# Smart To-Do App

A productivity app that helps you plan realistically by forcing time estimation and tracking your accuracy over time.

## Live Demo

**[Try it live here!](https://smart-todo-app-vedikas729.netlify.app/)**

No installation required - just visit the link, sign up, and start organizing your tasks.

## Features

- **Smart 3-Step Task Creation** - Guided flow forces thoughtful planning
- **Automatic Task Breakdown** - Large tasks (>1 hour) prompt for subtask creation
- **Daily Focus View** - See only today's tasks with hierarchical subtasks
- **Estimation Tracking** - Learn how accurate your time estimates are
- **Secure Authentication** - Your data is private and secure
- **Beautiful UI** - Clean, modern, responsive design

## Why This App?

Most todo apps let you dump endless tasks without thinking. This app makes you:
1. **Be specific** about what you'll do
2. **Estimate time** before committing
3. **Track accuracy** to improve over time
4. **Focus on today** instead of being overwhelmed

## Tech Stack

- **Frontend:** React, JavaScript, CSS
- **Backend:** Supabase (PostgreSQL + Auto-generated REST API)
- **Authentication:** Supabase Auth (email/password)
- **Hosting:** Netlify (frontend), Supabase Cloud (backend/database)

## Architecture
```
React Frontend (Netlify) 
    ↓
Supabase JS Client Library
    ↓
Supabase Cloud (Backend)
    ├── PostgreSQL Database
    ├── Auto-generated REST API
    └── Authentication System
```

## Project Structure
```
smart-todo-app/
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # UI components
│   │   │   ├── Auth/            # Login/signup
│   │   │   ├── TaskCreationFlow/ # 3-step task creation
│   │   │   ├── TodayView/        # Daily task list
│   │   │   ├── TaskItem/         # Individual task display
│   │   │   └── EstimationFeedback/ # Accuracy stats
│   │   ├── services/      # API layer
│   │   │   └── api.js           # Supabase queries
│   │   ├── supabaseClient.js    # Supabase connection
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   └── package.json
├── database/              # Database schema (for developers)
│   ├── schema.sql         # Table definitions
│   └── security.sql       # Row Level Security policies
├── docs/                  # Documentation
│   └── database-schema.md
└── README.md
```

## Deployment

This app is deployed using:
- **Frontend:** Netlify (automatically deploys from main branch)
- **Backend:** Supabase Cloud (always-on managed service)
- **Database:** PostgreSQL on Supabase