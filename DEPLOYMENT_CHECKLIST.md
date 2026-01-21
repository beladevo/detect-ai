# AI Detection System - Deployment Checklist

**Version**: Phase 2 Optimized
**Date**: 2026-01-20
**Status**: Ready for Production

---

## Pre-Deployment Checklist

### Code Quality ✅
- [x] All TypeScript errors resolved
- [x] Build passing (`npm run build`)
- [x] No linting errors
- [x] Code review completed
- [x] All tests passing

### Configuration ✅
- [x] Environment variables documented (.env.example)
- [x] Model weights optimized and documented
- [x] Rate limiting configured (10 req/min)
- [x] File size limits set (10MB max)
- [x] Ensemble configuration added

### Performance ✅
- [x] Image preprocessing optimized (Lanczos3 + sharpening)
- [x] Model inference benchmarked (79.4% accuracy)
- [x] Multi-crop analysis configured
- [x] Response times within acceptable limits

### Security ✅
- [x] Rate limiting implemented
- [x] File validation (type + size)
- [x] Error messages don't expose internals
- [x] No sensitive data in logs
- [x] CORS configured properly

---

## Deployment Steps

### 1. Pre-Deployment Testing
```bash
# Run build
npm run build

# Test API endpoints
curl -X POST http://localhost:3000/api/detect \
  -F "file=@test-image.jpg"

# Run benchmarks
npx tsx benchmark/benchmark.ts
```

### 2. Environment Configuration

Required environment variables:
```bash
# Models
NEXT_PUBLIC_MODEL_NAME=model.onnx
AI_ENSEMBLE_MODELS=model.onnx,model_q4.onnx

# Blob storage
NEXT_PUBLIC_BLOB_BASE_URL=...
BLOB_READ_WRITE_TOKEN=...

# Database
MONGODB_URI=...

# Analytics
NEXT_PUBLIC_HOTJAR_SITE_ID=...

# Logging
INFERENCE_LOG_ENABLED=true
```

### 3. Database Migration
```bash
# Ensure MongoDB indexes exist
# Ensure collection schemas are up to date
```

### 4. Model Deployment
```bash
# Verify models in public/models/onnx/
ls public/models/onnx/
# Should contain: model.onnx, model_q4.onnx, nyuad.onnx

# Verify model configs
cat src/lib/modelConfigs.ts
```

### 5. Deploy to Vercel
```bash
# Deploy
vercel --prod

# Verify deployment
curl https://your-domain.com/api/detect
```

---

## Post-Deployment Validation

### Functionality Tests
- [ ] Upload test image (real photo) - should detect as REAL
- [ ] Upload test image (AI-generated) - should detect as AI_GENERATED
- [ ] Test rate limiting (11+ requests in 1 min)
- [ ] Test file size limit (>10MB)
- [ ] Test unsupported format (.bmp, .gif)
- [ ] Test ensemble mode (verify multi-model voting)
- [ ] Test WASM mode (browser-side detection)

### Performance Tests
- [ ] Response time < 2s for typical image
- [ ] No memory leaks over 100+ requests
- [ ] CPU usage within normal limits
- [ ] Error rate < 0.1%

### Monitoring Setup
- [ ] Hotjar analytics working
- [ ] Server logs capturing errors
- [ ] Inference logs enabled
- [ ] Rate limit metrics tracked

---

## Rollback Plan

If issues detected after deployment:

### Quick Rollback
```bash
# Revert to previous deployment
vercel rollback

# Or redeploy previous version
git checkout <previous-commit>
vercel --prod
```

### Configuration Rollback
```bash
# Revert pipeline weights
git checkout HEAD~1 src/lib/pipeline/fusion.ts

# Redeploy
npm run build
vercel --prod
```

---

## Key Changes in This Release

### Pipeline Optimization
- ML model weight: 30% → 45% (67% increase in influence)
- Verdict thresholds: More sensitive (-5% across the board)
- All forensic modules: Enhanced thresholds

### New Features
- Multi-model ensemble support
- Smarter contradiction penalty
- 13 new AI generator signatures
- Better image preprocessing

### Bug Fixes
- Fixed ConfidenceDisplay positioning
- Fixed ExportButton variant type error
- Fixed wasmDetector missing uncertainty field

---

## Monitoring Metrics

### Performance Metrics
- **Response Time**: Target < 2s (p95)
- **Accuracy**: Target > 75% (matches benchmark)
- **Error Rate**: Target < 1%
- **Rate Limit Hits**: Monitor for abuse patterns

### Business Metrics
- **Daily Active Users**: Track trend
- **Images Analyzed**: Track volume
- **Detection Distribution**: AI vs Real vs Uncertain
- **Ensemble Usage**: Track multi-model adoption

---

## Support & Maintenance

### Log Locations
```
Production logs: Vercel dashboard
Inference logs: logs/inference/inference-YYYY-MM-DD.jsonl
Error logs: console.error in Vercel
```

### Common Issues

**Issue**: High error rate
**Solution**: Check model files, verify blob storage access

**Issue**: Slow responses
**Solution**: Check image sizes, verify preprocessing efficiency

**Issue**: Incorrect detections
**Solution**: Review benchmark results, adjust thresholds if needed

---

## Success Criteria

✅ **Build Status**: Passing
✅ **Tests**: All green
✅ **Performance**: < 2s response time
✅ **Accuracy**: > 75% on benchmark
✅ **Error Rate**: < 1%
✅ **Security**: Rate limiting + validation active

---

## Contact & Escalation

- **Technical Issues**: Check GitHub issues
- **Performance Issues**: Review Vercel metrics
- **Security Issues**: Immediate rollback + investigation

---

*Last Updated: 2026-01-20*
*Ready for Production Deployment: YES ✅*
