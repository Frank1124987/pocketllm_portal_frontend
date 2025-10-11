/**
 * TelemetryService - Handles system monitoring and logging
 * Implements FR8: Telemetry & Logging
 */
export class TelemetryService {
  constructor() {
    this.logs = [];
    this.metrics = [];
    this.maxLogs = 1000;
    this.maxMetrics = 10000;
    this.startTime = Date.now();
  }

  /**
   * Log an event (FR8)
   */
  log(level, component, message, metadata = {}) {
    const logEntry = {
      timestamp: new Date(),
      level: level, // 'DEBUG', 'INFO', 'WARN', 'ERROR'
      component,
      message,
      metadata,
      uptime: Date.now() - this.startTime
    };

    this.logs.push(logEntry);

    // Keep logs under max size
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${level}][${component}] ${message}`, metadata);
    }

    return logEntry;
  }

  /**
   * Log an inference request (FR8)
   */
  logInferenceRequest(sessionId, prompt, response, latency, isCached) {
    return this.log('INFO', 'INFERENCE', 'Inference request processed', {
      sessionId,
      promptLength: prompt.length,
      responseLength: response?.length || 0,
      latency,
      isCached,
      tokensPerSecond: isCached ? 0 : (response?.split(' ').length * 1000 / latency).toFixed(2)
    });
  }

  /**
   * Log an API request (FR8)
   */
  logApiRequest(method, endpoint, statusCode, latency) {
    return this.log('INFO', 'API', `${method} ${endpoint}`, {
      statusCode,
      latency
    });
  }

  /**
   * Log an admin action (FR8)
   */
  logAdminAction(admin, action, target, changes = {}) {
    return this.log('INFO', 'ADMIN', `Admin action: ${action}`, {
      admin,
      action,
      target,
      changes
    });
  }

  /**
   * Log a system event (FR8)
   */
  logSystemEvent(event, details = {}) {
    return this.log('INFO', 'SYSTEM', event, details);
  }

  /**
   * Log an error (FR8)
   */
  logError(component, error, context = {}) {
    return this.log('ERROR', component, error.message, {
      ...context,
      stack: error.stack
    });
  }

  /**
   * Record a metric
   */
  recordMetric(name, value, tags = {}) {
    const metric = {
      timestamp: Date.now(),
      name,
      value,
      tags
    };

    this.metrics.push(metric);

    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    return metric;
  }

  /**
   * Record system metrics (FR8)
   */
  recordSystemMetrics(cpuUsage, memoryUsage, activeSessions, cacheHitRate) {
    this.recordMetric('cpu_usage', cpuUsage, { unit: 'percent' });
    this.recordMetric('memory_usage', memoryUsage, { unit: 'percent' });
    this.recordMetric('active_sessions', activeSessions, { unit: 'count' });
    this.recordMetric('cache_hit_rate', cacheHitRate, { unit: 'percent' });
  }

  /**
   * Get logs filtered by criteria
   */
  getLogs(filter = {}) {
    let filtered = this.logs;

    if (filter.level) {
      filtered = filtered.filter(l => l.level === filter.level);
    }

    if (filter.component) {
      filtered = filtered.filter(l => l.component === filter.component);
    }

    if (filter.limit) {
      filtered = filtered.slice(-filter.limit);
    }

    return filtered;
  }

  /**
   * Get logs as text for display
   */
  getLogsAsText(limit = 100) {
    return this.logs
      .slice(-limit)
      .map(log => {
        const time = log.timestamp.toLocaleTimeString();
        return `[${time}] [${log.level}] ${log.component}: ${log.message}`;
      })
      .join('\n');
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary() {
    const summary = {};

    this.metrics.forEach(metric => {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          values: [],
          min: null,
          max: null,
          avg: null,
          latest: null
        };
      }

      summary[metric.name].values.push(metric.value);
      summary[metric.name].latest = metric.value;
    });

    // Calculate statistics
    for (const name in summary) {
      const values = summary[name].values;
      if (values.length > 0) {
        summary[name].min = Math.min(...values);
        summary[name].max = Math.max(...values);
        summary[name].avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
      }
    }

    return summary;
  }

  /**
   * Get audit trail for admin actions
   */
  getAuditTrail(limit = 100) {
    return this.getLogs({
      component: 'ADMIN',
      limit
    });
  }

  /**
   * Generate a report
   */
  generateReport() {
    const uptime = Date.now() - this.startTime;
    const infLogs = this.logs.filter(l => l.component === 'INFERENCE');
    const errorLogs = this.logs.filter(l => l.level === 'ERROR');

    return {
      uptime: `${(uptime / 1000 / 60).toFixed(2)} minutes`,
      totalLogs: this.logs.length,
      totalMetrics: this.metrics.length,
      inferences: infLogs.length,
      errors: errorLogs.length,
      averageLatency: infLogs.length > 0
        ? (infLogs.reduce((sum, l) => sum + (l.metadata.latency || 0), 0) / infLogs.length).toFixed(2)
        : 0,
      metricsSummary: this.getMetricsSummary(),
      recentErrors: errorLogs.slice(-5)
    };
  }

  /**
   * Clear logs (admin only)
   */
  clearLogs() {
    const count = this.logs.length;
    this.logs = [];
    this.log('INFO', 'SYSTEM', `Logs cleared (${count} entries removed)`);
    return count;
  }

  /**
   * Clear metrics (admin only)
   */
  clearMetrics() {
    const count = this.metrics.length;
    this.metrics = [];
    return count;
  }

  /**
   * Export logs as JSON
   */
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics() {
    return JSON.stringify(this.metrics, null, 2);
  }

  /**
   * Get system health status based on metrics
   */
  getHealthStatus() {
    const summary = this.getMetricsSummary();
    const cpuUsage = summary.cpu_usage?.latest || 0;
    const memoryUsage = summary.memory_usage?.latest || 0;
    const errorCount = this.logs.filter(l => l.level === 'ERROR').length;

    let status = 'healthy';
    const issues = [];

    if (cpuUsage > 90) {
      status = 'degraded';
      issues.push('CPU usage critically high');
    } else if (cpuUsage > 80) {
      issues.push('CPU usage elevated');
    }

    if (memoryUsage > 90) {
      status = 'degraded';
      issues.push('Memory usage critically high');
    } else if (memoryUsage > 80) {
      issues.push('Memory usage elevated');
    }

    if (errorCount > 10) {
      status = 'degraded';
      issues.push('High error rate detected');
    }

    return {
      status,
      cpuUsage,
      memoryUsage,
      errorCount,
      issues
    };
  }
}
