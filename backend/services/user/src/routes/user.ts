import { RouteHandlerMethod , FastifySchema } from 'fastify';
import * as userController from '../controllers/user.controller';
import * as friendController from '../controllers/friend.controller';
import * as blockController from '../controllers/block.controller';



type Route = {
    method  : 'GET' | 'POST' | 'DELETE' | 'PATCH' | 'PUT';
    url     : string;
    handler : RouteHandlerMethod;
    schema? : FastifySchema;
};


const userRoutes: Route[] = [

  { method: 'POST', url: '/api/user/me', handler: userController.createProfileHandler },
  { method: 'PUT', url: '/api/user/sync', handler: userController.updateProfileHandlerDB },
  { method: 'PUT', url: '/api/user/live', handler: userController.updateProfileHandler },
  { method: 'DELETE', url: '/api/user/me', handler: userController.deleteProfileHandler },
  { method: 'GET', url: '/api/user/me', handler: userController.getCurrentUserHandler },
  { method: 'GET', url: '/api/user/:id', handler: userController.getUserByIdHandler },
  { method: 'GET', url: '/api/user/all', handler: userController.getAllUserHandler },

  { method: 'GET', url: '/api/user/search', handler: userController.searchUsersHandler },
];


const friendRoutes: Route[] = [

  { method: 'POST', url: '/api/friend/request', handler: friendController.sendFriendRequestHandler },
  { method: 'POST', url: '/api/friend/accept', handler: friendController.acceptFriendRequestHandler },
  { method: 'POST', url: '/api/friend/reject', handler: friendController.rejectFriendRequestHandler },

  { method: 'GET', url: '/api/friend/pending', handler: friendController.getPendingRequestsHandler },
  { method: 'GET', url: '/api/friend/all', handler: friendController.getFriendsListHandler },
  
  { method: 'DELETE', url: '/api/friend/:friendId', handler: friendController.removeFriendHandler },
  
  { method: 'GET', url: '/api/friend/verify/:friendId', handler: friendController.verifyFriendshipHandler },
  
  { method: 'GET', url: '/api/blocked/all', handler: blockController.getBlockedUsersHandler },
  
  { method: 'POST', url: '/api/blocked/:blockId', handler: blockController.blockUserHandler },
  { method: 'DELETE', url: '/api/blocked/:blockId', handler: blockController.unblockUserHandler },

];



export  {friendRoutes , userRoutes};
