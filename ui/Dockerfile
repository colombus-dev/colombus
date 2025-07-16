FROM node:22-alpine

WORKDIR /app

COPY yarn.lock package.json /app/

RUN --mount=type=cache,target=~/.cache/yarn/v6 yarn install

CMD ["yarn", "dev", "--host"]
