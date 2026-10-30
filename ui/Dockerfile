FROM node:22-alpine3.22

ENV YARN_VERSION=4.18.1

RUN corepack enable && corepack prepare yarn@${YARN_VERSION}

WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./

RUN --mount=type=cache,target=/root/.cache/yarn \
    yarn install --immutable

CMD ["yarn", "dev"]
