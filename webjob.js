/* global sails,process,Passport */

var util = require('util');
var request = require('request');
var siteName = process.env.WEBSITE_SITE_NAME;
var pollingIntervalId;

function webjobAPIRequest(method, jobName, endpoint, qs, done) {
  var uri = util.format("https://%s.scm.azurewebsites.net/api/triggeredwebjobs/%s/%s", siteName, jobName, endpoint);
  sails.log.verbose('Webjob request URI: ' + uri);
  request({
    method: method,
    uri: uri,
    auth: {
      username: sails.config['federalist-ms'].webjob.username,
      password: sails.config['federalist-ms'].webjob.password
    },
    qs: qs
  }, function onRequest(err, res, body) {
    if (err) {
      return done(err);
    }

    done(null, res);
  });
}

function invokeWebjob(jobName, model, done) {
  var reqObj = {
    model: model,
    tempDir: sails.config.build.tempDir,
    publishDir: sails.config.build.publishDir,
    azure: sails.config['federalist-ms'].azure
  };
  
  webjobAPIRequest('POST', jobName, 'run', { "arguments": JSON.stringify(reqObj) }, function onWebjobAPIRequest(err, res) {
    if (err) {
      return done(err);
    }

    pollWebjob(jobName, function onPoll(err, result) {
      clearInterval(pollingIntervalId);
            
      if (err) {
        return done(err);
      }
      
      done();
    });
  });
}

function pollWebjob(jobName, done) {
  webjobAPIRequest('GET', jobName, 'history', null, function onWebjobAPIRequest(err, res) {
    if (err) {
      return done(err);
    }

    var resObj = JSON.parse(res.body);
    var runId = resObj.runs[0].id;
    var endpoint = 'history/' + runId;
    var intervalCount;
    pollingIntervalId = setInterval(function () {
      webjobAPIRequest('GET', jobName, endpoint, null, function onWebjobAPIRequest(err, res) {
        if (err) {
          return done(err);
        }
        
        if (intervalCount > 24) {
          return done('Webjob execution exceeded 4 minutes without a response');
        }

        var resObj = JSON.parse(res.body);
        if (resObj.status === "Success" || resObj.status === "Failed") {
          done();
        }

        intervalCount++;
      });
    }, 10000);
  });
}

module.exports = {

  build: {
    jekyll: function (model, done) {
      sails.log.verbose('Model: ' + model);
      var jobName = 'build-jekyll';
      Passport.findOne({ user: model.user.id }).exec(function onFind(err, passport) {
        if (err) {
          return done(err, model);
        }

        model.user.passport = passport;

        invokeWebjob(jobName, model, function onInvokeWebjob(err) {
          if (err) {
            sails.log.error(err);
            return done(err);
          }

          done(null, model);
        });
      });
    },

    hugo: function (model, done) {
      sails.log.verbose('Model: ' + model);
      var jobName = 'build-hugo';
      Passport.findOne({ user: model.user.id }).exec(function onFind(err, passport) {
        if (err) {
          return done(err, model);
        }

        model.user.passport = passport;

        invokeWebjob(jobName, model, function onInvokeWebjob(err) {
          if (err) {
            sails.log.error(err);
            return done(err);
          }

          done(null, model);
        });
      });
    },

    static: function (model, done) {
      sails.log.verbose('Model: ' + model);
      var jobName = 'build-static';
      Passport.findOne({ user: model.user.id }).exec(function onFind(err, passport) {
        if (err) {
          return done(err, model);
        }

        model.user.passport = passport;

        invokeWebjob(jobName, model, function onInvokeWebjob(err, result) {
          if (err) {
            sails.log.error(err);
            return done(err);
          }

          done(null, model);
        });
      });
    }
  },

  publish: function (tokens, model, done) {
    sails.log.verbose('Model: ' + model);
    invokeWebjob('publish-azure', tokens, model, function onPublishWebjob(err) {
      if (err) {
        return done(err);
      }

      done(null, model);
    });
  }

};