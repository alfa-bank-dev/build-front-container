var fs = require('fs');
var shell = require('shelljs');
var path = require('path');
var CWD = process.cwd();
var path = require('path');

var DEFAULT_OUTPUT_DIR = '.build';
var DEFAULT_BUILD_CONTAINER_VERSION = 'latest';

var isDepsChanged = require('./is-deps-changed');
var packDeps = require('./packers').packDeps;
var packApp = require('./packers').packApp;
var Promise = require('bluebird');

var removeBuildScript = false;
var BUILD_SCRIPT_NAME = 'build.sh';

module.exports.build = function(args) {
    if (args.help) {
        printHelp();
        return;
    }

    checkArgs(args);

    var OUTPUT_DIR = path.resolve(CWD, args['output-dir'] ? args['output-dir'] : DEFAULT_OUTPUT_DIR);
    createBuildEnv(OUTPUT_DIR, args['build-script-path'], args['project-type']);

    buildProject(
        !!args['build-on-host'],
        args['docker-registry'],
        args['docker-build-front-container-version']
    );

    var packing = [];
    if (isDepsChanged(OUTPUT_DIR)) {
        packing.push(packDeps(OUTPUT_DIR));
    }

    packing.push(packApp(OUTPUT_DIR, args['project-build-dir']));
    Promise.all(packing).then(function() {
        buildContainer(OUTPUT_DIR, args);
        cleanUp();
    }).catch(function(err) {
        console.log(err);
        cleanUp();
    });
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
        shell.exec('cp ' + path.join(__dirname, '..', 'Dockerfile') + ' ' + dockerFile);
    }

    var buildScriptDest = path.join(CWD, BUILD_SCRIPT_NAME);
    if (!fs.existsSync(buildScriptDest)) {
        shell.exec('cp ' + getBuildScriptPath(buildScriptPath, projectType) + ' ' + buildScriptDest);
        removeBuildScript = true;
    }
}

function getBuildScriptPath(buildScriptPath, projectType) {
    if (buildScriptPath) {
        return path.join(CWD, buildScriptPath);
    } else {
        var scriptFileName = (projectType ? projectType : 'webpack') + '.sh';
        return path.join(__dirname, '..', 'build-scripts', scriptFileName);
    }
}

function buildContainer(outputDir, args) {
    var version = args['app-version'] || 'latest';

    var buildCommand = 'cd ' + outputDir + ' && docker build -t ' + args['docker-registry'] + '/' + args['container-name'] + ':' + version + ' .';
    console.log('===== Build docker: ' + args['container-name'] + ' =====');
    console.log(buildCommand);
    shell.exec(buildCommand);

    var pushCommand = 'cd ' + outputDir + ' && docker push ' + args['docker-registry'] + '/' + args['container-name'] + ':' + version ;
    console.log('===== Push docker: ' + args['container-name'] + ' =====');
    console.log(pushCommand);
    shell.exec(pushCommand);
}

function checkArgs(args) {
    if (!args['container-name']) {
        throw new Error('container-name must be specified');
    }

    if (!args['docker-registry']) {
        throw new Error('docker-registry must be specified');
    }

    Object.keys(args).filter(function(k) { return k !== '_'; }).forEach(function(k) {
        if (typeof args[k] !== 'string' && typeof args[k] !== 'boolean') {
            throw new Error('option ' + k + ' is not correct. Maybe it is duplicated');
        }
    });
}

function printHelp() {
    var options = {
        help: '\tOutput usage information',
        'docker-registry': 'docker registry host. *Required*.',
        'docker-build-front-container-version': 'version of docker-front-build container. "' + DEFAULT_BUILD_CONTAINER_VERSION + '" by default',
        'output-dir': '\tYou can specify the path in your project where to put build process artifacts. ' + DEFAULT_OUTPUT_DIR + ' by default',
        'build-script-path': 'You can specify your own ' + BUILD_SCRIPT_NAME + ' script',
        'project-type': 'Could be "bem" or "webpack"(by default) - if defined than one of predefined scripts would be picked up.',
        'build-on-host': 'Do not use docker-container to build the project.',
        'app-version': '\tversion of application',
        'project-build-dir': 'the directory that contains building artifacts. "dist" by default',
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

function buildProject(buildOnHost, dockerRegistry, buildContainerVersion) {
    if (buildOnHost) {
        shell.exec('./' + BUILD_SCRIPT_NAME);
        return;
    }

    var NAME='docker-front-build';
    var containerName = NAME + '-' + Date.now();
    var buildContainerVersion = buildContainerVersion || DEFAULT_BUILD_CONTAINER_VERSION;

    var pullCommand = 'docker pull ' + dockerRegistry + '/' + NAME + ':' + buildContainerVersion;
    console.log('===== Pull docker: ' + NAME + ' =====');
    console.log(pullCommand);
    shell.exec(pullCommand);

    var runCommand = 'docker run -d -v $(pwd):/app-source --name=' +
        containerName + ' --net=host ' + dockerRegistry + '/' + NAME + ':' + buildContainerVersion;
    console.log('===== Run docker: ' + NAME + ' =====');
    console.log(runCommand);
    shell.exec(runCommand);


    var waitCommand = 'docker wait ' + containerName;
    console.log('===== Wait docker: ' + NAME + ' =====');
    console.log(waitCommand);
    shell.exec(waitCommand);

    var logsCommand = 'docker logs ' + containerName;
    console.log('===== Logs docker ' + NAME + ' =====');
    console.log(logsCommand);
    shell.exec(logsCommand);

    var rmCommand = 'docker rm -f ' + containerName + ' || true';
    console.log('===== rm -f docker: ' + NAME + ' =====');
    console.log(rmCommand);
    shell.exec(rmCommand);
}


function cleanUp() {
    if (removeBuildScript) {
        shell.exec('rm -f ' + path.join(CWD, BUILD_SCRIPT_NAME));
    }
}
