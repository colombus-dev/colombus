FROM node:22-alpine3.22

RUN corepack enable

RUN yarn set version 4.18.1

WORKDIR /app

COPY package.json yarn.lock ./

RUN --mount=type=cache,target=/root/.cache/yarn yarn install --frozen-lockfile

CMD ["yarn", "vite", "--host"]
