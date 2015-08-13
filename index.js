var Azure = ('./Azure');
var build = ('./build');

var hook = {
	
	// Default configs for Hook
	defaults: {

	},
		
	// Modify hook config based on user-overridden defaults
	configure: function () {
		return;
	},
		
	// Hook startup tasks
	initialize: function (done) {
		return done();
	},
		
	// Jekyll build task for execution on Windows
	jekyll: build.jekyll,
	
	// Hugo build task for execution on Windows
	hugo: build.hugo,
	
	// Static build task for execution on Windows
	static: build.static,
	
	/*
   * Publish a built site by copying it to its publish directory
   * or uploading it to an Azure Web App.
   *
   * @param {Object} tokens from the _run command
   * @param {Build} build model to parse
   * @param {Function} callback function
   */
	publish: function (tokens, model, done) {
		if (sails.config.build.azure) {
			var syncConfig = {
				prefix: tokens.root + '/' +
				tokens.owner + '/' +
				tokens.repository +
				tokens.branchURL,
				directory: tokens.destination
			};

      sails.log.verbose('Publishing job: ', model.id,
        ' => ', sails.config.build.azure);
      Azure.publish(syncConfig, function (err, result) {
        done(err, model);
      });
		} else {
			var cmd = _.template([
				'RMDIR ${publish} /S /Q',
				'MKDIR ${publish}',
				'XCOPY ${destination} ${publish} /E /I'
			].join(' & '));

			sails.log.verbose('Publishing job: ', model.id,
        ' => ', tokens.publish);
      exec(cmd(tokens), function (err, stdout, stderr) {
        if (stdout) sails.log.verbose('stdout: ' + stdout);
        if (stderr) sails.log.verbose('stderr: ' + stderr);
        done(err, model);
      });
		}

	},

};

module.exports = function federalistMS(sails) {
	return hook;
};