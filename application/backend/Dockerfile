# 
#########################

FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./

RUN npm ci --omit=dev

COPY backend/ .

RUN chown -R node:node /app

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1


CMD ["node", "src/server.js"]