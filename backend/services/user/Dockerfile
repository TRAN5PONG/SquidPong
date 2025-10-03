FROM --platform=linux/amd64 node:20-slim

RUN apt-get update && apt-get install -y openssl libssl-dev vim

WORKDIR /user

COPY ./*.json .

RUN npm install

RUN npm install ioredis-json

RUN npm install @types/ioredis --save-dev

RUN npm i --save-dev @types/amqplib

COPY ./src ./src

COPY ./prisma ./prisma

RUN npx prisma generate

RUN npm run build

EXPOSE 4002

CMD ["npm" , "run" , "start"]