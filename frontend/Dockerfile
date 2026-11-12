# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Disable SSL strictness for the build process if corporate proxy is in use
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

COPY frontend/package*.json frontend/.npmrc* ./
RUN npm install --unsafe-perm

COPY frontend/ .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Run as non-root user for security
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Copy public assets and Next.js standalone output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
