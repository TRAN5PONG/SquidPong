import { RouteHandlerMethod , FastifySchema } from 'fastify';
import * as notifyController from '../controllers/notifyController';
import { sendNotificationSchema } from '../validators/notifySchemas';


type Route = {
    method  : 'GET' | 'POST' | 'DELETE'; 
    url     : string;
    handler : RouteHandlerMethod;
    schema? : FastifySchema;
};

const notifyRoutes: Route[] = [
  { method: 'POST', url: '/api/notify/send', handler: notifyController.postSendNotificationHandler, schema: { body: sendNotificationSchema } },
  { method: 'GET', url: '/api/notify/history', handler: notifyController.getNotificationHistoryHandler },
  { method: 'DELETE', url: '/api/notify/:notifyId', handler: notifyController.deleteNotificationHandler },
];


export default notifyRoutes;
