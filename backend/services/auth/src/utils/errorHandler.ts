
import { Prisma } from "@prisma/client";
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export function errorHandler( request: FastifyRequest, reply: FastifyReply ,  error: FastifyError,done:any) {
  
    if (error.validation) 
      {
    reply.status(400).send({ message: 'Validation failed', errors: error.validation, });
    } 
    else {
    reply.status(500).send({ message: 'Internal Server Error' });
    }
    done()
}




export type ApiResponse<T = any> = {
  success: boolean;
  message: string;
  data?: T | undefined;
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
