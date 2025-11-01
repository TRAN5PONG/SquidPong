import amqp from "amqplib";
import {
  giveUp,
  startGame,
  toggleReadyStatus,
} from "../controllers/matchController";

let connection: any;
let channel: any;

export async function initRabbitMQ() {
  try {
  const rabbitmqUrl = process.env.RABBITMQ_URL || "amqp://rabbitmq:5672";
    connection = await amqp.connect(rabbitmqUrl);
    channel = await connection.createChannel();

    // Assert queues that this service will use
    await channel.assertQueue("game");
    // await channel.assertQueue("test", { durable: true }); // Gateway queue

    // Add connection error handling
    connection.on("error", (err: any) => {
      console.error("RabbitMQ connection error:", err);
    });

    connection.on("close", () => {
      console.log("RabbitMQ connection closed");
    });

    console.log("✅ Game Service connected to RabbitMQ");
  } catch (error) {
    console.error("❌ Failed to connect to RabbitMQ, retrying in 5s:", error);
    setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      initRabbitMQ();
    }, 5000);
  }
}

export async function sendDataToQueue(data: any, queue: string) {
  try {
    if (!channel) {
      console.error("RabbitMQ channel not available");
      return;
    }

    const msgBuffer = Buffer.from(JSON.stringify(data));
    channel.sendToQueue(queue, msgBuffer, { persistent: true });
    console.log(`📤 Sent message to ${queue}:`, data);
  } catch (error) {
    console.error("Error sending to queue:", error);
  }
}

// export async function receiveFromQueue(queue: string) {
//   try
//   {
//     if (!channel) {
//       console.error("RabbitMQ channel not available");
//       return;
//     }

//     await channel.consume(queue, receiveAndDeliver, { noAck: false });
//     console.log(`🎧 Listening for messages on queue: ${queue}`);
//   } catch (error) {
//     console.error("Error setting up consumer:", error);
//   }
// }

// function receiveAndDeliver(msg: any)
// {
//   if (msg === null) return;

//   try
//   {
//     const data = JSON.parse(msg.content.toString());
//     console.log("📥 Received game message:", data);

//   }
//   catch (error)
//   {
//     console.error("Error processing message:", error);
//     // Reject message and don't requeue on parsing errors
//     channel.nack(msg, false, false);
//   }
// }

export async function receiveFromQueue(queue: string) {
  channel.consume(queue, recieveHandler);
}

function recieveHandler(msg: any) {
  if (msg === null) return;

  try {
    const data = JSON.parse(msg.content.toString());
    const response = processMacthMessage(data.data);

    channel.ack(msg);
  } catch (error) {
    console.error("Error processing message:", error);
    // Reject message and don't requeue on parsing errors
    channel.nack(msg, false, false);
  }
}

async function processMacthMessage(data: any) {
  if (!data.event) {
    console.error("Invalid message format: missing type");
    return;
  }
  switch (data.event) {
    case "match-player-update":
      return toggleReadyStatus(data.matchId, data.playerId);
    case "match-give-up":
      return giveUp(data.matchId, data.playerId);
    case "match-start": {
      try {
        const updatedMatch = await startGame(data.matchId, data.playerId);

        sendDataToQueue(
          {
            to: [
              updatedMatch.opponent1.gmUserId,
              updatedMatch.opponent2?.gmUserId,
            ], // send only to the starter
            event: "match-started",
            data: { match: updatedMatch },
          },
          "test"
        );
      } catch (error) {
        sendDataToQueue(
          {
            to: data.senderGMid, // send back only to the starter
            event: "match-error",
            data: {
              message: (error as Error).message || "Failed to start match",
            },
          },
          "test"
        );
      }
      break;
    }

    default:
      console.error("Unknown event type:", data.event);
      return;
  }
}

async function getGMuserId(userId: string) {}
