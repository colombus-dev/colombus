FROM node:22-alpine

WORKDIR /app

COPY yarn.lock package.json

COPY src/ ./src/

COPY index.html .

COPY public/ ./public/

COPY *.json .

COPY *.js .

COPY *.ts .

RUN --mount=type=cache,target=~/.cache/yarn/v6 yarn install

COPY .env.development .

CMD ["yarn", "dev", "--host"]
