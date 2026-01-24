import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { withAdminAuth, logAdminAction } from '@/src/lib/auth'

const DEFAULT_SETTINGS = {
  siteName: 'Imagion',
  siteTagline: 'AI Image Detector',
  maintenanceMode: false,
  registrationEnabled: true,
  emailVerificationRequired: false,
  defaultUserTier: 'FREE',
  defaultApiModel: 'model_q4.onnx',
  defaultBrowserModel: 'model_q4.onnx',
  maxFileSize: 10485760,
  enabledPipelineModules: ['mlEnsemble', 'frequencyForensics', 'physicsConsistency', 'visualArtifacts', 'metadataForensics', 'provenance'],
  rateLimits: {
    free: { daily: 50, monthly: 1000, perMinute: 10 },
    premium: { daily: 1000, monthly: 30000, perMinute: 30 },
    enterprise: { daily: 10000, monthly: 300000, perMinute: 100 },
  },
}

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const settings = await prisma.systemSetting.findMany()

    const result = { ...DEFAULT_SETTINGS }

    for (const setting of settings) {
      if (setting.key in result) {
        (result as Record<string, unknown>)[setting.key] = setting.value
      }
    }

    return NextResponse.json(result)
  })
}

export async function PATCH(request: NextRequest) {
  return withAdminAuth(request, async (admin) => {
    const updates = await request.json()

    const allowedKeys = Object.keys(DEFAULT_SETTINGS)

    for (const [key, value] of Object.entries(updates)) {
      if (allowedKeys.includes(key)) {
        await prisma.systemSetting.upsert({
          where: { key },
          create: {
            key,
            value: value as object,
            updatedBy: admin.email,
          },
          update: {
            value: value as object,
            updatedBy: admin.email,
          },
        })
      }
    }

    await logAdminAction(
      admin.id,
      'SETTINGS_UPDATED',
      'SystemSetting',
      'global',
      { keys: Object.keys(updates) },
      request.headers.get('x-forwarded-for') || undefined
    )

    return NextResponse.json({ success: true })
  }, ['SUPER_ADMIN', 'ADMIN'])
}
