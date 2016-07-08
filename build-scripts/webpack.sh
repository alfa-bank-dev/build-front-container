#!/bin/bash

rm -rf ./dist

npm i --unsafe-perm

NODE_ENV=production ./node_modules/.bin/webpack
NODE_ENV=production ./node_modules/.bin/webpack --config webpack.backend.config.js
