FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN chmod +x node_modules/.bin/prisma && npx prisma generate

EXPOSE 8080

CMD sh -c "npx prisma db push --accept-data-loss && node src/server.js"
