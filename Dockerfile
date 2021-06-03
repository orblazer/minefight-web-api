ARG NODE_ENV=production

#############################
# Base image
#############################
FROM node:14-alpine as base
ENV NODE_ENV $NODE_ENV

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package.json .
COPY yarn.lock .
RUN yarn install

# Copy app source code
COPY . .

#############################
# Builder image
#############################
FROM base as builder
# Build app
RUN yarn build

# #############################
# # Production image
# #############################
FROM node:14-alpine as production

# Install app dependencies
COPY package*.json .
COPY yarn.lock .
RUN yarn install --production

# Copy bundled app
COPY --from=builder /app/dist .

# Copy config files
COPY discord-config.json .
COPY server-template.yml .

# Start app
EXPOSE 3000
CMD [ "node", "index.js" ]
