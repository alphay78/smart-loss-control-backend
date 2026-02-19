const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  errors?: string[]
  token?: string
  user?: {
    id: string
    role: "OWNER" | "STAFF"
    phone?: string
    shop_id?: string
    full_name?: string
  }
  dev_otp?: string
  sms_status?: string
  staff?: {
    id: string
    full_name: string
    device_id: string
    role: string
  }
  data?: T
}

async function apiCall<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("slc_token") : null

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  const data: ApiResponse<T> = await response.json()

  if (!response.ok) {
    throw {
      status: response.status,
      ...data,
    }
  }

  return data
}

// Auth API calls
export const authApi = {
  registerOwner: (body: {
    full_name: string
    shop_name: string
    phone: string
  }) =>
    apiCall("/auth/register-owner", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  verifyOTP: (body: { phone: string; otp: string }) =>
    apiCall("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  loginWithPIN: (body: { staff_name: string; pin: string }) =>
    apiCall("/auth/login-pin", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  linkStaff: (body: {
    qr_token: string
    device_id: string
    staff_name: string
    pin: string
  }) =>
    apiCall("/auth/staff/link", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  generateQR: () =>
    apiCall("/auth/generate-qr", {
      method: "POST",
    }),

  checkQRStatus: (qr_token: string) =>
    apiCall(`/auth/qr-status/${qr_token}`),
}

export { apiCall }
export type { ApiResponse }
