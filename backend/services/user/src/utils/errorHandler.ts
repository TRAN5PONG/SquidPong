
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export function errorHandler( error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  
    if (error.validation) {
    reply.status(400).send({ message: 'Validation failed', errors: error.validation, });
  } else {
    reply.status(500).send({ message: 'Internal Server Error' });
  }
}



export type ApiResponse<T = any> = {
  success: boolean;
  message: string;
  data?: T | any;
};



export function sendError(res: FastifyReply, error: unknown, statusCode = 400) 
{
  const message = error instanceof Error ? error.message : String(error);

  const response: ApiResponse<null> = {
    success: false,
    message,
    data: null,
  };

  return res.status(statusCode).send(response);
}
