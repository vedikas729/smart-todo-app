import React, { useState, useEffect } from 'react'
import './TodayView.css'
import { getTodaysTasks } from '../../services/api'
import TaskItem from '../TaskItem/TaskItem'

const TodayView = ({ userId, tasksUpdated }) => {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalPlannedTime, setTotalPlannedTime] = useState(0)

  useEffect(() => {
    loadTodaysTasks()
  }, [userId])

  useEffect(() => {
    if (tasksUpdated > 0) {
      loadTodaysTasks()
    }
  }, [tasksUpdated])

  const loadTodaysTasks = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const fetchedTasks = await getTodaysTasks(userId, today)
      setTasks(fetchedTasks)

      // Calculate total planned time (including subtasks)
      const total = fetchedTasks.reduce((sum, task) => {
        let taskTotal = task.is_completed ? 0 : task.estimated_duration_minutes

        // Add subtasks time if they exist
        if (task.subtasks && task.subtasks.length > 0) {
          const subtasksTotal = task.subtasks.reduce(
            (subSum, subtask) =>
              subSum + (subtask.is_completed ? 0 : subtask.estimated_duration_minutes),
            0
          )
          taskTotal += subtasksTotal
        }

        return sum + taskTotal
      }, 0)

      setTotalPlannedTime(total)
    } catch (error) {
      console.error('Failed to load tasks:', error)
      alert('Failed to load tasks: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTaskCompleted = () => {
    // Reload tasks after completion
    loadTodaysTasks()
  }

  if (loading) {
    return <div className="today-view loading">Loading today's tasks...</div>
  }

  return (
    <div className="today-view">
      <div className="today-view-header">
        <h2>📅 Today's Tasks</h2>
        <div className="total-time">
          <span className="time-label">Total planned:</span>
          <span className="time-value">
            {Math.floor(totalPlannedTime / 60)}h {totalPlannedTime % 60}m
          </span>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="no-tasks">
          <p>🎉 No tasks scheduled for today!</p>
          <p className="no-tasks-subtitle">Create a task above to get started.</p>
        </div>
      ) : (
        <div className="tasks-list">
          {tasks.map((task) => (
            <div key={task.id} className="task-group">
              {/* Main task */}
              <TaskItem task={task} onTaskCompleted={handleTaskCompleted} />

              {/* Subtasks if they exist */}
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="subtasks-container">
                  {task.subtasks.map((subtask) => (
                    <TaskItem
                      key={subtask.id}
                      task={subtask}
                      onTaskCompleted={handleTaskCompleted}
                      isSubtask={true}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TodayView