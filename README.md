# Colombus - The ML pipelines exploration platform

This project requires Docker and Docker Compose.

## Development mode

First run:
```bash
git clone git@github.com:colombus-dev/colombus.git && cd colombus
cp .env.sample.dev .env
docker network create colombus-dev_network  # once
```

Then deploy the [MLProfiler](https://github.com/colombus-dev/mlprofiler) which has to be linked to Colombus.

You must also complete the `.env` with at least:
- `JWT_SECRET` a secret password of at least 16 characters
- information about the database (name, username, password, host and port) which will be automatically deployed
- `ML_PROFILER_API_URL_PREFIX` the url of the MLProfiler deployed. Warning: put the service name as host to reach it (ex: http://mlprofiler_api:8081)

Finally, you can run:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

The application user interface must be accessible on http://localhost:5173 and the API at http://localhost:8180

## Production mode

```bash
cp .env.sample.prod .env # then edit .env
docker compose -f docker-compose.dev.yml up --build
```

**Update:**
```bash
docker compose -f docker-compose.prod.yml pull colombus_app colombus_ui
docker compose -f docker-compose.prod.yml up -d
```

## Configuration (.env)

The application works out-of-the-box with the default settings provided in `.env.sample`.
If you do not configure optional external services, their corresponding features will simply be disabled in the UI.

### Kaggle Integration (Optional)

To enable importing notebooks directly from Kaggle competitions, provide your Kaggle API credentials in your `.env` file:

```env
KAGGLE_USERNAME=your_kaggle_username
KAGGLE_KEY=your_kaggle_api_key
```

*(You can generate these credentials by going to your [Kaggle account settings](https://www.kaggle.com/settings/api) and clicking "Create New Token".)*

## Contributing

```bash
uv run --with pre-commit pre-commit install
```

## Cite

```
@article{JOT:issue_2026_03/a10,
  author = {Nicolas Lacroix and Mireille Blay-Fornarino and Philippe Collet and Frédéric Precioso and Sébastien Mosser},
  title = {A Model-Driven Approach To Support The Understanding Of Machine Learning Pipelines},
  journal = {Journal of Object Technology},
  volume = {25},
  number = {3},
  issn = {1660-1769},
  year = {2026},
  month = march,
  editor = {},
  note = {ECMFA 2026 Journal First},
  pages = {3:127-140},
  doi = {10.5381/jot.2026.25.3.a10},
  url = {http://www.jot.fm/contents/issue_2026_03/a10.html}
}
```
