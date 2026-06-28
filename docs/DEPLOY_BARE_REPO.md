# Deploy PriceIL Web via Bare Git Repo (`priceil-web-srv`)

This guide explains how to deploy this app to a server using a bare Git repository and push-to-deploy.

## Architecture

- Server bare repo: `priceil-web-srv` (for receiving pushes)
- Server working tree: checked-out app files used by Docker Compose
- Trigger: pushing `main` to `priceil-web-srv`
- Deploy action: post-receive hook checks out latest code and restarts container

## 1) Server prerequisites

Install on the server:

- `git`
- `docker`
- Docker Compose plugin (`docker compose`)

Create a deploy user (example: `deploy`) and ensure it can run Docker:

```bash
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG docker deploy
```

Log out and back in so group changes apply.

## 2) Create server directories and bare repo

Example paths:

- Bare repo: `/srv/git/priceil-web-srv.git`
- Working tree: `/srv/apps/priceil-web`

Run on the server:

```bash
sudo mkdir -p /srv/git /srv/apps/priceil-web
sudo chown -R deploy:deploy /srv/git /srv/apps/priceil-web

sudo -u deploy git init --bare /srv/git/priceil-web-srv.git
```

## 3) Add post-receive deploy hook

Create file:

`/srv/git/priceil-web-srv.git/hooks/post-receive`

```sh
#!/usr/bin/env sh
set -eu

GIT_DIR="/srv/git/priceil-web-srv.git"
WORK_TREE="/srv/apps/priceil-web"
TARGET_REF="refs/heads/main"

while read -r oldrev newrev refname; do
  [ "$refname" = "$TARGET_REF" ] || continue

  echo "[deploy] Updating working tree from $refname"
  mkdir -p "$WORK_TREE"
  GIT_WORK_TREE="$WORK_TREE" git --git-dir="$GIT_DIR" checkout -f main

  cd "$WORK_TREE"

  echo "[deploy] Building and restarting app container"
  docker compose build app
  docker compose up -d app

  echo "[deploy] Done"
done
```

Make it executable:

```bash
chmod +x /srv/git/priceil-web-srv.git/hooks/post-receive
```

## 4) Configure environment on server

Your compose file loads `.env.local`, so create it in the working tree path:

`/srv/apps/priceil-web/.env.local`

Example:

```env
NEXT_PUBLIC_API_URL=https://api.priceil.dev
# add other required variables used by this app
```

Important:

- Keep secrets only on the server `.env.local`
- Do not commit `.env.local`

## 5) Local remote configuration

If needed, configure remote from your local repo:

```bash
git remote add priceil-web-srv deploy@<SERVER_HOST>:/srv/git/priceil-web-srv.git
```

You already added this remote, so verify only:

```bash
git remote -v
```

## 6) Deploy

Push `main` to server:

```bash
git push priceil-web-srv main
```

This triggers the hook, checks out latest code, rebuilds, and restarts `app`.

## 7) Verify deployment

On server:

```bash
cd /srv/apps/priceil-web
docker compose ps
docker compose logs -f app
```

## 8) Rollback (quick)

On server, checkout a previous commit and restart:

```bash
cd /srv/apps/priceil-web
git log --oneline -n 10
git checkout <COMMIT_SHA>
docker compose up -d --build app
```

Then fix forward with a new push to `main`.

## Notes specific to this repository

- Container uses production mode (`NODE_ENV=production`)
- Service name in compose is `app`
- Dockerfile runs Next.js directly at runtime (not `pnpm start`) to avoid runtime permission issues under non-root user
