
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export function errorHandler( error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  
    if (error.validation) {
    reply.status(400).send({ message: 'Validation failed', errors: error.validation, });
  } else {
    reply.status(500).send({ message: 'Internal Server Error' });
  }
}
