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

## Configuration (.env)

The application works out-of-the-box with the default settings provided in `.env.sample`.
If you do not configure optional external services, their corresponding features will simply be disabled in the UI.

### Kaggle Integration (Optional)

To enable importing notebooks directly from Kaggle competitions, provide your Kaggle API credentials in your `.env` file:

```env
KAGGLE_USERNAME=your_kaggle_username
KAGGLE_KEY=your_kaggle_api_key
```

*(You can generate these credentials by going to your Kaggle account settings and clicking "Create New Token".)*

## Contributing

```bash
uv run --with pre-commit pre-commit install
```
