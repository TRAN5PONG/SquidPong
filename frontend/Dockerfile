FROM --platform=linux/amd64 node:20-slim

RUN apt-get update && apt-get install -y openssl libssl-dev vim

WORKDIR /frontend

COPY ./*.json .

RUN npm install

COPY ./src ./src

COPY ./vite.config.ts .

COPY ./index.html .

COPY ./public ./public

EXPOSE 8080

CMD ["npm" , "run" , "dev"]