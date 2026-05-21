# Colombus - The ML pipelines exploration platform

## Requirements

* Docker (tested on version 28.5.1, build e180ab8)
* Docker Compose (tested on version v2.40.0)
* A GitHub deploy key (for development)

## Starting the app

Prepare the env files
```bash
cp .env.sample .env && sed -i "s|JWT_SECRET=.*|JWT_SECRET=$(openssl rand -base64 20 | sed -E 's/(.)\1+/\1/g')|" .env
```
> [!IMPORTANT]
> Make sure your edit '.env' to update the variables so that they fit your needs.

Then use the following command to launch the app:
```bash
docker compose --env-file .env up --build
```

## Development

We use pre-commit to ensure code quality. Install pre-commit hooks locally:
```bash
uv run --with pre-commit pre-commit install
```
