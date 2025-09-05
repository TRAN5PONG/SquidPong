
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




export function simpleErrorHandler(error: any, respond: any) {
  respond.success = false;

  if (error instanceof Prisma.PrismaClientKnownRequestError)
  {
    if (error.code === "P2002")
    {
      const fields = error.meta?.target as string[] || [];
      respond.message = `${fields.join(", ")} is already taken.`;
    }
    else
      respond.message = error.message;
  } 
  else if (error instanceof Error)
    respond.message = error.message;
  else
    respond.message = "An unexpected error occurred";

}
