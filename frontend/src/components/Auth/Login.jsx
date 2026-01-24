import React, { useState } from 'react'
import { supabase } from '../../supabaseClient'
import './Login.css'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      alert('Error: ' + error.message)
    }
    
    setLoading(false)
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name
        }
      }
    })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Success! Check your email for a confirmation link.')
    }
    
    setLoading(false)
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Smart To-Do App</h1>
        <h2>{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
        
        <form onSubmit={isSignUp ? handleSignUp : handleLogin}>
          {isSignUp && (
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}
          
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          
          <button type="submit" disabled={loading} className="primary-button">
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Log In'}
          </button>
        </form>
        
        <button 
          onClick={() => setIsSignUp(!isSignUp)} 
          className="secondary-button"
        >
          {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  )
}

export default Login