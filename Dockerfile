FROM node:latest

WORKDIR /app

COPY package.json  ./

RUN npm install

COPY . .

EXPOSE 8765
EXPOSE 8766

CMD ["npm", "start"]
