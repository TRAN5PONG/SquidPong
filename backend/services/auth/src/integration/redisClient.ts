import Redis from "ioredis";


const redis = new Redis({
  host: "redis",
  port: 6379,
});

// export async function publish(channel:string , data:object)
// {
//  await redis.publish(channel, JSON.stringify(data));
// }

// export async function subscribe(_channel:string)
// {
//   await redis.on('message', (channel:string, message:string) => {
//   if (channel === _channel)
//     console.log('News:', message);

//   });

// }

export default redis;
