FROM ghcr.io/astral-sh/uv:python3.12-alpine

# TODO: split builder/runner to reduce image size

LABEL version="0.1"
LABEL description="This is the image used to build the Colombus API."

WORKDIR /colombus-builder

# Install git
RUN apk update && \
    apk upgrade && \
    apk add --no-cache git=2.47.2-r0 build-base=0.5-r3 openssh-client=9.9_p2-r0

COPY pyproject.toml uv.lock ./

RUN mkdir -p ~/.ssh && chmod 0700 ~/.ssh
RUN ssh-keyscan github.com >> ~/.ssh/known_hosts

# Install dependencies
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    --mount=type=ssh \
    uv sync --locked --no-install-project --no-install-package=jupyterlab

RUN adduser -D standarduser

RUN chown -R standarduser:standarduser /colombus-builder

USER standarduser

COPY ./app/ /colombus-builder/app/

CMD [".venv/bin/fastapi", "dev", "app/main.py", "--host", "0.0.0.0", "--port", "8180"]
