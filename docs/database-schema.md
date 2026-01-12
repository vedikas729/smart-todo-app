# Database Schema

## Overview
This document describes the database structure for the Smart To-Do App.

## Database Choice
Supabase (PostgreSQL)

## Tables

### users
Stores user account information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User's email address |
| name | VARCHAR(255) | NOT NULL | User's display name |
| created_at | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |
| estimation_accuracy | DECIMAL(5,2) | DEFAULT 1.0 | User's average estimation multiplier |

### tasks
Stores all tasks (including subtasks).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique task identifier |
| user_id | UUID | FOREIGN KEY REFERENCES users(id), NOT NULL | Owner of the task |
| task_name | VARCHAR(500) | NOT NULL | Name/description of task |
| estimated_duration_minutes | INTEGER | NOT NULL, CHECK (estimated_duration_minutes > 0) | Estimated time in minutes |
| actual_duration_minutes | INTEGER | NULL | Actual time taken (filled on completion) |
| scheduled_date | DATE | NOT NULL | Date task is scheduled for |
| is_completed | BOOLEAN | DEFAULT FALSE | Completion status |
| completed_at | TIMESTAMP | NULL | When task was completed |
| parent_task_id | UUID | FOREIGN KEY REFERENCES tasks(id), NULL | For subtasks, references parent task |
| created_at | TIMESTAMP | DEFAULT NOW() | Task creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

### Indexes
- `idx_tasks_user_id` on `tasks(user_id)` - Fast lookup of user's tasks
- `idx_tasks_scheduled_date` on `tasks(scheduled_date)` - Fast lookup by date
- `idx_tasks_user_scheduled` on `tasks(user_id, scheduled_date)` - Combined index for today's tasks query

## Relationships
- One user has many tasks (1:N)
- One task can have many subtasks (1:N, self-referential through parent_task_id)

## Sample Queries

### Get Today's Tasks for a User (with Subtasks)
```sql
-- Get all tasks scheduled for today, including subtasks
SELECT * FROM tasks
WHERE user_id = $1 
  AND scheduled_date = CURRENT_DATE
ORDER BY 
  COALESCE(parent_task_id, id),
  parent_task_id NULLS FIRST,
  created_at DESC;
```

### Get Only Parent Tasks for Today
```sql
-- Get only main tasks (no subtasks)
SELECT * FROM tasks
WHERE user_id = $1 
  AND scheduled_date = CURRENT_DATE
  AND parent_task_id IS NULL
ORDER BY created_at DESC;
```

### Get Subtasks for a Specific Parent Task
```sql
SELECT * FROM tasks
WHERE parent_task_id = $1
  AND user_id = $2
ORDER BY created_at ASC;
```