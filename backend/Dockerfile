# Backend Dockerfile for Grounding Designer Pro SaaS
FROM node:20-alpine

# Install Python and dependencies for report generation using virtual environment
RUN apk add --no-cache python3 py3-pip gcc musl-dev libffi-dev \
    && python3 -m venv /opt/venv \
    && /opt/venv/bin/pip install --no-cache-dir reportlab openpyxl

# Add venv to PATH
ENV PATH="/opt/venv/bin:$PATH"

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