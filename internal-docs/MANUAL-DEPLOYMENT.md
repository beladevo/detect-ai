# Manual Deployment Guide

Quick reference for deploying Imagion to your home server without CI/CD.

## Your SSH Connection

```powershell
ssh -i id_ed25519 boomelite@home-server
```

## Prerequisites

**Local machine (Windows):**
- Git Bash or PowerShell
- SSH key (`id_ed25519`)

**Server (Ubuntu):**
- Docker and Docker Compose installed
- SSH access configured

## Quick Start (Copy-Paste Ready)

### Step 1: Package the project (local machine)

Open Git Bash in `F:\repos\ai-detector\ai-detector`:

```bash
cd /f/repos/ai-detector/ai-detector

# Create tarball
tar -czf imagion-deploy.tar.gz \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.git \
  --exclude=extension \
  --exclude=benchmark/test-assets \
  --exclude=benchmark/results \
  --exclude=public/models/onnx \
  --exclude=wasm \
  --exclude=logs \
  .
```

### Step 2: Transfer files to server (local machine)

```bash
# Create models directory on server first
ssh -i ~/.ssh/id_ed25519 boomelite@home-server "mkdir -p /tmp/imagion-models"

# Transfer source code (~5 MB)
scp -i ~/.ssh/id_ed25519 imagion-deploy.tar.gz boomelite@home-server:/tmp/

# Transfer ONNX models (~1.5 GB) - this takes a while
scp -i ~/.ssh/id_ed25519 -r public/models/onnx/* boomelite@home-server:/tmp/imagion-models/

# Transfer environment file
scp -i ~/.ssh/id_ed25519 .env.production boomelite@home-server:/tmp/
```

### Step 3: SSH into server

```bash
ssh -i ~/.ssh/id_ed25519 boomelite@home-server
```

### Step 4: Set up directories (on server)

```bash
# Create directory structure
sudo mkdir -p /opt/imagion/{src,models}
sudo chown -R $USER:$USER /opt/imagion

# Extract source
cd /opt/imagion/src
tar -xzf /tmp/imagion-deploy.tar.gz

# Move models
mv /tmp/imagion-models/* /opt/imagion/models/

# Move config files
mv /tmp/.env.production /opt/imagion/
cp /opt/imagion/src/docker-compose.prod.yml /opt/imagion/

# Verify models
ls -lh /opt/imagion/models/
```

Before you build the image, double-check `/opt/imagion/.env.production` so `DATABASE_URL` points at the AWS RDS host (replace `<YOUR_DB_PASSWORD>` with the secret you were given) and the AWS/PG variables match that cluster. The `POSTGRES_*` entries at the bottom are only read when you explicitly launch the `local-db` profile.

### Step 5: Build Docker image (on server)

```bash
cd /opt/imagion/src

docker build -t imagion:latest \
  --build-arg NEXT_PUBLIC_BASE_URL=http://localhost:3000 \
  --build-arg NEXT_PUBLIC_MODEL_NAME=model.onnx \
  --build-arg NEXT_PUBLIC_USE_API_ONLY=false \
  --build-arg NEXT_PUBLIC_PREMIUM_FEATURES_ENABLED=true \
  --build-arg NEXT_PUBLIC_PIPELINE_ML_ENABLED=true \
  --build-arg NEXT_PUBLIC_PIPELINE_VISUAL_ENABLED=false \
  --build-arg NEXT_PUBLIC_PIPELINE_METADATA_ENABLED=false \
  --build-arg NEXT_PUBLIC_PIPELINE_PHYSICS_ENABLED=false \
  --build-arg NEXT_PUBLIC_PIPELINE_FREQUENCY_ENABLED=false \
  --build-arg NEXT_PUBLIC_PIPELINE_PROVENANCE_ENABLED=false \
  --build-arg NEXT_PUBLIC_HOTJAR_SITE_ID=6622003 \
  .
```

**Note:** First build takes 10-15 minutes.

### Step 6: Update docker-compose to use local image

```bash
cd /opt/imagion

# Edit compose file to use local image name
sed -i 's|ghcr.io/beladevo/detect-ai:latest|imagion:latest|g' docker-compose.prod.yml
```

### Step 7: Start services (on server)

```bash
cd /opt/imagion

# The managed Redis endpoint (provided via REDIS_URL in .env.production)
# replaces the compose-owned Redis container. If you still need a local
# Redis instance for debugging, enable it explicitly:
#   docker compose -f docker-compose.prod.yml --profile local-redis up -d redis

# Optional: start the bundled Postgres container for local diagnostics
docker compose -f docker-compose.prod.yml --profile local-db up -d postgres

# Wait for (the optional) Postgres to be healthy
docker compose -f docker-compose.prod.yml ps

# Run database migrations
docker compose -f docker-compose.prod.yml --profile migration run --rm migrate

# Start the app
docker compose -f docker-compose.prod.yml up -d app
```

### Step 8: Verify (on server)

```bash
# Check all containers
docker compose -f docker-compose.prod.yml ps

# Check app logs
docker logs imagion-app --tail 30

# Test health endpoint
curl http://localhost:3000/api/health
# Expected: {"status":"ok"}
```

### Step 9: Access from your PC

Open a new terminal on your local machine:

```bash
# SSH tunnel to access the app
ssh -i ~/.ssh/id_ed25519 -L 3000:localhost:3000 boomelite@home-server
```

Keep this terminal open, then browse to: **http://localhost:3000**

---

## All-in-One Commands

### Local machine (Git Bash)

```bash
# Package and transfer everything
cd /f/repos/ai-detector/ai-detector

tar -czf imagion-deploy.tar.gz \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.git \
  --exclude=extension \
  --exclude=benchmark/test-assets \
  --exclude=benchmark/results \
  --exclude=public/models/onnx \
  .

ssh -i ~/.ssh/id_ed25519 boomelite@home-server "mkdir -p /tmp/imagion-models"
scp -i ~/.ssh/id_ed25519 imagion-deploy.tar.gz boomelite@home-server:/tmp/
scp -i ~/.ssh/id_ed25519 -r public/models/onnx/* boomelite@home-server:/tmp/imagion-models/
scp -i ~/.ssh/id_ed25519 .env.production boomelite@home-server:/tmp/

ssh -i ~/.ssh/id_ed25519 boomelite@home-server
```

### Server (after SSH)

```bash
# Setup
sudo mkdir -p /opt/imagion/{src,models}
sudo chown -R $USER:$USER /opt/imagion
cd /opt/imagion/src && tar -xzf /tmp/imagion-deploy.tar.gz
mv /tmp/imagion-models/* /opt/imagion/models/
mv /tmp/.env.production /opt/imagion/
cp /opt/imagion/src/docker-compose.prod.yml /opt/imagion/

# Build
cd /opt/imagion/src
docker build -t imagion:latest \
  --build-arg NEXT_PUBLIC_BASE_URL=http://localhost:3000 \
  --build-arg NEXT_PUBLIC_MODEL_NAME=model.onnx \
  --build-arg NEXT_PUBLIC_USE_API_ONLY=false \
  --build-arg NEXT_PUBLIC_PREMIUM_FEATURES_ENABLED=true \
  --build-arg NEXT_PUBLIC_PIPELINE_ML_ENABLED=true \
  --build-arg NEXT_PUBLIC_PIPELINE_VISUAL_ENABLED=false \
  --build-arg NEXT_PUBLIC_PIPELINE_METADATA_ENABLED=false \
  --build-arg NEXT_PUBLIC_PIPELINE_PHYSICS_ENABLED=false \
  --build-arg NEXT_PUBLIC_PIPELINE_FREQUENCY_ENABLED=false \
  --build-arg NEXT_PUBLIC_PIPELINE_PROVENANCE_ENABLED=false \
  --build-arg NEXT_PUBLIC_HOTJAR_SITE_ID=6622003 \
  .

# Deploy
cd /opt/imagion
sed -i 's|ghcr.io/beladevo/detect-ai:latest|imagion:latest|g' docker-compose.prod.yml
# Redis is supplied by the managed `REDIS_URL` entry in `.env.production`.
# Start the compose-managed Redis only if you need the local fallback:
#   docker compose -f docker-compose.prod.yml --profile local-redis up -d redis
# Optional: start the bundled Postgres container for local diagnostics
docker compose -f docker-compose.prod.yml --profile local-db up -d postgres
sleep 30  # Wait for Redis (and the optional Postgres instance)
docker compose -f docker-compose.prod.yml --profile migration run --rm migrate
docker compose -f docker-compose.prod.yml up -d app

# Verify
docker compose -f docker-compose.prod.yml ps
curl http://localhost:3000/api/health
```

---

## Updating the Application

When you have code changes:

### On local machine:

```bash
cd /f/repos/ai-detector/ai-detector

# Repackage
tar -czf imagion-deploy.tar.gz \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.git \
  --exclude=extension \
  --exclude=benchmark/test-assets \
  --exclude=benchmark/results \
  --exclude=public/models/onnx \
  .

# Transfer
scp -i ~/.ssh/id_ed25519 imagion-deploy.tar.gz boomelite@home-server:/tmp/

# SSH in
ssh -i ~/.ssh/id_ed25519 boomelite@home-server
```

### On server:

```bash
cd /opt/imagion/src
rm -rf *
tar -xzf /tmp/imagion-deploy.tar.gz

# Rebuild image
docker build -t imagion:latest \
  --build-arg NEXT_PUBLIC_BASE_URL=http://localhost:3000 \
  --build-arg NEXT_PUBLIC_MODEL_NAME=model.onnx \
  --build-arg NEXT_PUBLIC_USE_API_ONLY=false \
  --build-arg NEXT_PUBLIC_PREMIUM_FEATURES_ENABLED=true \
  --build-arg NEXT_PUBLIC_PIPELINE_ML_ENABLED=true \
  --build-arg NEXT_PUBLIC_PIPELINE_VISUAL_ENABLED=false \
  --build-arg NEXT_PUBLIC_PIPELINE_METADATA_ENABLED=false \
  --build-arg NEXT_PUBLIC_PIPELINE_PHYSICS_ENABLED=false \
  --build-arg NEXT_PUBLIC_PIPELINE_FREQUENCY_ENABLED=false \
  --build-arg NEXT_PUBLIC_PIPELINE_PROVENANCE_ENABLED=false \
  --build-arg NEXT_PUBLIC_HOTJAR_SITE_ID=6622003 \
  .

# Run migrations (if schema changed)
cd /opt/imagion
docker compose -f docker-compose.prod.yml --profile migration run --rm migrate

# Restart app
docker compose -f docker-compose.prod.yml up -d --no-deps app

# Verify
docker logs imagion-app --tail 20
curl http://localhost:3000/api/health
```

---

## Troubleshooting

### Check logs

```bash
docker logs imagion-app --tail 100
docker logs imagion-redis --tail 50
# Optional (only if you started the local-db profile)
docker logs imagion-postgres --tail 50
```

### Restart everything

```bash
cd /opt/imagion
docker compose -f docker-compose.prod.yml restart
```

### Full reset (deletes all data!)

```bash
cd /opt/imagion
docker compose -f docker-compose.prod.yml down -v
docker system prune -a
# Then redo from Step 7
```

### Can't connect from outside

The app only listens on `127.0.0.1`. You must use SSH tunnel:

```bash
ssh -i ~/.ssh/id_ed25519 -L 3000:localhost:3000 boomelite@home-server
```

---

## File Structure

```
/opt/imagion/
├── src/                      # Source code
│   ├── Dockerfile
│   ├── package.json
│   ├── prisma/
│   └── src/
├── models/                   # ONNX models (volume-mounted)
│   ├── model.onnx
│   ├── model.onnx.data
│   ├── model_q4.onnx
│   ├── nyuad.onnx
│   └── ...
├── docker-compose.prod.yml   # Active compose file
└── .env.production           # Secrets
```

---

## Environment Variables

Your `.env.production` already has:
- ✅ `POSTGRES_PASSWORD` — generated
- ✅ `REDIS_PASSWORD` — generated
- ✅ `JWT_SECRET` — generated
- ✅ `MODELS_PATH=/opt/imagion/models`

Optional (fill in later if needed):
- Stripe (billing)
- PayPal (payments)
- SMTP (email)
- Cloudflare Tunnel (custom domain)
