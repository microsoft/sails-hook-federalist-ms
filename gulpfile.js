/*global process,__dirname*/

var exec = require('child_process').exec;

var gulp = require('gulp');
var mocha = require('gulp-mocha');
var gutil = require('gulp-util');
var rimraf = require('rimraf');
var ghPages = require('gulp-gh-pages');
var p = require('./package.json');
var ghPublishUser = process.env.GITHUB_PUBLISH_USER || '';
var ghPublishToken = process.env.GITHUB_PUBLISH_TOKEN || '';

gulp.doneCallback = function onDone(err) {
  process.exit(err ? 1 : 0);
};

gulp.task('test', function onTask() {
  return gulp.src(['test/*.spec.js'], { read: false })
    .pipe(mocha({
      reporter: 'spec',
      globals: {
        should: require('should')
      }
    }))
    .on('error', gutil.log);
});

gulp.task('clean-docs', ['test'], function onCleanDocs(cb) {
  rimraf('./jsdocs', cb);
});

gulp.task('docs', ['clean-docs'], function onTask(cb) {
  exec('jsdoc --configure ./.jsdoc.json --verbose', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});

gulp.task('publish-docs', ['docs'], function onTask() {
  return gulp.src('./jsdocs/sails-hook-federalist-ms/' + p.version + '/**/*')
    .pipe(ghPages({
      remoteUrl: 'https://' + ghPublishUser + ':' + ghPublishToken + '@github.com/Microsoft/sails-hook-federalist-ms'
    }));
});

gulp.task('default', ['publish-docs', 'docs', 'clean-docs', 'test']);