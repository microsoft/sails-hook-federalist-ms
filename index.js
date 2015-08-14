/**
 * federalist-ms installable hook
 * @module federalistMS
 */

'use strict';

var path = require('path');
var lib = path.join(__dirname, 'lib');

var Azure = require(path.join(lib, 'Azure'));
var build = require(path.join(lib, 'build'));

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