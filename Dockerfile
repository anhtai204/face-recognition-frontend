# Stage 1: build Next.js
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --frozen-lockfile
COPY . .
RUN npm run build

# Stage 2: production
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXTAUTH_SECRET=c3ccb63a-8bf9-4163-9e5f-7d4015a0809a
ENV NEXTAUTH_URL=http://localhost

# copy kết quả build
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
