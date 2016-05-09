# Build front container module


*Warning!* build project inside container works very slow with docker-machine on Mac.

This module implements the process of bulding container for front applications. You can read the details in build-and-deploy.md
in this repo.

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
