FROM mhart/alpine-node

RUN apk update
RUN apk upgrade
RUN apk add bash curl wget

COPY ./apigee-cf-service-broker /apigee-cf-service-broker

EXPOSE 8888 8888

# note you need to override the following environment variables

ENV NODE_ENV=TEST
ENV SECURITY_USER_NAME=user
ENV SECURITY_USER_PASSWORD=password

WORKDIR /apigee-cf-service-broker
ENTRYPOINT ["node","/apigee-cf-service-broker/server.js"]