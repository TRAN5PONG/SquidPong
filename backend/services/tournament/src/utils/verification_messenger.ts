import redis from "../integration/redisClient";
import nodemailer from 'nodemailer'
import html from './code'




let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'abdoqoubai@gmail.com',
    pass: 'zuhe fyst rlzr tjfc' ,
  },
});



function generateEmailHtml(code: string): string 
{
  return html.replace('{{code}}', code);
}



async function sendEmail(email: string, code: string) 
{

  const url = "https://xylar.app.n8n.cloud/webhook/send-message";

const data = {
      email: email,
      message: `this is code ${code}`
    };

const res = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-token": "MY_SECRET_TOKEN"
            },
            body: JSON.stringify(data)
            })
      

  return ;

}




async function generate6DigitCode(): Promise<string> 
{
  const value: string = Math.floor(100000 + Math.random() * 900000).toString();
  // console.log(`verify code : ${value}`)
  // return value;
  return '999999';
}



export async function sendEmailMessage(data:any)
{
  const code: string = await generate6DigitCode();
  await redis.set(`2fa:${data.email}`, code, "EX", "260");


  await sendEmail(data.email , code);
}









