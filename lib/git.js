/* global __dirname */

'use strict';

var exec = require('child_process').exec;
var path = require('path');
var _ = require('lodash');
var rimraf = require('rimraf');


/**
 * @module git
 */
module.exports = {
  
  /** Local directory */
  dir,
  
	/**
	 * Run Git command
   * 
   * @param {string} cmd - Command
   * @param {Object} opts - exec options
   * @param {Function([Error])} cb - callback function
	 */
	_run: function (cmd, opts, cb) {
    
		if (arguments.length === 2) {
			if (Object.prototype.toString.call(opts) === "[object Function]") {
				cb = opts;
				opts = null;
			}
		}

		exec(cmd, opts, function onClone(err, stdout, stderr) {
			if (err) {
				return cb(err);
			}
			if (stdout) {
				sails.log.verbose(cmd + ' stdout: ' + stdout);
			}
			if (stderr) {
				sails.log.verbose(cmd + ' stderr: ' + stderr);
			}
			cb();
		});
	},

	/**
	 * Purge existing directory
   */
	clean: function (cb) {
    var self = this;
    
		rimraf(self.dir, function onClear(err) {
			if (err) {
				return cb(err);
			}
			sails.log.verbose(self.dir + ' purged');
			cb();
		});
	},
	
	/**
	 * Clone Git repository
	 * 
	 * @param {string} remoteUrl - Git remote URL
	 * @param {string} dir - Local directory path to clone to
	 * @param {Function([Error])} cb - callback function
	 */
	clone: function (remoteUrl, dir, cb) {

		var cmd = _.template('git.exe clone ${remoteUrl} ${dir} 2>&1');
		cmd = cmd({ remoteUrl: remoteUrl, dir: dir });
		this._run(cmd, function onClone(err) {
			if (err) {
				return cb(err);
			}
			cb();
		});

	},

	/**
	 * 
	 */
	copy: function (src, destination, cb) {
		var cmd = _.template('XCOPY.EXE ${src} ${destination} /E /I /Y');
		cmd = cmd({ src: src, destination: destination });
		this._run(cmd, function onCopy(err) {
			if (err) {
				return cb(err);
			}
			cb();
		});
	},
	
	/**
	 * 
	 */
	addFiles: function (cb) {

		var cmd = 'git.exe add -A'
		var cwd = path.join(__dirname, path.basename(this.dir));
		this._run(cmd, { cwd: cwd }, function onAddFiles(err) {
			if (err) {
				return cb(err);
			}
			cb();
		});

	},
	
	/**
	 * 
	 */
	commitFiles: function (msg, cb) {

		var cmd = _.template('git.exe commit -m "${msg}"');
		var cwd = path.join(__dirname, path.basename(this.dir));
		cmd = cmd({ msg: msg });
		this._run(cmd, { cwd: cwd }, function onCommitFiles(err) {
			if (err) {
				return cb(err);
			}
			cb();
		});

	},
	
	/**
	 * 
	 */
	push: function (cb) {

		var cmd = 'git.exe push origin master --force'
		var cwd = path.join(__dirname, path.basename(this.dir));
		this._run(cmd, { cwd: cwd }, function onPush(err) {
			if (err) {
				return cb(err);
			}
			cb();
		});

	}

};