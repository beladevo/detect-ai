# ============================================================
# Stage 1: Install dependencies
# ============================================================
FROM node:22-bookworm-slim AS deps

WORKDIR /app

# Build toolchain for native modules (bcrypt, sharp, onnxruntime-node)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

# ============================================================
# Stage 2: Build the application
# ============================================================
FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma client generation
RUN npx prisma generate

# NEXT_PUBLIC_* vars must be present at build time (inlined into client JS)
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID
ARG NEXT_PUBLIC_STRIPE_PREMIUM_ANNUAL_PRICE_ID
ARG NEXT_PUBLIC_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID
ARG NEXT_PUBLIC_STRIPE_ENTERPRISE_ANNUAL_PRICE_ID
ARG NEXT_PUBLIC_HOTJAR_SITE_ID
ARG NEXT_PUBLIC_MODEL_NAME
ARG NEXT_PUBLIC_USE_API_ONLY
ARG NEXT_PUBLIC_PREMIUM_FEATURES_ENABLED
ARG NEXT_PUBLIC_PIPELINE_ML_ENABLED
ARG NEXT_PUBLIC_PIPELINE_VISUAL_ENABLED
ARG NEXT_PUBLIC_PIPELINE_METADATA_ENABLED
ARG NEXT_PUBLIC_PIPELINE_PHYSICS_ENABLED
ARG NEXT_PUBLIC_PIPELINE_FREQUENCY_ENABLED
ARG NEXT_PUBLIC_PIPELINE_PROVENANCE_ENABLED
ARG NEXT_PUBLIC_BLOB_BASE_URL

ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID=$NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID
ENV NEXT_PUBLIC_STRIPE_PREMIUM_ANNUAL_PRICE_ID=$NEXT_PUBLIC_STRIPE_PREMIUM_ANNUAL_PRICE_ID
ENV NEXT_PUBLIC_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=$NEXT_PUBLIC_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID
ENV NEXT_PUBLIC_STRIPE_ENTERPRISE_ANNUAL_PRICE_ID=$NEXT_PUBLIC_STRIPE_ENTERPRISE_ANNUAL_PRICE_ID
ENV NEXT_PUBLIC_HOTJAR_SITE_ID=$NEXT_PUBLIC_HOTJAR_SITE_ID
ENV NEXT_PUBLIC_MODEL_NAME=$NEXT_PUBLIC_MODEL_NAME
ENV NEXT_PUBLIC_USE_API_ONLY=$NEXT_PUBLIC_USE_API_ONLY
ENV NEXT_PUBLIC_PREMIUM_FEATURES_ENABLED=$NEXT_PUBLIC_PREMIUM_FEATURES_ENABLED
ENV NEXT_PUBLIC_PIPELINE_ML_ENABLED=$NEXT_PUBLIC_PIPELINE_ML_ENABLED
ENV NEXT_PUBLIC_PIPELINE_VISUAL_ENABLED=$NEXT_PUBLIC_PIPELINE_VISUAL_ENABLED
ENV NEXT_PUBLIC_PIPELINE_METADATA_ENABLED=$NEXT_PUBLIC_PIPELINE_METADATA_ENABLED
ENV NEXT_PUBLIC_PIPELINE_PHYSICS_ENABLED=$NEXT_PUBLIC_PIPELINE_PHYSICS_ENABLED
ENV NEXT_PUBLIC_PIPELINE_FREQUENCY_ENABLED=$NEXT_PUBLIC_PIPELINE_FREQUENCY_ENABLED
ENV NEXT_PUBLIC_PIPELINE_PROVENANCE_ENABLED=$NEXT_PUBLIC_PIPELINE_PROVENANCE_ENABLED
ENV NEXT_PUBLIC_BLOB_BASE_URL=$NEXT_PUBLIC_BLOB_BASE_URL

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ============================================================
# Stage 3: Production runner
# ============================================================
FROM node:22-bookworm-slim AS runner

WORKDIR /app

# Runtime libraries for native modules
RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips42 \
    libstdc++6 \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Non-root user
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy public assets (excluding ONNX models — those are volume-mounted)
COPY --from=builder --chown=nextjs:nodejs /app/public/favicon.ico ./public/favicon.ico
COPY --from=builder --chown=nextjs:nodejs /app/public/robots.txt ./public/robots.txt
COPY --from=builder --chown=nextjs:nodejs /app/public/logo.png ./public/logo.png
COPY --from=builder --chown=nextjs:nodejs /app/public/logo-350.png ./public/logo-350.png
COPY --from=builder --chown=nextjs:nodejs /app/public/AI-human.png ./public/AI-human.png
COPY --from=builder --chown=nextjs:nodejs /app/public/imagion-extension.zip ./public/imagion-extension.zip

# Copy SVG files
COPY --from=builder --chown=nextjs:nodejs /app/public/*.svg ./public/

# Copy WASM runtime for client-side ONNX inference
COPY --from=builder --chown=nextjs:nodejs /app/public/onnxruntime ./public/onnxruntime

# Copy Prisma schema + migrations (for prisma migrate deploy)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copy native modules that Next.js standalone doesn't bundle
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/onnxruntime-node ./node_modules/onnxruntime-node
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/onnxruntime-common ./node_modules/onnxruntime-common
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/sharp ./node_modules/sharp
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@img ./node_modules/@img
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/bcrypt ./node_modules/bcrypt

# Create mount point for ONNX models and logs directory
RUN mkdir -p /app/public/models/onnx /app/logs \
    && chown -R nextjs:nodejs /app/public/models /app/logs

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
