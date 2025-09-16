import prisma from '../db/database';
import { sendToService } from '../integration/api_calls';



export async function   createAccount(data:any): Promise<any>
{

    let password:string = data?.password ?? null;
    const user = await prisma.user.findUnique({where : {email : data.email}})
        
    const dataUser = {email : data.email , password , username : data.username }
    const Created = await prisma.user.upsert({ where: { email: data.email }, update: password ? {password} : {} , create: dataUser });
        
    if(!user)
    {
        delete data.id;
        const profile  = {...Created , ...data }
        await sendToService('http://user:4001/api/user/me' , 'POST'  , null , profile)
    }
        
    return Created;
}


