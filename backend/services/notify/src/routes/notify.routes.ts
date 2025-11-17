import { RouteHandlerMethod , FastifySchema } from 'fastify';
import { markNotificationAsReadAllHandler , getNotificationHistoryHandler, markNotificationAsReadHandler, deleteNotificationHandler, deleteAllNotificationsHandler } from '../controllers/notify.controller';
import { createUser, updateUser , deleteAccountHandler } from '../controllers/user.controller';
import {
  getNotificationHistorySchema,
  markNotificationAsReadSchema,
  markNotificationAsReadAllSchema,
  deleteNotificationSchema,
  deleteAllNotificationsSchema,
  createUserNotifySchema,
  updateUserNotifySchema,
  deleteUserNotifySchema
} from '../schemas/notify.schemas';



type Route = {
    method  : 'GET' | 'POST' | 'DELETE' | 'PATCH' | 'PUT'; 
    url     : string;
    handler : RouteHandlerMethod;
    schema? : FastifySchema;
};


const notifyRoutes: Route[] = [
  
  { method: 'POST', url: '/api/notify/create', handler: createUser, schema: createUserNotifySchema },
  { method: 'PUT', url: '/api/notify/update', handler: updateUser, schema: updateUserNotifySchema },
  { method: 'DELETE', url: '/api/notify/delete', handler: deleteAccountHandler, schema: deleteUserNotifySchema },
  
  { method: 'GET', url: '/api/notify/history', handler: getNotificationHistoryHandler, schema: getNotificationHistorySchema },
  
  { method: 'PATCH', url: '/api/notify/read/:notifyId', handler: markNotificationAsReadHandler, schema: markNotificationAsReadSchema },
  { method: 'PATCH', url: '/api/notify/read-all', handler: markNotificationAsReadAllHandler, schema: markNotificationAsReadAllSchema },
  { method: 'DELETE', url: '/api/notify/:notifyId', handler: deleteNotificationHandler, schema: deleteNotificationSchema },
  { method: 'DELETE', url: '/api/notify/all', handler: deleteAllNotificationsHandler, schema: deleteAllNotificationsSchema },
];

export default notifyRoutes;
