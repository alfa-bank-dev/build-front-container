#!/bin/bash

node --version
npm --version
npm install --unsafe-perm --production
NODE_ENV=development npm run build
