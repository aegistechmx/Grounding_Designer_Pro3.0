FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY apps/worker-ai/package.json ./apps/worker-ai/
COPY packages/ai/package.json ./packages/ai/

RUN npm ci

COPY . .

RUN npx prisma generate

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps ./apps
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/prisma ./prisma

CMD ["ts-node", "apps/worker-ai/src/index.ts"]
