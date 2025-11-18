# Colombus - The ML pipelines exploration platform

## Requirements

* Docker (tested on version 28.5.1, build e180ab8)
* Docker Compose (tested on version v2.40.0)
* A GitHub deploy key (for development)

## Deployment

The following docker compose commands deploy the Colombus exploration platform (in development mode):

```bash
$ docker compose build --ssh default=$HOME/.ssh/[YOUR_GITHUB_SSH_DEPLOY_KEY]
$ docker compose up
```

## Development

### Pre-commit

We use pre-commit to ensure code quality.

```bash
$ uv tool install pre-commit --with pre-commit-uv
$ pre-commit install
```

To test the installation, run the following command:

```bash
$ pre-commit run --all-files
```

For more information, see https://adamj.eu/tech/2025/05/07/pre-commit-install-uv/.
