FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate
RUN npx prisma db push --accept-data-loss

EXPOSE 8080

CMD ["node", "src/server.js"]
