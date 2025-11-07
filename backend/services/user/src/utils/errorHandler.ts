
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

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) 
{
  if (reply.sent) return


  const closeRequestStream = () => {
    try {
      if (request.raw?.readableEnded === false) {
        request.raw.resume() // drain remaining bytes
      }
    } catch (err) {
      console.warn('Failed to drain request stream:', err)
    }
  }

  // 🧩 Handle multipart/file upload errors
  if (error.code === 'FST_FILES_LIMIT' || error.message?.includes('reach files limit')) 
    {
    closeRequestStream()
    return reply.status(400).send({
      success: false,
      message: 'Too many files uploaded. Only 1 file is allowed per request.'
    })
  }

  if (error.code === 'FST_REQ_FILE_TOO_LARGE' || error.message?.includes('File size limit')) 
    {
    closeRequestStream()
    return reply.status(413).send({
      success: false,
      message: 'File size too large. Maximum file size is 5MB.'
    })
  }

  if (error.code === 'FST_PARTS_LIMIT' || error.message?.includes('reach parts limit')) 
  {
    closeRequestStream()
    return reply.status(400).send({
      success: false,
      message: 'Too many parts in the request. Please reduce the number of fields.'
    })
  }

  if (error.code?.startsWith('FST_') || error.name === 'FastifyError') 
    {
    closeRequestStream()
    return reply.status(error.statusCode || 400).send({
      success: false,
      message: error.message || 'Bad request'
    })
  }

  if ((error as any).validation) 
  {
    const detailedMessage = formatValidationError((error as any).validation)
    return reply.status(400).send({
      success: false,
      message: `Validation failed: ${detailedMessage}`,
      errors: (error as any).validation
    })
  }

  return reply.status(error.statusCode || 500).send({
    success: false,
    message: error.message || 'Internal Server Error'
  })
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
