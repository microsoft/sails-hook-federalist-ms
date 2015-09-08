# sails-hook-federalist-ms

[![npmbadge](https://img.shields.io/npm/v/sails-hook-federalist-ms.svg)](https://www.npmjs.com/package/sails-hook-federalist-ms)

This installable hook for Sails.js incorporates both [Windows](http://windows.com) and [Microsoft Azure](https://azure.microsoft.com) extensibility in to [Federalist](https://github.com/18F/federalist), a static website management platform built and maintained by [18F](https://18f.gsa.gov). The hook is comprised of two components: build support for Windows (and [Azure Web Apps](http://azure.microsoft.com/en-us/services/app-service/web/)) and static site publishing support for Azure.

New releases of this package will coincide with Federalist's current stage of development; based on 18F's [Project Stage Definitions](https://18f.gsa.gov/dashboard/stages/).

Detailed API documentation for this package can be found here: [http://microsoft.github.io/sails-hook-federalist-ms/](http://microsoft.github.io/sails-hook-federalist-ms/).

## Running Federalist on Windows

In order to enable this hook, the `FEDERALIST_BUILD_ENGINE` environment variable must be set to 'federalist-ms'. By enabling this hook, the build engine will be configured to run tasks on Windows (or Web Apps), and the Azure site publishing feature will be activated.

If Federalist detects that the platform is running on Windows and the `FEDERALIST_BUILD_ENGINE` environment variable is not set, an error will be logged indicating that builds will fail until the variable is set correctly.

### Windows Build Engine

Federalist works by executing a specific set of build tasks for each static site based on whether or not the site's content is built using a content generator (either [Jekyll](http://jekyllrb.com/) or [Hugo](http://gohugo.io/)). If the site isn't built with a generator, then the build engine simply stages the site's content for publishing as is.

When running Federalist on Windows (or on an [Azure Web App](http://azure.microsoft.com/en-us/services/app-service/web/) as described below), this hook invokes the appropriate build tasks using [CMD-based](https://en.wikipedia.org/wiki/Cmd.exe) syntax. All task output is redirected to stdout and subsequently attached to the Federalist logging engine.

#### Jekyll

Jekyll must be installed in order to build sites that are created with it. Instructions for installing Jekyll on Windows can be found [here](http://jekyll-windows.juthilo.com/). In addition, you'll want to install additional Ruby gem dependencies which can be done using the following commands:

```sh
gem install bundler
bundle install
```

#### Hugo

Hugo is required to build sites that depend on it and installation instructions can be found [here](http://gohugo.io/overview/installing/).

## Azure Static Site Publishing

Once a site has been built and staged, the hook will subsequently publish the content to an Azure Web App. In order to publish to Azure, a new Azure Active Directory native client application must be created. Instructions for doing so can be found [here](https://msdn.microsoft.com/en-us/library/azure/dn132599.aspx#BKMK_Adding). The 'Redirect URI' value is arbitrary and can be set to anything.

In addition, the following environment variables need to be set:

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

TODOs

- Set environment variables (including `RUBY_HOME`)
- Installer bundler gem
- Execute `bundle` command at root to install Gem dependencies

## Developing on Windows

This hook is developed following the Sails.js [hook specification](http://sailsjs.org/documentation/concepts/extending-sails/hooks/hook-specification).

In order to install Sails and the required dependencies for contributing to the hook, the following prerequisites must be installed in the following order:

- [Node.js](https://nodejs.org/)
- [Visual Studio 2013+](https://www.visualstudio.com/)
  - Community Edition is sufficient
  - Ensure Common Tools for Visual C++ are included
- [Python 2.7.x](https://www.python.org/downloads/)
- [Ruby 2.0.0-x](http://rubyinstaller.org/downloads/)
- [Ruby 2.0+ development kit](http://rubyinstaller.org/downloads/)
  - Installation instructions [here](https://github.com/oneclick/rubyinstaller/wiki/Development-Kit)
- [Hugo](http://gohugo.io/overview/installing/)
- [Jekyll](http://jekyll-windows.juthilo.com/)

NOTE: In order to avoid Sails npm package name length limitations imposed by Windows, npm v3.x can be used to install the hook's dependencies. Instructions for upgrading npm to v3.x can be found [here](https://github.com/npm/npm/wiki/Troubleshooting#upgrading-on-windows). Bear in mind that some packages might be incompatible with npm v3.x at the time of this writing. If issues arise during installation, reference the source repositories of the offending packages  on GitHub for any open issues.

Execute the following command to install the dependencies for sails-hook-federalist-ms:

```shell
npm install
```

[Gulp](http://gulpjs.com/) is used to execute all unit tests and compile the documentation from the code. The command below can be executed to initiate the build tasks.

```shell
gulp
```

NOTE: Only those with push priveleges on the GitHub remote can update the existing gh-pages branch. Any errors in the documentation should be denoted by a new Issue on GitHub. 
