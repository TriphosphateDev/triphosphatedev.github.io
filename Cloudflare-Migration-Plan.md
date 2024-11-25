# Cloudflare Migration Plan

## 1. Code Cleanup Phase

### Remove Deprecated Services
1. Remove ProxyCheck.io integration
   - Delete API keys from config
   - Remove all ProxyCheck.io endpoints
   - Remove JSONP fallback code
   - Clean up error handling specific to ProxyCheck

2. Remove IPQualityScore remnants
   - Remove any remaining IPQualityScore references
   - Clean up legacy validation logic

### Files to Update

#### src/config.js
- Remove:
  - `PROXYCHECK_API_KEY`
  - `PROXYCHECK_PUBLIC_KEY`
  - `PROXYCHECK_API_ENDPOINT`

#### src/ipValidation.js
- Simplify to basic IP fetching
- Remove:
  - ProxyCheck validation logic
  - JSONP implementation
  - Retry mechanisms
  - VPN/Proxy detection
  - Cache implementation (will be handled by Cloudflare)

#### consultation.html & index.html
- Update CSP headers
- Remove ProxyCheck.io from connect-src
- Clean up validation scripts
- Simplify security checks

## 2. Interim Implementation

### Temporary IP Validation 