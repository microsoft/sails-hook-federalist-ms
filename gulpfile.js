/*global process,__dirname*/

var exec = require('child_process').exec;

var gulp = require('gulp');
var mocha = require('gulp-mocha');
var gutil = require('gulp-util');
var clean = require('gulp-clean');
var ghPages = require('gulp-gh-pages');

gulp.task('test', function onTask() {
  gulp.src(['test/*.spec.js'], { read: false })
    .pipe(mocha({
      reporter: 'spec',
      globals: {
        should: require('should')
      }
    }))
    .once('end', function onEnd() {
      process.exit();
    })
    .on('error', gutil.log);
});

gulp.task('docs', function onTask(cb) {
  exec('jsdoc --configure ./.jsdoc.json --verbose', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});

gulp.task('publish-docs', ['docs'], function onTask() {
  return gulp.src('./jsdocs/sails-hook-federalist-ms/1.0.0/**/*')
    .pipe(ghPages());
});

gulp.task('default', ['test', 'docs', 'publish-docs']);