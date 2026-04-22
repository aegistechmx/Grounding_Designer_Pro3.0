# Grounding Designer Pro - Backend Industrial

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 20+
- Docker y Docker Compose
- PostgreSQL 15+ (opcional, Docker incluido)

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/your-org/grounding-backend.git
cd grounding-backend

# Copiar variables de entorno
cp .env.example .env

# Iniciar servicios con Docker
npm run docker:up

# Generar cliente Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# Iniciar API
npm run dev:api

# En otra terminal, iniciar workers
npm run dev:worker-fem
npm run dev:worker-ai
npm run dev:worker-opt
```

## 🐳 Docker Compose

```bash
# Levantar todo el stack
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

## 📊 Endpoints API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /api/projects | Crear proyecto |
| GET | /api/projects | Listar proyectos |
| POST | /api/simulation/run/:projectId | Ejecutar simulación FEM |
| GET | /api/simulation/status/:simulationId | Estado de simulación |
| POST | /api/simulation/ai/:projectId | Diseño con IA |
| POST | /api/simulation/optimize/:projectId | Optimización NSGA-II |
| GET | /api/compliance/:projectId | Reporte de cumplimiento |
| POST | /api/auth/login | Login |
| POST | /api/auth/register | Registro |
| POST | /api/billing/create-checkout | Crear checkout Stripe |

## 🧪 Probar la API

```bash
# Crear proyecto
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Project","voltageLevel":13200,"soilProfile":{},"gridDesign":{}}'

# Ejecutar simulación
curl -X POST http://localhost:3000/api/simulation/run/{projectId}

# Ver estado
curl http://localhost:3000/api/simulation/status/{simulationId}
```

## 📈 Escalado

```bash
# Escalar workers FEM
docker-compose up -d --scale worker-fem=5

# Kubernetes (producción)
kubectl apply -f infra/k8s/
```

## 🔧 Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection | postgresql://... |
| REDIS_URL | Redis connection | redis://redis:6379 |
| PORT | API port | 3000 |
| JWT_SECRET | JWT signing secret | - |
| STRIPE_SECRET_KEY | Stripe API key | - |

## 📝 Licencia

MIT

Desarrollado para ingeniería eléctrica profesional
