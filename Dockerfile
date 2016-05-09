FROM node:4.2.2
WORKDIR /src

ADD public-modules.tar.gz /src/
ADD app.tar.gz /src/
