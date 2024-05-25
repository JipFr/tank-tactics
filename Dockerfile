FROM node:20.10.0 AS base
RUN apt install libfontconfig1 fontconfig libfontconfig1-dev

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
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
CMD ["yarn", "start"]
