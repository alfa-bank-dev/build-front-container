var fs = require('fs');
var archiver = require('archiver');
var path = require('path');
var shell = require('shelljs');
var Promise = require('bluebird');

module.exports.packDeps = function(outputDir) {
    return new Promise(function(resolve, reject) {
        console.log('Create tar archive with deps...');
        console.log(process.cwd());

        var output = fs.createWriteStream(path.join(outputDir, 'public-modules.tar.gz'));
        output.on('close', function() {
            console.log(Math.round(archive.pointer() / 1024 / 1024) + ' total MB');
            console.log('archiver has been finalized and the output file descriptor has closed.');
            resolve(true);
        });

        var archive = archiver.create('tar', {
            gzip: true,
            gzipOptions: {
                level: 1
            }
        });

        archive.pipe(output);
        archive.on('error', function(err) {
            reject(err);
        });

        var cwd = process.cwd();
        var deps = shell.exec('npm ls --prod --parseable').stdout
            .split('\n')
            .map(function(d) { return d.replace(cwd, ''); })
            .filter(function(d) { return !!d })
            .map(function(d) { return /\/node_modules\/([^/]*).*/.exec(d)[1]; })
            .reduce(function(acc, cur) {
                if (acc.indexOf(cur) === -1) {
                    acc.push(cur);
                }

                return acc;
            }, []);

        deps.forEach(function(dep) {
            console.log(dep);
            archive.directory('./node_modules/' + dep);
        });


        archive.finalize();
    });
};

module.exports.packApp = function(outputDir, _projectBuildDir) {
    var projectBuildDir = _projectBuildDir || 'dist';

    return new Promise(function(resolve, reject) {
        console.log('Create tar archive with app...');
        var output = fs.createWriteStream(path.join(outputDir, 'app.tar.gz'));
        output.on('close', function() {
            console.log(Math.round(archive.pointer() / 1024 / 1024) + ' total MB');
            console.log('archiver has been finalized and the output file descriptor has closed.');
            resolve();
        });

        var archive = archiver.create('tar', {
            gzip: true,
            gzipOptions: {
                level: 1
            }
        });

        archive.pipe(output);
        archive.on('error', function(err) {
            reject(err);
        });

        [projectBuildDir, 'config'].forEach(function(folder) {
            console.log(folder);
            archive.directory(folder);
        });

        ['package.json', 'CHANGELOG.md'].forEach(function(file) {
            console.log(file);
            if (fs.existsSync(file)) {
                archive.file(file);
            }
        });

        archive.finalize();
    });
};
