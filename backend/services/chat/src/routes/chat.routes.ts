import { RouteHandlerMethod , FastifySchema  } from 'fastify';

import {
  blockUserHandler, unblockUserHandler, removeUserHandler,
  blockFriendInChatHandler, unblockFriendInChatHandler,
  createChat, removeChat, getChatById, getRecentChats,
  sendMessageHandler, editMessageHandler, deleteMessageHandler, 
  replyToMessageHandler, addReactionHandler, removeReactionHandler,
  markMessagesAsRead
} from '../controllers/chat.controller';

import { deleteAccountHandler } from '../controllers/user.controller';
import { createUser, updateUser } from '../controllers/user.controller';
import {
  createGroup, updateGroupInfo, updateGroupImage, removeGroup, getGroupById, getGoupes,
  removeGroupMember, leaveGroup, listGroupMembers,
  requestJoinGroup, getJoinRequests, approveJoinRequest, rejectJoinRequest,
  getGroupMessages, updateMember, inviteUserToGroup
} from '../controllers/group.controller';



import {
  createChatSchema as newCreateChatSchema,
  removeChatSchema as newRemoveChatSchema,
  getChatByIdSchema as newGetChatByIdSchema,
  getRecentChatsSchema as newGetRecentChatsSchema,
  blockUserInChatSchema,
  unblockUserInChatSchema,
  removeUserFromChatSchema,
  blockFriendInChatSchema,
  unblockFriendInChatSchema,
  markMessagesAsReadSchema
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
  updateGroupImageSchema,
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

  

  { method: 'GET',    url: '/api/chat/recent',             handler: getRecentChats, schema: newGetRecentChatsSchema },
  { method: 'POST',   url: '/api/chat/new',                handler: createChat, schema: newCreateChatSchema  }, // createChatSchema         
  { method: 'DELETE', url: '/api/chat/remove',     handler: removeChat, schema: newRemoveChatSchema  },          
  { method: 'GET',    url: '/api/chat/:chatId/messages',   handler: getChatById, schema: newGetChatByIdSchema  },
  { method: 'PATCH',  url: '/api/chat/:chatId/read',       handler: markMessagesAsRead, schema: markMessagesAsReadSchema  },

  { method: 'POST',   url: '/api/chat/block/:friendId',    handler: blockUserHandler, schema: blockUserInChatSchema  },
  { method: 'POST',   url: '/api/chat/unblock/:friendId',  handler: unblockUserHandler, schema: unblockUserInChatSchema  },
  { method: 'DELETE', url: '/api/chat/user/:friendId',     handler: removeUserHandler, schema: removeUserFromChatSchema },
  
  // Service-to-service endpoints (called from user-service)
  { method: 'POST',   url: '/api/chat/block-friend',        handler: blockFriendInChatHandler, schema: blockFriendInChatSchema },
  { method: 'POST',   url: '/api/chat/unblock-friend',      handler: unblockFriendInChatHandler, schema: unblockFriendInChatSchema },
];




// ------------------- Message Endpoints -------------------
export const messageRoutes: Route[] = [
  { method: 'POST',   url: '/api/message/send',                handler: sendMessageHandler, schema: sendMessageSchema },
  { method: 'PATCH',  url: '/api/message/:messageId/edit',     handler: editMessageHandler, schema: editMessageSchema },
  { method: 'DELETE', url: '/api/message/:messageId',          handler: deleteMessageHandler, schema: deleteMessageSchema },
  { method: 'POST',   url: '/api/message/:messageId/reply',    handler: replyToMessageHandler, schema: replyToMessageSchema },
  { method: 'POST',   url: '/api/message/:messageId/reaction', handler: addReactionHandler, schema: addReactionSchema },
  { method: 'DELETE', url: '/api/message/:messageId/reaction', handler: removeReactionHandler, schema: removeReactionSchema },
];


// ------------------- Group Endpoints -------------------
export const groupRoutes: Route[] = [

  // Group management
  { method: 'POST',   url: '/api/group/create',                       handler: createGroup },
  { method: 'PUT',  url: '/api/group/:groupId',              handler: updateGroupInfo },    
  { method: 'PUT',    url: '/api/group/:groupId/image',        handler: updateGroupImage },        
  { method: 'DELETE', url: '/api/group/:groupId',              handler: removeGroup },                
  { method: 'GET',    url: '/api/group/:groupId/:matchId',              handler: getGroupById },              
  { method: 'GET',    url: '/api/group',                       handler: getGoupes },                 

  // Members management
  { method: 'PATCH',  url: '/api/group/:groupId/members', handler: updateMember }, 
  { method: 'DELETE', url: '/api/group/:groupId/members', handler: removeGroupMember }, 
  { method: 'POST',   url: '/api/group/:groupId/:matchId/members/leave', handler: leaveGroup },            
  { method: 'GET',    url: '/api/group/:groupId/members',      handler: listGroupMembers },    

  // Join requests (for private group)
  { method: 'POST',   url: '/api/group/:groupId/:matchId/join-requests',           handler: requestJoinGroup },
  { method: 'GET',    url: '/api/group/:groupId/join-requests',           handler: getJoinRequests },
  { method: 'PATCH',  url: '/api/group/:groupId/join-requests/approve', handler: approveJoinRequest },
  { method: 'PATCH',  url: '/api/group/:groupId/join-requests/reject',  handler: rejectJoinRequest },

  // Admin/Owner invite users
  { method: 'POST',   url: '/api/group/:groupId/invite',                 handler: inviteUserToGroup },
  { method: 'GET',    url: '/api/group/:groupId/:matchId/messages',     handler: getGroupMessages },

]
