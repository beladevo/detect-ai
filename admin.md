# 🎛️ Imagion Admin Dashboard - Comprehensive Plan

## Overview

Based on the existing codebase architecture (Next.js 15, PostgreSQL/Prisma, custom UI with Tailwind + Framer Motion), here's a complete admin dashboard plan using **Magic UI** components for a modern, polished experience.

---

## 📁 Proposed File Structure

```
src/
├── app/
│   └── admin/
│       ├── layout.tsx              # Admin layout with sidebar
│       ├── page.tsx                # Dashboard overview
│       ├── users/
│       │   ├── page.tsx            # User list
│       │   └── [id]/page.tsx       # User detail/edit
│       ├── detections/
│       │   └── page.tsx            # Detection analytics
│       ├── waitlist/
│       │   └── page.tsx            # Waitlist management
│       ├── settings/
│       │   ├── page.tsx            # General settings
│       │   ├── models/page.tsx     # Model configuration
│       │   └── features/page.tsx   # Feature flags
│       ├── billing/
│       │   └── page.tsx            # Subscription management
│       ├── logs/
│       │   ├── page.tsx            # System logs
│       │   ├── api/page.tsx        # API request logs
│       │   └── errors/page.tsx     # Error logs
│       ├── security/
│       │   └── page.tsx            # Security & access
│       └── reports/
│           └── page.tsx            # Analytics reports
├── components/
│   └── admin/
│       ├── AdminSidebar.tsx
│       ├── AdminHeader.tsx
│       ├── StatCard.tsx
│       ├── UserTable.tsx
│       ├── ActivityChart.tsx
│       ├── LogViewer.tsx
│       └── ...
└── app/api/admin/
    ├── users/route.ts
    ├── users/[id]/route.ts
    ├── analytics/route.ts
    ├── settings/route.ts
    ├── feature-flags/route.ts
    ├── waitlist/route.ts
    ├── logs/route.ts
    └── ...
```

---

## 🖥️ Screen-by-Screen Breakdown

### 1. 🔐 Admin Login

**Route:** `/admin/login`

**Features:**
- Separate admin authentication (not regular user login)
- Two-factor authentication (TOTP)
- Login attempt tracking & lockout
- Session duration selector (1h, 8h, 24h)
- IP whitelisting option

**Magic UI Components:**
- `AnimatedGradientText` for branding
- `ShimmerButton` for login action
- `BorderBeam` around login card
- `Particles` background

---

### 2. 📊 Dashboard Overview

**Route:** `/admin`

**Stats Cards (top row):**
| Metric | Description |
|--------|-------------|
| Total Users | With growth % vs last month |
| Active Today | Currently active users |
| Detections Today | Total API + Browser detections |
| Revenue (MRR) | Monthly recurring revenue |
| API Health | Uptime percentage |
| Queue Length | Pending detections |

**Charts & Widgets:**
- **Detection Volume** - Line chart (7d/30d/90d toggle)
- **User Growth** - Area chart with tier breakdown
- **Verdict Distribution** - Donut chart (AI/Real/Uncertain)
- **Top Models Performance** - Bar chart by accuracy
- **Recent Activity Feed** - Real-time log stream
- **Alerts Panel** - Critical issues requiring attention

**Magic UI Components:**
- `NumberTicker` for animated stat numbers
- `AnimatedList` for activity feed
- `MagicCard` for stat cards with hover effects
- `Marquee` for scrolling alerts
- `Globe` for geographic user distribution

---

### 3. 👥 User Management

**Route:** `/admin/users`

#### User List View

**Table Columns:**
| Column | Features |
|--------|----------|
| User | Avatar, name, email, verified badge |
| Tier | FREE/PREMIUM/ENTERPRISE with badge |
| Status | Active/Locked/Suspended/Deleted |
| Detections | Monthly/Total count |
| Last Active | Relative time |
| Created | Registration date |
| Actions | Quick actions menu |

**Filters:**
- Tier (FREE, PREMIUM, ENTERPRISE)
- Status (Active, Locked, Suspended, Soft-deleted)
- Registration date range
- Last activity range
- Has API key enabled
- Email verified/unverified

**Bulk Actions:**
- Lock/Unlock multiple users
- Change tier
- Export to CSV
- Send bulk email
- Delete (soft)

**Magic UI Components:**
- `DataTable` with sorting/filtering
- `AvatarCircles` for user previews
- `Badge` components for status/tier
- `Dock` for quick actions

---

#### User Detail/Edit View

**Route:** `/admin/users/[id]`

**Sections:**

**1. Profile Overview**
- Edit name, email
- Avatar management
- Email verification status (resend option)
- Account creation date
- Last login info

**2. Subscription & Billing**
- Current tier with upgrade/downgrade
- Stripe customer link
- Payment history
- Invoice generation
- Credit adjustments

**3. Usage Statistics**
- Detection history chart
- API vs Browser usage breakdown
- Rate limit status
- Quota usage (daily/monthly)

**4. Security**
- Password reset (force)
- Active sessions list (with revoke)
- Login history (IP, device, location)
- API key management (view/regenerate/disable)

**5. Account Actions**
- Lock account (with reason)
- Suspend account (temporary)
- Delete account (soft/hard)
- Impersonate user (audit logged)

**6. Notes & Tags**
- Internal admin notes
- Custom tags for categorization
- Flag for review

---

### 4. ⚙️ Settings

#### General Settings

**Route:** `/admin/settings`

**Sections:**

**1. Platform Settings**
- Site name, tagline
- Maintenance mode toggle
- Registration enabled/disabled
- Email verification required
- Default user tier

**2. Detection Settings**
- Default model for API detection
- Default model for Browser detection
- Enable/disable specific pipeline modules
- Confidence thresholds for verdicts
- Multi-crop analysis toggle

**3. Rate Limiting**
- Requests per minute (by tier)
- Daily limits (by tier)
- Monthly limits (by tier)
- Concurrent connections (by tier)

**4. File Handling**
- Max file size
- Allowed file types
- Image preprocessing options

---

#### Model Configuration

**Route:** `/admin/settings/models`

**Features:**
- List all available ONNX models
- Upload new models
- Set `aiIndex` configuration per model
- Enable/disable models
- Set as default for API/Browser
- Configure ensemble presets
- Run benchmark from admin panel
- View accuracy metrics per model

**Magic UI Components:**
- `FileUpload` with drag-and-drop
- `Tabs` for model categories
- `ProgressBar` for benchmark progress

---

#### Feature Flags

**Route:** `/admin/settings/features`

**Table:**
| Flag | Description | FREE | PREMIUM | ENTERPRISE | Global |
|------|-------------|------|---------|------------|--------|
| multiple_models | Multi-model ensemble | ❌ | ✅ | ✅ | Toggle |
| api_access | API key access | ❌ | ✅ | ✅ | Toggle |
| advanced_analytics | Detailed analytics | ❌ | ✅ | ✅ | Toggle |
| cloud_storage | Cloud result storage | ❌ | ❌ | ✅ | Toggle |
| priority_queue | Priority processing | ❌ | ❌ | ✅ | Toggle |

**Actions:**
- Toggle per tier
- Global override toggle
- Add new feature flags
- A/B testing configuration

---

### 5. 📋 Waitlist Management

**Route:** `/admin/waitlist`

**Features:**
- View all waitlist entries
- Filter by source, date range
- Export to CSV
- Bulk invite (send access emails)
- Remove entries
- Analytics (signups over time, sources)

**Table Columns:**
| Column | Description |
|--------|-------------|
| Email | Waitlist email |
| Source | Where they signed up |
| IP Address | For fraud detection |
| User Agent | Device info |
| Created | Signup date |
| Status | Pending/Invited/Converted |
| Actions | Invite, Remove |

**Magic UI Components:**
- `Confetti` on successful invite
- `AnimatedList` for recent signups

---

### 6. 📜 Logs & Monitoring

#### System Logs

**Route:** `/admin/logs`

**Log Types:**
- Application logs
- Error logs
- Security logs (failed logins, suspicious activity)
- Audit logs (admin actions)

**Features:**
- Real-time log streaming
- Search & filter
- Log level filter (DEBUG, INFO, WARN, ERROR)
- Date range selection
- Export logs
- Log retention settings

---

#### API Request Logs

**Route:** `/admin/logs/api`

**Table:**
| Column | Description |
|--------|-------------|
| Timestamp | Request time |
| User | User or API key |
| Endpoint | API route called |
| Method | GET/POST/etc |
| Status | Response code |
| Duration | Response time |
| IP Address | Client IP |

**Features:**
- Filter by endpoint, status code, user
- Response time percentiles (p50, p95, p99)
- Error rate tracking
- Request volume charts

---

#### Error Logs

**Route:** `/admin/logs/errors`

**Features:**
- Grouped by error type
- Stack traces
- Affected users
- First/last occurrence
- Resolution status
- Link to related code

---

### 7. 💳 Billing & Subscriptions

**Route:** `/admin/billing`

**Overview Stats:**
- Monthly Recurring Revenue (MRR)
- Annual Recurring Revenue (ARR)
- Churn rate
- Average Revenue Per User (ARPU)
- Lifetime Value (LTV)

**Subscriptions Table:**
| Column | Description |
|--------|-------------|
| User | Customer info |
| Plan | Current subscription |
| Status | Active/Canceled/Past Due |
| Amount | Monthly charge |
| Started | Subscription start |
| Renews | Next billing date |
| Actions | Cancel, Upgrade, Refund |

**Features:**
- Create manual subscriptions
- Apply discounts/coupons
- Process refunds
- View Stripe dashboard link
- Revenue charts over time
- Subscription cohort analysis

---

### 8. 🛡️ Security

**Route:** `/admin/security`

**Sections:**

**1. Admin Accounts**
- List all admin users
- Add/remove admins
- Role management (Super Admin, Moderator, Read-only)
- Admin activity audit log

**2. Access Control**
- IP whitelist/blacklist
- Country blocking
- Rate limit bypass list
- API key management

**3. Security Alerts**
- Failed login attempts
- Suspicious activity
- Rate limit violations
- Potential abuse patterns

**4. Compliance**
- GDPR data export requests
- Account deletion requests
- Data retention policies

---

### 9. 📈 Reports & Analytics

**Route:** `/admin/reports`

**Pre-built Reports:**

| Report | Description |
|--------|-------------|
| User Growth | Registration trends, churn |
| Detection Analytics | Volume, accuracy, verdicts |
| Revenue Report | MRR, ARR, projections |
| API Usage | Endpoint popularity, response times |
| Model Performance | Accuracy comparison, benchmark results |
| Geographic Distribution | Users by country/region |
| Feature Adoption | Which features are used |

**Features:**
- Custom date ranges
- Export to PDF/CSV
- Schedule automated reports
- Email delivery
- Dashboard embeddable widgets

**Magic UI Components:**
- `AnimatedBeam` connecting data sources
- `OrbitingCircles` for data visualization
- `BentoGrid` for report cards

---

### 10. 🔔 Notifications Center

**Route:** `/admin/notifications`

**Alert Types:**
- System alerts (downtime, high error rate)
- User alerts (abuse, chargebacks)
- Business alerts (revenue milestones, churn spikes)
- Security alerts (breach attempts)

**Configuration:**
- Email notifications
- Slack integration
- Discord webhook
- Custom webhook endpoints
- Alert thresholds

---

## 🎨 Magic UI Components to Use

| Component | Use Case |
|-----------|----------|
| `AnimatedGradientText` | Page headers, branding |
| `NumberTicker` | Animated statistics |
| `MagicCard` | Stat cards with hover effects |
| `BorderBeam` | Highlight important cards |
| `ShimmerButton` | Primary actions |
| `AnimatedList` | Activity feeds, notifications |
| `Marquee` | Scrolling alerts |
| `Particles` | Background effects |
| `Globe` | Geographic visualization |
| `AvatarCircles` | User groups |
| `Dock` | Quick action toolbar |
| `BentoGrid` | Dashboard layout |
| `Confetti` | Success celebrations |
| `RippleButton` | Secondary actions |
| `BlurFade` | Page transitions |
| `Meteors` | Loading states |
| `RetroGrid` | Background pattern |
| `DotPattern` | Subtle backgrounds |
| `Spotlight` | Focus areas |
| `TextReveal` | Important announcements |

---

## 🗄️ Database Schema Additions

```prisma
// Add to User model
model User {
  // ... existing fields
  isAdmin         Boolean   @default(false)
  adminRole       AdminRole?
  lockedAt        DateTime?
  lockedReason    String?
  lockedBy        String?   // Admin who locked
  suspendedUntil  DateTime?
  notes           AdminNote[]
  tags            String[]
}

enum AdminRole {
  SUPER_ADMIN
  ADMIN
  MODERATOR
  READONLY
}

model AdminNote {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  content   String
  createdBy String
  createdAt DateTime @default(now())
}

model AdminAuditLog {
  id         String   @id @default(cuid())
  adminId    String
  action     String   // e.g., "USER_LOCKED", "TIER_CHANGED"
  targetType String   // e.g., "User", "FeatureFlag"
  targetId   String
  details    Json?
  ipAddress  String?
  createdAt  DateTime @default(now())
}

model SystemSetting {
  key       String   @id
  value     Json
  updatedBy String?
  updatedAt DateTime @updatedAt
}

model Waitlist {
  // ... existing fields
  status     WaitlistStatus @default(PENDING)
  invitedAt  DateTime?
  convertedAt DateTime?
}

enum WaitlistStatus {
  PENDING
  INVITED
  CONVERTED
  REMOVED
}

model SecurityAlert {
  id        String   @id @default(cuid())
  type      String   // FAILED_LOGIN, RATE_LIMIT, SUSPICIOUS
  severity  String   // LOW, MEDIUM, HIGH, CRITICAL
  userId    String?
  ipAddress String?
  details   Json
  resolved  Boolean  @default(false)
  resolvedBy String?
  resolvedAt DateTime?
  createdAt DateTime @default(now())
}
```

---

## 🔌 API Endpoints

```
# Authentication
POST   /api/admin/auth/login
POST   /api/admin/auth/logout
POST   /api/admin/auth/2fa/setup
POST   /api/admin/auth/2fa/verify

# Users
GET    /api/admin/users              # List with pagination/filters
GET    /api/admin/users/:id          # Get user details
PATCH  /api/admin/users/:id          # Update user
POST   /api/admin/users/:id/lock     # Lock account
POST   /api/admin/users/:id/unlock   # Unlock account
POST   /api/admin/users/:id/suspend  # Temporary suspend
POST   /api/admin/users/:id/impersonate
DELETE /api/admin/users/:id          # Soft delete
DELETE /api/admin/users/:id/permanent # Hard delete

# Analytics
GET    /api/admin/analytics/overview
GET    /api/admin/analytics/users
GET    /api/admin/analytics/detections
GET    /api/admin/analytics/revenue

# Settings
GET    /api/admin/settings
PATCH  /api/admin/settings
GET    /api/admin/settings/models
POST   /api/admin/settings/models
PATCH  /api/admin/settings/models/:id

# Feature Flags
GET    /api/admin/feature-flags
PATCH  /api/admin/feature-flags/:key

# Waitlist
GET    /api/admin/waitlist
POST   /api/admin/waitlist/:id/invite
DELETE /api/admin/waitlist/:id

# Logs
GET    /api/admin/logs/system
GET    /api/admin/logs/api
GET    /api/admin/logs/errors
GET    /api/admin/logs/audit

# Billing
GET    /api/admin/billing/overview
GET    /api/admin/billing/subscriptions
POST   /api/admin/billing/subscriptions/:id/cancel
POST   /api/admin/billing/refund

# Security
GET    /api/admin/security/alerts
POST   /api/admin/security/alerts/:id/resolve
GET    /api/admin/security/admins
POST   /api/admin/security/admins
DELETE /api/admin/security/admins/:id
```

---

## 🚀 Implementation Priority

### Phase 1 - Core (Week 1-2)
1. Admin authentication + 2FA
2. Admin layout with sidebar
3. Dashboard overview with key stats
4. User list with basic filters

### Phase 2 - User Management (Week 2-3)
5. User detail view
6. Lock/unlock/suspend functionality
7. Tier management
8. Admin audit logging

### Phase 3 - Settings & Config (Week 3-4)
9. General settings page
10. Model configuration
11. Feature flags management
12. Rate limit configuration

### Phase 4 - Monitoring (Week 4-5)
13. Waitlist management
14. System logs viewer
15. API request logs
16. Error tracking

### Phase 5 - Advanced (Week 5-6)
17. Billing/subscription management
18. Security dashboard
19. Reports & analytics
20. Notifications center

---

## 💡 Additional Feature Suggestions

### User Experience
- **Dark/Light mode toggle** for admin panel
- **Keyboard shortcuts** (Cmd+K for search)
- **Customizable dashboard** - drag/drop widgets
- **Saved filters** - save common filter presets
- **Quick actions bar** - floating action buttons

### Monitoring
- **Uptime monitoring** - API endpoint health checks
- **Performance metrics** - Response time tracking
- **Error budget** - SLO tracking
- **Anomaly detection** - Alert on unusual patterns

### User Management
- **User segments** - Group users by behavior
- **Automated actions** - Lock after X failed logins
- **User journey tracking** - Funnel visualization
- **Cohort analysis** - User retention by signup date

### Security
- **Session management** - Force logout all users
- **Honeypot detection** - Catch malicious actors
- **Geo-fencing** - Region-based access control
- **Request signing** - Prevent request tampering

### Business Intelligence
- **Churn prediction** - ML-based risk scores
- **Revenue forecasting** - Trend projections
- **A/B testing dashboard** - Experiment results
- **Customer health scores** - Engagement metrics
