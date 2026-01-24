import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Login from './components/Auth/Login'
import TaskCreationFlow from './components/TaskCreationFlow/TaskCreationFlow'
import TodayView from './components/TodayView/TodayView'
import EstimationFeedback from './components/EstimationFeedback/EstimationFeedback'
import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tasksUpdated, setTasksUpdated] = useState(0)

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const handleTaskCreated = () => {
    setTasksUpdated(prev => prev + 1)
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (!session) {
    return <Login />
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>📝 Smart To-Do App</h1>
        <div className="user-info">
          <span>{session.user.email}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="App-main">
        <TaskCreationFlow 
          userId={session.user.id}
          onTaskCreated={handleTaskCreated}
        />

        <TodayView 
          userId={session.user.id}
          tasksUpdated={tasksUpdated}
        />

        <EstimationFeedback 
          userId={session.user.id}
          tasksUpdated={tasksUpdated}
        />
      </main>
    </div>
  )
}

export default App