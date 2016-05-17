var builder = require('../lib');
var build = builder.build;
var getBuildScriptPath = builder.getBuildScriptPath;
var createBuildEnv = builder.createBuildEnv;
var buildProject = builder.buildProject;
var expect = require('expect');
var fs = require('fs');
var shell = require('shelljs');
var path = require('path');

var packDeps = require('../lib/packers').packDeps;
var packApp = require('../lib/packers').packApp;

var OUTPUT_DIR = 'test/build';
var CWD = process.cwd();

var isDepsChanged = require('../lib/is-deps-changed');

describe('build front container', () => {

    afterEach(() => {
        shell.exec(`rm -rf ${OUTPUT_DIR}`);
        shell.exec('rm -rf test/output');
        shell.exec('rm -f ./build.sh');
    });

    it('should print help info', () => {
        var log = [];
        var consoleLogOriginal = console.log;
        console.log = function() {
            log.push([].slice.call(arguments));
        };

        build({
            help: true
        });

        console.log = consoleLogOriginal;

        expect(log[0][0].indexOf('Usage: build-front-container')).toNotBe(-1);
    });

    it('should check if container-name option is passed', () => {
        var catched = false;
        try {
            build({});
        } catch(e) {
            catched = true;
            expect(e.message).toBe('container-name must be specified');
        }

        expect(catched).toBe(true);
    });

    it('should check if docker-registry option is passed', () => {
        var catched = false;
        try {
            build({ 'container-name': 'hi-there' });
        } catch(e) {
            catched = true;
            expect(e.message).toBe('docker-registry must be specified');
        }

        expect(catched).toBe(true);
    });

    it('should create build env', () => {
        createBuildEnv(OUTPUT_DIR, './test/build-test.sh');

        expect(fs.existsSync(OUTPUT_DIR)).toBe(true);
        expect(fs.existsSync(`${OUTPUT_DIR}/Dockerfile`)).toBe(true);
        expect(fs.readFileSync('./build.sh')).toEqual(fs.readFileSync('./test/build-test.sh'));
    });

    it('should choose prepared build.sh script for BEM project', () => {
        var res = getBuildScriptPath(null, 'bem');
        expect(res).toBe(path.resolve(CWD, 'build-scripts/bem.sh'));
    });

    it('should choose prepared build.sh script for Webpack project', () => {
        var res = getBuildScriptPath(null, 'webpack');
        expect(res).toBe(path.resolve(CWD, 'build-scripts/webpack.sh'));
    });

    it('should choose build.sh script for Webpack project by default', () => {
        var res = getBuildScriptPath();
        expect(res).toBe(path.resolve(CWD, 'build-scripts/webpack.sh'));
    });

    it('should exec build.sh to build project if build-on-host was passed', () => {
        createBuildEnv(OUTPUT_DIR, './test/build-test.sh');
        buildProject(true);

        expect(fs.readFileSync(path.resolve(OUTPUT_DIR, 'log')).toString()).toBe('hi there\n');
    });

    it('should check if deps changed', function() {
        this.timeout(3000);
        createBuildEnv(OUTPUT_DIR);
        var prevNpmLs = '└── m1@0.0.1';

        fs.writeFileSync(path.resolve(OUTPUT_DIR, 'prev-npm-ls'), prevNpmLs);

        process.chdir('./test/project');
        expect(isDepsChanged('../build')).toBe(true);
        expect(isDepsChanged('../build')).toBe(false);
        process.chdir('../..');
    });

    it('should pack deps', (done) => {
        createBuildEnv(OUTPUT_DIR);
        process.chdir('./test/project');

        packDeps('../build').then(() => {
            var res = shell.exec('tar -ztvf ../build/public-modules.tar.gz');
            ['m1/package.json', 'm2/package.json'].forEach(file => {
                expect(res.stdout.indexOf(file)).toNotBe(-1);
            });

            process.chdir('../..');
            done();
        });

    });

    it('should pack app', (done) => {
        createBuildEnv(OUTPUT_DIR);
        process.chdir('./test/project');

        packApp('../build', 'my-project-build-dir').then(() => {
            var res = shell.exec('tar -ztvf ../build/app.tar.gz');
            ['my-project-build-dir/hi-there', 'package.json', 'config'].forEach(file => {
                expect(res.stdout.indexOf(file)).toNotBe(-1);
            });

            process.chdir('../..');
            done();
        });
    });
});
