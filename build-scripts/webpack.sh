rm -rf ./dist

node --version
npm --version

npm i --unsafe-perm
APP_DEBUG=1 NODE_TARGET=standalone NODE_ENV=production npm run build
APP_DEBUG=1 NODE_TARGET=standalone NODE_ENV=production npm run build-server
