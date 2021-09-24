FROM node:16.10.0-alpine3.11

WORKDIR /app

RUN apk add --update python make g++\
   && rm -rf /var/cache/apk/*
RUN apk add  --no-cache ffmpeg
RUN npm cache clean --force
RUN npm cache verify


ADD package.json package-lock.json /app/
ADD .dev.env /app/
ADD nest-cli.json /app/

ENV NODE_ENV=dev

RUN npm install

COPY . /app/

VOLUME [ "/app/src" ]

RUN npm run build
