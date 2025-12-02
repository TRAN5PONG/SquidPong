import { NotificationEl, NotificationType } from "@/types/notification";
import { API_BASE_URL, ApiResponse } from "./auth";

// interface Notification {
// 	id : number;
// 	type : NotificationType;
// 	isRead : boolean;

// }

export async function getNotifications(): Promise<
  ApiResponse<NotificationEl[]>
> {
  const resp = await fetch(`${API_BASE_URL}/notify/history`, {
    method: "GET",
    credentials: "include",
  });

  const data = (await resp.json()) as ApiResponse<NotificationEl[]>;

  return data;
}
export async function markNotificationAsRead(
  notificationId: string
): Promise<ApiResponse<null>> {
  const resp = await fetch(`${API_BASE_URL}/notify/read/${notificationId}`, {
    method: "PATCH",
    credentials: "include",
  });
  const data = (await resp.json()) as ApiResponse<null>;
  return data;
}
export async function markAllNotificationsAsRead(): Promise<ApiResponse<null>> {
  const resp = await fetch(`${API_BASE_URL}/notify/read-all`, {
    method: "PATCH",
    credentials: "include",
  });
  const data = (await resp.json()) as ApiResponse<null>;
  return data;
}