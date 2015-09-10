/* global sails,process */

var exec = require('child_process').exec;
var path = require('path');
var _ = require('lodash');
// var azure = require('./azure');
var gitCmdPath = '"D:\\Program Files (x86)\\Git\\cmd\\git.exe"';
var bundleCmdPath = path.join(process.env.RUBY_HOME, 'bin', 'bundle');
var jekyllCmdPath = path.join(process.env.RUBY_HOME, 'bin', 'jekyll');
var reqObj = JSON.parse(process.env.WEBJOBS_COMMAND_ARGUMENTS);
var model = reqObj.model;
var tempDir = reqObj.tempDir;
var publishDir = reqObj.publishDir;


/**
 * Takes a command template and a model, tokenizes the model,
 * runs the command, and calls the callback.
 *
 * The following tokens are availble: owner, repository, branch,
 * token (GitHub access token), source (temporary build directory),
 * destination (final destination for build site).
 *
 * The source directory should be deleted after build completes.
 *
 * @param {Array} cmd - array of string templates, each item is a command
 */
function run(cmd) {
  var defaultBranch = model.branch === model.site.defaultBranch;
  var tokens = {
    branch: model.branch,
    branchURL: defaultBranch ? '' : '/' + model.branch,
    root: defaultBranch ? 'site' : 'preview',
    config: model.site.config
  };
  // Temporary until workaround for single line IF EXIST logic is implemented
  var template = _.template(cmd.filter(function onFilter(val) {
    return val;
  }).join(' & '));

  next(model);
		
  /**
   * Execute build command in child process and
   * initiate publishing
   * 
   * @param {Build} model - build model to parse
   */
  function next(model) {

    // Set populated token values
    tokens.repository = model.site.repository;
    tokens.owner = model.site.owner;
    tokens.token = (model.user.passport) ? model.user.passport.tokens.accessToken : '';
    tokens.baseurl = '';

    // Set up source and destination paths
    tokens.source = tempDir + '/source/' +
    tokens.owner + '/' + tokens.repository + '/' + tokens.branch;
    tokens.destination = tempDir + '/destination/' +
    tokens.owner + '/' + tokens.repository + '/' + tokens.branch;
    tokens.publish = publishDir + '/' + tokens.root + '/' +
    tokens.owner + '/' + tokens.repository + tokens.branchURL;

    // Remove leading slash and normalize path for Windows
    tokens.source = path.normalize(tokens.source.replace(/^\//, ''));
    tokens.destination = path.normalize(tokens.destination.replace(/^\//, ''));
    tokens.publish = path.normalize(tokens.publish.replace(/^\//, ''));
      
    // Run command in child process and
    // call callback with error and model
    exec(template(tokens), function onExecute(err, stdout, stderr) {
      if (stdout) {
        console.log('stdout: ' + stdout);
      }
      if (stderr) {
        console.log('stderr: ' + stderr);
      }
      if (err) {
        console.error(err);
        // return done(err, model);
      }
      publish(tokens);
    });
  }
}

/**
 * Publish a built site by copiting it to its publish directory
 * or pushing it to an Azure Web App
 * 
 * @param {Object} tokens - tokens from the _run command
 */
function publish(tokens) {
  // If an Azure configuration and/or S3 configuration is defined, publish site accordingly
    if (reqObj.azure) {
      var rgName = 'federalist-' + tokens.owner;
      // Temporary hardcoding path
      var rgTemplatePath = '../templates/webapp/azuredeploy.json';
      var rgDeploymentName = rgName + '-deployment-' + model.id;
      var webAppName = tokens.owner + '-' + tokens.repository;
      var appHostingPlanName = rgName + '-web';

      var publishConfig = {
        directory: tokens.destination,
        rgName: rgName,
        rgTemplatePath: rgTemplatePath,
        rgDeploymentName: rgDeploymentName,
        webAppName: webAppName,
        appHostingPlanName: appHostingPlanName
      };

      console.log('Publishing job: ', model.id,
        ' => ', publishConfig);
      /*
      azure.publish(publishConfig, function onPublish(err) {
        if (err) {
          console.error(err);
        }
        done(err, model);
      });
      */
    } else {
      var cmd = _.template([
        'RMDIR ${publish} /S /Q 2> nul',
        'MKDIR ${publish}',
        'XCOPY ${destination} ${publish} /E /I /Q 2>&1'
      ].join(' & '));

      console.log('Publishing job: ', model.id,
        ' => ', tokens.publish);
      exec(cmd(tokens), function onExecute(err, stdout, stderr) {
        if (stdout) {
          console.log('stdout: ' + stdout);
        }
        if (stderr) {
          console.log('stderr: ' + stderr);
        }
        // done(err, model);
      });
    }
}

console.log('Model: ' + JSON.stringify(model));

run([
  'echo. removing existing source directory ${source}',
  'RMDIR ${source} /S /Q 2> nul',
  'echo creating source directory ${source}',
  'MKDIR ${source}',
  'echo cloning branch ${branch} from owner ${owner} at repository ${repository}',
  gitCmdPath + ' clone -b ${branch} --single-branch ' +
  'https://${token}@github.com/${owner}/${repository}.git ${source} 2>&1',
  'echo baseurl: ${baseurl} > ${source}\\_config_base.yml',
  'echo branch: ${branch} >> ${source}\\_config_base.yml',
      
  // This command conditionally added since an empty model.site.config object
  // results an execution of echo by itself which leads to miscellaneous
  // output in _config_base.yml
  (model.site.config) ? 'echo ${config} >> ${source}\\_config_base.yml' : null,

  bundleCmdPath,
  bundleCmdPath + ' exec ' + jekyllCmdPath + ' build --safe --config ${source}\\_config.yml,${source}\\_config_base.yml ' +
  '--source ${source} --destination ${source}\\_site 2>&1',
  'echo removing existing destination directory ${destination}',
  'RMDIR ${destination} /S /Q 2> nul',
  'echo creating destination directory ${destination}',
  'MKDIR ${destination}',
  'echo recursively copying source directory ${source}\\_site to destination directory ${destination}',
  'XCOPY ${source}\\_site ${destination} /E /I /Q 2>&1',
  'XCOPY ' + path.normalize('node_modules/sails-hook-federalist-ms/templates/webapp/web.config') + ' ${destination} /E /I /Q 2>&1',
  'echo removing source directory ${source}',
  'RMDIR ${source} /S /Q 2> nul',
]);