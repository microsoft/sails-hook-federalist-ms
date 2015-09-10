var path = require('path');
var lib = path.join(__dirname, 'lib');
var build = require(path.join(lib, 'build'));
var azure = require(path.join(lib, 'azure'));
var webjob = require('./webjob');
var jobEngine = process.env.FEDERALIST_JOB_ENGINE;



/**
 * Azure configuration object which is created from environment variables by default
 * @typedef AzureConfig 
 * @property {Object} defaults
 * @property {Object} defaults.__configKey__
 * @property {Object} defaults.__configKey__.azure 
 * @property {string} defaults.__configKey__.azure.subscriptionId - Azure Subscription Id
 * @property {string} defaults.__configKey__.azure.authorityUrl - Azure Active Directory tentant authentication endpoint
 * @property {string} defaults.__configKey__.azure.username - Azure Active Directory username (Must be an Organization Account)
 * @property {string} defaults.__configKey__.azure.password - Azure Active Directory password
 * @property {string} defaults.__configKey__.azure.clientId - Azure Active Directory application client Id
 * @property {string} defaults.__configKey__.azure.region - Azure Resource Group and Web App Region
 */

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
    
    /**
     * Hook defaults (See Sails.js hook {@link http://sailsjs.org/documentation/concepts/extending-sails/hooks/hook-specification/defaults|specification})
     *
     * @type {AzureConfig}
     */
    defaults: {
      __configKey__: {
        azure: {
          subscriptionId: process.env.FEDERALIST_AZURE_SUBSCRIPTION_ID,
          authorityUrl: "https://login.microsoftonline.com/" + process.env.FEDERALIST_AZURE_TENANT_ID,
          username: process.env.FEDERALIST_AZURE_USERNAME,
          password: process.env.FEDERALIST_AZURE_PASSWORD,
          clientId: process.env.FEDERALIST_AZURE_CLIENT_ID,
          region: process.env.FEDERALIST_AZURE_REGION
        },
        webjob: {
          username: process.env.FEDERALIST_AZURE_WEBJOB_USERNAME,
          password: process.env.FEDERALIST_AZURE_WEBJOB_PASSWORD
        }
      }
    },
    
    /** Default overrides (See Sails.js hook {@link http://sailsjs.org/documentation/concepts/extending-sails/hooks/hook-specification/configure|specification}) */
    configure: function () {
      return;
    },

    /** Hook initialization (See Sails.js hook {@link http://sailsjs.org/documentation/concepts/extending-sails/hooks/hook-specification/initialize|specification}) */
    initialize: function (done) {
      return done();
    },
    
    /** 
     * Jekyll build task for execution on Windows
     * @function jekyll
     * {@link module:build.jekyll}
     */
    jekyll: (jobEngine === 'webjob') ? webjob.build.jekyll.bind(build) : build.jekyll.bind(build),
    
    /** 
     * Hugo build task for execution on Windows
     * @function hugo
     * {@link module:build.hugo}
     */
    hugo: (jobEngine === 'webjob') ? webjob.build.hugo.bind(build) : build.hugo.bind(build),
    
    /**
     * Static build task for execution on Windows
     * @function static
     * {@link module:build.static}
     */
    static: (jobEngine === 'webjob') ? webjob.build.static.bind(build) : build.static.bind(build),
    
    /**
     * Publish a built site by copying it to its publish directory or pushing it to an Azure Web App
     * @function publish
     * {@link module:build.publish}
     */
    publish: (jobEngine === 'webjob') ? webjob.publish.bind(build) : build.publish.bind(build)
  };

};
