import { RouteHandlerMethod , FastifySchema  } from 'fastify';

import {
  blockUserHandler, unblockUserHandler, removeUserHandler, deleteAccountHandler, 
  createChat, removeChat, getChatById, getRecentChats,
  sendMessageHandler, editMessageHandler, deleteMessageHandler, 
  replyToMessageHandler, addReactionHandler, removeReactionHandler,
  markMessagesAsRead
} from '../controllers/chat.controller';
import { createUser, updateUser } from '../controllers/user.controller';
import {
  createGroup, updateGroupInfo, removeGroup, getGroupById, getGoupes,
  removeGroupMember, leaveGroup, listGroupMembers,
  requestJoinGroup, getJoinRequests, approveJoinRequest, rejectJoinRequest,
  getGroupMessages, updateMember, inviteUserToGroup
} from '../controllers/group.controller';



import {
  createChatSchema as newCreateChatSchema,
  removeChatSchema as newRemoveChatSchema,
  getChatByIdSchema as newGetChatByIdSchema,
  getRecentChatsSchema as newGetRecentChatsSchema
} from '../schemas/chat.schemas';

import {
  sendMessageSchema,
  editMessageSchema,
  deleteMessageSchema,
  replyToMessageSchema,
  addReactionSchema,
  removeReactionSchema
} from '../schemas/message.schemas';

import {
  createGroupSchema,
  updateGroupInfoSchema,
  removeGroupSchema,
  getGroupByIdSchema,
  getGroupsSchema,
  updateMemberSchema,
  removeGroupMemberSchema,
  leaveGroupSchema,
  listGroupMembersSchema,
  requestJoinGroupSchema,
  getJoinRequestsSchema,
  approveJoinRequestSchema,
  rejectJoinRequestSchema,
  getGroupMessagesSchema,
  inviteUserToGroupSchema,
} from '../schemas/group.schemas';

import {
  createPollSchema,
  getReactionsForMessageSchema,
  getGroupPollsSchema,
  getPollByIdSchema,
  votePollOptionSchema,
  removePollSchema
} from '../schemas/poll.schemas';

type Route = {
    method  : 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH'; 
    url     : string;
    handler : RouteHandlerMethod;
    schema? : FastifySchema;
};


// ------------------- Chat Endpoints -------------------
export const chatRoutes : Route[] = [
  { method: 'POST',   url: '/api/chat/create',            handler: createUser },          
  { method: 'PUT',   url: '/api/chat/update',     handler: updateUser, },          
  { method: 'DELETE', url: '/api/chat/delete',     handler: deleteAccountHandler },

  

  { method: 'GET',    url: '/api/chat/recent',             handler: getRecentChats },
  { method: 'POST',   url: '/api/chat/new',                handler: createChat  }, // createChatSchema         
  // { method: 'DELETE', url: '/api/chat/remove/:chatId',     handler: removeChat  },          
  { method: 'GET',    url: '/api/chat/:chatId/messages',   handler: getChatById  },
  { method: 'PATCH',  url: '/api/chat/:chatId/read',       handler: markMessagesAsRead  },

  { method: 'POST',   url: '/api/chat/block/:friendId',    handler: blockUserHandler  },
  { method: 'POST',   url: '/api/chat/unblock/:friendId',  handler: unblockUserHandler  },
  { method: 'DELETE', url: '/api/chat/user/:friendId',     handler: removeUserHandler },
];




// ------------------- Message Endpoints -------------------
export const messageRoutes: Route[] = [
  { method: 'POST',   url: '/api/message/send',                handler: sendMessageHandler },
  { method: 'PATCH',  url: '/api/message/:messageId/edit',     handler: editMessageHandler },
  { method: 'DELETE', url: '/api/message/:messageId',          handler: deleteMessageHandler },
  { method: 'POST',   url: '/api/message/:messageId/reply',    handler: replyToMessageHandler },
  { method: 'POST',   url: '/api/message/:messageId/reaction', handler: addReactionHandler },
  { method: 'DELETE', url: '/api/message/:messageId/reaction', handler: removeReactionHandler },
];


// ------------------- Group Endpoints -------------------
export const groupRoutes: Route[] = [

  // Group management
  { method: 'POST',   url: '/api/group/',                       handler: createGroup, schema: createGroupSchema },
  { method: 'PATCH',  url: '/api/group/:groupId',              handler: updateGroupInfo, schema: updateGroupInfoSchema },            
  { method: 'DELETE', url: '/api/group/:groupId',              handler: removeGroup, schema: removeGroupSchema },                
  { method: 'GET',    url: '/api/group/:groupId',              handler: getGroupById, schema: getGroupByIdSchema },              
  { method: 'GET',    url: '/api/group',                       handler: getGoupes, schema: getGroupsSchema },                 

  // Members management
  { method: 'PATCH',  url: '/api/group/:groupId/members', handler: updateMember, schema: updateMemberSchema }, 
  { method: 'DELETE', url: '/api/group/:groupId/members', handler: removeGroupMember, schema: removeGroupMemberSchema }, 
  { method: 'POST',   url: '/api/group/:groupId/members/leave', handler: leaveGroup, schema: leaveGroupSchema },            
  { method: 'GET',    url: '/api/group/:groupId/members',      handler: listGroupMembers, schema: listGroupMembersSchema },    

  // Join requests (for private group)
  { method: 'POST',   url: '/api/group/:groupId/join-requests',           handler: requestJoinGroup, schema: requestJoinGroupSchema },
  { method: 'GET',    url: '/api/group/:groupId/join-requests',           handler: getJoinRequests, schema: getJoinRequestsSchema },
  { method: 'PATCH',  url: '/api/group/:groupId/join-requests/approve', handler: approveJoinRequest, schema: approveJoinRequestSchema },
  { method: 'PATCH',  url: '/api/group/:groupId/join-requests/reject',  handler: rejectJoinRequest, schema: rejectJoinRequestSchema },

  // Admin/Owner invite users
  { method: 'POST',   url: '/api/group/:groupId/invite',                 handler: inviteUserToGroup, schema: inviteUserToGroupSchema },
  { method: 'GET',    url: '/api/group/:groupId/messages',     handler: getGroupMessages, schema: getGroupMessagesSchema },

]
