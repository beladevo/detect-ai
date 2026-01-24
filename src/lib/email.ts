import nodemailer from 'nodemailer'
import { env } from '@/src/lib/env'

const normalizedBaseUrl = env.BASE_URL.replace(/\/$/, '')

const hasSmtpConfig =
  Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASSWORD && env.EMAIL_FROM)

export const supportsSmtp = hasSmtpConfig

const getTransporter = () => {
  if (!hasSmtpConfig) {
    return null
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: !!env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    },
  })
}

export interface SendVerificationEmailOptions {
  email: string
  token: string
  firstName?: string | null
}

export async function sendVerificationEmail(options: SendVerificationEmailOptions): Promise<string> {
  const { email, token, firstName } = options
  const verificationUrl = `${normalizedBaseUrl}/verify-email?token=${encodeURIComponent(token)}`
  const subject = 'Verify your Imagion AI Detector account'
  const displayName = firstName?.trim() || 'there'
  const bodyText = `Hi ${displayName},\n\nPlease confirm your email address by clicking the link below:\n${verificationUrl}\n\nIf you did not create an account, you can safely ignore this email.\n\nThanks,\nImagion AI`
  const bodyHtml = `
    <p>Hi ${displayName},</p>
    <p>Please confirm your email address by clicking the link below:</p>
    <p><a href="${verificationUrl}">Verify my email</a></p>
    <p>If you did not create an account, you can safely ignore this email.</p>
    <p>Thanks,<br/>Imagion AI</p>
  `

  if (!hasSmtpConfig) {
    console.info('SMTP not configured; verification link:', verificationUrl)
    return verificationUrl
  }

  const transporter = getTransporter()
  if (!transporter) {
    console.info('SMTP transporter could not be created; verification link:', verificationUrl)
    return verificationUrl
  }

  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to: email,
    subject,
    text: bodyText,
    html: bodyHtml,
  })

  return verificationUrl
}
