FROM node:alpine
WORKDIR /usr/src/app
COPY . .
RUN apk update && \
 apk add docker && \
 apk add docker-compose && \
 npm install