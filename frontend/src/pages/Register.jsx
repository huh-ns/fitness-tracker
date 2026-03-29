import { useState } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'

export default function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleRegister = async () => {
    try {
      const res = await axios.post(
        `https://fitness-tracker-5nxn.onrender.com/auth/register?username=${username}&email=${email}&password=${password}`
      )
      localStorage.setItem('token', res.data.token)
      navigate('/dashboard')
    } catch (err) {
      setError('Registration failed. Email may already be in use.')
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>💪 FitTrack</h1>
        <h2 style={styles.subtitle}>Create an account</h2>
        {error && <p style={styles.error}>{error}</p>}
        <input
          style={styles.input}
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <input
          style={styles.input}
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          style={styles.input}
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button style={styles.button} onClick={handleRegister}>Register</button>
        <p style={styles.link}>Already have an account? <Link to="/login" style={styles.a}>Login</Link></p>
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' },
  card: { background: '#1a1a1a', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' },
  title: { textAlign: 'center', fontSize: '2rem' },
  subtitle: { textAlign: 'center', color: '#aaa', fontWeight: 'normal' },
  input: { padding: '0.75rem', borderRadius: '8px', border: '1px solid #333', background: '#0f0f0f', color: '#fff', fontSize: '1rem' },
  button: { padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#22c55e', color: '#fff', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold' },
  error: { color: '#ef4444', textAlign: 'center' },
  link: { textAlign: 'center', color: '#aaa' },
  a: { color: '#22c55e' }
}