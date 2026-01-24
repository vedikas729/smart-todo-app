import React, { useState, useEffect } from 'react'
import './EstimationFeedback.css'
import { getEstimationStats } from '../../services/api'

const EstimationFeedback = ({ userId, tasksUpdated }) => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [userId])

  useEffect(() => {
    if (tasksUpdated > 0) {
      loadStats()
    }
  }, [tasksUpdated])

  const loadStats = async () => {
    try {
      const data = await getEstimationStats(userId)
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="estimation-feedback loading">Loading stats...</div>
  }

  if (!stats || stats.totalCompletedTasks === 0) {
    return (
      <div className="estimation-feedback empty">
        <h3>📊 Estimation Accuracy</h3>
        <p>Complete some tasks to see your estimation accuracy!</p>
      </div>
    )
  }

  const accuracy = parseFloat(stats.averageAccuracy)
  const isAccurate = accuracy >= 0.9 && accuracy <= 1.1

  return (
    <div className="estimation-feedback">
      <h3>📊 Your Estimation Accuracy</h3>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalCompletedTasks}</div>
          <div className="stat-label">Tasks Completed</div>
        </div>
        
        <div className={`stat-card ${isAccurate ? 'accurate' : 'inaccurate'}`}>
          <div className="stat-value">
            {accuracy > 1 ? '📈' : accuracy < 1 ? '📉' : '🎯'}
          </div>
          <div className="stat-label">{stats.message}</div>
        </div>
      </div>

      <div className="accuracy-tip">
        {isAccurate && (
          <p>✨ Great job! Your estimates are very accurate. Keep it up!</p>
        )}
        {accuracy > 1.1 && (
          <p>💡 Tip: You tend to underestimate. Try adding buffer time to your estimates.</p>
        )}
        {accuracy < 0.9 && (
          <p>💡 Tip: You tend to overestimate. Tasks usually take less time than you think!</p>
        )}
      </div>
    </div>
  )
}

export default EstimationFeedback