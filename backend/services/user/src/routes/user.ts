import { RouteHandlerMethod , FastifySchema } from 'fastify';
import * as userController from '../controllers/user.controller';
import * as friendController from '../controllers/friend.controller';
import * as blockController from '../controllers/block.controller';
import { createProfileSchema , updateProfileSchema , deleteProfileSchema , getCurrentUserSchema  , getUserByIdSchema , getAllUserSchema} from '../validators/ProfileSchema';
// import { sendFriendRequestSchema, acceptFriendRequestSchema, rejectFriendRequestSchema, getFriendsListSchema, removeFriendSchema, getPendingRequestsSchema,blockUserSchema,unblockUserSchema,getBlockedUsersSchema } from '../validators/FriendSchema';




type Route = {
    method  : 'GET' | 'POST' | 'DELETE' | 'PATCH' | 'PUT';
    url     : string;
    handler : RouteHandlerMethod;
    schema? : FastifySchema;
};

const userRoutes: Route[] = [
  { method: 'POST', url: '/api/user/me', handler: userController.createProfileHandler },
  { method: 'PUT', url: '/api/user/me', handler: userController.updateProfileHandler },
  { method: 'DELETE', url: '/api/user/me', handler: userController.deleteProfileHandler },
  { method: 'GET', url: '/api/user/me', handler: userController.getCurrentUserHandler },
  { method: 'GET', url: '/api/user/:id', handler: userController.getUserByIdHandler },
  { method: 'GET', url: '/api/user/all', handler: userController.getAllUserHandler },

  { method: 'GET', url: '/api/user/search', handler: userController.searchUsersHandler },
];

const friendRoutes: Route[] = [
  { method: 'GET', url: '/api/friend/pending', handler: friendController.getPendingRequestsHandler },
  { method: 'GET', url: '/api/friend/all', handler: friendController.getFriendsListHandler },
  { method: 'POST', url: '/api/friend/request', handler: friendController.sendFriendRequestHandler },
  { method: 'POST', url: '/api/friend/accept', handler: friendController.acceptFriendRequestHandler },
  { method: 'POST', url: '/api/friend/reject', handler: friendController.rejectFriendRequestHandler },
  { method: 'DELETE', url: '/api/friend/:friendId', handler: friendController.removeFriendHandler },

  { method: 'GET', url: '/api/friend/verify', handler: friendController.verifyFriendshipHandler },


  { method: 'GET', url: '/api/friend/search', handler: friendController.searchFriendsByUsernameHandler },

  { method: 'POST', url: '/api/blocked/:blockId', handler: blockController.blockUserHandler },
  { method: 'DELETE', url: '/api/blocked/:blockId', handler: blockController.unblockUserHandler },

  { method: 'GET', url: '/api/blocked/search', handler: blockController.searchBlockedUsersByUsernameHandler },
];



export  {friendRoutes , userRoutes};
