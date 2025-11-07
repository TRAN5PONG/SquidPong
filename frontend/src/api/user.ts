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
  const response = await fetch(`${API_BASE_URL}/user/username/${Id}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return await response.json();
}

// friends
export async function sendFriendRequest(
  receiverId: number
): Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/friend/request`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ receiverId }),
  });

  return await response.json();
}
export async function acceptFriendRequest(
  senderId: number
): Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/friend/accept`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ senderId }),
  });

  return await response.json();
}
export async function rejectFriendRequest(
  senderId: number
): Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/friend/reject`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ senderId }),
  });

  return await response.json();
}

export interface MiniUser {
  id: string;
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string;
  status: string;
  isVerified: boolean;
}
interface PendingFriendRequestsData {
  received: MiniUser[];
  sent: MiniUser[];
}
export async function getPendingFriendRequests(): Promise<
  ApiResponse<PendingFriendRequestsData>
> {
  // endpoint: /friend/pending
  // method: GET"
  const response = await fetch(`${API_BASE_URL}/friend/pending`, {
    method: "GET",
    credentials: "include",
  });

  return await response.json();
}

/**
 * Friends
 * @param userid 
 * @returns 
 */
export async function getUserFriends(
  userid: string
): Promise<ApiResponse<MiniUser[]>> {
  const response = await fetch(`${API_BASE_URL}/friend/all-friends/${userid}`, {
    method: "GET",
    credentials: "include",
  });
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
/**
 * Block
 */
export async function getBlockedUsers(): Promise<ApiResponse<MiniUser[]>> {
  const response = await fetch(`${API_BASE_URL}/blocked/all`, {
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
export async function blockUser(userId: number): Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/blocked/${userId}`, {
    method: "POST",
    credentials: "include",
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

// users
export async function getUsers(): Promise<ApiResponse<User[]>> {
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

// Search
export async function SearchUsers(query: string): Promise<ApiResponse<User[]>> {
  const response = await fetch(
    `${API_BASE_URL}/user/search?query=${encodeURIComponent(query)}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to search users: ${response.statusText}`);
  }
  return await response.json();
}

export const changeAvatar = async (avatarFile: File): Promise<ApiResponse> => {
  const formData = new FormData();

  formData.append("avatar", avatarFile);
  const resp = await fetch(`${API_BASE_URL}/user/avatar`, {
    method: "PUT",
    credentials: "include",
    body: formData,
  });

  return await resp.json();
};
export const updateProfile = async (
  firstName: string,
  lastName: string,
  username: string,
  banner: string
): Promise<ApiResponse> => {
  const resp = await fetch(`${API_BASE_URL}/user/db`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ firstName, lastName, username, banner }),
  });

  return await resp.json();
};
