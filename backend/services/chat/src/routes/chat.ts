import { RouteHandlerMethod , FastifySchema  } from 'fastify';

import { createChat , removeChat   , getChatById } from '../controllers/chat.controller';
import {
  createGroup, updateGroupInfo, removeGroup, getGroupById, getGoupes,
  removeGroupMember, leaveGroup, listGroupMembers,
  requestJoinGroup, getJoinRequests, approveJoinRequest, rejectJoinRequest,
  getGroupMessages, updateMember
} from '../controllers/group.controller';

import { createPoll } from '../controllers/poll.controller';

import { ReactionsForMessage } from '../controllers/reaction.controller';

type Route = {
    method  : 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH'; 
    url     : string;
    handler : RouteHandlerMethod;
    schema? : FastifySchema;
};



// ------------------- Chat Endpoints -------------------
export const chatRoutes : Route[] = [
  { method: 'POST',   url: '/api/chat/new',                handler: createChat },          
  { method: 'DELETE', url: '/api/chat/remove/:chatId',     handler: removeChat },          
  { method: 'GET',    url: '/api/chat/:chatId/messages',   handler: getChatById },    
];



// ------------------- Group Endpoints -------------------
export const groupRoutes: Route[] = [

  // Group management
  { method: 'POST',   url: '/api/group/',                       handler: createGroup },                // create new group
  { method: 'PATCH',  url: '/api/group/:groupId',              handler: updateGroupInfo },            // update group info
  { method: 'DELETE', url: '/api/group/:groupId',              handler: removeGroup },                // delete group
  { method: 'GET',    url: '/api/group/:groupId',              handler: getGroupById },               // get group by id
  { method: 'GET',    url: '/api/group',                       handler: getGoupes },                  // list/search group

  // Members management
  { method: 'PATCH',  url: '/api/group/:groupId/members', handler: updateMember }, // update role or status (flexible endpoint)
  { method: 'DELETE', url: '/api/group/:groupId/members', handler: removeGroupMember }, // remove member
  { method: 'POST',   url: '/api/group/:groupId/members/leave', handler: leaveGroup },             // leave group voluntarily
  { method: 'GET',    url: '/api/group/:groupId/members',      handler: listGroupMembers },         // list members

  // Join requests (for private group)
  { method: 'POST',   url: '/api/group/:groupId/join-requests',           handler: requestJoinGroup },
  { method: 'GET',    url: '/api/group/:groupId/join-requests',           handler: getJoinRequests },
  { method: 'PATCH',  url: '/api/group/:groupId/join-requests/approve', handler: approveJoinRequest },
  { method: 'PATCH',  url: '/api/group/:groupId/join-requests/reject',  handler: rejectJoinRequest },

  // Messages
  { method: 'GET',    url: '/api/group/:groupId/messages',     handler: getGroupMessages },

];

// ------------------- Poll REST Endpoints -------------------
export const pollRoutes: Route[] = [
  { method: 'POST', url: '/api/group/:groupId/polls', handler: createPoll },

  // { method: 'GET', url: '/api/group/:groupId/polls', handler: getGroupPolls },

  // { method: 'GET', url: '/api/polls/:pollId', handler: getPollById },

  // { method: 'POST', url: '/api/polls/:pollId/options', handler: addPollOption },

  // { method: 'POST', url: '/api/polls/:pollId/votes', handler: votePollOption },

  // { method: 'DELETE', url: '/api/polls/:pollId', handler: removePoll },
];




export const reactionRoutes: Route[] = [

  {method: 'GET', url: '/api/chat/:messageId/reactions', handler: ReactionsForMessage},
];