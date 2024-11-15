FROM node:22.11.0 AS base
RUN apt update && apt install -y \
  libfontconfig1 \
  fontconfig \
  libfontconfig1-dev \
  python3 \
  g++ \
  make \
  cmake \
  pkg-config \
  && rm -rf /var/lib/apt/lists/*

FROM base AS install-stage
WORKDIR /app
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
RUN yarn install --immutable

FROM base AS build-stage
WORKDIR /app
COPY --from=install-stage /app/node_modules ./node_modules
COPY . .
RUN yarn prisma generate
RUN yarn build

FROM base AS production-stage
WORKDIR /app
COPY --from=build-stage /app/dist ./dist
COPY --from=build-stage /app/node_modules ./node_modules
COPY --from=build-stage /app/prisma ./prisma
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
CMD ["yarn", "start"]
