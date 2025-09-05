FROM --platform=linux/amd64 node:20-slim

RUN apt-get update && apt-get install -y openssl libssl-dev vim

WORKDIR /notify

COPY ./*.json .

RUN npm install

RUN npm install resend

RUN npm i --save-dev @types/amqplib

COPY ./src ./src

COPY ./prisma ./prisma

COPY ./.env .

RUN npx prisma generate

RUN npm run build

EXPOSE 4004

CMD ["npm" , "run" , "start"]