FROM node:26-slim AS build
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
	npm ci; \
	GOOGLE_APPLICATION_CREDENTIALS=/config/google/credentials.json npm run build; \
	# sharp >=0.33 loads its native binding and libvips from platform-specific
	# @img packages via a dynamic require that nitro cannot trace, so ship the
	# ones npm installed for this platform next to the traced sharp package.
	mkdir -p .output/server/node_modules/@img; \
	for pkg in node_modules/@img/sharp-*; do \
		cp -R "$pkg" .output/server/node_modules/@img/; \
	done; \
	mkdir -p /app; \
	cp -R .output /app/.output

FROM node:26-slim
WORKDIR /app

COPY --from=build /app/.output ./.output

CMD ["node", ".output/server/index.mjs"]
