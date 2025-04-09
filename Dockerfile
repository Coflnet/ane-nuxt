FROM node:22-slim AS build
WORKDIR /app

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./
# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install

# Copy the rest of the application code
COPY . .

# Build the Nuxt app
RUN pnpm run build

# Use a smaller base image for the runtime stage
FROM node:22-slim AS prod

# Set the working directory
WORKDIR /app

# Copy only the necessary files from the build stage
COPY --from=build /app/.output /app/.output
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/

# Expose the port the app runs on
EXPOSE 3000
# Start the Nuxt app in production mode
CMD ["node", ".output/server/index.mjs"]
