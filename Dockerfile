FROM node:10.13.0-alpine
# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# fix npm private module
COPY package*.json /usr/src/app/
COPY . /usr/src/app

# Install app dependencies
RUN npm install
RUN npm install gulp -g

# Bundle app source
RUN npm run prepare
EXPOSE 3333
CMD [ "npm", "run", "start" ]

