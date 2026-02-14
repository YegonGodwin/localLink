# Recommendation Engine Verification Guide

## Quick Answer: How to Verify Your Models Work

### Step 1: Basic Verification (5 minutes)
```bash
cd recommendation-service
python test_recommendations.py
```

**What to look for:**
- ✓ All models loaded
- ✓ Recommendations generated
- ✓ No errors

### Step 2: Production Evaluation (After collecting data)
```bash
python evaluate_production.py
```

**What to look for:**
- Precision@10 > 0.2
- NDCG@10 > 0.4
- Hit Rate@10 > 0.5

### Step 3: Monitor in Production
```bash
curl -H "Authorization: Bearer <admin_token>" \
  http://localhost:5000/api/recommendations/metrics
```

**What to look for:**
- Success rate > 90%
- Fallback rate < 20%
- Average response time < 500ms

## Expected Metrics for Good Recommendations

### Minimum Acceptable (Cold Start - First Month)
```
Precision@10:  0.10 - 0.20
Recall@10:     0.10 - 0.20
NDCG@10:       0.30 - 0.40
Hit Rate@10:   0.40 - 0.60
Diversity:     0.40 - 0.60
```

### Good Performance (After 3 Months)
```
Precision@10:  0.20 - 0.40
Recall@10:     0.20 - 0.40
NDCG@10:       0.50 - 0.70
Hit Rate@10:   0.70 - 0.85
Diversity:     0.50 - 0.70
```

### Excellent Performance (Mature System)
```
Precision@10:  0.40+
Recall@10:     0.40+
NDCG@10:       0.70+
Hit Rate@10:   0.85+
Diversity:     0.60+
```

## Key Metrics Explained Simply

### 1. Precision@10
**Question:** "Of 10 services I recommended, how many did the user actually like?"

**Example:**
- Recommended 10 services
- User booked 3 of them
- Precision = 3/10 = 0.30 (30%)

**Good value:** > 0.20 (20% of recommendations are relevant)

### 2. NDCG@10
**Question:** "Are the best recommendations at the top?"

**Why it matters:** Better to show the perfect service first than at position 10

**Good value:** > 0.50

### 3. Hit Rate@10
**Question:** "Did I recommend at least ONE service the user liked?"

**Example:**
- 100 users
- 75 found at least one relevant service in top 10
- Hit Rate = 75/100 = 0.75 (75%)

**Good value:** > 0.60 (60% of users find something relevant)

### 4. Diversity
**Question:** "Are my recommendations varied or all the same?"

**Example:**
- Bad: 10 plumbing services, all similar
- Good: Mix of plumbing, electrical, cleaning, etc.

**Good value:** > 0.50

## How to Interpret Results

### Scenario 1: Everything is Low
```
Precision: 0.05
NDCG: 0.15
Hit Rate: 0.20
```

**Diagnosis:** Model not working or not enough training data

**Solutions:**
1. Check if models are actually trained (not random)
2. Verify training data quality
3. Wait for more user interactions
4. Use fallback recommendations

### Scenario 2: Good Accuracy, Low Diversity
```
Precision: 0.35
NDCG: 0.65
Diversity: 0.25
```

**Diagnosis:** Model is too focused, recommending similar items

**Solutions:**
1. Add diversity penalty to model
2. Use hybrid approach
3. Add random exploration (10% random items)

### Scenario 3: High Diversity, Low Accuracy
```
Precision: 0.10
Diversity: 0.80
```

**Diagnosis:** Recommendations too random

**Solutions:**
1. Reduce exploration rate
2. Increase model confidence threshold
3. Use more user history

## Testing Workflow

### Week 1: Setup & Basic Testing
```bash
# 1. Test model loading
python test_recommendations.py

# 2. Check API endpoints
curl http://localhost:8001/health

# 3. Test through backend
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/recommendations/services
```

**Expected:** Models load, API responds, no errors

### Week 2-4: Collect Data
- Let users browse and book services
- Need minimum 50-100 bookings for meaningful evaluation
- Monitor fallback usage rate

### Month 2: First Evaluation
```bash
python evaluate_production.py
```

**Expected:**
- Precision@10: 0.10-0.15
- Hit Rate@10: 0.40-0.50
- Some models may perform better than others

### Month 3+: Optimization
- Compare models
- Choose best performer
- Retrain with new data
- A/B test improvements

## Monitoring in Production

### API Endpoint
```
GET /api/recommendations/metrics
Authorization: Bearer <admin_token>
```

### Response
```json
{
  "success": true,
  "data": {
    "metrics": {
      "totalRequests": 1523,
      "successfulRequests": 1450,
      "failedRequests": 73,
      "fallbackUsed": 89,
      "successRate": "95.21%",
      "fallbackRate": "5.84%",
      "averageResponseTime": "245ms",
      "status": "healthy"
    },
    "serviceHealth": {
      "available": true,
      "responseTime": "12ms",
      "modelsLoaded": {
        "content_based": true,
        "collaborative": true,
        "hybrid": true
      }
    }
  }
}
```

### Health Status Indicators

**Healthy:**
- Success rate > 95%
- Fallback rate < 10%
- Response time < 300ms

**Degraded:**
- Success rate 80-95%
- Fallback rate 10-30%
- Response time 300-500ms

**Unhealthy:**
- Success rate < 80%
- Fallback rate > 30%
- Response time > 500ms

## Red Flags to Watch For

### 🚨 Critical Issues
1. **Models not loading** - Check file paths and formats
2. **All recommendations identical** - Model not trained properly
3. **Fallback rate > 50%** - Recommendation service down
4. **Response time > 1s** - Performance issue

### ⚠️ Warning Signs
1. **Precision dropping over time** - Need retraining
2. **Low diversity (< 0.3)** - Too focused
3. **Coverage < 0.2** - Many services never recommended
4. **Fallback rate increasing** - Service becoming unstable

## Business Metrics to Track

Beyond technical metrics, track:

### Conversion Metrics
- Click-through rate on recommendations
- Booking rate from recommendations
- Revenue from recommended services

### User Engagement
- Time spent browsing recommendations
- Return rate of users who used recommendations
- User satisfaction scores

### Provider Fairness
- Distribution of recommendations across providers
- New provider visibility
- Revenue distribution

## When to Retrain Models

Retrain when:
1. **Monthly schedule** - Regular updates with new data
2. **Metrics drop 10%+** - Performance degradation
3. **New services added** - Expand coverage
4. **User behavior changes** - Seasonal patterns

## Common Questions

**Q: My metrics are low, is the model broken?**
A: Low metrics are normal for the first month. Need 100+ bookings for meaningful evaluation.

**Q: Which model should I use?**
A: Start with hybrid. After collecting data, run `evaluate_production.py` to compare.

**Q: How long until I see good metrics?**
A: 2-3 months with active users. Depends on booking volume.

**Q: Should I optimize for precision or diversity?**
A: Balance both. High precision with low diversity = boring. High diversity with low precision = random.

**Q: What if recommendation service is down?**
A: System automatically falls back to popular services. Monitor fallback rate.

**Q: How often should I check metrics?**
A: Daily for first month, weekly after that. Set up alerts for critical issues.

## Files Created

### Testing & Evaluation
- `recommendation-service/test_recommendations.py` - Basic verification
- `recommendation-service/evaluate_production.py` - Production evaluation
- `recommendation-service/evaluator.py` - Metrics calculation
- `recommendation-service/TESTING_GUIDE.md` - Detailed guide

### Monitoring
- `backend/utils/recommendationMonitor.js` - Track requests and performance
- `GET /api/recommendations/metrics` - Monitoring endpoint

## Next Steps

1. ✅ Run basic tests: `python test_recommendations.py`
2. ⏳ Collect booking data (2-4 weeks)
3. 📊 Run production evaluation: `python evaluate_production.py`
4. 🎯 Choose best model based on NDCG@10
5. 📈 Monitor metrics endpoint weekly
6. 🔄 Retrain monthly with new data

## Support

If metrics are consistently low after 2 months:
1. Check training data quality
2. Verify model training process
3. Review feature engineering
4. Consider simpler baseline (popularity-based)
5. Collect more diverse user interactions
