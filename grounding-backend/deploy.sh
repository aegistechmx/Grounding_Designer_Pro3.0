#!/bin/bash

# Script de deploy a producción
echo "🚀 Desplegando Grounding Designer Backend..."

# Cargar variables de entorno
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Build de imágenes
docker build -t grounding-backend:latest .

# Push a registry (ejemplo AWS ECR)
# aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
# docker tag grounding-backend:latest ${REGISTRY}/grounding-backend:${VERSION}
# docker push ${REGISTRY}/grounding-backend:${VERSION}

# Aplicar migraciones de base de datos
# npm run migration:run

# Desplegar a Kubernetes (ejemplo)
# kubectl apply -f infrastructure/kubernetes/

echo "✅ Deploy completado"
