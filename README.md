# Colombus - The ML pipelines exploration platform

Requires Docker and Docker Compose.

## Deploy

```bash
git clone git@github.com:colombus-dev/colombus.git && cd colombus
cp .env.sample .env # then edit .env
docker compose -f docker-compose.prod.yml up -d --build
```

**Update:**
```bash
docker compose -f docker-compose.prod.yml pull colombus_app colombus_ui
docker compose -f docker-compose.prod.yml up -d
```

## Develop

```bash
cp .env.sample .env # then edit .env
docker network create colombus-dev_network  # once
docker compose -f docker-compose.dev.yml up --build
```

UI → http://localhost:5173
API → http://localhost:8180

## Contributing

```bash
uv run --with pre-commit pre-commit install
```
