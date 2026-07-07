FROM node:24-slim AS build
WORKDIR /src

COPY . .

RUN set -eu; \
	if [ -f /src/package.json ]; then \
		app_dir=/src; \
	elif [ -f /src/Ane-nuxt/package.json ]; then \
		app_dir=/src/Ane-nuxt; \
	else \
		echo "package.json not found in build context"; \
		exit 1; \
	fi; \
	cd "$app_dir"; \
	npm install; \
	GOOGLE_APPLICATION_CREDENTIALS=/config/google/credentials.json npm run build; \
	mkdir -p /app; \
	cp -R .output /app/.output

FROM node:24-slim
WORKDIR /app

COPY --from=build /app/.output ./.output

CMD ["node", ".output/server/index.mjs"]

