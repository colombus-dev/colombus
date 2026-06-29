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
