import path from 'path';
import fastify, { FastifyRequest, FastifyReply } from 'fastify';
import fastifyStatic from '@fastify/static';
import WebSocket, { WebSocketServer } from 'ws';
import type { DbMessageRow, DbReactionRow } from './db.js';
import * as db from './db.js';



import { initRabbitMQ , receiveFromQueue } from './integration/rabbitmqClient.js';



import type {
  ChatMessage,
  ChatReaction,
  ChatReactionType,
  ChatMessageType,
  ChatMessageStatus,
  User,
} from './types.js';

// Emoji to ChatReactionType mapping
const emojiToReactionType: Record<string, ChatReactionType> = {
  '👍': 'like',
  '🧡': 'love',
  '😂': 'laugh',
  '🙂': 'wow',
  '😢': 'sad',
  '🙏': 'thanks',
};

const app = fastify();
const server = app.server;
const wss = new WebSocketServer({ server });

console.log('WebSocket server created');

wss.on('error', (error:any) => {
  console.error('WebSocket server error:', error);
});

wss.on('close', () => {
  console.log('WebSocket server closed');
});

await app.register(fastifyStatic, {
  root: path.join(process.cwd(), '../frontend/dist'),
  prefix: '/',
  decorateReply: true,
});

app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
  return reply.sendFile('index.html');
});

function mapEmojiToReactionType(emoji: string): ChatReactionType {
  return emojiToReactionType[emoji] || 'like';
}

function createUser(username: string): User {
  return { username };
}

function formatDbMessageToChatMessage(
  msg: db.DbMessageRow,
  reactionsRows: db.DbReactionRow[]
): ChatMessage {
  const reactions: ChatReaction[] = reactionsRows.map(r => ({
    type: mapEmojiToReactionType(r.emoji),
    from: { username: r.user }
  }));

  return {
    id: msg.id,
    from: { username: msg.senderId  },
    date: msg.timestamp,
    message: msg.message,
    status: 'delivered',
    type: 'text',
    reactions,
  };
}

// wss.on('connection', async (ws:any) => {
//   console.log('Client connected');
//   console.log('Total connected clients:', wss.clients.size);

//   try 
//   {
//     const messages = await db.getMessages();

//     // Format messages with their reactions
//     const reactions = await Promise.all(messages.map(msg => db.getReactions(msg.id)));
//     const messagesWithReactions = messages.map((msg, index) => formatDbMessageToChatMessage(msg, reactions[index]));

//     ws.send(JSON.stringify({ 
//       type: 'history', 
//       messages: messagesWithReactions 
//     }));
//   } catch (err) {
//     console.error('Error loading chat history:', err);
//     ws.send(JSON.stringify({ type: 'history', messages: [] }));
//   }

//   ws.on('message', async (data:any) => {
//     console.log('Received message:', data.toString());
//     try {
//       const parsed = JSON.parse(data.toString());
//       console.log('Parsed message:', parsed);

//       if (parsed.type === 'chat') {
//         const sender: string = parsed.sender;
//         const messageText: string = parsed.message;

//         const insertedMessage = await db.addMessage(sender, messageText);

//         const chatMessage: ChatMessage = {
//           id: insertedMessage.id,
//           from: createUser(sender),
//           date: insertedMessage.timestamp,
//           message: messageText,
//           status: 'delivered',
//           type: 'text',
//           reactions: [],
//         };

//         // Broadcast to all clients
//         wss.clients.forEach((client:any) => {
//           if (client.readyState === WebSocket.OPEN) {
//             client.send(
//               JSON.stringify({
//                 type: 'chat',
//                 id: insertedMessage.id,
//                 message: chatMessage,
//               })
//             );
//           }
//         });
//       } else if (parsed.type === 'reaction') {
//         const { messageId, emoji, user } = parsed;
//         const numMessageId = Number(messageId);

//         try {
//           // Toggle the reaction
//           await db.toggleReaction(numMessageId, emoji, user);

//           // Get updated reactions
//           const reactionsRows = await db.getReactionsForMessage(numMessageId);
          
//           // Send the updated reactions to all clients
//           const reactionUpdate = {
//             type: 'reaction',
//             messageId: numMessageId,
//             reactions: reactionsRows.map((r: DbReactionRow) => {
//               return {
//                 emoji: r.emoji,
//                 user: r.user
//               };
//             })
//           };

//           wss.clients.forEach((client:any) => {
//             if (client.readyState === WebSocket.OPEN) {
//               client.send(JSON.stringify(reactionUpdate));
//             }
//           });
//         } catch (err) {
//           console.error('Error handling reaction:', err);
//         }
//       }
//     } catch (err) {
//       console.error('Error processing websocket message:', err);
//     }
//   });

//   ws.on('close', () => {
//     console.log('Client disconnected');
//   });
// });



try 
{
  await db.initDb();
  const address = await app.listen({ port: 4002, host: '0.0.0.0' });
  await initRabbitMQ();
  await receiveFromQueue();
  console.log(`Server listening on ${address}`);
} 
catch (err) 
{
  console.error('Error starting server:', err);
  process.exit(1);
}

// Cleanup on server shutdown
process.on('SIGINT', async () => {
  await db.closeDb();
  process.exit();
});

