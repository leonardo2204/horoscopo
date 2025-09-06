# Stage 1: Build the application
FROM node:23-alpine AS build

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and pnpm-lock.yaml (or yarn.lock/package-lock.json)
# to leverage Docker's layer caching
COPY package.json pnpm-lock.yaml* ./

# Install dependencies using pnpm (or npm/yarn)
RUN npm install

# Copy the rest of the application files
COPY . .

# Accept build args for environment variables
ARG VITE_PUBLIC_POSTHOG_KEY
ARG VITE_PUBLIC_POSTHOG_HOST

# Set environment variables from build args
ENV VITE_PUBLIC_POSTHOG_KEY=$VITE_PUBLIC_POSTHOG_KEY
ENV VITE_PUBLIC_POSTHOG_HOST=$VITE_PUBLIC_POSTHOG_HOST

# Build the TanStack Start application
# This command will depend on your project's build script, usually defined in package.json
RUN npm run build

# Stage 2: Serve the application
FROM node:23-alpine AS production

# Set the working directory
WORKDIR /app

# Copy package.json for production dependencies
COPY package.json ./

# Install only production dependencies including native modules
RUN npm install --production

# Copy the build output from the build stage
COPY --from=build /app/.output ./.output

# Expose the port your application listens on (default for TanStack Start is often 3000)
EXPOSE 3000

# Start the application
# This command will depend on your project's start script, usually defined in package.json
CMD ["node", ".output/server/index.mjs"]