# sails-hook-federalist-ms

This installable hook for Sails.js incorporates both [Windows](http://windows.com) and [Microsoft Azure](https://azure.microsoft.com) extensibility in to [18F's](https://18f.gsa.gov) [Federalist](https://github.com/18F/federalist) platform. The hook is comprised of two components: build support for Windows and static site publishing support for [Azure](https://azure.microsoft.com).

Detailed API documentation for this package can be found here: https://microsoft.github.io/sails-hook-federalist-ms/.

## Windows Build Engine

TODO

## Azure Static Site Publishing

TODO

## Developing

This hook is developed following the Sails.js [hook specification](http://sailsjs.org/documentation/concepts/extending-sails/hooks/hook-specification). Execute the following command to install the package's dependencies:

```shell
npm install
```

Unit tests are developed using [Mocha](http://mochajs.org/) which can be installed by running `npm install -g mocha`.

[Gulp](http://gulpjs.com/) is used to execute all unit tests and compile the documentation from the code. Execute the following command to initiate the build tasks:

```shell
gulp
```