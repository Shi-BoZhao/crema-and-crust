# Crema & Crust Diorama をどこでもホストするための最小イメージ。
#   docker build -t crema-diorama .
#   docker run -p 5199:5199 -e DIORAMA_TOKEN=合言葉 crema-diorama
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-fund --no-audit
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
EXPOSE 5199
CMD ["node", "server/standalone.mjs"]
