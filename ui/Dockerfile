FROM node:22-alpine3.22

WORKDIR /app

COPY package.json yarn.lock ./

RUN --mount=type=cache,target=~/.cache/yarn/v6 yarn install --modules-folder=/node_modules

CMD ["yarn", "--modules-folder=/node_modules", "vite", "--host"]
