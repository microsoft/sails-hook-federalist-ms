var path = require('path');
var lib = path.join(__dirname, 'lib');
var build = require(path.join(lib, 'build'));
var azure = require(path.join(lib, 'azure'));


/**
 * Azure configuration object which is created from environment variables by default
 * @typedef AzureConfig 
 * @type {Object}
 * @property {string} subscriptionId - Azure Subscription Id
 * @property {string} authorityUrl - Azure Active Directory tentant authentication endpoint
 * @property {string} username - Azure Active Directory username (Must be an Organization Account)
 * @property {string} password - Azure Active Directory password
 * @property {string} clientId - Azure Active Directory application client Id
 * @property {Object} resourceGroup - Resource Group Configuration
 * @property {string} resourceGroup.name - Azure Resource Group Name
 * @property {string} resourceGroup.region - Azure Resource Group Region
 * @property {string} resourceGroup.templatePath - Path to Azure Resource Group template
 * @property {string} resourceGroup.deploymentName - Azure Resource Group Deployment name
 * @property {Object} resourceGroup.templateParams - Resource Group template parameters
 * @property {string} resourceGroup.templateParams.siteName - Azure Web App name
 * @property {string} resourceGroup.templateParams.hostingPlanName - Azure Web App Hosting Plan name
 * @property {string} resourceGroup.templateParams.siteLocation - Azure Web App Region
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
  
  var hook = {
    
    /**
     * Hook defaults (See Sails.js hook {@link http://sailsjs.org/documentation/concepts/extending-sails/hooks/hook-specification/defaults|specification})
     * 
     * `defaults.__configKey__.azure` should be set to an {@link AzureConfig} object
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
    jekyll: build.jekyll.bind(build),
    
    /** 
     * Hugo build task for execution on Windows
     * @function hugo
     * {@link module:build.hugo}
     */
    hugo: build.hugo.bind(build),
    
    /**
     * Static build task for execution on Windows
     * @function static
     * {@link module:build.static}
     */
    static: build.static.bind(build),
    
    /**
     * Publish a built site by copying it to its publish directory or pushing it to an Azure Web App
     * @function publish
     * {@link module:build.publish}
     */
    publish: build.publish.bind(build)
  };
  
  return hook;

};
