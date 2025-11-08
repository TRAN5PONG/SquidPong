import { RouteHandlerMethod , FastifySchema } from 'fastify';
import { markNotificationAsReadAllHandler , getNotificationHistoryHandler, markNotificationAsReadHandler, deleteNotificationHandler, deleteAllNotificationsHandler, deleteAccountHandler } from '../controllers/notify.controller';
import { createUser, updateUser } from '../controllers/user.controller';

type Route = {
    method  : 'GET' | 'POST' | 'DELETE' | 'PATCH' | 'PUT'; 
    url     : string;
    handler : RouteHandlerMethod;
    schema? : FastifySchema;
};

const notifyRoutes: Route[] = [
  
  // User Management Routes (Internal)
  { method: 'POST', url: '/api/notify/create', handler: createUser, },
  { method: 'PUT', url: '/api/notify/update', handler: updateUser, },
  { method: 'DELETE', url: '/api/notify/delete', handler: deleteAccountHandler },
  
  // Notification Routes
  { method: 'GET', url: '/api/notify/history', handler: getNotificationHistoryHandler },
  
  { method: 'PATCH', url: '/api/notify/read/:notifyId', handler: markNotificationAsReadHandler },
  { method: 'PATCH', url: '/api/notify/read-all', handler: markNotificationAsReadAllHandler },
  { method: 'DELETE', url: '/api/notify/:notifyId', handler: deleteNotificationHandler },
  { method: 'DELETE', url: '/api/notify/all', handler: deleteAllNotificationsHandler },
];

export default notifyRoutes;
