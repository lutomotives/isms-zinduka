FROM --platform=linux/arm64 node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

FROM --platform=linux/arm64 node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV SQLITE_PATH=/data/isms.sqlite

RUN addgroup -S nodegrp && adduser -S nodeuser -G nodegrp

COPY --from=deps /app/node_modules ./node_modules
COPY src ./src

RUN mkdir -p /data && chown -R nodeuser:nodegrp /data
USER nodeuser

EXPOSE 3000
CMD ["node", "src/server.js"]
