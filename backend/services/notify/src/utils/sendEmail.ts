import nodemailer from 'nodemailer';


console.log("EMAIL_USER: ", process.env.NOTIFY_EMAIL_USER);
console.log("EMAIL_PASS: ", process.env.NOTIFY_EMAIL_PASS);

const user = process.env.NOTIFY_EMAIL_USER;
const pass = process.env.NOTIFY_EMAIL_PASS;



const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {user, pass},
  });


  let mailOptions = {
    from: `'Squad Pong' <${user}>`,
    to: 'abdoqoubai@gmail.com',
    subject: 'Ping Pong Project Notification',
    text: 'Hello! This is a test email from your Node.js TypeScript app.',
  };


export async function sendEmail(code : string = '999999') 
{

  try 
  {
    mailOptions.text = `Your verification code is: ${code}`;
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
  } 
  catch (err) {
    console.error('Error sending email:', err);
  }

}

