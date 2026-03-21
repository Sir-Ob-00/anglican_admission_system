# Dockerfile to build the express backend
FROM node:18-alpine

# Create app directory
WORKDIR /anglican_admission_system_backend

# copy package.json and package-lock.json to the working directory
COPY package*.json ./

# install dependencies
RUN npm install

# copy the rest of the application code to the working directory
COPY . .

# expose the port the app runs on
EXPOSE 3000

# start the application
CMD ["npm", "start"]