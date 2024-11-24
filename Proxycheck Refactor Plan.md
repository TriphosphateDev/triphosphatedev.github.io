# Proxycheck.io Integration Plan

## 0. Security Setup - GitHub Secrets

### GitHub Actions Secrets
Add the following secrets in GitHub repository settings (Settings > Secrets and variables > Actions):

1. `PROXYCHECK_API_KEY`: `a32394-618019-a48t0t-7z9799`
2. `PROXYCHECK_PUBLIC_KEY`: `public-k82938-647649-684944`

### GitHub Codespaces Secrets
Add the same secrets for Codespaces (Settings > Secrets and variables > Codespaces):

1. `PROXYCHECK_API_KEY`: `a32394-618019-a48t0t-7z9799`
2. `PROXYCHECK_PUBLIC_KEY`: `public-k82938-647649-684944`

### Environment Variables Setup
✅ Added to .env file:
- PROXYCHECK_API_KEY
- PROXYCHECK_PUBLIC_KEY
- PROXYCHECK_API_ENDPOINT

## 1. Update Core Validation (src/ipValidation.js)