import { FastifyRequest , FastifyInstance } from "fastify";
import redis from "../integration/redisClient";



// Function to extract userId from request cookies and verify JWT
export async function getUserIdFromRequest(req: FastifyRequest, app: FastifyInstance): Promise<string> 
{
    const cookie = req.headers.cookie;
    if (!cookie) throw new Error("Not allowed");

    const token = cookie.split('=')[1];
    if (!token) throw new Error("Missing access token");

    const tokenExists = await redis.get(token);
    if (!tokenExists) throw new Error("Token expired or invalid");

    
    const payload: any = await app.jwt.verify(token);
    if (!payload || !payload.userId) throw new Error("Invalid token payload");

    return payload.userId as string;
}
