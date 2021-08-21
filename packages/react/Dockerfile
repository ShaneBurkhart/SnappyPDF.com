FROM node:15.14.0
MAINTAINER Shane Burkhart <shaneburkhart@gmail.com>

WORKDIR /app

RUN npm install react-scripts

ADD . /app/

RUN npm install 

CMD ["npm", "start"]
