FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY apps/worker-optimizer/package.json ./apps/worker-optimizer/
COPY packages/optimization/package.json ./packages/optimization/

RUN npm ci

COPY . .

RUN npx prisma generate

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps ./apps
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/prisma ./prisma

CMD ["ts-node", "apps/worker-optimizer/src/index.ts"]
