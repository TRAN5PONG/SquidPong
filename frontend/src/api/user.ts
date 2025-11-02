import { User } from "@/types/user";
import { API_BASE_URL, ApiResponse } from "./auth";


export async function getUserProfile(): Promise<ApiResponse<User>> {
  const response = await fetch(`${API_BASE_URL}/user/me`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch user profile: ${response.statusText}`);
  }
  return await response.json();
}
export async function getUserById(Id: string): Promise<ApiResponse<User>> {
  const response = await fetch(`${API_BASE_URL}/user/${Id}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch user by ID: ${response.statusText}`);
  }
  return await response.json();
}

// friends
export async function sendFriendRequest(
  friendId: number
): Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/friend/request`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ friendId }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }

  return await response.json();
}
export async function acceptFriendRequest(
  friendId: number
): Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/friend/accept`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ friendId }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }

  return await response.json();
}
export async function rejectFriendRequest(
  friendId: number
): Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/friend/reject`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ friendId }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }

  return await response.json();
}
export async function pendingFriendRequests(): Promise<ApiResponse<User[]>> {
  // endpoint: /friend/pending
  // method: "GET"
  const response = await fetch(`${API_BASE_URL}/friend/pending`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(
      `Failed to fetch pending friend requests: ${response.statusText}`
    );
  }
  return await response.json();
}
export async function user_friends(): Promise<ApiResponse<User[]>> {
  const response = await fetch(`${API_BASE_URL}/friend`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch friends: ${response.statusText}`);
  }
  return await response.json();
}
export async function blockedFriends(): Promise<ApiResponse<User[]>> {
  const response = await fetch(`${API_BASE_URL}/friend/blocked`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch blocked friends: ${response.statusText}`);
  }
  return await response.json();
}
export async function removeFriend(userId: number): Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/friend/${userId}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to remove friend: ${response.statusText}`);
  }
  return await response.json();
}

// users
export async function getUsers() : Promise<ApiResponse<User[]>> {
  const response = await fetch(`${API_BASE_URL}/user`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.statusText}`);
  }
  return await response.json();
}
export async function blockUser(userId: number): Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/blocked/${userId}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to block user: ${response.statusText}`);
  }
  return await response.json();
}
export async function unblockUser(userId: number): Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/blocked/${userId}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to unblock user: ${response.statusText}`);
  }
  return await response.json();
}

// Search
export async function SearchUsers(query: string): Promise<ApiResponse<User[]>> {
  const response = await fetch(`${API_BASE_URL}/user/search?query=${encodeURIComponent(query)}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to search users: ${response.statusText}`);
  }
  return await response.json();
}