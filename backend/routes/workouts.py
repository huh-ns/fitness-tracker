from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from jose import jwt
from fastapi.security import OAuth2PasswordBearer
import urllib.request
import json as json_module

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
SECRET_KEY = "your-secret-key-here"
ALGORITHM = "HS256"

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/log")
def log_workout(
    exercise: str,
    sets: int,
    reps: int,
    weight: float,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    workout = models.Workout(
        exercise=exercise,
        sets=sets,
        reps=reps,
        weight=weight,
        user_id=current_user.id
    )
    db.add(workout)
    db.commit()
    db.refresh(workout)

    best = db.query(models.Workout).filter(
        models.Workout.user_id == current_user.id,
        models.Workout.exercise == exercise
    ).order_by(models.Workout.weight.desc()).first()

    is_pr = best.id == workout.id
    return {"workout": workout.id, "is_pr": is_pr}

@router.get("/history")
def get_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    workouts = db.query(models.Workout).filter(
        models.Workout.user_id == current_user.id
    ).order_by(models.Workout.date.desc()).all()
    return workouts

@router.get("/prs")
def get_prs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    workouts = db.query(models.Workout).filter(
        models.Workout.user_id == current_user.id
    ).all()
    prs = {}
    for w in workouts:
        if w.exercise not in prs or w.weight > prs[w.exercise]:
            prs[w.exercise] = w.weight
    return prs

@router.get("/ai-suggestion")
def ai_suggestion(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    workouts = db.query(models.Workout).filter(
        models.Workout.user_id == current_user.id
    ).all()

    prs = {}
    for w in workouts:
        if w.exercise not in prs or w.weight > prs[w.exercise]:
            prs[w.exercise] = w.weight

    summary = ', '.join([f"{ex}: {w}kg" for ex, w in prs.items()])
    prompt = f"I am tracking my gym workouts. My current personal records are: {summary}. Suggest what I should focus on in my next workout session with specific sets/reps/weight targets. Keep it concise."

    api_key = "AIzaSyA_wbs1qxLI2pzyPvjzqqFuCl-z7cu2euE"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

    data = json_module.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})

    try:
        with urllib.request.urlopen(req) as response:
            result = json_module.loads(response.read())
            return {"suggestion": result["candidates"][0]["content"]["parts"][0]["text"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))