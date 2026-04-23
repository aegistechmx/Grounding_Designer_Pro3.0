# Backend Dockerfile for Grounding Designer Pro SaaS
FROM node:18-alpine

# Install Python and dependencies
RUN apk add --no-cache python3 py3-pip \
    && pip3 install --no-cache-dir reportlab openpyxl

WORKDIR /app

# Install Node dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy backend code
COPY . .

# Create necessary directories
RUN mkdir -p jobs/reports/results jobs/fem/results

# Expose port
EXPOSE 3001

# Start the server
CMD ["node", "app.js"]
