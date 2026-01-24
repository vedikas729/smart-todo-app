import React, { useState } from 'react'
import './TaskItem.css'
import { completeTask, createSubTasks, deleteTask } from '../../services/api'

const TaskItem = ({ task, onTaskCompleted, isSubtask = false }) => {
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [actualMinutes, setActualMinutes] = useState('')
  const [completing, setCompleting] = useState(false)
  const [showAddSubtask, setShowAddSubtask] = useState(false)
  const [subtaskName, setSubtaskName] = useState('')
  const [subtaskTime, setSubtaskTime] = useState('')
  const [addingSubtask, setAddingSubtask] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleCheckboxChange = () => {
    if (!task.is_completed) {
      setShowCompletionModal(true)
    }
  }

  const handleSubmitCompletion = async () => {
    if (!actualMinutes) return

    setCompleting(true)
    try {
      await completeTask(task.id, parseInt(actualMinutes))
      setShowCompletionModal(false)
setActualMinutes('')
onTaskCompleted?.()
  // Show estimation feedback
  const estimated = task.estimated_duration_minutes
  const actual = parseInt(actualMinutes)
  const diff = actual - estimated
  const percentOff = ((diff / estimated) * 100).toFixed(0)
  
  if (Math.abs(diff) <= 5) {
    alert(`Great estimate! You were spot on! 🎯`)
  } else if (diff > 0) {
    alert(`Task completed! It took ${diff} minutes longer than estimated (${percentOff}% over). Consider this for future estimates!`)
  } else {
    alert(`Task completed! It took ${Math.abs(diff)} minutes less than estimated (${Math.abs(percentOff)}% under). You're getting better at estimating!`)
  }
} catch (error) {
  alert('Failed to complete task: ' + error.message)
} finally {
  setCompleting(false)
}
}

  const handleAddSubtask = async () => {
    if (!subtaskName.trim() || !subtaskTime) return

    setAddingSubtask(true)
    try {
      await createSubTasks(task.id, [{
        user_id: task.user_id,
        task_name: subtaskName.trim(),
        estimated_duration_minutes: parseInt(subtaskTime),
        scheduled_date: task.scheduled_date
      }])
      setShowAddSubtask(false)
      setSubtaskName('')
      setSubtaskTime('')
      onTaskCompleted?.()
    } catch (error) {
      alert('Failed to add subtask: ' + error.message)
    } finally {
      setAddingSubtask(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return

    setDeleting(true)
    try {
      await deleteTask(task.id)
      onTaskCompleted?.()
    } catch (error) {
      alert('Failed to delete task: ' + error.message)
    } finally {
      setDeleting(false)
    }
  }
return (
<>
<div
  className={`task-item ${task.is_completed ? 'completed' : ''} ${
    isSubtask ? 'subtask' : ''
  }`}
>
<input
       type="checkbox"
       checked={task.is_completed}
       onChange={handleCheckboxChange}
       disabled={task.is_completed}
       className="task-checkbox"
     />
    <div className="task-content">
      <div className="task-header">
        {isSubtask && <span className="subtask-indicator">↳</span>}
        <h3 className="task-name">{task.task_name}</h3>
        {!task.is_completed && (
          <button
            className="delete-task-btn"
            onClick={handleDelete}
            disabled={deleting}
            title="Delete task"
          >
            {deleting ? '...' : '🗑️'}
          </button>
        )}
      </div>
      
      <div className="task-meta">
        <span className="task-time">
          ⏱️ {task.estimated_duration_minutes} min
        </span>
        {task.is_completed && task.actual_duration_minutes && (
          <span className="task-actual">
            ✓ Actual: {task.actual_duration_minutes} min
          </span>
        )}
      </div>

      {!isSubtask && !task.is_completed && (
        <button
          className="add-subtask-btn"
          onClick={() => setShowAddSubtask(!showAddSubtask)}
        >
          {showAddSubtask ? 'Cancel' : '+ Add Subtask'}
        </button>
      )}

      {showAddSubtask && (
        <div className="add-subtask-form">
          <input
            type="text"
            placeholder="Subtask name"
            value={subtaskName}
            onChange={(e) => setSubtaskName(e.target.value)}
            className="subtask-name-input"
          />
          <select
            value={subtaskTime}
            onChange={(e) => setSubtaskTime(e.target.value)}
            className="subtask-time-select"
          >
            <option value="">Estimated time</option>
            <option value="5">5 min</option>
            <option value="10">10 min</option>
            <option value="15">15 min</option>
            <option value="20">20 min</option>
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">1 hour</option>
          </select>
          <button
            onClick={handleAddSubtask}
            disabled={!subtaskName.trim() || !subtaskTime || addingSubtask}
            className="add-subtask-submit-btn"
          >
            {addingSubtask ? 'Adding...' : 'Add'}
          </button>
        </div>
      )}
    </div>
  </div>

  {showCompletionModal && (
    <div className="modal-overlay" onClick={() => setShowCompletionModal(false)}>
      <div className="completion-modal" onClick={(e) => e.stopPropagation()}>
        <h3>How long did this actually take?</h3>
        <p className="estimated-reminder">You estimated: {task.estimated_duration_minutes} minutes</p>
        
        <select
          value={actualMinutes}
          onChange={(e) => setActualMinutes(e.target.value)}
          autoFocus
        >
          <option value="">Select duration...</option>
          <option value="5">5 minutes</option>
          <option value="10">10 minutes</option>
          <option value="15">15 minutes</option>
          <option value="20">20 minutes</option>
          <option value="30">30 minutes</option>
          <option value="45">45 minutes</option>
          <option value="60">1 hour</option>
          <option value="90">1.5 hours</option>
          <option value="120">2 hours</option>
          <option value="150">2.5 hours</option>
          <option value="180">3 hours</option>
          <option value="240">4+ hours</option>
        </select>
        
        <div className="modal-buttons">
          <button
            onClick={handleSubmitCompletion}
            disabled={!actualMinutes || completing}
            className="complete-btn"
          >
            {completing ? 'Completing...' : 'Complete Task'}
          </button>
          <button
            onClick={() => setShowCompletionModal(false)}
            className="cancel-btn"
            disabled={completing}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )}
</>
)
}
export default TaskItem