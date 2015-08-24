/* global describe,before,after,it */

var Sails = require('sails').Sails;
var should = require('should');
var azure = require('../lib/azure');
var build = require('../lib/build');

describe('Sails', function () {

  var sails;
  var federalistMS;

  // Before running any tests, attempt to lift Sails
  before(function (done) {

    // Hook will timeout in 10 seconds
    this.timeout(11000);

    // Attempt to lift sails
    Sails().lift({
      hooks: {
        // Load the hook
        "federalistMS": require('../'),
        // Skip grunt
        "grunt": false
      },
      log: { level: "error" }
    }, function (err, _sails) {
      if (err) {
        return done(err);
      }
      sails = _sails;
      federalistMS = sails.hooks.federalistMS;
      return done();
    });
  });

  // After tests are complete, lower Sails
  after(function (done) {

    if (sails) {
      return sails.lower(done);
    }
    
    return done();
  });
  
  // Test that Sails can lift with the hook in place
  it('should not crash', function () {
    return true;
  });
  
  describe('federalist-ms installable hook', function() {
    
    it('should be loaded', function () {
      should.exist(federalistMS);
    });
    
    it('should have a defaults object', function() {
      (federalistMS).should.have.enumerable('defaults');
    });
    
    it('should have a configure function', function() {
      (federalistMS).should.have.enumerable('configure');
    });
    
    it('should have an initialize function', function() {
      (federalistMS).should.have.enumerable('initialize');
    }); 
    
    it('should have a Jekyll build function', function() {
      (federalistMS).should.have.enumerable('jekyll');
    });
    
    it('should have a Hugo build function', function() {
      (federalistMS).should.have.enumerable('hugo');
    });
    
    it('should have a static build function', function() {
      (federalistMS).should.have.enumerable('static');
    });
    
    it('should have a publish function', function() {
      (federalistMS).should.have.enumerable('publish');
    });
    
  });
  
  describe('federalist-ms installable hook azure module', function() {
    
    
    
  });
  
});