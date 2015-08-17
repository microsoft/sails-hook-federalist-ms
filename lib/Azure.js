var fs = require('fs');
var path = require('path');
var url = require('url');
var FTPClient = require('ftp');
var c = new FTPClient();
    
// Azure dependencies
var AuthenticationContext = require('adal-node').AuthenticationContext;
var common = require('azure-common');
var resourceManagement = require('azure-arm-resource');
var resourceManagementClient;
var webSiteManagement = require('azure-asm-website');
var webSiteManagementClient;
var tokenCreds;
  
// FTP
var ftpHost;
var ftpUser;
var ftpPass;
var ftpFiles = [];
var ftpDirs = [];
var tempPublishDir;


/**
 * Azure site publishing
 * @module azure
 */
module.exports = {
  sayHi: function() {
    console.log(this);
  },
  
  testVar: 'Hi',
  
  /**
   * @type AzureConfig
   */
  config: {},
         
  /**
   * Publish to Azure
   * 
   * @param {string} directory - Path to local site directory
   * @param {Function(error)} done - callback function
   */
  publish: function (directory, done) {
    
    // Execute Azure deployment operation in series
    async.series([this._setToken, this._checkResources, this._getPublishingCredentials, this._uploadContent], function onResult(err, results) {
      if (err) {
        return done(err);
      }
      done(null, results);
    });
  },
  
  /**
   * Retrieve authentication token for Azure
   * 
   * @param {Function(error, results)} callback - callback function
   */
  _setToken: function (callback) {

    console.log("Setting token...");

    var authorityUrl = this.config.authorityUrl;
    var service = new AuthenticationContext(authorityUrl);
    var username = this.config.username;
    var password = this.config.password;
    var clientId = this.config.clientId;
    var subscriptionId = this.this.config.subscriptionId;

    service.acquireTokenWithUsernamePassword('https://management.core.windows.net/', username, password, clientId, function onAcquisition(err, tokenResponse) {
      if (err) {
        return callback(err);
      }

      tokenCreds = new common.TokenCloudCredentials({
        subscriptionId: subscriptionId,
        token: tokenResponse.accessToken
      });

      resourceManagementClient = resourceManagement.createResourceManagementClient(tokenCreds);
      webSiteManagementClient = webSiteManagement.createWebSiteManagementClient(tokenCreds);

      console.log("Token set");

      callback(null, 'Token set');
    });
  },
  
  /**
   * Check existence of Azure resources in specified resource group
   * 
   * TODO: This code is a bit hacky, need to cleanup
   * 
   * @param {Function(error, results)} callback - callback function
   */
  _checkResources: function (callback) {

    console.log("Determining whether or not Web App already exists");

    var webSpace = this.config.resourceGroup.name + '-' + this.config.resourceGroup.region.replace(/ /g, '') + 'webspace';
    var siteName = this.config.resourceGroup.templateParams.siteName;

    webSiteManagementClient.webSpaces.get(webSpace, function onWebSpaceGet(err, result) {

      if (err && err.code === 'NotFound') {
        console.log("Web Space does not exist\r\nProvisioning new Resource Group");

        this._deployResourceGroup(function onResourceGroupDeploy(err, result) {
          if (err) {
            return callback(err);
          }
          callback(null, 'Resource Group deployed');
        });
      } else if (err) {
        return callback(err);
      }

      if (result) {
        webSiteManagementClient.webSites.get(webSpace, siteName, function onWebSiteGet(err, result) {
          if (err && err.code === 'NotFound') {
            console.log("Web App '" + siteName + "' does not exist in Web Space '" + webSpace);

            this._deployResourceGroup(function onResourceGroupDeploy(err, result) {
              if (err) {
                return callback(err);
              }
              callback(null, 'Resource Group deployed');
            });
          } else if (err) {
            return callback(err);
          }

          if (result) {
            console.log("Web App already exists");

            callback(null, "Web App already exists");
          }
        });
      }
    });
  },
  
  /**
   * Get Web App publishing credentials
   * 
   * @param {Function(error, results)} callback - callback function
   */
  _getPublishingCredentials: function (callback) {
    var webSpace = this.config.resourceGroup.name + '-' + this.config.resourceGroup.region.replace(/ /g, '') + 'webspace';
    var siteName = this.config.resourceGroup.templateParams.siteName;

    webSiteManagementClient.webSites.getPublishProfile(webSpace, siteName, function onWebSiteGet(err, result) {
      if (err) {
        return callback(err);
      }
      for (var i = 0; i < result.publishProfiles.length; i++) {
        if (result.publishProfiles[i].publishMethod === 'FTP') {
          var profile = result.publishProfiles[i];
          var publishUrl = url.parse(profile.publishUrl);
          ftpHost = publishUrl.hostname;
          ftpUser = profile.userName;
          ftpPass = profile.userPassword;
            
          // Sails logging placeholder
          console.log("Publish profile retrieved");

          return callback(null, 'Publish Profile retrieved');
        }
      }
    });
  },
  
  /**
   * Publish site content via FTPS
   * 
   * NOTE: May want to rework for Git publishing instead of FTPS
   * NOTE: Requires Node 0.10.x due to bug in TLS module as
   * described {@link https://github.com/joyent/node/issues/9272|here}
   * 
   * @param {Function(error, results)} callback - callback function
   */
  _uploadContent: function (callback) {

    tempPublishDir = this.config.tempPublishDir;

    c.on('ready', function onReady() {
      // Will replace with build token destination path
      this._ftpWalk(tempPublishDir, function onWalk(err) {

        if (err) {
          return callback(err);
        }

        async.series([this._createFTPDirectories, this._uploadFTPFiles], function onResult(err, results) {
          c.end();

          if (err) {
            return callback(err);
          }
          console.log("\r\n");
          callback(null, 'Files uploaded successfully');
        });
      });
    });

    c.connect({
      host: ftpHost,
      secure: true,
      user: ftpUser || process.env.FEDERALIST_AZURE_WEBAPP_DEPLOYMENT_USER,
      password: ftpPass || process.env.FEDERALIST_AZURE_WEBAPP_DEPLOYMENT_PASSWORD
    });
  },
  
  /**
   * Create new Resource Group and execute template deployment
   * 
   * @param {Function(error)} done - callback function
   */
  _deployResourceGroup: function (done) {

    this._checkRGExistence(function onCheckResourceGroupExistence(err, exists, result) {
      if (err) {
        return done(err);
      }

      if (!exists) {
        async.series([this._createResourceGroup, this._deployTemplate, this._checkDeploymentStatus], function onResult(err, results) {
          if (err) {
            return done(err);
          }
          done(null, results);
        });
      } else {
        done(null, result);
      }
    });
  },
  
  /**
   * Check existence of Resource Group
   * 
   * @param {Function(error)} done - callback function
   */
  _checkRGExistence: function (done) {
    var rgName = this.config.resourceGroup.name;

    resourceManagementClient.resourceGroups.checkExistence(rgName, function onCheckResourceGroupExistence(err, result) {
      // Bug in checkExistence() function that returns an error
      // instead of result.exists = false
      if (err && err.statusCode === 404 && err.code === 'NotFound') {
        return done(null, false, result);
      } else if (err) {
        return done(err);
      }

      done(null, true, result);
    });
  },
  
  /**
   * Create new Resource Group
   * 
   * @param {Function(error, results)} callback - callback function
   */
  _createResourceGroup: function (callback) {

    var rgName = this.config.resourceGroup.name;
    var params = {
      location: this.config.resourceGroup.region
    };

    resourceManagementClient.resourceGroups.createOrUpdate(rgName, params, function onCreateResourceGroup(err, result) {
      if (err) {
        return callback(err);
      }
      callback(null, result);
    });
  },
  
  /**
   * Deploy generated template to Resource Group
   * 
   * @param {Function(error, results)} callback - callback function
   */
  _deployTemplate: function (callback) {
  
    // Will replace with hosted template
    var templatePath = this.config.resourceGroup.templatePath
    var template;
    var rgName = this.config.resourceGroup.name;
    var deploymentName = this.config.resourceGroup.deploymentName;
    
    try {
      template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
    } catch (err) {
      return callback(err);
    }

    // May decide to dynamically populate these parameters based on template JSON
    var params = {
      "properties": {
        "template": template,
        "mode": "Incremental",
        "parameters": {
          "siteName": {
            "value": this.config.resourceGroup.templateParams.siteName
          },
          "hostingPlanName": {
            "value": this.config.resourceGroup.templateParams.hostingPlanName
          },
          "siteLocation": {
            "value": this.config.resourceGroup.templateParams.siteLocation
          }
        }
      }
    };

    resourceManagementClient.deployments.createOrUpdate(rgName, deploymentName, params, function onResourceGroupDeployment(err, result) {
      if (err) {
        return callback(err);
      }

      // sails.log.verbose(result);
      callback(null, result);
    });
  },
  
  /**
   * Check deployment status
   * 
   * @param {Function(error, results)} callback - callback function
   */
  _checkDeploymentStatus: function (callback) {

    function getStatus(retry, results) {

      var rgName = this.config.resourceGroup.name;
      var deploymentName = this.config.resourceGroup.deploymentName;

      resourceManagementClient.deployments.get(rgName, deploymentName, function onDeploymentGet(err, result) {
        if (err) {
          return retry(err);
        }

        if (result && result.deployment.properties.provisioningState === 'Succeeded') {
          return retry(null, true);
        } else if (result && result.deployment.properties.provisioningState === 'Failed') {
          return retry(null, false);
        } else {
          retry(new Error("Incomplete deployment \r\n"));
        }
      });
    }

    async.retry({ times: 6, interval: 10000 }, getStatus, function onResult(err, results) {
      if (err) {
        return callback(err);
      }

      if (!results) {
        // Need to implement in a separate function
        var rgName = this.config.resourceGroup.name;
        var deploymentName = this.config.resourceGroup.deploymentName;

        resourceManagementClient.deploymentOperations.list(rgName, deploymentName, null, function onDeploymentOperationsList(err, result) {
          if (err) {
            return callback(err);
          }
          return callback("Template deployment failed due to following error \r\n" + JSON.stringify(result.operations[0].properties.statusMessage));
        });
      } else {
        callback(null, results);
      }
    });
  },  
  
  /**
   * Walk static site directory structure and copy paths
   * to global arrays
   * 
   * NOTE: may need to adjust path references
   * 
   * @param {string} dir - directory path
   * @param {Function(error)} done - callback function
   */
  _ftpWalk: function (dir, done) {

    fs.readdir(dir, function onDirRead(err, list) {
      var pending = list.length;
      
      if (err) {
        return done(err);
      }
      if (!pending) {
        return done();
      }
      list.forEach(function onFile(file) {
        file = path.join(dir, file);
        fs.stat(file, function onStat(err, stat) {
          if (stat && stat.isDirectory()) {
            ftpDirs.push(dir, file);
            this._ftpWalk(file, function onWalk(err, res) {
              if (!--pending) {
                done();
              }
            });
          } else {
            ftpFiles.push(file);
            if (!--pending) {
              done();
            }
          }
        });
      });
    });
  },
  
  /**
   * Create FTP directories
   * 
   * @param {Function(error, results)} callback - callback function
   */
  _createFTPDirectories: function (callback) {

    async.each(ftpDirs, createDir, function onResult(err) {
      if (err) {
        return callback(err);
      }

      console.log("\r\n");
      callback();
    });
    
    /**
     * Create directory
     * 
     * @param {string} dir - directory path
     * @param {Function(error)} callback - callback function
     */
    function createDir(dir, callback) {

      var ftpDir = path.join('/site/wwwroot/', path.relative(tempPublishDir, dir));
      ftpDir = ftpDir.replace(/\\/g, "/");

      c.mkdir(ftpDir, true, function onFtpMkDir(err) {
        if (err) {
          return callback(err);
        }

        console.log("FTP directory '" + ftpDir + "' created");

        callback();
      });
    }
  },
  
  /**
   * Upload files via FTP
   * 
   * @param {Function(error)} callback - callback function
   */
  _uploadFTPFiles: function (callback) {

    async.each(ftpFiles, uploadFile, function onResult(err) {
      if (err) {
        return callback(err);
      }
      callback();
    });
    
    /**
     * Upload file
     * 
     * @param {string} file - file path
     * @param {Function(error)} callback - callback function
     */
    function uploadFile(file, callback) {
  
      // Relative/absolute path normalization for Azure
      var localFile = path.join(process.cwd(), file);
      var ftpFile = path.join('/site/wwwroot/', path.relative(tempPublishDir, file));
      ftpFile = ftpFile.replace(/\\/g, "/");

      c.put(localFile, ftpFile, function onFtpPutFile(err) {
        if (err) {
          return callback(err);
        }
        
        // Sails logging placeholder
        console.log("File '" + localFile + "' uploaded successfully");

        callback();
      });
    }
  },
  
  /**
   * Remove Resource Group and cleanup attempted
   * deployment operation
   * 
   * NOTE: Cleanup stubs for Resource Group provisioning failure
   * 
   * @param {Function(error)} done - callback function
   */
  cleanup: function (done) {
  
    // Delete Resource Group
    var rgName = this.config.resourceGroup.name;

    resourceManagementClient.resourceGroups.deleteMethod(rgName, function onResourceGroupDelete(err, result) {
      if (err) {
        return done(err);
      }

      // sails.log.verbose(result);
      done(null, result);
    });
  }

};