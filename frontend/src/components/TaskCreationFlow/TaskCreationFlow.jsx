import React, { useState } from 'react'
import './TaskCreationFlow.css'
import { createTask, createSubTasks } from '../../services/api'

const TaskCreationFlow = ({ userId, onTaskCreated }) => {
  const [taskName, setTaskName] = useState('')
  const [estimatedTime, setEstimatedTime] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [subtasks, setSubtasks] = useState([{ name: '', estimatedTime: '' }])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!taskName.trim() || !estimatedTime || !scheduledDate) {
      alert('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      // Create parent task first
      const parentTask = await createTask({
        user_id: userId,
        task_name: taskName,
        estimated_duration_minutes: parseInt(estimatedTime),
        scheduled_date: scheduledDate,
      })

      // Create subtasks if any are filled
      const subtasksData = subtasks
        .filter(st => st.name.trim() && st.estimatedTime)
        .map(st => ({
          user_id: userId,
          task_name: st.name,
          estimated_duration_minutes: parseInt(st.estimatedTime),
          scheduled_date: scheduledDate,
        }))

      if (subtasksData.length > 0) {
        await createSubTasks(parentTask.id, subtasksData)
      }

      // Reset form
      setTaskName('')
      setEstimatedTime('')
      setScheduledDate('')
      setSubtasks([{ name: '', estimatedTime: '' }])

      onTaskCreated?.(parentTask)

      alert('Task created successfully!')
    } catch (error) {
      alert('Failed to create task: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addSubtask = () => {
    setSubtasks([...subtasks, { name: '', estimatedTime: '' }])
  }

  const updateSubtask = (index, field, value) => {
    const updated = [...subtasks]
    updated[index][field] = value
    setSubtasks(updated)
  }

  const removeSubtask = (index) => {
    setSubtasks(subtasks.filter((_, i) => i !== index))
  }

  return (
    <div className="task-creation-flow">
      <h2>Create New Task</h2>
      
      <form onSubmit={handleSubmit} className="task-form">
        <div className="form-group">
          <label>Task Name *</label>
          <input
            type="text"
            placeholder="What do you want to do?"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Estimated Duration *</label>
          <select 
            value={estimatedTime} 
            onChange={(e) => setEstimatedTime(e.target.value)}
            required
          >
            <option value="">Select duration...</option>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">1 hour</option>
            <option value="90">1.5 hours</option>
            <option value="120">2 hours</option>
            <option value="180">3+ hours</option>
          </select>
        </div>

        <div className="form-group">
          <label>Scheduled Date *</label>
          <input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        <div className="subtasks-section">
          <h3>Subtasks (Optional)</h3>
          {subtasks.map((subtask, index) => (
            <div key={index} className="subtask-input">
              <input
                type="text"
                placeholder="Subtask name..."
                value={subtask.name}
                onChange={(e) => updateSubtask(index, 'name', e.target.value)}
              />
              <select
                value={subtask.estimatedTime}
                onChange={(e) => updateSubtask(index, 'estimatedTime', e.target.value)}
              >
                <option value="">Duration...</option>
                <option value="5">5 min</option>
                <option value="10">10 min</option>
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">1 hour</option>
              </select>
              {subtasks.length > 1 && (
                <button type="button" onClick={() => removeSubtask(index)} className="remove-btn">×</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addSubtask} className="add-subtask-btn">+ Add Another Subtask</button>
        </div>

        <button type="submit" disabled={isSubmitting} className="submit-btn">
          {isSubmitting ? 'Creating...' : 'Create Task'}
        </button>
      </form>
    </div>
  )
}

export default TaskCreationFlow