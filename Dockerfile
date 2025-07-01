# Stage 1: Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 2: Production stage
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
# Disable telemetry during runtime
ENV NEXT_TELEMETRY_DISABLED 1

# Copy necessary files from the build stage
COPY --from=build /app/public ./public
# The standalone output copies necessary node_modules, so we don't need to copy them separately.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static

# Use the non-root user from the base image
USER node

# Expose port 9002 as requested
EXPOSE 9002
ENV PORT 9002

# The `server.js` file is created by Next.js when `output: 'standalone'` is set
CMD ["node", "server.js"]
