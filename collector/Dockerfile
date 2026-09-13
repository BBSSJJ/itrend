FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app/collector

COPY --chown=node:node collector/package.json collector/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node collector/index.js collector/pipeline.js ./
COPY --chown=node:node collector/src ./src
COPY --chown=node:node config /app/config

USER 1000
EXPOSE 3001

CMD ["node", "index.js"]
