# Frontend Dockerfile for Grounding Designer Pro
FROM node:20-alpine AS builder

WORKDIR /app

# Install Node dependencies (including devDependencies for build)
COPY package*.json ./
RUN npm ci

# Copy frontend code
COPY . .

# Build React app
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app

COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
