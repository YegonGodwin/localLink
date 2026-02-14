import recommendationClient from './recommendationClient.js';

class RecommendationMonitor {
  constructor() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      fallbackUsed: 0,
      averageResponseTime: 0,
      responseTimes: []
    };
    
    this.maxResponseTimes = 100; // Keep last 100 response times
  }

  recordRequest(success, responseTime, usedFallback = false) {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }
    
    if (usedFallback) {
      this.metrics.fallbackUsed++;
    }
    
    // Track response time
    this.metrics.responseTimes.push(responseTime);
    if (this.metrics.responseTimes.length > this.maxResponseTimes) {
      this.metrics.responseTimes.shift();
    }
    
    // Calculate average
    this.metrics.averageResponseTime = 
      this.metrics.responseTimes.reduce((a, b) => a + b, 0) / 
      this.metrics.responseTimes.length;
  }

  getMetrics() {
    const successRate = this.metrics.totalRequests > 0
      ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100
      : 0;
    
    const fallbackRate = this.metrics.totalRequests > 0
      ? (this.metrics.fallbackUsed / this.metrics.totalRequests) * 100
      : 0;

    return {
      totalRequests: this.metrics.totalRequests,
      successfulRequests: this.metrics.successfulRequests,
      failedRequests: this.metrics.failedRequests,
      fallbackUsed: this.metrics.fallbackUsed,
      successRate: successRate.toFixed(2) + '%',
      fallbackRate: fallbackRate.toFixed(2) + '%',
      averageResponseTime: Math.round(this.metrics.averageResponseTime) + 'ms',
      status: this.getHealthStatus(successRate, fallbackRate)
    };
  }

  getHealthStatus(successRate, fallbackRate) {
    if (successRate >= 95 && fallbackRate < 10) {
      return 'healthy';
    } else if (successRate >= 80 && fallbackRate < 30) {
      return 'degraded';
    } else {
      return 'unhealthy';
    }
  }

  async checkServiceHealth() {
    try {
      const startTime = Date.now();
      const health = await recommendationClient.healthCheck();
      const responseTime = Date.now() - startTime;
      
      return {
        available: health.status === 'healthy',
        responseTime: responseTime + 'ms',
        modelsLoaded: health.models_loaded || {},
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        available: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  reset() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      fallbackUsed: 0,
      averageResponseTime: 0,
      responseTimes: []
    };
  }
}

export default new RecommendationMonitor();
