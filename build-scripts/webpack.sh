#!/bin/bash

rm -rf ./dist

npm i --unsafe-perm

APP_DEBUG=1 NODE_TARGET=standalone NODE_ENV=production ./node_modules/.bin/webpack
APP_DEBUG=1 NODE_TARGET=standalone NODE_ENV=production /node_modules/.bin/webpack --config webpack.backend.config.js
