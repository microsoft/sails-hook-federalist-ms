module.exports = function(config, done) {
	// Verify platform
	var isWindows = /^win/.test(process.platform);
	if (!isWindows) return done("Windows is not the current execution environment. Select an alternate build engine");
	
		
};