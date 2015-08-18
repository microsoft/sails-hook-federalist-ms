#!/bin/sh

# Subscrption ID
export FEDERALIST_AZURE_SUBSCRIPTION_ID=''

# Azure AD Tenant ID
export FEDERALIST_AZURE_TENANT_ID=''

# Organizational/Corp account creds
export FEDERALIST_AZURE_USERNAME=''
export FEDERALIST_AZURE_PASSWORD=''

# Azure AD Application Client ID
export FEDERALIST_AZURE_CLIENT_ID=''

# Resource Group Name for site build
export FEDERALIST_AZURE_RG_NAME=''

# Region for new Resource Group and Web App
export FEDERALIST_AZURE_REGION=''

# Path to Resource Group template file
export FEDERALIST_AZURE_RG_TEMPLATE_PATH=''

# Resource Group deployment name
export FEDERALIST_AZURE_RG_DEPLOYMENT_NAME=''

# New/existing Azure Web App name (if existing, making sure it resides within the Resource Group defined)
export FEDERALIST_AZURE_WEBAPP_NAME=''

# New App Hosting Plan name
export FEDERALIST_AZURE_APPHOSTINGPLAN_NAME=''

# Local site directory to publish to Azure Web App (for testing purposes; normally defined by buildEngine tokens)
export FEDERALIST_AZURE_LOCAL_SITE_DIRECTORY=''