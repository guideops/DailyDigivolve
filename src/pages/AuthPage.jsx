import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setError(null)
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.user) {
          await supabase.from('profiles').update({ username }).eq('id', data.user.id)
        }
      }
      onAuth()
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const inp = {
    background: 'rgba(255,255,255,0.06)',
    border: '2px solid rgba(255,255,255,0.12)',
    borderRadius: 8,
    padding: '11px 14px',
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    width: '100%',
    fontFamily: 'Nunito, sans-serif',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080a12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Nunito, sans-serif', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380, background: '#111318', border: '2px solid rgba(255,255,255,0.1)', boxShadow: '4px 4px 0 rgba(255,255,255,0.06)', padding: 32 }}>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 13, color: '#fff', marginBottom: 6 }}>
          DAILY<span style={{ color: '#4ECDC4' }}>DIGIVOLVE</span>
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>
          {mode === 'login' ? 'Sign in to your account' : 'Create your Tamer account'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'signup' && (
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username (Tamer name)" style={inp} />
          )}
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" style={inp} />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" style={inp}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()} />

          {error && <div style={{ fontSize: 12, color: '#FF6B6B', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)', padding: '8px 12px', borderRadius: 6 }}>{error}</div>}

          <button onClick={handleSubmit} disabled={loading}
            style={{ background: '#4ECDC4', border: '2px solid rgba(255,255,255,0.2)', boxShadow: '3px 3px 0 rgba(255,255,255,0.1)', padding: '11px', color: '#0d0f14', fontFamily: "'Press Start 2P', monospace", fontSize: 9, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'LOADING...' : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
          </button>

          <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            style={{ background: 'transparent', border: 'none', color: '#4ECDC4', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}
