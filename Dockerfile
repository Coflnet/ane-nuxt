FROM node:22-slim AS build
WORKDIR /app

ARG GOOGLE_APPLICATION_CREDENTIALS

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

CMD ["node", ".output/server/index.mjs"]

