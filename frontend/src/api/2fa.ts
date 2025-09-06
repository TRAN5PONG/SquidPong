export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface ApiResponse<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
}

interface TwoFASetupData {
  QRCode?: string;
}

interface TwoFAVerifyData {
  email?: string; 
  is2FAEnabled?: boolean;
}

export async function twofaSetupController(): Promise<ApiResponse<TwoFASetupData>> 
{
  const response = await fetch(`${API_BASE_URL}/2fa/setup`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`2FA setup failed: ${response.statusText}`);
  }

  return await response.json();
}


export async function twofaVerifyController(code: string, email?: string): Promise<ApiResponse<TwoFAVerifyData>> 
{
  const response = await fetch(`${API_BASE_URL}/2fa/verify`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code, email }),
  });

  if (!response.ok) {
    throw new Error(`2FA verification failed: ${response.statusText}`);
  }

  return await response.json();
}
