# Files to Remove

## Security Files
- src/ipValidation.js
- src/monitoring.js
- src/config.example.js
- src/config.prod.js
- blocked.html
- ROLLBACK.md
- Click Fraud Prevention Plan.md
- src/recaptcha.js (if exists)
- src/recaptcha-config.js (if exists)
- src/validation.js (contains reCAPTCHA code)
- src/recaptcha-handler.js (if exists)
- public/recaptcha.html (if exists)
- .env (contains reCAPTCHA keys)

## Configuration Files
- .github/workflows/deploy.yml (since we're using Cloudflare)
- Cloudflare-Migration-Plan.md (once migration is complete) 