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
	initialize: function (cb) {
		return cb();
	},
		
	// buildEngine tasks for execution on Windows
	build: function (config) {
		return;
	},
		
	// Azure publishing tasks
	publish: function (config) {
		this.Azure.publish(config, function (err, result) {
			// sails.log.error(err);
			if (err) console.error(err);
				
			// sails.log.verbose(result);
			console.log(result);

			return;
		});
	}
};

module.exports = function federalistMS(sails) {
	_.extend(this, hook);
	return this;
};