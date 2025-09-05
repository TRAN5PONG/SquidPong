import { RouteHandlerMethod , FastifySchema } from 'fastify';
import * as notifyController from '../controllers/notify.controller';
import { sendNotificationSchema } from '../validators/notifySchemas';


type Route = {
    method  : 'GET' | 'POST' | 'DELETE' | 'PATCH'; 
    url     : string;
    handler : RouteHandlerMethod;
    schema? : FastifySchema;
};


const notifyRoutes: Route[] = [
  { method: 'POST', url: '/api/notify/send', handler: notifyController.postSendNotificationHandler },
  { method: 'GET', url: '/api/notify/history', handler: notifyController.getNotificationHistoryHandler },
  { method: 'DELETE', url: '/api/notify/:notifyId', handler: notifyController.deleteNotificationHandler },
  { method: 'PATCH', url: '/api/notify/:notifyId', handler: notifyController.updateNotificationHandler },
];

export default notifyRoutes;
