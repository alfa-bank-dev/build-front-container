var fs = require('fs');
var archiver = require('archiver');
var path = require('path');

module.exports.packDeps = function(outputDir) {
    return new Promise((resolve, reject) => {
        console.log('Create tar archive with deps...');
        console.log(process.cwd());
        var pkg = require(path.join(process.cwd(), '/package.json'));

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


        Object.keys(pkg.dependencies).forEach(function(dep) {
            console.log(dep, pkg.dependencies[dep]);
            archive.directory('./node_modules/' + dep);
        });

        archive.finalize();
    });
};

module.exports.packApp = function(outputDir, _projectBuildDir) {
    var projectBuildDir = _projectBuildDir || 'dist';

    return new Promise((resolve, reject) => {
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
}
