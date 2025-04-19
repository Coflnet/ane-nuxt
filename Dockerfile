FROM node:22-slim AS build
WORKDIR /app

ARG GOOGLE_APPLICATION_CREDENTIALS

# Copy package.json and pnpm-lock.yaml
COPY ./package.json ./package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Nuxt app
RUN npm run build

CMD ["node", ".output/server/index.mjs"]

