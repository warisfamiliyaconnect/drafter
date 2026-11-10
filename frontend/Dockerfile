# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Disable SSL strictness for the build process
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

COPY frontend/package*.json frontend/.npmrc ./
RUN npm install --unsafe-perm

COPY frontend/ .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]
