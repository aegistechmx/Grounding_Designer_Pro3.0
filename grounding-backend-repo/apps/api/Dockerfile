FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/engine/package.json ./packages/engine/
COPY packages/compliance/package.json ./packages/compliance/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build api

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["node", "dist/apps/api/main.js"]
