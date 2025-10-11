import { FastifyRequest, FastifyReply } from 'fastify';

function checkSecretToken(req: FastifyRequest) {
  const token = req.headers['x-secret-token'];
  if (token !== process.env.SECRET_TOKEN) {
    throw new Error('Unauthorized: Invalid secret token');
  }
}

export async function createUser(req: FastifyRequest, res: FastifyReply) {
  try {
    checkSecretToken(req);
    // ...logic to create user in chat service...
    return res.send({ success: true, message: 'User created in chat service.' });
  } catch (error) {
    return res.status(401).send({ success: false, message: error.message });
  }
}

export async function updateUser(req: FastifyRequest, res: FastifyReply) {
  try {
    checkSecretToken(req);
    // ...logic to update user in chat service...
    return res.send({ success: true, message: 'User updated in chat service.' });
  } catch (error) {
    return res.status(401).send({ success: false, message: error.message });
  }
}

export async function deleteUser(req: FastifyRequest, res: FastifyReply) {
  try {
    checkSecretToken(req);
    // ...logic to delete user in chat service...
    return res.send({ success: true, message: 'User deleted in chat service.' });
  } catch (error) {
    return res.status(401).send({ success: false, message: error.message });
  }
}
