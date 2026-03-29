import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const [exercise, setExercise] = useState('')
  const [sets, setSets] = useState('')
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [history, setHistory] = useState([])
  const [prs, setPrs] = useState({})
  const [message, setMessage] = useState('')
  const [selectedExercise, setSelectedExercise] = useState('')
  const [aiSuggestion, setAiSuggestion] = useState('')
const [aiLoading, setAiLoading] = useState(false)
  const navigate = useNavigate()

  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    fetchHistory()
    fetchPRs()
  }, [])

  const fetchHistory = async () => {
    const res = await axios.get('http://127.0.0.1:8000/workouts/history', { headers })
    setHistory(res.data)
  }

  const fetchPRs = async () => {
    const res = await axios.get('http://127.0.0.1:8000/workouts/prs', { headers })
    setPrs(res.data)
  }

  const logWorkout = async () => {
    if (!exercise || !sets || !reps || !weight) {
      setMessage('Please fill in all fields')
      return
    }
    const res = await axios.post(
      `http://127.0.0.1:8000/workouts/log?exercise=${exercise}&sets=${sets}&reps=${reps}&weight=${weight}`,
      {}, { headers }
    )
    if (res.data.is_pr) setMessage(`🏆 New PR for ${exercise}!`)
    else setMessage('Workout logged!')
    setExercise(''); setSets(''); setReps(''); setWeight('')
    fetchHistory(); fetchPRs()
  }

  const logout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

 const getAISuggestion = async () => {
  setAiLoading(true)
  setAiSuggestion('')
  try {
    const res = await axios.get('http://127.0.0.1:8000/workouts/ai-suggestion', { headers })
    setAiSuggestion(res.data.suggestion)
  } catch (err) {
    setAiSuggestion('Error getting suggestion. Please try again.')
    console.error(err)
  }
  setAiLoading(false)
}

  const chartData = history
  .filter(w => w.exercise === selectedExercise)
  .reverse()
  .map((w, i) => ({
    date: `Session ${i + 1}`,
    weight: w.weight,
    reps: w.reps
  }))

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>💪 FitTrack</h1>
        <button onClick={logout} style={styles.logoutBtn}>Logout</button>
      </div>

      <div style={styles.grid}>
        {/* Log Workout */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Log Workout</h2>
          {message && <p style={styles.message}>{message}</p>}
          <input style={styles.input} placeholder="Exercise (e.g. Bench Press)" value={exercise} onChange={e => setExercise(e.target.value)} />
          <input style={styles.input} placeholder="Sets" type="number" value={sets} onChange={e => setSets(e.target.value)} />
          <input style={styles.input} placeholder="Reps" type="number" value={reps} onChange={e => setReps(e.target.value)} />
          <input style={styles.input} placeholder="Weight (kg)" type="number" value={weight} onChange={e => setWeight(e.target.value)} />
          <button style={styles.button} onClick={logWorkout}>Log Workout</button>
        </div>

        {/* Personal Records */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🏆 Personal Records</h2>
          {Object.keys(prs).length === 0 ? (
            <p style={styles.empty}>No PRs yet — start logging!</p>
          ) : (
            Object.entries(prs).map(([ex, w]) => (
              <div key={ex} style={styles.prRow}>
                <span>{ex}</span>
                <span style={styles.prWeight}>{w} kg</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Progress Chart */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>📈 Progress Chart</h2>
        <select
          style={{ ...styles.input, marginBottom: '1rem' }}
          value={selectedExercise}
          onChange={e => setSelectedExercise(e.target.value)}
        >
          <option value="">Select an exercise</option>
          {Object.keys(prs).map(ex => (
            <option key={ex} value={ex}>{ex}</option>
          ))}
        </select>
        {selectedExercise && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={250}>
  <LineChart data={chartData}>
  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
  <XAxis dataKey="date" stroke="#666" />
  <YAxis yAxisId="left" stroke="#22c55e" />
  <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" domain={[0, 20]} />
  <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', color: '#fff' }} />
  <Line yAxisId="left" type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} name="Weight (kg)" />
  <Line yAxisId="right" type="monotone" dataKey="reps" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} name="Reps" />
  <Legend />
</LineChart>
</ResponsiveContainer>
        )}
        {selectedExercise && chartData.length === 0 && (
          <p style={styles.empty}>No data for this exercise yet.</p>
        )}
      </div>

      {/* AI Suggestions */}
<div style={styles.card}>
  <h2 style={styles.cardTitle}>🤖 AI Workout Suggestion</h2>
  <button style={styles.button} onClick={getAISuggestion} disabled={aiLoading}>
    {aiLoading ? 'Thinking...' : 'Get AI Suggestion'}
  </button>
  {aiSuggestion && (
    <div style={{ marginTop: '1rem', color: '#ccc', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
      {aiSuggestion}
    </div>
  )}
</div>

      {/* Recent Workouts */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>📋 Recent Workouts</h2>
        {history.length === 0 ? (
          <p style={styles.empty}>No workouts logged yet!</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                {['Exercise', 'Sets', 'Reps', 'Weight', 'Date'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map(w => (
                <tr key={w.id}>
                  <td style={styles.td}>{w.exercise}</td>
                  <td style={styles.td}>{w.sets}</td>
                  <td style={styles.td}>{w.reps}</td>
                  <td style={styles.td}>{w.weight} kg</td>
                  <td style={styles.td}>{new Date(w.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '900px', margin: '0 auto', padding: '2rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
  title: { fontSize: '1.8rem' },
  logoutBtn: { padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: '#333', color: '#fff', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' },
  card: { background: '#1a1a1a', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' },
  cardTitle: { marginBottom: '1rem', fontSize: '1.2rem' },
  input: { display: 'block', width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #333', background: '#0f0f0f', color: '#fff', fontSize: '1rem', marginBottom: '0.75rem' },
  button: { width: '100%', padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#22c55e', color: '#fff', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold' },
  message: { color: '#22c55e', marginBottom: '1rem' },
  empty: { color: '#666' },
  prRow: { display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #222' },
  prWeight: { color: '#22c55e', fontWeight: 'bold' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #333', color: '#aaa' },
  td: { padding: '0.75rem', borderBottom: '1px solid #222' },
}