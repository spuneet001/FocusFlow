# FocusFlow — AI-Powered Todo App

Full-stack application with **Spring Boot** backend and **React** frontend.

## Architecture

```
focusflow/
├── backend/          ← Spring Boot 3 (Java 17)
│   ├── src/main/java/com/focusflow/
│   │   ├── controller/     AuthController, TaskController, AiAgentController, ReportController
│   │   ├── service/        AuthService, TaskService, AiAgentService, WeeklyReportService
│   │   ├── entity/         User, Task, AiPlan, WeeklyReport
│   │   ├── repository/     JPA repositories
│   │   ├── security/       JwtService, JwtAuthFilter
│   │   └── config/         SecurityConfig (CORS, JWT, BCrypt)
│   └── src/main/resources/application.properties
│
├── frontend/         ← React 18 + Vite
│   └── src/
│       ├── api/        axios client + typed API calls
│       ├── store/      Zustand (auth + tasks)
│       ├── pages/      AuthPage, TasksPage, AgentPage, ReportPage, SubscriptionPage
│       ├── components/ Sidebar, reusable UI (Btn, Card, Modal, Badge...)
│       └── styles/     global.css with CSS variables
│
└── docker-compose.yml   ← PostgreSQL + Backend + Frontend
```

## Database Tables (auto-created via Hibernate)

| Table           | Key Columns                                                        |
|-----------------|--------------------------------------------------------------------|
| `users`         | id, name, email, password (bcrypt), plan (FREE/PRO/PREMIUM)       |
| `tasks`         | id, user_id, title, description, task_date, task_time, alarm_tune, priority, category, done, ai_generated |
| `ai_plans`      | id, user_id, goal, generated_plan, chat_history (JSON), tasks_added |
| `weekly_reports`| id, user_id, week_start, total_tasks, completed_tasks, ai_narrative, daily_stats (JSON) |

## REST API Endpoints

### Auth
| Method | URL                  | Body                       |
|--------|----------------------|----------------------------|
| POST   | /api/auth/register   | {name, email, password}    |
| POST   | /api/auth/login      | {email, password}          |

### Tasks
| Method | URL                        | Description              |
|--------|----------------------------|--------------------------|
| GET    | /api/tasks                 | All tasks for user       |
| GET    | /api/tasks/date/{date}     | Tasks by date            |
| POST   | /api/tasks                 | Create task              |
| PUT    | /api/tasks/{id}            | Update task              |
| PATCH  | /api/tasks/{id}/toggle     | Toggle done              |
| DELETE | /api/tasks/{id}            | Delete task              |

### AI Agent (Pro+)
| Method | URL            | Description                      |
|--------|----------------|----------------------------------|
| POST   | /api/ai/plan   | Generate plan from goal          |
| POST   | /api/ai/chat   | Chat to refine plan              |
| GET    | /api/ai/plans  | Get all saved plans              |

### Reports
| Method | URL                  | Description               |
|--------|----------------------|---------------------------|
| GET    | /api/reports/current | This week's report + AI   |
| GET    | /api/reports         | Report history            |

### User
| Method | URL               | Description          |
|--------|-------------------|----------------------|
| GET    | /api/users/me     | Get profile          |
| PATCH  | /api/users/me/plan| Upgrade plan         |

## Where AI is Integrated

1. **AI Agent — Plan Generation** (`POST /api/ai/plan`)  
   User provides a goal → Claude generates a 7-day personalised task plan

2. **AI Agent — Chat Refinement** (`POST /api/ai/chat`)  
   User chats to modify plan → Claude responds + auto-detects `TASK_ADD: {json}` blocks → tasks saved to DB

3. **Weekly Report — AI Narrative** (`GET /api/reports/current`)  
   Weekly task stats sent to Claude → returns motivational narrative with insights and recommendations → stored in DB

## Quick Start

### 1. Prerequisites
- Java 17+, Maven 3.9+
- Node.js 20+
- PostgreSQL 15+ (or use Docker)

### 2. Environment Variables
```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

### 3a. With Docker (easiest)
```bash
cd focusflow
ANTHROPIC_API_KEY=sk-ant-... docker-compose up
# Frontend: http://localhost:3000
# Backend:  http://localhost:8080
```
docker run --name focusflow-db \
  -e POSTGRES_DB=focusflow \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  -d postgres:15-alpine
### 3b. Without Docker

**Backend:**
```bash
cd backend
# Edit src/main/resources/application.properties with your DB credentials
mvn spring-boot:run
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

## Production Notes
- Replace `app.jwt.secret` with a 256-bit random string (env var)
- Add Stripe webhook handler in `UserController.upgradePlan()`
- Add `spring.jpa.hibernate.ddl-auto=validate` after first run
- Enable HTTPS on nginx and backend
