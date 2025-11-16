import { RouteHandlerMethod , FastifySchema } from 'fastify';
import * as userController from '../controllers/user.controller';
import * as friendController from '../controllers/friend.controller';
import * as blockController from '../controllers/block.controller';
import { 
  createProfileSchema,
  updateProfileDBSchema,
  getCurrentUserSchema,
  getUserByIdSchema,
  getAllUsersSchema,
  searchUsersSchema,
  deleteProfileSchema,
  getUserByUserNameSchema,
  updateAvatarSchema
} from '../schemas/user.schemas';
import {
  sendFriendRequestSchema,
  acceptFriendRequestSchema,
  rejectFriendRequestSchema,
  cancelFriendRequestSchema,
  getFriendsListSchema,
  getPendingRequestsSchema,
  removeFriendSchema,
  verifyFriendshipSchema
} from '../schemas/friend.schemas';
import {
  blockUserSchema,
  unblockUserSchema,
  getBlockedUsersSchema
} from '../schemas/block.schemas';


type Route = {
    method  : 'GET' | 'POST' | 'DELETE' | 'PATCH' | 'PUT';
    url     : string;
    handler : RouteHandlerMethod;
    schema? : FastifySchema;
};


const userRoutes: Route[] = [

  { method: 'POST', url: '/api/user/me', handler: userController.createProfileHandler, schema: createProfileSchema },
  { method: 'PUT', url: '/api/user/db', handler: userController.updateProfileHandlerDB, schema: updateProfileDBSchema },
  { method: 'PUT', url: '/api/user/realtime', handler: userController.updateProfileHandler },
  { method: 'PUT', url: '/api/user/avatar', handler: userController.updateProfileImageHandler, schema: updateAvatarSchema },
  { method: 'DELETE', url: '/api/user/me', handler: userController.deleteProfileHandler, schema: deleteProfileSchema },
  
  { method: 'GET', url: '/api/user/me', handler: userController.getCurrentUserHandler, schema: getCurrentUserSchema },
  { method: 'GET', url: '/api/user/username/:username', handler: userController.getUserByUserNameHandler  , schema: getUserByUserNameSchema },
  { method: 'GET', url: '/api/user/id/:id', handler: userController.getUserByIdHandler, schema: getUserByIdSchema },
  { method: 'GET', url: '/api/user/all', handler: userController.getAllUserHandler, schema: getAllUsersSchema },
  { method: 'GET', url: '/api/user/search', handler: userController.searchUsersHandler, schema: searchUsersSchema },
  
];




const friendRoutes: Route[] = [

  { method: 'POST', url: '/api/friend/request', handler: friendController.sendFriendRequestHandler, schema: sendFriendRequestSchema },
  { method: 'POST', url: '/api/friend/accept', handler: friendController.acceptFriendRequestHandler, schema: acceptFriendRequestSchema },
  { method: 'POST', url: '/api/friend/reject', handler: friendController.rejectFriendRequestHandler, schema: rejectFriendRequestSchema },
  { method: 'PUT' , url: '/api/friend/cancel', handler: friendController.cancelFriendRequestHandler, schema: cancelFriendRequestSchema },
  { method: 'GET', url: '/api/friend/pending', handler: friendController.getPendingRequestsHandler, schema: getPendingRequestsSchema },
  { method: 'GET', url: '/api/friend/all-friends/:username', handler: friendController.getFriendsListHandler },
  { method: 'DELETE', url: '/api/friend/:friendId', handler: friendController.removeFriendHandler, schema: removeFriendSchema },
  
  { method: 'GET', url: '/api/friend/verify/:friendId', handler: friendController.verifyFriendshipHandler, schema: verifyFriendshipSchema },
  
  // Block endpoints
  { method: 'GET', url: '/api/blocked/all', handler: blockController.getBlockedUsersHandler, schema: getBlockedUsersSchema },
  { method: 'POST', url: '/api/blocked/:blockId', handler: blockController.blockUserHandler, schema: blockUserSchema },
  { method: 'DELETE', url: '/api/blocked/:blockId', handler: blockController.unblockUserHandler, schema: unblockUserSchema },

];


export  {friendRoutes , userRoutes};
