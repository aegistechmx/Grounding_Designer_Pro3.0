# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy backend code
COPY . .

# Expose port
EXPOSE 3001

# Start the server
CMD ["node", "server.js"]
