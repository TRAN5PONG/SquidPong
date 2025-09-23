import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../db/database';
import { ApiResponse  , sendError , verifyFriendship  } from '../utils/helper';
import { Message } from '../utils/types';
import { PollMessages } from '../utils/RespondMessage';

import {checkUserAndFetchGroup} from '../utils/group.check';


// Create a new poll in a group
export async function createPoll(req: FastifyRequest, res: FastifyReply)
{}

