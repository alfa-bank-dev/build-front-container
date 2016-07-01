# Build front container module

[![Build Status](https://travis-ci.org/alfa-bank-dev/build-front-container.svg?branch=master)](https://travis-ci.org/alfa-bank-dev/build-front-container)


*Warning!* build project inside container works very slow with docker-machine on Mac.

The main goal of this project is to uniform the process of building web applications. We heavily use Docker in our build process.
We can divide the build process into two stages:

 - create all the required artifacts. Mainly, they're some JS and CSS bundles, images, etc.
 - build Docker image using the artifacts from the previous step

We recommend creating artifacts in the specially prepared docker-container. Although, you can build you artifacts
on the host, but building project inside container has some benefits:

 - your project created in the suitable environment. So the versions of tools are correct - node.js, npm and friends.
 - sometimes it's not possible to get the right tools on the CI-server

The first stage requires build.sh script. You can use already prepared scripts(see ./build-scripts) or you can put
your own one. So this bash script will run inside docker container and in the end, we'll get some files.

Then we need to put these files into container. For this purpose, two archives create:

 - app.tar.gz - application files
 - public-modules.tar.gz - for npm-deps

And then just put them inside the image(see Dockerfile).


## Options

See output from

```bash
./node_modules/.bin/build-front-container --help
```

## How to use

Add command to your npm-scripts. E.g.:

```bash
$ grep scripts -A 1 package.json
  "scripts": {
    "build-front-container": "build-front-container",
```

By default all artifacts will be put into .build directory.
It's also possible to specify output directory. E.g.:

```bash
$ grep scripts -A 1 package.json
  "scripts": {
    "build-front-container": "build-front-container --output-dir .build-xxx",
```

You can specify what build script to use for building project. E.g.:

```bash
$ grep scripts -A 1 package.json
  "scripts": {
    "build-front-container": "build-front-container --build-script-path ./build.sh"
```

You can choose one of predefined build scripts. E.g.:

```bash
$ grep scripts -A 1 package.json
  "scripts": {
    "build-front-container": "build-front-container --project-type webpack"
```
