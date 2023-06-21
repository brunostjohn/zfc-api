FROM node:16-alpine as builder

WORKDIR /app

COPY ["package.json","package-lock.json","./"]

RUN npm install

COPY ["./src","./src"]

COPY ["tsconfig.json","tsconfig.build.json","./"]

RUN npm run build

FROM node:16-alpine as final

WORKDIR /app

COPY --from=builder /app/dist /app/dist/

COPY --from=builder /app/package.json /app/

COPY --from=builder /app/yarn.lock /app/

RUN npm install --production

ENV PORT=5000

ENV NODE_ENV=production

CMD ["npm","run","start:prod"]
