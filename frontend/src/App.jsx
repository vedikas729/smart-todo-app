import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import './App.css'

// Quick login component for testing
const QuickLogin = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('Loading...')
    
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            name: 'Test User'
          }
        }
      })
      if (error) {
        setMessage(`❌ Error: ${error.message}`)
      } else {
        setMessage('✅ Check your email for confirmation link!')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage(`❌ Error: ${error.message}`)
      } else {
        setMessage('✅ Login successful!')
      }
    }
  }

  return (
    <div style={{ 
      maxWidth: '400px', 
      margin: '2rem auto',
      padding: '2rem',
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ marginTop: 0, color: '#333' }}>
        {mode === 'login' ? '🔐 Login' : '📝 Sign Up'}
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333' }}>
            Email
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              fontSize: '1rem',
              border: '2px solid #e0e0e0',
              borderRadius: '6px',
              boxSizing: 'border-box',
              color: '#000'
            }}
            required
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333' }}>
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '0.75rem',
              fontSize: '1rem',
              border: '2px solid #e0e0e0',
              borderRadius: '6px',
              boxSizing: 'border-box',
              color: '#000'
            }}
            required
            minLength={6}
          />
        </div>

        <button 
          type="submit"
          style={{ 
            width: '100%', 
            padding: '0.75rem',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          {mode === 'login' ? 'Login' : 'Sign Up'}
        </button>
      </form>

      {message && (
        <div style={{ 
          marginTop: '1rem',
          padding: '0.75rem',
          background: message.includes('❌') ? '#fee' : '#efe',
          borderRadius: '4px',
          fontSize: '0.9rem',
          color: '#333'
        }}>
          {message}
        </div>
      )}

      <button 
        onClick={() => {
          setMode(mode === 'login' ? 'signup' : 'login')
          setMessage('')
        }}
        style={{ 
          width: '100%',
          marginTop: '1rem',
          padding: '0.5rem',
          background: 'transparent',
          border: 'none',
          color: '#667eea',
          cursor: 'pointer',
          textDecoration: 'underline'
        }}
      >
        {mode === 'login' ? "Don't have an account? Sign up" : 'Have an account? Login'}
      </button>
    </div>
  )
}

// Settings Panel Component
const SettingsPanel = ({ session, setSession }) => {
  const [newName, setNewName] = useState('')
  const [message, setMessage] = useState('')
  const [estimationStats, setEstimationStats] = useState(null)
  const [loadingStats, setLoadingStats] = useState(false)

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    setMessage('Updating...');

    try {
      const { data, error: authError } = await supabase.auth.updateUser({
        data: { name: newName }
      });
      if (authError) throw authError;

      const { error: dbError } = await supabase
        .from('users')
        .update({ name: newName })
        .eq('id', session.user.id);
        
      if (dbError) throw dbError;

      setSession({
        ...session,
        user: data.user
      });

      setMessage('✅ Name updated!');
      setNewName('');
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  const loadEstimationStats = async () => {
    setLoadingStats(true)
    setMessage('Loading stats...')
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('estimated_duration_minutes, actual_duration_minutes, task_name, is_completed')
        .eq('user_id', session.user.id)
        .eq('is_completed', true)
        .not('actual_duration_minutes', 'is', null)

      if (error) throw error

      if (data.length === 0) {
        setMessage('ℹ️ No completed tasks with actual time recorded yet.')
        setEstimationStats(null)
      } else {
        // Calculate accuracy
        const accuracies = data.map(task => ({
          name: task.task_name,
          estimated: task.estimated_duration_minutes,
          actual: task.actual_duration_minutes,
          ratio: task.actual_duration_minutes / task.estimated_duration_minutes,
          difference: task.actual_duration_minutes - task.estimated_duration_minutes
        }))

        const avgAccuracy = accuracies.reduce((sum, a) => sum + a.ratio, 0) / accuracies.length
        const totalEstimated = data.reduce((sum, t) => sum + t.estimated_duration_minutes, 0)
        const totalActual = data.reduce((sum, t) => sum + t.actual_duration_minutes, 0)

        setEstimationStats({
          tasks: accuracies,
          avgAccuracy: avgAccuracy.toFixed(2),
          totalCompleted: data.length,
          totalEstimated,
          totalActual,
          percentOff: ((avgAccuracy - 1) * 100).toFixed(1)
        })
        setMessage('✅ Stats loaded!')
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`)
    } finally {
      setLoadingStats(false)
    }
  }

  return (
    <div style={{ 
      marginTop: '2rem', 
      padding: '1.5rem', 
      background: 'white', 
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ marginTop: 0, color: '#333' }}>⚙️ Settings & Tests</h2>

      {/* User Info Section */}
      <div style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid #e0e0e0' }}>
        <h3 style={{ color: '#333', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
          👤 User Profile
        </h3>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Current name: {session.user.user_metadata?.name || 'Not set'}
        </p>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="Enter new name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ 
              flex: 1,
              padding: '0.5rem', 
              fontSize: '1rem',
              border: '2px solid #e0e0e0',
              borderRadius: '6px',
              color: '#000'
            }}
          />
          <button 
            onClick={handleUpdateName}
            style={{
              padding: '0.5rem 1rem',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Update Name
          </button>
        </div>
      </div>

      {/* Estimation Accuracy Section */}
      <div style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid #e0e0e0' }}>
        <h3 style={{ color: '#333', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
          📊 Estimation Accuracy
        </h3>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
          View how accurate your time estimates are compared to actual time taken.
        </p>
        
        <button 
          onClick={loadEstimationStats}
          disabled={loadingStats}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loadingStats ? 'not-allowed' : 'pointer',
            opacity: loadingStats ? 0.6 : 1
          }}
        >
          {loadingStats ? 'Loading...' : 'Load Estimation Stats'}
        </button>

        {estimationStats && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f4ff', borderRadius: '6px' }}>
            <h4 style={{ color: '#333', marginTop: 0, marginBottom: '1rem' }}>
              Summary
            </h4>
            <div style={{ color: '#333', lineHeight: '1.8' }}>
              <p><strong>Total Completed Tasks:</strong> {estimationStats.totalCompleted}</p>
              <p><strong>Total Estimated Time:</strong> {estimationStats.totalEstimated} minutes</p>
              <p><strong>Total Actual Time:</strong> {estimationStats.totalActual} minutes</p>
              <p><strong>Average Accuracy Ratio:</strong> {estimationStats.avgAccuracy}x</p>
              <p style={{ 
                fontWeight: 'bold',
                color: Math.abs(parseFloat(estimationStats.percentOff)) < 10 ? '#28a745' : '#ffc107'
              }}>
                {parseFloat(estimationStats.percentOff) > 10 
                  ? `You underestimate by ${estimationStats.percentOff}%`
                  : parseFloat(estimationStats.percentOff) < -10
                  ? `You overestimate by ${Math.abs(estimationStats.percentOff)}%`
                  : 'Your estimates are pretty accurate!'}
              </p>
            </div>

            <h4 style={{ color: '#333', marginTop: '1.5rem', marginBottom: '1rem' }}>
              Task Breakdown
            </h4>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {estimationStats.tasks.map((task, index) => (
                <div key={index} style={{ 
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  background: 'white',
                  borderRadius: '4px',
                  border: '1px solid #e0e0e0'
                }}>
                  <p style={{ color: '#333', fontWeight: '500', marginBottom: '0.25rem' }}>
                    {task.name}
                  </p>
                  <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
                    Estimated: {task.estimated} min | Actual: {task.actual} min | 
                    Diff: {task.difference > 0 ? '+' : ''}{task.difference} min
                    ({task.ratio > 1 ? `${((task.ratio - 1) * 100).toFixed(0)}% over` : `${((1 - task.ratio) * 100).toFixed(0)}% under`})
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {message && (
        <div style={{ 
          padding: '0.75rem',
          background: message.includes('❌') ? '#fee' : message.includes('ℹ️') ? '#e7f3ff' : '#efe',
          borderRadius: '4px',
          fontSize: '0.9rem',
          color: '#333',
          marginTop: '1rem'
        }}>
          {message}
        </div>
      )}
    </div>
  )
}

// Subtasks Testing Component
const SubtasksTest = ({ session }) => {
  const [parentTask, setParentTask] = useState('')
  const [parentEstimate, setParentEstimate] = useState('60')
  const [parentDate, setParentDate] = useState(new Date().toISOString().split('T')[0])
  const [subtasks, setSubtasks] = useState([{ name: '', estimate: '15' }])
  const [message, setMessage] = useState('')
  const [allTasks, setAllTasks] = useState([])

  const addSubtask = () => {
    setSubtasks([...subtasks, { name: '', estimate: '15' }])
  }

  const updateSubtask = (index, field, value) => {
    const updated = [...subtasks]
    updated[index][field] = value
    setSubtasks(updated)
  }

  const removeSubtask = (index) => {
    setSubtasks(subtasks.filter((_, i) => i !== index))
  }

  const createTaskWithSubtasks = async () => {
  if (!parentTask.trim()) {
    setMessage('❌ Please enter a parent task name')
    return
  }

  const validSubtasks = subtasks.filter(st => st.name.trim())
  setMessage('Creating...')

  try {
    // 1. Always create the parent task
    const { data: parent, error: parentError } = await supabase
      .from('tasks')
      .insert([{
        user_id: session.user.id,
        task_name: parentTask,
        estimated_duration_minutes: parseInt(parentEstimate),
        scheduled_date: parentDate
      }])
      .select()
      .single()

    if (parentError) throw parentError

    // 2. ONLY create subtasks if there are valid ones
    if (validSubtasks.length > 0) {
      const subtasksData = validSubtasks.map(st => ({
        user_id: session.user.id,
        task_name: st.name,
        estimated_duration_minutes: parseInt(st.estimate),
        scheduled_date: parentDate,
        parent_task_id: parent.id
      }))

      const { error: subtasksError } = await supabase
        .from('tasks')
        .insert(subtasksData)

      if (subtasksError) throw subtasksError
    }

    setMessage(validSubtasks.length > 0 
      ? `✅ Created task with ${validSubtasks.length} subtasks!` 
      : `✅ Created task!`)
    
    // ... rest of your reset logic
  } catch (error) {
    setMessage(`❌ Error: ${error.message}`)
  }
}

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Organize by parent-child
      const parents = data
        .filter(t => !t.parent_task_id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      const organized = parents.map(parent => ({
        ...parent,
        subtasks: data
          .filter(t => t.parent_task_id === parent.id)
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      }))

      setAllTasks(organized)
    } catch (error) {
      console.error('Error loading tasks:', error)
    }
  }

  const completeTask = async (taskId, actualMinutes) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          is_completed: true,
          actual_duration_minutes: actualMinutes,
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId)

      if (error) throw error
      
      setMessage('✅ Task completed!')
      loadTasks()
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`)
    }
  }

  const deleteTaskAndSubtasks = async (taskId) => {
    if (!confirm('Delete this task and all its subtasks?')) return

    try {
      // Delete subtasks first
      await supabase
        .from('tasks')
        .delete()
        .eq('parent_task_id', taskId)

      // Delete parent
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error
      
      setMessage('✅ Task deleted!')
      loadTasks()
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [])

  return (
    <div style={{ 
      marginTop: '2rem', 
      padding: '1.5rem', 
      background: 'white', 
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ marginTop: 0, color: '#333' }}>📋 Subtasks Testing</h2>

      {/* Create Task with Subtasks */}
      <div style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid #e0e0e0' }}>
        <h3 style={{ color: '#333', fontSize: '1.1rem', marginBottom: '1rem' }}>
          Create Parent Task with Subtasks
        </h3>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>
            Parent Task Name
          </label>
          <input
            type="text"
            placeholder="e.g., Complete project"
            value={parentTask}
            onChange={(e) => setParentTask(e.target.value)}
            style={{ 
              width: '100%',
              padding: '0.5rem', 
              fontSize: '1rem',
              border: '2px solid #e0e0e0',
              borderRadius: '6px',
              color: '#000',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>
              Estimated Time (minutes)
            </label>
            <select
              value={parentEstimate}
              onChange={(e) => setParentEstimate(e.target.value)}
              style={{ 
                width: '100%',
                padding: '0.5rem', 
                fontSize: '1rem',
                border: '2px solid #e0e0e0',
                borderRadius: '6px',
                color: '#666',
                boxSizing: 'border-box'
              }}
            >
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
              <option value="180">3 hours</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>
              Scheduled Date
            </label>
            <input
              type="date"
              value={parentDate}
              onChange={(e) => setParentDate(e.target.value)}
              style={{ 
                width: '100%',
                padding: '0.5rem', 
                fontSize: '1rem',
                border: '2px solid #e0e0e0',
                borderRadius: '6px',
                color: '#666',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        <h4 style={{ color: '#333', fontSize: '1rem', marginBottom: '0.75rem' }}>
          Subtasks
        </h4>
        
        {subtasks.map((subtask, index) => (
          <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input
              type="text"
              placeholder="Subtask name"
              value={subtask.name}
              onChange={(e) => updateSubtask(index, 'name', e.target.value)}
              style={{ 
                flex: 2,
                padding: '0.5rem', 
                fontSize: '1rem',
                border: '2px solid #e0e0e0',
                borderRadius: '6px',
                color: '#000'
              }}
            />
            <select
              value={subtask.estimate}
              onChange={(e) => updateSubtask(index, 'estimate', e.target.value)}
              style={{ 
                flex: 1,
                padding: '0.5rem', 
                fontSize: '1rem',
                border: '2px solid #e0e0e0',
                borderRadius: '6px',
                color: '#666'
              }}
            >
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="60">1 hour</option>
            </select>
            {subtasks.length > 1 && (
              <button 
                onClick={() => removeSubtask(index)}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            )}
          </div>
        ))}

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <button 
            onClick={addSubtask}
            style={{
              padding: '0.5rem 1rem',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            + Add Subtask
          </button>

          <button 
            onClick={createTaskWithSubtasks}
            style={{
              padding: '0.5rem 1.5rem',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Create Task with Subtasks
          </button>
        </div>
      </div>

      {/* Display Tasks */}
      <div>
        <h3 style={{ color: '#333', fontSize: '1.1rem', marginBottom: '1rem' }}>
          Your Tasks ({allTasks.length})
        </h3>

        {allTasks.length === 0 ? (
          <p style={{ color: '#666' }}>No tasks yet. Create one above!</p>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {allTasks.map((task) => (
              <div key={task.id} style={{ 
                marginBottom: '1rem',
                padding: '1rem',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                background: task.is_completed ? '#f0f0f0' : 'white'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ 
                      color: '#333', 
                      margin: 0, 
                      textDecoration: task.is_completed ? 'line-through' : 'none'
                    }}>
                      {task.task_name}
                    </h4>
                    <p style={{ color: '#666', fontSize: '0.9rem', margin: '0.25rem 0' }}>
                      📅 {task.scheduled_date} | ⏱️ {task.estimated_duration_minutes} min
                      {task.is_completed && task.actual_duration_minutes && 
                        ` | ✓ Actual: ${task.actual_duration_minutes} min`}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {!task.is_completed && (
                      <button 
                        onClick={() => {
                          const actual = prompt('How many minutes did it take?')
                          if (actual) completeTask(task.id, parseInt(actual))
                        }}
                        style={{
                          padding: '0.25rem 0.75rem',
                          background: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        Complete
                      </button>
                    )}
                    <button 
                      onClick={() => deleteTaskAndSubtasks(task.id)}
                      style={{
                        padding: '0.25rem 0.75rem',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {task.subtasks && task.subtasks.length > 0 && (
                  <div style={{ 
                    marginTop: '0.75rem',
                    marginLeft: '1.5rem',
                    paddingLeft: '1rem',
                    borderLeft: '3px solid #667eea'
                  }}>
                    <p style={{ color: '#667eea', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                      Subtasks ({task.subtasks.length}):
                    </p>
                    {task.subtasks.map((subtask) => (
                      <div key={subtask.id} style={{ 
                        marginBottom: '0.5rem',
                        padding: '0.5rem',
                        background: subtask.is_completed ? '#e8f5e9' : '#f8f9ff',
                        borderRadius: '4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <span style={{ 
                            color: '#333',
                            textDecoration: subtask.is_completed ? 'line-through' : 'none'
                          }}>
                            ↳ {subtask.task_name}
                          </span>
                          <span style={{ color: '#666', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                            ({subtask.estimated_duration_minutes} min)
                            {subtask.is_completed && subtask.actual_duration_minutes && 
                              ` - Actual: ${subtask.actual_duration_minutes} min`}
                          </span>
                        </div>
                        {!subtask.is_completed && (
                          <button 
                            onClick={() => {
                              const actual = prompt('How many minutes did this subtask take?')
                              if (actual) completeTask(subtask.id, parseInt(actual))
                            }}
                            style={{
                              padding: '0.25rem 0.5rem',
                              background: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem'
                            }}
                          >
                            ✓
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {message && (
        <div style={{ 
          marginTop: '1rem',
          padding: '0.75rem',
          background: message.includes('❌') ? '#fee' : '#efe',
          borderRadius: '4px',
          fontSize: '0.9rem',
          color: '#333'
        }}>
          {message}
        </div>
      )}
    </div>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get current session on page load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for login/logout changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    // Cleanup listener on unmount
    return () => subscription.unsubscribe()
  }, [])

  // Loading screen
  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <h2>Loading...</h2>
      </div>
    )
  }

  // Not logged in → show login
  if (!session) {
    return (
      <div style={{ padding: '2rem' }}>
        <QuickLogin />
      </div>
    )
  }

  // Logged in → show app
  return (
    <div style={{ 
      maxWidth: '900px', 
      margin: '0 auto', 
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1 style={{ color: '#939393' }}>
        ✅ Smart To-Do App (Test Mode)
      </h1>

      <button
        onClick={() => supabase.auth.signOut()}
        style={{
          marginBottom: '1.5rem',
          padding: '0.5rem 1rem',
          background: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
      >
        Logout
      </button>

      <SettingsPanel session={session} setSession={setSession} />
      <SubtasksTest session={session} />
    </div>
  )
}

export default App