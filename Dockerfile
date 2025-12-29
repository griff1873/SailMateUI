# Build Stage
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Build Arguments for Auth0 and API configuration
ARG VITE_API_URL=https://sailmateapi-692264879690.us-central1.run.app/api
ARG VITE_AUTH0_DOMAIN=dev-026304zu6k5d8hlc.us.auth0.com
ARG VITE_AUTH0_CLIENT_ID=026304zu6k5d8hlc
ARG VITE_AUTH0_AUDIENCE=https://sailmateui-692264879690.us-central1.run.app

# Note: Vite validates that only VITE_ prefixed variables are exposed to the client
RUN npm run build

# Production Stage
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy built assets from builder stage
COPY --from=build /app/dist .

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080 (Google Cloud Run default)
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
