# Manual Deployment Guide

Quick reference for deploying Imagion to your server without using CI/CD. This assumes you have SSH access to the server.

## Prerequisites

- Ubuntu server with Docker and Docker Compose installed
- SSH access to the server
- ONNX models downloaded locally (9 files, ~1.5 GB total)

## Step 1: Package the project

On your local machine (Windows):

```powershell
cd F:\repos\ai-detector\ai-detector

# Create tarball excluding heavy files
tar -czf imagion-deploy.tar.gz `
  --exclude=node_modules `
  --exclude=.next `
  --exclude=.git `
  --exclude=extension `
  --exclude=benchmark/test-assets `
  --exclude=benchmark/results `
  --exclude=public/models/onnx `
  .
```

## Step 2: Transfer files to server

```powershell
# Transfer source code
scp imagion-deploy.tar.gz YOUR_USER@YOUR_SERVER_IP:/tmp/

# Transfer ONNX models (separate, large files)
scp -r public\models\onnx\* YOUR_USER@YOUR_SERVER_IP:/tmp/imagion-models/

# Transfer environment file
scp .env.production YOUR_USER@YOUR_SERVER_IP:/tmp/
```

## Step 3: Set up on server

SSH into your server:

```bash
ssh YOUR_USER@YOUR_SERVER_IP
```

Create directory structure:

```bash
sudo mkdir -p /opt/imagion/{src,models}
sudo chown -R $USER:$USER /opt/imagion
```

Extract and organize files:

```bash
# Extract source
cd /opt/imagion/src
tar -xzf /tmp/imagion-deploy.tar.gz

# Move models
mv /tmp/imagion-models/* /opt/imagion/models/

# Move environment file
mv /tmp/.env.production /opt/imagion/

# Copy Docker Compose to working directory
cp /opt/imagion/src/docker-compose.prod.yml /opt/imagion/
```

Verify models are present:

```bash
ls -lh /opt/imagion/models/
# Should show: model.onnx, model.onnx.data, model_q4.onnx, nyuad.onnx, etc.
```

## Step 4: Build Docker image

```bash
cd /opt/imagion/src

docker build -t ghcr.io/beladevo/detect-ai:latest \
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

**Note:** First build takes 10-15 minutes (installs deps, compiles native modules).

## Step 5: Start services

```bash
cd /opt/imagion

# Start database and Redis
docker compose -f docker-compose.prod.yml up -d postgres redis

# Wait for healthy status (30-60 seconds)
watch -n 2 'docker compose -f docker-compose.prod.yml ps'
# Press Ctrl+C when both show "healthy"
```

## Step 6: Run database migrations

```bash
docker compose -f docker-compose.prod.yml --profile migration run --rm migrate
```

Expected output:
```
Prisma Migrate applied successfully
```

## Step 7: Start the application

```bash
docker compose -f docker-compose.prod.yml up -d app
```

## Step 8: Verify deployment

Check container status:

```bash
docker compose -f docker-compose.prod.yml ps
```

Expected output (all services should show "Up" and app should be "healthy"):
```
NAME                IMAGE                              STATUS
imagion-app         ghcr.io/beladevo/detect-ai:latest  Up (healthy)
imagion-postgres    postgres:16-alpine                 Up (healthy)
imagion-redis       redis:7-alpine                     Up (healthy)
```

Check logs:

```bash
docker logs imagion-app --tail 50
```

Expected: No errors, should show:
```
▲ Next.js 16.1.1
- Local:        http://localhost:3000
- Network:      http://0.0.0.0:3000

✓ Ready in 2.3s
```

Test health endpoint:

```bash
curl http://localhost:3000/api/health
```

Expected: `{"status":"ok"}`

## Step 9: Access the application

### From the server itself

```bash
curl http://localhost:3000
```

### From your local machine (via SSH tunnel)

On your local machine:

```bash
ssh -L 3000:localhost:3000 YOUR_USER@YOUR_SERVER_IP
```

Then open your browser to: `http://localhost:3000`

## Optional: Start Cloudflare Tunnel

If you have a custom domain and configured the tunnel token:

```bash
cd /opt/imagion
docker compose -f docker-compose.prod.yml --profile tunnel up -d cloudflared
```

## Updating the application

When you have code changes:

1. **Package new version** on local machine (same as Step 1)
2. **Transfer** to server (same as Step 2)
3. **Extract** new code:
   ```bash
   cd /opt/imagion/src
   rm -rf *
   tar -xzf /tmp/imagion-deploy.tar.gz
   ```
4. **Rebuild** Docker image (same as Step 4)
5. **Run migrations** (if schema changed):
   ```bash
   cd /opt/imagion
   docker compose -f docker-compose.prod.yml --profile migration run --rm migrate
   ```
6. **Restart app**:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --no-deps app
   ```
7. **Verify** (same as Step 8)

## Troubleshooting

### App won't start

```bash
# Check logs
docker logs imagion-app --tail 100

# Common issues:
# - Missing env vars: check /opt/imagion/.env.production
# - Database not ready: ensure postgres is healthy
# - Missing models: check /opt/imagion/models/ has .onnx files
```

### Database migration fails

```bash
# Check postgres logs
docker logs imagion-postgres --tail 50

# Check migration status
docker compose -f docker-compose.prod.yml --profile migration run --rm migrate
```

### Can't connect from outside

The app binds to `127.0.0.1:3000` only. Use SSH tunnel or Cloudflare Tunnel for external access.

### Reset everything

```bash
cd /opt/imagion
docker compose -f docker-compose.prod.yml down -v  # WARNING: deletes all data
docker system prune -a  # Clean up images
# Then restart from Step 5
```

## Environment Variables

The `.env.production` file must contain at minimum:

```bash
# Required (already generated)
POSTGRES_PASSWORD=<random>
REDIS_PASSWORD=<random>
JWT_SECRET=<random>
MODELS_PATH=/opt/imagion/models

# Required for runtime
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_MODEL_NAME=model.onnx
```

Optional services (fill in if you want them to work):
- Stripe (billing): 11 variables
- PayPal (payments): 3 variables
- SMTP (email verification): 5 variables
- Hotjar (analytics): 1 variable

See `.env.production.example` for all options.

## File Structure

After deployment:

```
/opt/imagion/
├── src/                          # Extracted source code
│   ├── Dockerfile
│   ├── docker-compose.prod.yml
│   ├── package.json
│   ├── prisma/
│   └── src/
├── models/                       # ONNX models (volume-mounted)
│   ├── model.onnx
│   ├── model.onnx.data
│   ├── model_q4.onnx
│   └── ...
├── docker-compose.prod.yml       # Active compose file
└── .env.production              # Production secrets
```

## Security Notes

- Database and Redis have no exposed ports (internal Docker network only)
- App binds to `127.0.0.1` only (not `0.0.0.0`)
- All secrets are in `.env.production` (gitignored)
- Models are mounted read-only (`:ro`)
- Containers run as non-root user (UID 1001)

## Next Steps

- Set up Tailscale for secure remote access
- Configure Cloudflare Tunnel when you buy a domain
- Set up automated CI/CD (see `.github/workflows/deploy.yml`)
- Enable billing by filling in Stripe/PayPal credentials
- Enable email verification by filling in SMTP credentials
