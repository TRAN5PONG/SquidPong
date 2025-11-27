import { User } from "../types/users";

export const getUser = async (userId: string): Promise<User> => {
  try {
    const user = await fetch(`http://user:4002/api/user/id/${userId}`, {
      method: "GET",
    });
    const userData = await user.json();
    if (userData && userData.success) return userData.data;
    throw new Error("User not found");
  } catch (error) {
    throw error;
  }
};
