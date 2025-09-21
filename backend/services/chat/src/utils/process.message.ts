
// import { createMessage } from "../controllers/chat.rabbit.controller";
// import { sendDataToQueue } from "../integration/rabbitmqClient";
// import redis from "../integration/redisClient";
// import { verifyFriendship } from "./helper";

// export async function handleMessage(data: { senderId: string, receiverId: string, message: string }) 
// {
//   try 
//   {

//     if(!await verifyFriendship(data.senderId, data.receiverId))
//       throw new Error("Users are not friends");

//     const message = await createMessage(`${data.senderId}`, data.receiverId, data.message);

//     console.log("Message created:", message);
  
//     const isOnline = await redis.sismember('online_users', data.receiverId);
//     if (isOnline)
//       await sendDataToQueue({...message , targetId : message.receiverId }, "broadcastData");

//     return message;
//   } 
//   catch (err) {
//     console.error("Error handling message:", err);
//     throw err;
//   }
// }
