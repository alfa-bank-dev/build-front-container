var fs = require('fs');
var shell = require('shelljs');
var path = require('path');
var CWD = process.cwd();
var path = require('path');

var DEFAULT_OUTPUT_DIR = '.build';

var isDepsChanged = require('./is-deps-changed');
var packDeps = require('./packers').packDeps;
var packApp = require('./packers').packApp;

module.exports.build = function(args) {
    if (args.help) {
        printHelp();
        return;
    }

    checkArgs(args);

    var OUTPUT_DIR = path.resolve(CWD, args['output-dir'] ? args['output-dir'] : DEFAULT_OUTPUT_DIR);
    createBuildEnv(OUTPUT_DIR, args['build-script-path'], args['project-type']);
    buildProject(!!args['build-on-host'], args['docker-registry']);

    var packing = [];
    if (isDepsChanged(OUTPUT_DIR)) {
        packing.push(packDeps(OUTPUT_DIR));
    }

    packing.push(packApp(OUTPUT_DIR, args['project-build-dir']));
    Promise.all(packing).then(() => {
        buildContainer(OUTPUT_DIR, args);
    }).catch(err => { console.log(err); });
};

module.exports.getBuildScriptPath = getBuildScriptPath;
module.exports.createBuildEnv = createBuildEnv;
module.exports.buildProject = buildProject;

function createBuildEnv(outputDir, buildScriptPath, projectType) {
    if(!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    var dockerFile = path.join(outputDir, 'Dockerfile');
    if (!fs.existsSync(dockerFile)) {
        shell.exec(`cp ${path.join(__dirname, '..', 'Dockerfile')} ${dockerFile}`);
    }

    var buildScriptDest = path.join(CWD, 'build.sh');
    if (!fs.existsSync(buildScriptDest)) {
        shell.exec(`cp ${getBuildScriptPath(buildScriptPath, projectType)} ${buildScriptDest}`);
    }
}

function getBuildScriptPath(buildScriptPath, projectType) {
    if (buildScriptPath) {
        return path.join(CWD, buildScriptPath);
    } else {
        var scriptFileName = `${projectType ? projectType : 'webpack'}.sh`;
        return path.join(__dirname, '..', 'build-scripts', scriptFileName);
    }
}

function buildContainer(OUTPUT_DIR, args) {
    var version = args['app-version'] || 'latest';

    shell.exec(`cd ${OUTPUT_DIR}`);
    shell.exec(`docker build -t docker.moscow.alfaintra.net/${args['container-name']}:${version} .`);
    shell.exec(`docker push docker.moscow.alfaintra.net/${args['container-name']}:${version}`);
}

function checkArgs(args) {
    if (!args['container-name']) {
        throw new Error('container-name must be specified');
    }

    if (!args['docker-registry']) {
        throw new Error('docker-registry must be specified');
    }
}

function printHelp() {
    var options = {
        help: '\tOutput usage information',
        'output-dir': `\tYou can specify the path in your project where to put build process artifacts. "${DEFAULT_OUTPUT_DIR}" by default`,
        'build-script-path': 'You can specify your own build.sh script',
        'project-type': 'Could be "bem" or "webpack"(by default) - if defined than one of predefined scripts would be picked up.',
        'build-on-host': 'Do not use docker-container to build the project. It works with npm@2',
        'app-version': '\tversion of application',
        'container-name': 'name of the container. *Required*.',
        'project-build-dir': 'the directory that contains building artifacts. "dist" by default',
        'docker-registry': 'docker registry host. *Required*.',
    };

    console.log(
        '\nUsage: build-front-container [options]\n\n' +
        'A tool to build front containers\n\n' +
        'Options:\n\n' +
        Object.keys(options)
            .map(function (key) {
                return '  --' + key + '\t' + options[key] + '\n';
            })
            .join('')
    );
}

function buildProject(buildOnHost, dockerRegistry) {
    if (buildOnHost) {
        shell.exec('./build.sh');
        return;
    }

    var NAME='docker-front-build'
    shell.exec(`docker rm -f ${NAME} || true`);
    shell.exec(`docker pull ${dockerRegistry}/${NAME}:latest`);
    shell.exec(`docker run -d -v $(pwd):/app-source --name=${NAME} --net=host ${dockerRegistry}/${NAME}:latest`);
    shell.exec(`docker wait ${NAME}`);
    shell.exec(`docker logs ${NAME}`);
}
