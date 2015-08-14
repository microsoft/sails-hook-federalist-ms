var exec = require('child_process').exec;

module.exports = {
	
	/*
   * Takes a command template and a model, tokenizes the model,
   * runs the command, and calls the callback.
   *
   * The following tokens are availble: owner, repository, branch,
   * token (GitHub access token), source (temporary build directory),
   * destination (final destination for build site).
   *
   * The source directory should be deleted after build completes.
   *
   * @param {Array} array of string templates, each item is a command
   * @param {Build} build model to parse
   * @param {Function} callback function
   */
	_run: function (cmd, model, done) {
    var service = this,
			defaultBranch = model.branch === model.site.defaultBranch,
			tokens = {
				branch: model.branch,
				branchURL: defaultBranch ? '' : '/' + model.branch,
				root: defaultBranch ? 'site' : 'preview',
				config: model.site.config
			},
			// Temporary until workaround for single line IF EXIST logic is implemented
			template = _.template(cmd.join(' & '));

    // Populate user's passport
    Passport.findOne({ user: model.user.id }).exec(function (err, passport) {

      // End early if error
      if (err) return done(err, model);

      model.user.passport = passport;

      // Continue run process with populated model
      next(model);

    });

    function next(model) {

      // Set populated token values
      tokens.repository = model.site.repository;
      tokens.owner = model.site.owner;
      tokens.token = (model.user.passport) ?
        model.user.passport.tokens.accessToken : '';
      tokens.baseurl = (model.site.domain && defaultBranch) ? "''" :
        '/' + tokens.root + '/' + tokens.owner +
        '/' + tokens.repository + tokens.branchURL;

      // Set up source and destination paths
      tokens.source = sails.config.build.tempDir + '/source/' +
			tokens.owner + '/' + tokens.repository + '/' + tokens.branch;
      tokens.destination = sails.config.build.tempDir + '/destination/' +
			tokens.owner + '/' + tokens.repository + '/' + tokens.branch;
      tokens.publish = sails.config.build.publishDir + '/' + tokens.root + '/' +
			tokens.owner + '/' + tokens.repository + tokens.branchURL;

      // Remove leading slash and normalize path for Windows
			tokens.source = path.normalize(tokens.source.replace(/^\//, ''));
			tokens.destination = path.normalize(tokens.destination.replace(/^\//, ''));
			tokens.publish = path.normalize(tokens.publish.replace(/^\//, ''));
      
      // Run command in child process and
      // call callback with error and model
      exec(template(tokens), function (err, stdout, stderr) {
        if (stdout) sails.log.verbose('stdout: ' + stdout);
        if (stderr) sails.log.verbose('stderr: ' + stderr);
        if (err) return done(err, model);
        service.publish(tokens, model, done);
      });

    }

  },
  
  // Jekyll build task for execution on Windows
	jekyll: function (model, done) {
		this._run([
			'RMDIR ${source} /S /Q',
			'MKDIR ${source}',
			'git clone -b ${branch} --single-branch ' +
			'https://${token}@github.com/${owner}/${repository}.git ${source}',
			'echo baseurl: /${root}/${owner}/${repository}/${branch} > ' +
			'${source}\\_config_base.yml',
			'jekyll build --safe --config ${source}\\_config.yml,${source}\\_config_base.yml ' +
			'--source ${source} --destination ${source}\\_site',
			'RMDIR ${destination} /S /Q',
			'MKDIR ${destination}',
			'XCOPY ${source}\\_site ${destination} /E /I',
			'RMDIR ${source} /S /Q',
		], model, done);
	},
	
	// Hugo build task for execution on Windows
	hugo: function (model, done) {
		this._run([
			'RMDIR ${source} /S /Q',
			'MKDIR ${source}',
			'git clone -b ${branch} --single-branch ' +
			'https://${token}@github.com/${owner}/${repository}.git ${source}',
			'hugo --baseUrl=/${root}/${owner}/${repository}/${branch} ' +
			'--source=${source}',
			'RMDIR ${destination} /S /Q',
			'MKDIR ${destination}',
			'XCOPY ${source}\\public ${destination} /E /I',
			'RMDIR ${source} /S /Q',
		], model, done);
	},
	
	// Static build task for execution on Windows
	static: function (model, done) {
		this._run([
			'RMDIR ${source} /S /Q',
			'MKDIR ${source}',
			'git clone -b ${branch} --single-branch https://${token}@github.com/${owner}/${repository}.git ${source}',
			'RMDIR ${destination} /S /Q',
			'XCOPY ${source} ${destination} /E /I',
			'RMDIR ${source} /S /Q'
		], model, done);
	},
	
	publish: function(tokens, model, done) {
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
	}
}