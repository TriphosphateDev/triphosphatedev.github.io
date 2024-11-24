# Emergency Rollback Procedure

1. Immediate Rollback
- Revert to IPQualityScore branch
- Update DNS settings if necessary
- Deploy previous version

2. Monitoring Thresholds for Rollback
- Error rate > 5%
- False positive rate > 2%
- API response time > 300ms
- Rate limit exceeded

3. Rollback Commands 