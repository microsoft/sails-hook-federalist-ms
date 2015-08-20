# sails-hook-federalist-ms

[![npmbadge](https://img.shields.io/npm/v/sails-hook-federalist-ms.svg)](https://www.npmjs.com/package/sails-hook-federalist-ms)

This installable hook for Sails.js incorporates both [Windows](http://windows.com) and [Microsoft Azure](https://azure.microsoft.com) extensibility in to [Federalist](https://github.com/18F/federalist), a static website management platform built and maintained by [18F](https://18f.gsa.gov). The hook is comprised of two components: build support for Windows (and [Azure Web Apps](http://azure.microsoft.com/en-us/services/app-service/web/)) and static site publishing support for Azure.

New releases of this package will coincide with Federalist's current stage of development; based on 18F's [Project Stage Definitions](https://18f.gsa.gov/dashboard/stages/).

Detailed API documentation for this package can be found here: [https://microsoft.github.io/sails-hook-federalist-ms/](https://microsoft.github.io/sails-hook-federalist-ms/).

## Running Federalist on Windows

In order to enable this hook, the `FEDERALIST_BUILD_ENGINE` environment variable must be set to 'federalist-ms'. By enabling this hook, the build engine will be configured to run tasks on Windows (or Web Apps), and the Azure site publishing feature will be activated.

If Federalist detects that the platform is running on Windows and the `FEDERALIST_BUILD_ENGINE` environment variable is not set, an error will be logged indicating that builds will fail until the variable is set correctly.

### Windows Build Engine

Federalist works by executing a specific set of build tasks for each static site based on whether or not the site's content is built using a content generator (either [Jekyll](http://jekyllrb.com/) or [Hugo](http://gohugo.io/)). If the site isn't built with a generator, then the build engine simply stages the site's content for publishing as is.

When running Federalist on Windows (or on an [Azure Web App](http://azure.microsoft.com/en-us/services/app-service/web/) as described below), this hook invokes the appropriate build tasks using [CMD-based](https://en.wikipedia.org/wiki/Cmd.exe) syntax. All task output is redirected to stdout and subsequently attached to the Federalist logging engine.

Jekyll must be installed in order to build sites that are created with it. Instructions for installing Jekyll on Windows can be found [here](http://jekyll-windows.juthilo.com/). Similarly, Hugo is required to build sites that depend on it and installation instructions can be found [here](http://gohugo.io/overview/installing/).

## Azure Static Site Publishing

Once a site has been built and staged, the hook will subsequently publish the content to an Azure Web App. In order to publish to Azure, the following environment variables need to be set:

| Environment Variable                 | Description          |
| :----------------------------------- | :------------------- |
| FEDERALIST_BUILD_ENGINE              | Should be set to 'federalist-ms' |
| FEDERALIST_AZURE_SUBSCRIPTION_ID     | Azure Subscription Id |
| FEDERALIST_AZURE_TENANT_ID           | Azure Active Directory tenant Id |
| FEDERALIST_AZURE_CLIENT_ID           | Azure Active Directory application client Id |
| FEDERALIST_AZURE_USERNAME            | Azure Active Directory organizational account username (cannot be a Microsoft Account (e.g. Outlook, Live, etc) |
| FEDERALIST_AZURE_PASSWORD            | Azure Active Directory organizational account password |
| FEDERALIST_AZURE_REGION              | Azure Region for deployment (for new Web Apps) |

The Azure publishing process is based on the following execution sequence:

1. Retrieve Azure Active Directory authorization token
2. Check for existence of Azure Web App
3. If Web App exists, skip to Step 6
4. Otherwise, provision new Azure Resource Group if one doesn't exist
5. Deploy template to Resource Group
6. Retrieve Web App site-level publishing credentials
7. Publish content to Web App via FTPS

For the intial alpha release, FTPS is used to publish the site content. Future releases of this package will use Git for publishing. 

## Running Federalist on Azure

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