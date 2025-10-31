import { FastifyRequest, FastifyReply } from 'fastify';


// get method controllers
async function postSendNotificationHandler(req:FastifyRequest , res:FastifyReply)
{
    return res.send(req.body)
}



// post method controllers
async function getNotificationHistoryHandler(req:FastifyRequest , res:FastifyReply)
{
    return res.send(req.body)
}


async function deleteNotificationHandler(req:FastifyRequest , res:FastifyReply)
{
    return res.send(req.body)
}




export {deleteNotificationHandler , postSendNotificationHandler , getNotificationHistoryHandler}