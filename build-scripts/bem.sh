#!/bin/bash

node --version
npm --version
npm install --unsafe-perm
NODE_ENV=development npm run make
