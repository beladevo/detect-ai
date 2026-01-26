const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET
const PAYPAL_ENV = process.env.PAYPAL_ENV === "production" ? "production" : "sandbox"
const PAYPAL_CONFIGURED = Boolean(PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET)

if (!PAYPAL_CONFIGURED) {
  console.warn("PayPal credentials missing; PayPal flow will be disabled.")
}

export function isPayPalConfigured() {
  return PAYPAL_CONFIGURED
}

const PAYPAL_BASE_URL =
  PAYPAL_ENV === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com"

type PayPalAccessTokenResponse = {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
}

export type PayPalOrderPayload = {
  intent: "CAPTURE"
  purchase_units: Array<{
    amount: { currency_code: string; value: string }
    description?: string
  }>
  application_context?: {
    brand_name?: string
    landing_page?: "LOGIN" | "BILLING"
    shipping_preference?: "NO_SHIPPING" | "GET_FROM_FILE"
    user_action?: "PAY_NOW" | "CONTINUE"
    return_url?: string
    cancel_url?: string
  }
}

export type PayPalOrderResponse = {
  id: string
  status: string
  links: Array<{ href: string; rel: string; method: string }>
}

export type PayPalCaptureResponse = {
  id: string
  status: string
  payer: { email_address: string }
  purchase_units: Array<{
    amount: { currency_code: string; value: string }
    payments?: {
      captures: Array<{
        id: string
        status: string
        amount: { currency_code: string; value: string }
      }>
    }
  }>
  links: Array<{ href: string; rel: string; method: string }>
}

async function getPayPalAccessToken(): Promise<string> {
  if (!PAYPAL_CONFIGURED) {
    throw new Error("PayPal credentials are not configured")
  }

  const basicAuth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64")
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`PayPal token request failed: ${errorText}`)
  }

  const payload = (await response.json()) as PayPalAccessTokenResponse
  return payload.access_token
}

async function fetchWithAccessToken<T>(endpoint: string, init: RequestInit): Promise<T> {
  const token = await getPayPalAccessToken()
  const response = await fetch(`${PAYPAL_BASE_URL}${endpoint}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  })

  if (!response.ok) {
    const errorDetail = await response.text()
    throw new Error(`PayPal API error (${endpoint}): ${errorDetail}`)
  }

  return response.json() as Promise<T>
}

export async function createPayPalOrder(payload: PayPalOrderPayload): Promise<PayPalOrderResponse> {
  return fetchWithAccessToken("/v2/checkout/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function capturePayPalOrder(
  orderId: string
): Promise<PayPalCaptureResponse> {
  return fetchWithAccessToken(`/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
  })
}
