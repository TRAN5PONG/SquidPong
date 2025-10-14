import { RouteHandlerMethod , FastifySchema } from 'fastify';
import { getNotificationHistoryHandler, markNotificationAsReadHandler, deleteNotificationHandler, deleteAllNotificationsHandler } from '../controllers/notify.controller';
import { createUser, updateUser } from '../controllers/user.controller';

type Route = {
    method  : 'GET' | 'POST' | 'DELETE' | 'PATCH' | 'PUT'; 
    url     : string;
    handler : RouteHandlerMethod;
    schema? : FastifySchema;
};

const notifyRoutes: Route[] = [
  
  // User Management Routes (Internal)
  { method: 'POST', url: '/api/notify/user/create', handler: createUser, },
  { method: 'PUT', url: '/api/notify/user/update', handler: updateUser, },
  
  // Notification Routes
  { method: 'GET', url: '/api/notify/history', handler: getNotificationHistoryHandler },
  { method: 'PATCH', url: '/api/notify/read/:notifyId', handler: markNotificationAsReadHandler },
  { method: 'DELETE', url: '/api/notify/:notifyId', handler: deleteNotificationHandler },
  { method: 'DELETE', url: '/api/notify/all', handler: deleteAllNotificationsHandler },
];

export default notifyRoutes;
