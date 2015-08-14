'use strict';

var path = require('path');
var lib = path.join(__dirname, 'lib');
var build = require(path.join(lib, 'build'));

/**
 * federalist-ms installable hook
 * @module federalistMS
 */

/**
 * Installable hook
 * 
 * @param {Sails} sails - Sails app instance
 */
module.exports = function federalistMS(sails) {
	return {
		defaults: {},

		configure: function () {
			return;
		},

		initialize: function (done) {
			return done();
		},

		jekyll: build.jekyll,
		hugo: build.hugo,
		static: build.static
	}
};