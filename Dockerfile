FROM node:16.15

WORKDIR /app_drop

COPY package*.json ./

RUN npm install

COPY . .
EXPOSE 3002

CMD [ "npm", "run", "start" ]
