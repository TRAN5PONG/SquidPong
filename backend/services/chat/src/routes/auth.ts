import { RouteHandlerMethod , FastifySchema } from 'fastify';
import { sayhello } from '../controllers/chat.controller';

type Route = {
    method  : 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH'; 
    url     : string;
    handler : RouteHandlerMethod;
    schema? : FastifySchema;
};



export const chatRoutes: Route[] = [
{
    method: 'GET',
    url: '/api/chat/chats',
    handler: sayhello,
    },
    
];