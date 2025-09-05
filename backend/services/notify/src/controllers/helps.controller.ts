
import prisma from "../db/database";


export async function createNotification(data: any) 
{

  console.log('create new notification')
  return prisma.notification.create({
    data: {
      userId: data.userId,
      title: data.title,
      message: data.message,
      // type: data.type ?? 'INFO',
      // status: data.status ?? 'UNREAD',
    },
  });
}


export async function updateNotification(data: any)
{
  const notification = await prisma.notification.findFirst({
    where: {
      id: data.id,
      userId: data.userId,
    },
  });

  if (!notification)
    throw new Error('Notification not found for this user');

  return prisma.notification.update({
    where: { id: notification.id },
    data: {status : data.status},
  });
}

export async function deleteNotification(data: any) 
{
  const notification = await prisma.notification.findFirst({
    where: {
      id: data.id,
      userId: data.userId,
    },
  });

  if (!notification)
    throw new Error('Notification not found for this user');

  return prisma.notification.delete({
    where: { id: notification.id },
  });
}
