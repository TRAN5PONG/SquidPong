
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

// Enhanced error handler with dynamic validation messages
const formatValidationError = (validationErrors: any[]) => {
  const errors = validationErrors.map((error: any) => {
    const field = error.instancePath ? error.instancePath.replace('/', '') : error.params?.missingProperty || 'unknown field';
    
    switch (error.keyword) {
      case 'required':
        return `Missing required field: '${error.params?.missingProperty}'`;
      case 'format':
        if (error.params?.format === 'email') {
          return `Field '${field}' must be a valid email address`;
        }
        return `Field '${field}' has invalid format: ${error.params?.format}`;
      case 'minLength':
        return `Field '${field}' must be at least ${error.params?.limit} characters long`;
      case 'maxLength':
        return `Field '${field}' must be no more than ${error.params?.limit} characters long`;
      case 'pattern':
        if (field === 'code' && error.params?.pattern === '^[0-9]{6}$') {
          return `Field '${field}' must be exactly 6 digits`;
        }
        if (field === 'username' && error.params?.pattern === '^[a-zA-Z0-9_]+$') {
          return `Field '${field}' can only contain letters, numbers, and underscores`;
        }
        return `Field '${field}' does not match the required pattern`;
      case 'additionalProperties':
        return `Unexpected field: '${error.params?.additionalProperty}' is not allowed`;
      case 'type':
        return `Field '${field}' must be of type ${error.params?.type}`;
      case 'minimum':
        return `Field '${field}' must be at least ${error.params?.limit}`;
      case 'maximum':
        return `Field '${field}' must be no more than ${error.params?.limit}`;
      default:
        return error.message || `Invalid value for field '${field}'`;
    }
  });
  
  return errors.join('; ');
};

export function errorHandler( error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  console.error('Error occurred:', error);

  // If it's a validation error
  if (error.validation) {
    const detailedMessage = formatValidationError(error.validation);
    return reply.status(400).send({
      success: false,
      message: `Validation failed: ${detailedMessage}`,
      errors: error.validation // Include raw validation errors for debugging
    });
  }

  // If it's a normal error with a message
  return reply.status(error.statusCode || 500).send({
    success: false,
    message: error.message || 'Internal Server Error'
  });
}

export type ApiResponse<T = any> = {
  success: boolean;
  message: string;
  data?: T | any;
};

export function sendError(res: FastifyReply, error: unknown, statusCode = 400) {
  const message = error instanceof Error ? error.message : String(error);

  const response: ApiResponse<null> = {
    success: false,
    message,
    data: null,
  };

  return res.status(statusCode).send(response);
}

export function checkSecretToken(req: FastifyRequest) {
  const secretToken = req.headers['x-secret-token'] as string;
  if (secretToken !== process.env.SECRET_TOKEN)
    throw new Error('Unauthorized: Invalid secret token');
}
