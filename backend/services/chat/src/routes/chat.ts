import { RouteHandlerMethod , FastifySchema  } from 'fastify';

import { createChat , removeChat   , getChatById } from '../controllers/chat.controller';
// import { createPoll , getGroupPolls , getPollById , addPollOption , votePollOption , removePoll } from '../controllers/poll.controller';
import { createGroup , removeGroup , getGroupById , addGroupMember , removeGroupMember , listGroupMembers , getGroupMessages , updateMemberRole , updateGroupInfo } from '../controllers/group.controller';
import { addGroupMemberSchema } from '../schemas/group.schema';


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
export const groupRoutes : Route[] = [
  { method: 'POST',   url: '/api/group/new',                        handler: createGroup },
  { method: 'DELETE', url: '/api/group/remove/:groupId',            handler: removeGroup },
  { method: 'GET',    url: '/api/group/show/:groupId',              handler: getGroupById },
  
  { method: 'POST',   url: '/api/group/:groupId/member/add',        handler: addGroupMember , schema : addGroupMemberSchema },
  { method: 'DELETE', url: '/api/group/:groupId/member/remove/:id', handler: removeGroupMember },
  { method: 'PATCH',  url: '/api/group/:groupId/member/:memberId/role', handler: updateMemberRole },
  { method: 'PATCH',  url: '/api/group/:groupId' , handler: updateGroupInfo },

  { method: 'GET',    url: '/api/group/:groupId/members',           handler: listGroupMembers },
  { method: 'GET',    url: '/api/group/:groupId/messages',          handler: getGroupMessages },
];


// ------------------- Poll REST Endpoints -------------------
export const pollRoutes: Route[] = [
  // { method: 'POST', url: '/api/group/:groupId/polls', handler: createPoll },

  // { method: 'GET', url: '/api/group/:groupId/polls', handler: getGroupPolls },

  // { method: 'GET', url: '/api/polls/:pollId', handler: getPollById },

  // { method: 'POST', url: '/api/polls/:pollId/options', handler: addPollOption },

  // { method: 'POST', url: '/api/polls/:pollId/votes', handler: votePollOption },

  // { method: 'DELETE', url: '/api/polls/:pollId', handler: removePoll },
];


