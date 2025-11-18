export const getUser = async (userId: string): Promise<any> => {
  const res = await fetch(`http://user:4002/api/user/id/${userId}`);
  if (!res.ok) {
    throw new Error("Failed to fetch user data");
  }
  const userData = await res.json();
  return userData;
};

