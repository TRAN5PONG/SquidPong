import { RouteHandlerMethod , FastifySchema  } from 'fastify';

import {deleteUser , updateUser ,  createUser ,   createChat , removeChat   , getChatById, getRecentChats } from '../controllers/chat.controller';
import {
  createGroup, updateGroupInfo, removeGroup, getGroupById, getGoupes,
  removeGroupMember, leaveGroup, listGroupMembers,
  requestJoinGroup, getJoinRequests, approveJoinRequest, rejectJoinRequest,
  getGroupMessages, updateMember
} from '../controllers/group.controller';

import { createPoll } from '../controllers/poll.controller';
import { ReactionsForMessage } from '../controllers/reaction.controller';


import {
  createChatSchema as newCreateChatSchema,
  removeChatSchema as newRemoveChatSchema,
  getChatByIdSchema as newGetChatByIdSchema,
  getRecentChatsSchema as newGetRecentChatsSchema
} from '../schemas/chat.schemas';

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
  getGroupMessagesSchema
} from '../schemas/group.schemas';

import {
  createPollSchema,
  getReactionsForMessageSchema
} from '../schemas/poll.schemas';

type Route = {
    method  : 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH'; 
    url     : string;
    handler : RouteHandlerMethod;
    schema? : FastifySchema;
};



// ------------------- Chat Endpoints -------------------
export const chatRoutes : Route[] = [
  { method: 'POST',   url: '/api/chat/user/create',            handler: createUser },          
  { method: 'PUT',   url: '/api/chat/user/update',     handler: updateUser, },          
  { method: 'DELETE',   url: '/api/chat/user/delete',     handler: deleteUser,  },          

  { method: 'GET',    url: '/api/chat/recent',             handler: getRecentChats, schema: newGetRecentChatsSchema },

  { method: 'POST',   url: '/api/chat/new',                handler: createChat , schema: newCreateChatSchema },          
  { method: 'DELETE', url: '/api/chat/remove/:chatId',     handler: removeChat , schema: newRemoveChatSchema },          
  { method: 'GET',    url: '/api/chat/:chatId/messages',   handler: getChatById , schema: newGetChatByIdSchema },    
];



// ------------------- Group Endpoints -------------------
export const groupRoutes: Route[] = [

  // Group management
  { method: 'POST',   url: '/api/group/',                       handler: createGroup, schema: createGroupSchema },                // create new group
  { method: 'PATCH',  url: '/api/group/:groupId',              handler: updateGroupInfo, schema: updateGroupInfoSchema },            // update group info
  { method: 'DELETE', url: '/api/group/:groupId',              handler: removeGroup, schema: removeGroupSchema },                // delete group
  { method: 'GET',    url: '/api/group/:groupId',              handler: getGroupById, schema: getGroupByIdSchema },               // get group by id
  { method: 'GET',    url: '/api/group',                       handler: getGoupes, schema: getGroupsSchema },                  // list/search group

  // Members management
  { method: 'PATCH',  url: '/api/group/:groupId/members', handler: updateMember, schema: updateMemberSchema }, // update role or status (flexible endpoint)
  { method: 'DELETE', url: '/api/group/:groupId/members', handler: removeGroupMember, schema: removeGroupMemberSchema }, // remove member
  { method: 'POST',   url: '/api/group/:groupId/members/leave', handler: leaveGroup, schema: leaveGroupSchema },             // leave group voluntarily
  { method: 'GET',    url: '/api/group/:groupId/members',      handler: listGroupMembers, schema: listGroupMembersSchema },         // list members

  // Join requests (for private group)
  { method: 'POST',   url: '/api/group/:groupId/join-requests',           handler: requestJoinGroup, schema: requestJoinGroupSchema },
  { method: 'GET',    url: '/api/group/:groupId/join-requests',           handler: getJoinRequests, schema: getJoinRequestsSchema },
  { method: 'PATCH',  url: '/api/group/:groupId/join-requests/approve', handler: approveJoinRequest, schema: approveJoinRequestSchema },
  { method: 'PATCH',  url: '/api/group/:groupId/join-requests/reject',  handler: rejectJoinRequest, schema: rejectJoinRequestSchema },

  // Messages
  { method: 'GET',    url: '/api/group/:groupId/messages',     handler: getGroupMessages, schema: getGroupMessagesSchema },

];

// ------------------- Poll REST Endpoints -------------------
export const pollRoutes: Route[] = [
  { method: 'POST', url: '/api/group/:groupId/polls', handler: createPoll, schema: createPollSchema },

  // { method: 'GET', url: '/api/group/:groupId/polls', handler: getGroupPolls },

  // { method: 'GET', url: '/api/polls/:pollId', handler: getPollById },

  // { method: 'POST', url: '/api/polls/:pollId/options', handler: addPollOption },

  // { method: 'POST', url: '/api/polls/:pollId/votes', handler: votePollOption },

  // { method: 'DELETE', url: '/api/polls/:pollId', handler: removePoll },
];




export const reactionRoutes: Route[] = [

  {method: 'GET', url: '/api/chat/:messageId/reactions', handler: ReactionsForMessage, schema: getReactionsForMessageSchema},
];