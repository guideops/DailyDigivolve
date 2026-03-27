import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase.js'
import App from './App.jsx'
import AuthPage from './pages/AuthPage.jsx'

export default function Root() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div style={{ minHeight: '100vh', background: '#080a12', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontFamily: 'Nunito, sans-serif', fontSize: 13 }}>
        Loading...
      </div>
    )
  }

  if (!session) return <AuthPage onAuth={() => {}} />

  return <App session={session} />
}
