# FROM node:20-alpine AS build

# WORKDIR /app

# COPY frontend/package*.json ./

# RUN npm ci

# COPY frontend/ .

# RUN npm run build


# FROM nginx:alpine

# COPY --from=build /app/dist /usr/share/nginx/html

# EXPOSE 80

# CMD ["nginx", "-g", "daemon off;"]

######################

FROM node:20-alpine AS build

WORKDIR /app

COPY frontend/package*.json ./

RUN npm ci

COPY frontend/ .

RUN npm run build


FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

COPY frontend/nginx.conf /etc/nginx/nginx.conf

RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /var/log/nginx \
    && touch /var/run/nginx.pid \
    && chown nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080 || exit 1

CMD ["nginx", "-g", "daemon off;"]