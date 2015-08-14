var exec = require('child_process').exec;

var gulp = require('gulp');
var mocha = require('gulp-mocha');
var gutil = require('gulp-util');
var clean = require('gulp-clean');

gulp.task('test', function() {
	return gulp.src(['test/*.spec.js'], { read: false})
		.pipe(mocha({
			reporter: 'spec',
			globals: {
				should: require('should')
			}
		}))
		.once('end', function() {
			process.exit();
		})
		.on('error', gutil.log);
});

gulp.task('clean-docs', function() {
	return gulp.src('jsdocs', { read: false })
		.pipe(clean());
});

gulp.task('docs', ['clean-docs'], function(cb) {
	exec('jsdoc --configure ./.jsdoc.json --verbose', function (err, stdout, stderr) {
		console.log(stdout);
		console.log(stderr);
		cb(err);
	});
});

gulp.task('default', ['test', 'docs']);