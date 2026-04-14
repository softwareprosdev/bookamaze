// Azure Enterprise Infrastructure for Bookamaze
// Target: Enterprise-grade deployment with WAF alignment

targetScope = 'subscription'

@description('Environment name (dev/staging/prod)')
@allowed(['dev', 'staging', 'prod'])
param environment string = 'prod'

@description('Location for all resources')
param location string = resourceGroup().location

@description('Azure AD tenant ID')
param aadTenantId string

@description('Administrator user ID for Key Vault')
param keyVaultAdminObjectId string

// Main Resource Group
resource rg 'Microsoft.Resources/resourceGroups@2021-04-01' existing = {
  name: 'bookamaze-${environment}-rg'
}

// App Service Plan (Enterprise - Production Ready)
resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: 'bookamaze-${environment}-asp'
  location: location
  sku: {
    name: 'P1v3'
    tier: 'PremiumV3'
    capacity: 1
  }
  kind: 'linux'
  properties: {
    reserved: true
    hyperV: false
    perSiteScaling: true
    elasticScalingEnabled: false
  }
}

// Web App
resource webApp 'Microsoft.Web/sites@2023-12-01' = {
  name: 'bookamaze-${environment}'
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    clientAffinityEnabled: true
    siteConfig: {
      linuxFxVersion: 'NODE|22'
      alwaysOn: true
      http20Enabled: true
      minTlsVersion: '1.3'
      ftpsState: 'Disabled'
      appCommandLine: 'node dist/server/index.js'
      cors: {
        allowedOrigins: []
        supportCredentials: true
      }
      vnetRouteAllEnabled: true
      ipSecurityRestrictions: [
        {
          ipAddress: 'Any'
          action: 'Allow'
          priority: 2147483647
          name: 'Allow all'
        }
      ]
    }
  }
}

// App Service Staging Slot
resource stagingSlot 'Microsoft.Web/sites/slots@2023-12-01' = {
  parent: webApp
  name: 'staging'
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|22'
      http20Enabled: true
      minTlsVersion: '1.3'
      appCommandLine: 'node dist/server/index.js'
    }
  }
}

// Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2023-02-01' = {
  name: 'bookamaze-${environment}-kv'
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: aadTenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionDays: 90
    enablePurgeProtection: environment == 'prod'
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
    secrets: [
      {
        name: 'DATABASE_PATH'
        attributes: {
          enabled: true
        }
      }
      ]
  }
}

// Key Vault Secret - JWT Secret
resource kvSecretJwtSecret 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  parent: keyVault
  name: 'jwt-secret'
  properties: {
    attributes: {
      enabled: true
    }
    value: '@Microsoft.KeyVault_SECRET_URI(bookamaze-jwt-secret)'
  }
}

// Key Vault Access Policy
resource kvAccessPolicy 'Microsoft.KeyVault/vaults/accessPolicies@2023-02-01' = {
  parent: keyVault
  name: 'add'
  properties: {
    tenantId: subscription().tenantId
    objectId: webApp.identity.principalId
    permissions: {
      keys: []
      secrets: ['get', 'list']
      certificates: []
    }
  }
}

// Application Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'bookamaze-${environment}-ai'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    Request_Source: 'REST'
    RetentionInDays: 90
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
    workspaceResourceId: empty(logAnalyticsWorkspace.id) ? null : logAnalyticsWorkspace.id
  }
}

// Log Analytics Workspace
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: 'bookamaze-${environment}-law'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 90
  }
}

// Azure Database for PostgreSQL Flexible Server
resource postgresqlServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-08-01' = {
  name: 'bookamaze-${environment}-db'
  location: location
  sku: {
    name: 'Standard_D2s_v3'
    tier: 'Standard'
    capacity: 2
  }
  properties: {
    version: '16'
    administratorLogin: 'bookadmin'
    administratorLoginPassword: '@Microsoft.KeyVault_SECRET_URI(bookamaze-db-password)'
    storage: {
      storageSizeGB: 20
      tier: 'P10'
    }
    highAvailability: {
      mode: environment == 'prod' ? 'ZoneRedundant' : 'Disabled'
    }
    backup: {
      backupRetentionDays: 30
      geoRedundantBackup: environment == 'prod' ? 'Enabled' : 'Disabled'
    }
    network: {
      delegatedSubnetResourceId: empty(vnet.id)
      privateDnsZoneResourceId: empty(privateDnsZone.id)
    }
    maintenanceWindow: {
      dayOfWeek: 0
      startHour: 0
      startMinute: 0
    }
  }
}

// Database Firewall Rule
resource dbFirewallRule 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-08-01' = {
  parent: postgresqlServer
  name: 'allow-azure-services'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// VNet for Private Endpoints
resource vnet 'Microsoft.Network/virtualNetworks@2023-06-01' = {
  name: 'bookamaze-${environment}-vnet'
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: ['10.0.0.0/16']
    }
    subnets: [
      {
        name: 'default'
        properties: {
          addressPrefix: '10.0.0.0/24'
          delegations: [
            {
              name: 'Microsoft.DBforPostgreSQL/flexibleServers'
              properties: {
                serviceName: 'Microsoft.DBforPostgreSQL/flexibleServers'
              }
            }
          ]
        }
      }
      {
        name: 'app-service'
        properties: {
          addressPrefix: '10.0.1.0/24'
        }
      }
    ]
  }
}

// Private DNS Zone
resource privateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: 'privatelink.postgresql.database.azure.com'
  location: 'global'
}

// VNet Link
resource vnetLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: privateDnsZone
  name: 'bookamaze-vnet-link'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: vnet.id
    }
  }
}

// Output Variables
output webAppName string = webApp.name
output webAppDefaultHostName string = webApp.properties.defaultHostName
output webAppPrincipalId string = webApp.identity.principalId
output keyVaultUri string = keyVault.properties.vaultUri
output appInsightsInstrumentationKey string = appInsights.properties.InstrumentationKey
output appInsightsConnectionString string = appInsights.properties.ConnectionString
output databaseHost string = postgresqlServer.properties.fullyQualifiedDomainName
output databaseName string = 'bookamaze'