import { supabase } from '../supabaseClient'

// ==================== USERS ====================

export const updateUserName = async (newName) => {
  const { data, error } = await supabase.auth.updateUser({
    data: { name: newName }
  });

  if (error) throw error;
  return data.user;
};

// ==================== TASKS ====================

export const createTask = async (taskData) => {
  const { data, error } = await supabase
    .from('tasks')
    .insert([taskData])
    .select()
    .single()

  if (error) throw error
  return data
}

export const getTodaysTasks = async (userId, date) => {
  // Get ALL tasks for today (parents and subtasks)
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('scheduled_date', date)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Organize into hierarchy
  return organizeTasksHierarchically(data)
}

// Helper function to organize tasks into parent-child structure
const organizeTasksHierarchically = (tasks) => {
  // Separate parents and children
  const parentTasks = tasks.filter(task => !task.parent_task_id)
  const subtasks = tasks.filter(task => task.parent_task_id)

  // Create a map of parent_id -> subtasks array
  const subtaskMap = {}
  subtasks.forEach(subtask => {
    if (!subtaskMap[subtask.parent_task_id]) {
      subtaskMap[subtask.parent_task_id] = []
    }
    subtaskMap[subtask.parent_task_id].push(subtask)
  })

  // Attach subtasks to their parents
  const organizedTasks = parentTasks.map(parent => ({
    ...parent,
    subtasks: subtaskMap[parent.id] || []
  }))

  // Include orphaned subtasks (subtasks whose parent isn't scheduled today)
  const orphanedSubtasks = subtasks.filter(subtask => 
    !parentTasks.some(parent => parent.id === subtask.parent_task_id)
  )

  return [...organizedTasks, ...orphanedSubtasks]
}

export const completeTask = async (taskId, actualMinutes) => {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      is_completed: true,
      actual_duration_minutes: actualMinutes,
      completed_at: new Date().toISOString()
    })
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateTask = async (taskId, updates) => {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteTask = async (taskId) => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)

  if (error) throw error
}

export const createSubTasks = async (parentTaskId, subtasksData) => {
  // Add parent_task_id to each subtask
  const subtasksWithParent = subtasksData.map(subtask => ({
    ...subtask,
    parent_task_id: parentTaskId
  }))

  const { data, error } = await supabase
    .from('tasks')
    .insert(subtasksWithParent)
    .select()

  if (error) throw error
  return data
}

// ==================== STATS ====================

export const getEstimationStats = async (userId) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('estimated_duration_minutes, actual_duration_minutes')
    .eq('user_id', userId)
    .eq('is_completed', true)
    .not('actual_duration_minutes', 'is', null)

  if (error) throw error

  if (data.length === 0) {
    return {
      totalCompletedTasks: 0,
      averageAccuracy: 1.0,
      underestimatePercentage: '0.0',
      message: 'Complete some tasks to see your estimation accuracy!'
    }
  }

  // Calculate accuracy (actual / estimated)
  const accuracies = data.map(task => 
    task.actual_duration_minutes / task.estimated_duration_minutes
  )
  
  const avgAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length

  // If avgAccuracy > 1, user underestimates
  // If avgAccuracy < 1, user overestimates
  const underestimatePercentage = ((avgAccuracy - 1) * 100).toFixed(1)

  return {
    totalCompletedTasks: data.length,
    averageAccuracy: avgAccuracy.toFixed(2),
    underestimatePercentage: underestimatePercentage,
    message: avgAccuracy >= 1.1 
      ? `You typically underestimate by ${Math.abs(underestimatePercentage)}%`
      : avgAccuracy <= 0.9
      ? `You typically overestimate by ${Math.abs(underestimatePercentage)}%`
      : 'Your estimates are pretty accurate!'
  }
}