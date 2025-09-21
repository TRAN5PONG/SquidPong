import { RouteHandlerMethod , FastifySchema  } from 'fastify';

import { createChat , removeChat , getChatById  , addChatMember , removeChatMember } from '../controllers/chat.controller';
import { createPoll , getGroupPolls , getPollById , addPollOption , votePollOption , removePoll } from '../controllers/poll.controller';
import { sendMessageWithAttachment , getChatMessages , removeAttachment } from '../controllers/attach.file.controller';
import { createGroup , removeGroup , getGroupById , addGroupMember , removeGroupMember , listGroupMembers , getGroupMessages , updateMemberRole , updateGroupInfo } from '../controllers/group.controller';


type Route = {
    method  : 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH'; 
    url     : string;
    handler : RouteHandlerMethod;
    schema? : FastifySchema;
};



// ------------------- Chat Endpoints -------------------

// ------------------- Chat Endpoints -------------------
export const chatRoutes = [
  { method: 'POST',   url: '/api/chat/new',                handler: createChat },          // create new chat
  { method: 'DELETE', url: '/api/chat/remove/:chatId',     handler: removeChat },          // remove chat

  { method: 'POST',   url: '/api/chat/:chatId/member/add', handler: addChatMember },       // add member to chat
  { method: 'DELETE', url: '/api/chat/:chatId/member/remove/:userId', handler: removeChatMember }, // remove member from chat

  { method: 'GET',    url: '/api/chat/:chatId/messages',   handler: getChatMessages },    // get all messages in a chat
];


// // ------------------- Attachment Endpoints -------------------
export const attachmentRoutes = [

  { method: 'POST',     url: '/api/chats/:chatId/messages/:type', handler: sendMessageWithAttachment,},
  { method: 'GET',      url: '/api/chats/:chatId/messages', handler: getChatMessages,},
  { method: 'DELETE',   url: '/api/attachments/:attachmentId', handler: removeAttachment},

];



// ------------------- Group Endpoints -------------------
export const groupRoutes = [
  { method: 'POST',   url: '/api/group/new',                        handler: createGroup },
  { method: 'DELETE', url: '/api/group/remove/:groupId',            handler: removeGroup },
  { method: 'GET',    url: '/api/group/show/:groupId',              handler: getGroupById },
  { method: 'POST',   url: '/api/group/:groupId/member/add',        handler: addGroupMember },
  { method: 'DELETE', url: '/api/group/:groupId/member/remove/:id', handler: removeGroupMember },
  { method: 'PATCH',  url: '/api/group/:groupId/member/:memberId/role', handler: updateMemberRole },
  { method: 'PATCH',  url: '/api/group/:groupId' , handler: updateGroupInfo },

  { method: 'GET',    url: '/api/group/:groupId/members',           handler: listGroupMembers },
  { method: 'GET',    url: '/api/group/:groupId/messages',          handler: getGroupMessages },
];



// ------------------- Poll REST Endpoints -------------------
export const pollRoutes = [
  { method: 'POST', url: '/api/groups/:groupId/polls', handler: createPoll },
  { method: 'GET', url: '/api/groups/:groupId/polls', handler: getGroupPolls },
  { method: 'GET', url: '/api/polls/:pollId', handler: getPollById },
  { method: 'POST', url: '/api/polls/:pollId/options', handler: addPollOption },
  { method: 'POST', url: '/api/polls/:pollId/vote', handler: votePollOption },
  { method: 'DELETE', url: '/api/polls/:pollId', handler: removePoll },
];




