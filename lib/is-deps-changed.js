var shell = require('shelljs');
var path = require('path');
var fs = require('fs');

module.exports = function(outputDir) {
    var currentNpmLsFile = path.join(outputDir, 'current-npm-ls');
    var prevNpmLsFile = path.join(outputDir, 'prev-npm-ls');

    var npmDiff;
    var npmLs = shell.exec(`npm ls | tail -n +2 > ${currentNpmLsFile}`);

    if (fs.existsSync(prevNpmLsFile)) {
        npmDiff = shell.exec(`diff ${currentNpmLsFile} ${prevNpmLsFile}`).output;
    } else {
        npmDiff = true;
    }

    shell.exec(`mv ${currentNpmLsFile} ${prevNpmLsFile}`);

    return !!npmDiff;
};
