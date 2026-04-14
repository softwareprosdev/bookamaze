# Bookamaze Azure Deployment Plan

## Overview
Enterprise-ready deployment for Bookamaze application with production-grade infrastructure.

## Pre-requisites
- Azure subscription with contributor access
- Azure AD tenant with permissions to create app registrations
- Key Vault admin access

## Environment
- **Subscription**: User's Azure subscription
- **Resource Group**: bookamaze-prod-rg
- **Location**: User's preferred Azure region

## Infrastructure Components

### Compute
- **App Service Plan**: P1v3 (Premium V3) - Enterprise tier
- **Web App**: Linux, Node.js 22, Always On enabled
- **Staging Slot**: For blue-green deployments

### Database
- **PostgreSQL Flexible Server**: D2s_v3, Zone Redundant (prod)
- **Storage**: 20GB P10
- **Backup**: 30 days retention, Geo-redundant (prod)

### Security
- **Key Vault**: Standard SKU with RBAC, Soft Delete, Purge Protection
- **TLS 1.3**: Minimum TLS version
- **HTTPS Only**: Enforced

### Monitoring
- **Application Insights**: 90-day retention
- **Log Analytics**: PerGB2018 SKU

### Networking
- **Virtual Network**: /16 address space
- **Private DNS Zone**: For private endpoint access

## Deployment Steps

### 1. Create Resource Group
```bash
az group create --name bookamaze-prod-rg --location <location>
```

### 2. Deploy Infrastructure
```bash
az deployment sub create \
  --name bookamaze-infra \
  --location <location> \
  --template-file .azure/main.bicep \
  --parameters aadTenantId=<tenant-id> \
  --parameters keyVaultAdminObjectId=<object-id>
```

### 3. Store Secrets
```bash
# Store JWT secret
az keyvault secret set \
  --vault-name bookamaze-prod-kv \
  --name jwt-secret \
  --value <your-jwt-secret>

# Store database password
az keyvault secret set \
  --vault-name bookamaze-prod-kv \
  --name db-password \
  --value <your-db-password>
```

### 4. Configure GitHub Secrets
Add these repository secrets:
- `AZURE_CLIENT_ID`: Service principal client ID
- `AZURE_TENANT_ID`: Azure AD tenant ID
- `AZURE_SUBSCRIPTION_ID`: Subscription ID

### 5. Deploy Application
```bash
# Manual trigger or push to main
```

## CI/CD Pipeline
- **Trigger**: Push to main branch
- **Stages**:
  1. CI: Install, typecheck, lint, build
  2. CD: Deploy to Azure Web App
- **Artifacts**: Build output retained for 7 days

## Rollback
1. Navigate to Azure Web App
2. Go to Deployment slots
3. Swap staging with production slot