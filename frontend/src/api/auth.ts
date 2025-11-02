export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface ApiResponse<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
}
interface signinData {
  is2FAEnabled: boolean;
  token: string;
}
// Signin
export async function login(
  email: string,
  password: string
): Promise<ApiResponse<signinData>> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }

  return await response.json();
}
export async function signUp(
  firstName: string,
  lastName: string,
  username: string,
  email: string,
  password: string
): Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      firstName,
      lastName,
      username,
      email,
      password,
    }),
  });

  if (!response.ok) {
    throw new Error(`Signup failed: ${response.statusText}`);
  }

  return await response.json();
}
export async function logout(): Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(`Logout failed: ${response.statusText}`);
  }
  return await response.json();
}

// email verification
export async function verifyEmail(
  email: string,
  code: string
): Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, code }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }

  return await response.json();
}
export async function resendVerificationEmail(
  email: string
): Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/resend-verification`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }

  return await response.json();
}

// Password
export async function requestPasswordReset(
  email: string
): Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.statusText}`);
  }

  return await response.json();
}
export async function resetPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, code, newPassword }),
  });

  if (!response.ok) {
    throw new Error(`Reset failed: ${response.statusText}`);
  }

  return await response.json();
}
export async function changePassword(
  oldPassword: string,
  newPassword: string
): Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/change-password`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ oldPassword, newPassword }),
  });

  if (!response.ok) {
    throw new Error(`Change password failed: ${response.statusText}`);
  }

  return await response.json();
}

// 2FA
export async function TwoFA_status(): Promise<
  ApiResponse<{ is2FAEnabled: boolean }>
> {
  // endpoint => /2fa/status
  const response = await fetch(`${API_BASE_URL}/2fa/status`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`2FA status check failed: ${response.statusText}`);
  }
  return await response.json();
}
export async function TwoFA_enable(code: string): Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/2fa/enable`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    throw new Error(`Enable 2FA failed: ${response.statusText}`);
  }

  return await response.json();
}
export async function TwoFA_disable(): Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/2fa/disable`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Disable 2FA failed: ${response.statusText}`);
  }
  return await response.json();
}
export async function TwoFA_setup(): Promise<
  ApiResponse<{ QRCode: string; key: string }>
> {
  // endpoint => /2fa/setup
  const response = await fetch(`${API_BASE_URL}/2fa/setup`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`2FA setup failed: ${response.statusText}`);
  }
  return await response.json();
}
export async function TwoFA_verify(token: string, code: string): Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/2fa/verify`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, code }),
  });

  if (!response.ok) {
    throw new Error(`2FA verification failed: ${response.statusText}`);
  }

  return await response.json();
}


// Third-party authentication
export async function googleAuth():Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/google`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Google authentication failed: ${response.statusText}`);
  }

  return await response.json();
}