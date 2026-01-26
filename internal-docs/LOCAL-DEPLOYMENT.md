# Local / Self-Hosted Deployment Guide

This document describes how to deploy Imagion on a home Ubuntu server using a KVM virtual machine, Docker Compose, Cloudflare Tunnel (optional), and Tailscale.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Host OS — Ubuntu Server                                        │
│  ┌────────────┐   ┌──────────────────────────────────────────┐  │
│  │   Immich    │   │  KVM VM — Ubuntu 24.04                   │  │
│  │ (untouched) │   │                                          │  │
│  │             │   │  ┌─ Docker Compose ───────────────────┐  │  │
│  │             │   │  │                                    │  │  │
│  │             │   │  │  app (Next.js)  ←── 127.0.0.1:3000│  │  │
│  │             │   │  │    ↕ internal        ↑ tunnel net  │  │  │
│  │             │   │  │  postgres    redis    cloudflared  │  │  │
│  │             │   │  │  (no ports)  (no ports)  (opt-in)  │  │  │
│  │             │   │  └────────────────────────────────────┘  │  │
│  │             │   │                                          │  │
│  │             │   │  Tailscale ← SSH access / admin          │  │
│  └────────────┘   └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │                              │
         │                    Cloudflare Tunnel (if enabled)
         │                              │
      LAN only               authentipic.com (Cloudflare DNS)
```

**Key properties:**
- Immich on the host is never touched.
- The VM is fully isolated at the hypervisor level.
- Postgres and Redis have zero exposed ports (internal Docker network only).
- Public access flows through Cloudflare Tunnel. Without a domain, access is via Tailscale SSH tunnel.
- CI/CD builds a Docker image, pushes to `ghcr.io`, and deploys via SSH over Tailscale.

## Repository files

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build (deps → builder → runner). Produces a ~300 MB image with Next.js standalone output and native modules. |
| `docker-compose.prod.yml` | Production stack: `app`, `postgres`, `redis`, `cloudflared` (profile: tunnel), `migrate` (profile: migration). |
| `.dockerignore` | Excludes node_modules, .next, models, extension source, benchmark assets from build context. |
| `.github/workflows/deploy.yml` | CI/CD: build → push to ghcr.io → deploy via Tailscale SSH. |
| `.env.production.example` | Template for all production environment variables. |
| `src/app/api/health/route.ts` | Health check endpoint (`GET /api/health`). |
| `next.config.ts` | Contains `output: "standalone"` and `serverExternalPackages` for Docker compatibility. |

## Prerequisites

### Host machine

The host already runs Ubuntu with Immich. Only KVM is needed:

```bash
sudo apt install qemu-kvm libvirt-daemon-system virt-manager
```

### Create the VM

```bash
sudo virt-install \
  --name imagion-vm \
  --ram 8192 \
  --vcpus 6 \
  --disk size=50,format=qcow2,path=/var/lib/libvirt/images/imagion-vm.qcow2 \
  --os-variant ubuntu24.04 \
  --network bridge=br0 \
  --graphics none \
  --console pty,target_type=serial \
  --cdrom /path/to/ubuntu-24.04-live-server-amd64.iso
```

Recommended VM specs:

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 4 vCPUs | 6 vCPUs |
| RAM | 4 GB | 8 GB |
| Disk | 30 GB | 50 GB |

## VM setup

### 1. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
sudo apt install -y docker-compose-plugin
```

### 2. Install Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --advertise-tags=tag:server
```

### 3. Create deploy user

```bash
sudo useradd -m -s /bin/bash -G docker deploy
sudo mkdir -p /home/deploy/.ssh
# Add your CI SSH public key:
echo "ssh-ed25519 AAAA..." | sudo tee /home/deploy/.ssh/authorized_keys
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

### 4. Configure firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow in on tailscale0
sudo ufw enable
```

### 5. Configure swap

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 6. Create directory structure

```bash
sudo mkdir -p /opt/imagion/models
sudo chown -R deploy:deploy /opt/imagion
```

### 7. Transfer files to VM

From your development machine:

```bash
# ONNX models
scp public/models/onnx/* deploy@<vm-tailscale-ip>:/opt/imagion/models/

# Docker Compose file
scp docker-compose.prod.yml deploy@<vm-tailscale-ip>:/opt/imagion/

# Environment file (fill in values first — see section below)
scp .env.production deploy@<vm-tailscale-ip>:/opt/imagion/
```

### 8. Authenticate with ghcr.io

On the VM, log in to GitHub Container Registry so Docker can pull images:

```bash
echo "<GITHUB_PAT>" | docker login ghcr.io -u <github-username> --password-stdin
```

The PAT needs the `read:packages` scope.

## Environment variables

Copy `.env.production.example` to `.env.production` and fill in all values.

**Secrets** (generate strong random values):
- `POSTGRES_PASSWORD` — database password
- `REDIS_PASSWORD` — Redis password
- `JWT_SECRET` — 64-character random string
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — from Stripe dashboard
- `SUPABASE_SERVICE_ROLE_KEY` — from Supabase dashboard
- `SMTP_PASSWORD` — from your email provider
- `PAYPAL_CLIENT_SECRET` — from PayPal dashboard
- `CLOUDFLARE_TUNNEL_TOKEN` — from Cloudflare Zero Trust (leave empty if no domain)

**Configuration** (non-secret):
- `NEXT_PUBLIC_BASE_URL` — `http://localhost:3000` (no domain) or `https://authentipic.com` (with domain)
- `MODELS_PATH` — `/opt/imagion/models`
- Pipeline feature flags, model names, etc.

**Build-time vs runtime**: `NEXT_PUBLIC_*` variables are inlined into client JavaScript at Docker image build time by GitHub Actions (via `build-args`). Server-only secrets are injected at runtime via `.env.production`. Keep the GitHub Actions variable `vars.NEXT_PUBLIC_BASE_URL` in sync with the `.env.production` value.

## Cloudflare Tunnel (optional)

The tunnel is only needed when you have a custom domain. Without it, the app is accessible via Tailscale only.

### Without a domain (default)

1. Leave `CLOUDFLARE_TUNNEL_TOKEN` empty in `.env.production`
2. The CI/CD pipeline skips starting cloudflared
3. Access the app via Tailscale SSH tunnel:
   ```bash
   ssh -L 3000:localhost:3000 deploy@<vm-tailscale-ip>
   # Then open http://localhost:3000 in your browser
   ```

### With a custom domain

1. Add your domain (e.g., `authentipic.com`) to Cloudflare
2. In Cloudflare Zero Trust dashboard → Networks → Tunnels:
   - Create a tunnel named "imagion"
   - Configure public hostname: domain `authentipic.com`, service `http://app:3000`
   - Copy the tunnel token
3. Set in `.env.production`:
   ```
   CLOUDFLARE_TUNNEL_TOKEN=<your-token>
   NEXT_PUBLIC_BASE_URL=https://authentipic.com
   ```
4. Set the GitHub Actions variable `vars.NEXT_PUBLIC_BASE_URL` to `https://authentipic.com` and rebuild the image
5. DNS records (usually auto-created by the tunnel):
   - `CNAME @ → <tunnel-uuid>.cfargotunnel.com` (proxied)
   - `CNAME www → <tunnel-uuid>.cfargotunnel.com` (proxied)
6. Cloudflare SSL/TLS settings:
   - Mode: Full (strict)
   - Always Use HTTPS: On
   - Minimum TLS: 1.2
7. Update Stripe webhook URL to `https://authentipic.com/api/stripe/webhook`

## Tailscale

### VM setup

Already covered in the VM setup section above. The VM advertises itself with `tag:server`.

### CI access

In the Tailscale admin console:
1. Create an OAuth client for GitHub Actions with tag `tag:ci`
2. Set ACL rules:
   ```json
   {
     "tagOwners": {
       "tag:ci": ["autogroup:admin"],
       "tag:server": ["autogroup:admin"]
     },
     "acls": [
       { "action": "accept", "src": ["tag:ci"], "dst": ["tag:server:22"] }
     ],
     "ssh": [
       { "action": "accept", "src": ["tag:ci"], "dst": ["tag:server"], "users": ["deploy"] }
     ]
   }
   ```

### Admin access

Access the admin panel via SSH tunnel:

```bash
ssh -L 3000:localhost:3000 deploy@<vm-tailscale-ip>
# Browse to http://localhost:3000/admin
```

Access the database for maintenance:

```bash
ssh -L 5432:localhost:5432 deploy@<vm-tailscale-ip>
# Then: psql -h localhost -p 5432 -U imagion imagion
# Note: this requires docker exec or exposing postgres to 127.0.0.1 temporarily
```

## CI/CD pipeline

### How it works

The GitHub Actions workflow (`.github/workflows/deploy.yml`) runs on every push to `main`:

1. **Build job**: Checks out code → builds Docker image with Buildx → pushes to `ghcr.io/beladevo/detect-ai:latest` (and a SHA-tagged version)
2. **Deploy job**: Connects to the VM via Tailscale → SSH → pulls image → runs migrations → restarts app → waits for health check

### GitHub secrets required

| Secret | Description |
|--------|-------------|
| `TS_OAUTH_CLIENT_ID` | Tailscale OAuth client ID for CI |
| `TS_OAUTH_SECRET` | Tailscale OAuth secret |
| `VM_TAILSCALE_IP` | Tailscale IP of the VM |
| `VM_SSH_PRIVATE_KEY` | SSH private key for the `deploy` user |
| `GHCR_PAT` | GitHub PAT with `read:packages` scope (used on VM to pull images) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_KEY` | Supabase anon/publishable key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID` | Stripe price ID |
| `NEXT_PUBLIC_STRIPE_PREMIUM_ANNUAL_PRICE_ID` | Stripe price ID |
| `NEXT_PUBLIC_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID` | Stripe price ID |
| `NEXT_PUBLIC_STRIPE_ENTERPRISE_ANNUAL_PRICE_ID` | Stripe price ID |
| `NEXT_PUBLIC_HOTJAR_SITE_ID` | Hotjar site ID |

### GitHub variables required

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_BASE_URL` | App URL. Default: `http://localhost:3000`. Set to `https://authentipic.com` when you have the domain. |

### Manual deployment

If CI/CD is not yet configured, deploy manually:

```bash
ssh deploy@<vm-tailscale-ip>
cd /opt/imagion

# Pull latest image
docker pull ghcr.io/beladevo/detect-ai:latest

# Run migrations
docker compose -f docker-compose.prod.yml --profile migration run --rm migrate

# Start core services
docker compose -f docker-compose.prod.yml up -d postgres redis app

# (Optional) Start tunnel
docker compose -f docker-compose.prod.yml --profile tunnel up -d cloudflared

# Check status
docker compose -f docker-compose.prod.yml ps
docker logs imagion-app --tail 20
```

## First-time deployment

Step-by-step for the very first deploy:

```bash
# On the VM as deploy user
cd /opt/imagion

# 1. Pull all images
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml --profile tunnel pull  # if using tunnel
docker compose -f docker-compose.prod.yml --profile migration pull

# 2. Start database and redis
docker compose -f docker-compose.prod.yml up -d postgres redis

# 3. Wait for postgres to be healthy
docker compose -f docker-compose.prod.yml ps

# 4. Run database migrations
docker compose -f docker-compose.prod.yml --profile migration run --rm migrate

# 5. Start the app
docker compose -f docker-compose.prod.yml up -d app

# 6. Verify health
curl http://localhost:3000/api/health
# Expected: {"status":"ok"}

# 7. (Optional) Start cloudflared
docker compose -f docker-compose.prod.yml --profile tunnel up -d cloudflared

# 8. Check all services
docker compose -f docker-compose.prod.yml ps
```

## Docker image details

The `Dockerfile` uses a three-stage build:

| Stage | Base image | Purpose |
|-------|-----------|---------|
| `deps` | `node:22-bookworm-slim` | Installs npm dependencies with native build tools (python3, g++, make) |
| `builder` | `node:22-bookworm-slim` | Runs `prisma generate` and `next build` with `NEXT_PUBLIC_*` build args |
| `runner` | `node:22-bookworm-slim` | Production image with standalone output, runtime libs (libvips, libstdc++), non-root user |

**Native modules** explicitly copied into the runner stage (not bundled by Next.js standalone):
- `onnxruntime-node` + `onnxruntime-common` — ONNX inference
- `sharp` + `@img` — image processing
- `bcrypt` — password hashing
- `.prisma/client` + `@prisma/client` — database ORM

**ONNX models** are not in the image. The runner stage creates an empty `/app/public/models/onnx/` directory that serves as the mount point.

**Model path resolution**: `src/lib/nodeDetector.ts:99` resolves models via `path.join(process.cwd(), "public/models/onnx", modelName)`. In standalone mode, `process.cwd()` = `/app` (WORKDIR). The volume mount maps `${MODELS_PATH}` → `/app/public/models/onnx`. No code changes needed.

## Network isolation

```
┌─────────────────────────────────────┐
│         internal network            │
│         (internal: true)            │
│                                     │
│   postgres ◄──► app ◄──► redis     │
│   (no ports)         (no ports)     │
│                 │                   │
└─────────────────┼───────────────────┘
                  │
┌─────────────────┼───────────────────┐
│         tunnel network              │
│                 │                   │
│            app ◄──► cloudflared     │
│                     (opt-in)        │
└─────────────────────────────────────┘
```

- `internal` is marked `internal: true` — containers on this network cannot reach the internet.
- `tunnel` allows cloudflared to proxy traffic to the app.
- The app bridges both networks.
- Postgres and Redis have zero port bindings.

## Security checklist

- [x] Non-root container user (UID 1001)
- [x] Postgres and Redis on internal-only Docker network
- [x] Redis password-protected
- [x] App port bound to `127.0.0.1` only (not `0.0.0.0`)
- [x] UFW firewall allowing only Tailscale interface
- [x] Cloudflare proxy hides the VM's real IP
- [x] No secrets baked into Docker image (runtime env injection)
- [x] ONNX models mounted read-only (`:ro`)
- [x] Resource limits on all containers
- [x] Health checks with automatic restart
- [x] SSH access via Tailscale only
- [x] CI/CD concurrency control (no racing deploys)

## Troubleshooting

### App fails to start

```bash
# Check logs
docker logs imagion-app --tail 100

# Common causes:
# - Missing env vars → check .env.production
# - Database not ready → ensure postgres is healthy first
# - Missing models → check /opt/imagion/models/ has .onnx files
```

### Database migration fails

```bash
# Check migration status
docker compose -f docker-compose.prod.yml --profile migration run --rm migrate npx prisma migrate status

# Check postgres logs
docker logs imagion-postgres --tail 50
```

### Cloudflared not connecting

```bash
docker logs imagion-cloudflared --tail 50

# Common causes:
# - Invalid tunnel token → regenerate in Cloudflare dashboard
# - DNS not configured → check Cloudflare DNS records
# - App not healthy → cloudflared depends on app health check
```

### Rollback

```bash
# Find the previous image tag (SHA-based)
docker images ghcr.io/beladevo/detect-ai

# Roll back to a specific tag
docker compose -f docker-compose.prod.yml pull  # if needed
# Edit docker-compose.prod.yml to pin the image tag, or:
docker tag ghcr.io/beladevo/detect-ai:<old-sha> ghcr.io/beladevo/detect-ai:latest
docker compose -f docker-compose.prod.yml up -d --no-deps app
```

### View resource usage

```bash
docker stats --no-stream
```
