# Grounding Designer Pro - SaaS Architecture Documentation

## Overview

Grounding Designer Pro has been transformed from a standalone React application into a comprehensive SaaS platform for professional grounding system design, comparable to ETAP and DIgSILENT.

## Architecture Diagram

```
┌─────────────────┐
│   Frontend      │
│   (React)       │
│   :3000         │
└────────┬────────┘
         │
         │ HTTP/HTTPS
         ↓
┌─────────────────┐
│   API Gateway   │
│   (Express)     │
│   :3001         │
└────────┬────────┘
         │
         ├──────────────┬──────────────┬──────────────┐
         ↓              ↓              ↓              ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ IEEE 80      │ │ FEM          │ │ Heatmap      │ │ Report       │
│ Engine       │ │ Simulation   │ │ Service      │ │ Service      │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
         │              │              │              │
         ↓              ↓              ↓              ↓
┌──────────────────────────────────────────────────────────────┐
│                     BullMQ + Redis                          │
│                    Job Queue System                         │
└──────────────────────────────────────────────────────────────┘
         │
         ↓
┌─────────────────┐
│   PostgreSQL     │
│   Database       │
│   :5432         │
└─────────────────┘
```

## Components

### Frontend (React)
- **Location**: `src/`
- **Port**: 3000
- **Key Features**:
  - API client layer (`src/api/`)
  - Component-based architecture
  - Real-time visualization
  - PDF/Excel export integration

### Backend (Node.js + Python)
- **Location**: `backend/`
- **Port**: 3001
- **Key Services**:
  - IEEE 80 Engine Service (`services/ieee80.service.js`)
  - FEM Simulation Service (`services/fem.service.js`)
  - Heatmap Service (`services/heatmap.service.js`)
  - Report Service (`services/report.service.js`)
  - AI Service (`services/ai.service.js`)
  - Authentication Service (`services/auth.service.js`)
  - Version Service (`services/version.service.js`)
  - Dashboard Service (`services/dashboard.service.js`)

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update user
- `GET /api/auth/limits` - Check plan limits

#### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/:id/versions` - Get project versions
- `POST /api/projects/:id/versions` - Create version
- `GET /api/projects/:id/compare` - Compare versions

#### Simulation
- `POST /api/simulation/ieee80` - Run IEEE 80 simulation
- `POST /api/simulation/fem` - Run FEM simulation (async)
- `GET /api/simulation/jobs/:jobId` - Get job status
- `GET /api/simulation/results/:resultId` - Get simulation result
- `POST /api/simulation/sensitivity` - Run sensitivity analysis
- `POST /api/simulation/optimize` - Run optimization
- `GET /api/simulation/heatmap/:resultId` - Get heatmap
- `POST /api/simulation/batch` - Batch simulations

#### Reports
- `POST /api/reports/pdf` - Generate PDF (async)
- `POST /api/reports/excel` - Generate Excel (async)
- `POST /api/reports/dxf` - Generate DXF (async)
- `POST /api/reports/batch` - Batch reports (async)
- `GET /api/reports/jobs/:jobId` - Get job status
- `GET /api/reports/:reportId/download` - Download report
- `GET /api/reports/:reportId` - Get report metadata
- `GET /api/reports/project/:projectId` - List project reports

#### Dashboard
- `GET /api/dashboard/overview` - Dashboard overview
- `GET /api/dashboard/recent-projects` - Recent projects
- `GET /api/dashboard/usage` - Usage statistics
- `GET /api/dashboard/current-usage` - Current month usage
- `GET /api/dashboard/activity` - Activity timeline
- `GET /api/dashboard/compliance-trends` - Compliance trends
- `GET /api/dashboard/top-projects` - Top performing projects

## Database Schema

### Tables
- **users** - User accounts with roles and plans
- **projects** - Project information
- **simulations** - Simulation records with version tracking
- **results** - Detailed simulation results
- **reports** - Generated reports (PDF, Excel, DXF)
- **project_versions** - Project versioning
- **usage_tracking** - SaaS usage and limits

### Relationships
- users (1) → projects (N)
- projects (1) → simulations (N)
- simulations (1) → results (1)
- projects (1) → reports (N)
- projects (1) → project_versions (N)
- users (1) → usage_tracking (N)

## Job Queue System

### Queues
- **simulation** - FEM simulations
- **reports** - PDF/Excel/DXF generation
- **heatmap** - Heatmap generation
- **fem** - Heavy FEM calculations
- **ai** - AI optimizations

### Workers
- **simulation-worker** - Processes simulation jobs
- **report-worker** - Processes report generation jobs

### Job Flow
1. User requests heavy operation (FEM, PDF generation)
2. Backend creates job in BullMQ queue
3. Worker picks up job
4. Worker processes job (async)
5. Worker saves result
6. Frontend polls job status
7. Frontend retrieves result when complete

## Authentication & Authorization

### JWT Authentication
- Token-based authentication
- 7-day token expiration
- Role-based access control

### Roles
- **admin** - Full access, user management
- **engineer** - Full project access
- **viewer** - Read-only access

### Plans
- **free** - 10 simulations, 5 PDF exports, 100MB storage
- **pro** - 100 simulations, 50 PDF exports, 1GB storage
- **enterprise** - Unlimited access, 10GB storage

## Deployment

### Docker Compose
```bash
docker-compose up -d
```

Services:
- grounding-app (Frontend)
- backend (API Server)
- simulation-worker (Job processor)
- report-worker (Job processor)
- postgres (Database)
- redis (Job queue)

### Environment Variables
```
# Backend
NODE_ENV=production
PORT=3001
DB_HOST=postgres
DB_PORT=5432
DB_NAME=grounding_saas
DB_USER=postgres
DB_PASSWORD=postgres
REDIS_HOST=redis
REDIS_PORT=6379
JWT_SECRET=your-secret-key

# Frontend
REACT_APP_API_URL=http://localhost:3001
```

## Development

### Setup
1. Install dependencies:
   ```bash
   npm install
   cd backend && npm install
   ```

2. Start PostgreSQL and Redis:
   ```bash
   docker-compose up -d postgres redis
   ```

3. Run database migrations:
   ```bash
   psql -h localhost -U postgres -d grounding_saas -f backend/database/schema.sql
   ```

4. Start backend:
   ```bash
   cd backend && node app.js
   ```

5. Start frontend:
   ```bash
   npm start
   ```

### Testing
```bash
# Backend tests
cd backend && npm test

# Frontend tests
npm test
```

## Monitoring

### Health Checks
- Frontend: `GET http://localhost:3000`
- Backend: `GET http://localhost:3001/health`

### Logs
- Backend logs to console
- Workers log to console
- Database logs to PostgreSQL logs

## Security

- JWT token authentication
- Role-based access control
- Rate limiting
- Input sanitization
- CORS configuration
- SQL injection prevention (parameterized queries)

## Scaling

### Horizontal Scaling
- Add more backend instances behind load balancer
- Add more worker instances for job processing
- Use Redis Cluster for job queue scaling

### Vertical Scaling
- Increase database resources
- Increase Redis memory for job queue
- Use more powerful worker instances

## Future Enhancements

- S3 integration for file storage
- Stripe integration for payments
- Email notifications
- Real-time collaboration
- Advanced AI features
- Mobile applications
