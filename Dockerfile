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

# Distroless, glibc, non-root (uid/gid 65532). No shell, no package manager, no apt layer.
# The prebuilt @img/sharp-linux-x64 bundles libvips, so @nuxt/image's ipx works here.
FROM gcr.io/distroless/nodejs26-debian13:nonroot
WORKDIR /app

COPY --from=build --chown=65532:65532 /app/.output ./.output

# tells node's http clients to honour HTTP(S)_PROXY / NO_PROXY from the pod env
ENV NODE_USE_ENV_PROXY=1
ENV NODE_ENV=production

USER 65532:65532
EXPOSE 3000
# the distroless entrypoint is `node`
CMD [".output/server/index.mjs"]
