FROM node:24-bookworm-slim

LABEL com.azure.containerizationassist.createdby="containerization-assist"

ARG GH_VERSION=2.89.0
ARG COPILOT_VERSION=1.0.98
ARG TARGETARCH

WORKDIR /opt/harness
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl git \
    && arch="$(dpkg --print-architecture)" \
    && curl -fsSLo /tmp/gh.deb "https://github.com/cli/cli/releases/download/v${GH_VERSION}/gh_${GH_VERSION}_linux_${arch}.deb" \
    && apt-get install -y --no-install-recommends /tmp/gh.deb \
    && rm /tmp/gh.deb \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /auth /job /workspace /evidence /home/node/.copilot \
    && chown -R node:node /auth /job /workspace /evidence /home/node

COPY .build-packages/${TARGETARCH}/runtime/ /tmp/packages/
RUN case "${TARGETARCH}" in amd64) cpu=x64 ;; arm64) cpu=arm64 ;; *) exit 1 ;; esac \
    && npm install -g --offline --omit=optional \
       "/tmp/packages/github-copilot-${COPILOT_VERSION}.tgz" \
       "/tmp/packages/github-copilot-linux-${cpu}-${COPILOT_VERSION}.tgz" \
       /tmp/packages/detect-libc-2.1.2.tgz \
    && npm cache add /tmp/packages/*.tgz

COPY package.json ./
RUN cp /tmp/packages/package-lock.json ./package-lock.json \
    && npm ci --offline --omit=dev && npm cache clean --force && rm -rf /tmp/packages
COPY harness-lib.mjs worker.mjs dump-models.mjs ./

ENV HOME=/home/node
USER node
# Batch containers have no listener; the controller checks readiness and exit status.
HEALTHCHECK NONE
CMD ["node", "/opt/harness/worker.mjs", "/job/plan.json"]
