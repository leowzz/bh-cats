FROM node:22-alpine AS build
WORKDIR /app
ARG VITE_API_BASE_URL=/api
ARG VITE_MEDIA_BASE_URL=/media
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_MEDIA_BASE_URL=${VITE_MEDIA_BASE_URL}
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
ARG BACKEND_BASE_URL=http://backend:8000
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN sed -i "s|__BACKEND_BASE_URL__|${BACKEND_BASE_URL}|g" /etc/nginx/conf.d/default.conf
EXPOSE 80
