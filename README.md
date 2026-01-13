# Smart To-Do App

A productivity app that helps you plan realistically by forcing time estimation and tracking your accuracy over time.

## Features

- Guided 3-step task creation flow
- Automatic breakdown prompts for large tasks (>1 hour)
- Daily focus view showing today's tasks
- Hierarchical subtask display
- Estimation accuracy tracking
- User authentication

## Tech Stack

- **Frontend:** React, JavaScript
- **Backend:** Supabase (PostgreSQL + Auto-generated API)
- **Authentication:** Supabase Auth
- **Hosting:** TBD, possibly Netlify (frontend)

## Architecture
```
React Frontend → Supabase Client → Supabase Cloud (PostgreSQL + API)
```

## Project Structure
```
smart-todo-app/
├── frontend/          # React application
├── database/          # SQL scripts and migrations
├── docs/              # Documentation
└── README.md
```