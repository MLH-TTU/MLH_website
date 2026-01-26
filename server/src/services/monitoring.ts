/**
 * Monitoring Service
 * 
 * Provides system monitoring, health checks, and performance metrics
 * for production deployment monitoring and alerting.
 */

import { PrismaClient } from '@prisma/client';
import { monitoringConfig } from '../config/security.js';
import { logHealthCheck, logPerformance } from '../config/logger.js';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  checks: {
    database: HealthStatus;
    fileSystem: HealthStatus;
    memory: HealthStatus;
    uptime: HealthStatus;
  };
  metrics?: SystemMetrics;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  message?: string;
  responseTime?: number;
  details?: any;
}

export interface SystemMetrics {
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
  };
  database: {
    connections: number;
    queryTime: number;
  };
  requests: {
    total: number;
    errors: number;
    averageResponseTime: number;
  };
}

export class MonitoringService {
  private prisma: PrismaClient;
  private startTime: number;
  private requestMetrics: {
    total: number;
    errors: number;
    totalResponseTime: number;
  };

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
    this.startTime = Date.now();
    this.requestMetrics = {
      total: 0,
      errors: 0,
      totalResponseTime: 0
    };
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const [database, fileSystem, memory, uptime] = await Promise.all([
        this.checkDatabase(),
        this.checkFileSystem(),
        this.checkMemory(),
        this.checkUptime()
      ]);

      const status = this.determineOverallStatus([database, fileSystem, memory, uptime]);
      
      const result: HealthCheckResult = {
        status,
        timestamp: new Date().toISOString(),
        checks: {
          database,
          fileSystem,
          memory,
          uptime
        }
      };

      if (monitoringConfig.metricsEnabled) {
        result.metrics = await this.getSystemMetrics();
      }

      const duration = Date.now() - startTime;
      logHealthCheck(status, { ...result, duration: `${duration}ms` });

      return result;
    } catch (error) {
      const result: HealthCheckResult = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {
          database: { status: 'unhealthy', message: 'Health check failed' },
          fileSystem: { status: 'unhealthy', message: 'Health check failed' },
          memory: { status: 'unhealthy', message: 'Health check failed' },
          uptime: { status: 'unhealthy', message: 'Health check failed' }
        }
      };

      logHealthCheck('unhealthy', { error: error instanceof Error ? error.message : 'Unknown error' });
      return result;
    }
  }

  /**
   * Check database connectivity and performance
   */
  private async checkDatabase(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      // Test basic connectivity
      await this.prisma.$connect();
      
      // Test query performance
      const queryStart = Date.now();
      await this.prisma.user.count();
      const queryTime = Date.now() - queryStart;
      
      const responseTime = Date.now() - startTime;
      
      if (queryTime > 1000) {
        return {
          status: 'unhealthy',
          message: 'Database queries are slow',
          responseTime,
          details: { queryTime: `${queryTime}ms` }
        };
      }

      return {
        status: 'healthy',
        message: 'Database is responsive',
        responseTime,
        details: { queryTime: `${queryTime}ms` }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Database connection failed',
        responseTime: Date.now() - startTime,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Check file system accessibility
   */
  private async checkFileSystem(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Check upload directory
      const uploadDir = process.env.UPLOAD_DIR || 'uploads';
      
      try {
        await fs.access(uploadDir);
      } catch {
        // Try to create directory if it doesn't exist
        await fs.mkdir(uploadDir, { recursive: true });
      }

      // Test write permissions
      const testFile = path.join(uploadDir, '.health-check');
      await fs.writeFile(testFile, 'health-check');
      await fs.unlink(testFile);

      return {
        status: 'healthy',
        message: 'File system is accessible',
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'File system access failed',
        responseTime: Date.now() - startTime,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Check memory usage
   */
  private async checkMemory(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      const memoryUsage = process.memoryUsage();
      const totalMemory = memoryUsage.heapTotal;
      const usedMemory = memoryUsage.heapUsed;
      const memoryPercentage = (usedMemory / totalMemory) * 100;

      const status = memoryPercentage > 90 ? 'unhealthy' : 'healthy';
      const message = status === 'healthy' 
        ? 'Memory usage is normal' 
        : 'Memory usage is high';

      return {
        status,
        message,
        responseTime: Date.now() - startTime,
        details: {
          used: `${Math.round(usedMemory / 1024 / 1024)}MB`,
          total: `${Math.round(totalMemory / 1024 / 1024)}MB`,
          percentage: `${memoryPercentage.toFixed(1)}%`
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Memory check failed',
        responseTime: Date.now() - startTime,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Check system uptime
   */
  private async checkUptime(): Promise<HealthStatus> {
    const uptime = Date.now() - this.startTime;
    const uptimeSeconds = Math.floor(uptime / 1000);
    
    return {
      status: 'healthy',
      message: 'System is running',
      responseTime: 0,
      details: {
        uptime: `${uptimeSeconds}s`,
        startTime: new Date(this.startTime).toISOString()
      }
    };
  }

  /**
   * Get comprehensive system metrics
   */
  private async getSystemMetrics(): Promise<SystemMetrics> {
    const memoryUsage = process.memoryUsage();
    const uptime = Date.now() - this.startTime;

    // Get database metrics
    let dbConnections = 0;
    let dbQueryTime = 0;
    
    try {
      const queryStart = Date.now();
      await this.prisma.user.count();
      dbQueryTime = Date.now() - queryStart;
      // Note: Prisma doesn't expose connection pool metrics directly
      dbConnections = 1; // Placeholder
    } catch {
      // Database metrics unavailable
    }

    return {
      uptime: Math.floor(uptime / 1000),
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
      },
      cpu: {
        usage: 0 // Would need additional library for CPU metrics
      },
      database: {
        connections: dbConnections,
        queryTime: dbQueryTime
      },
      requests: {
        total: this.requestMetrics.total,
        errors: this.requestMetrics.errors,
        averageResponseTime: this.requestMetrics.total > 0 
          ? Math.round(this.requestMetrics.totalResponseTime / this.requestMetrics.total)
          : 0
      }
    };
  }

  /**
   * Record request metrics
   */
  recordRequest(responseTime: number, isError: boolean = false): void {
    this.requestMetrics.total++;
    this.requestMetrics.totalResponseTime += responseTime;
    
    if (isError) {
      this.requestMetrics.errors++;
    }
  }

  /**
   * Get request metrics
   */
  getRequestMetrics() {
    return { ...this.requestMetrics };
  }

  /**
   * Reset request metrics
   */
  resetRequestMetrics(): void {
    this.requestMetrics = {
      total: 0,
      errors: 0,
      totalResponseTime: 0
    };
  }

  /**
   * Determine overall system status
   */
  private determineOverallStatus(checks: HealthStatus[]): 'healthy' | 'unhealthy' {
    return checks.every(check => check.status === 'healthy') ? 'healthy' : 'unhealthy';
  }

  /**
   * Start periodic health checks
   */
  startPeriodicHealthChecks(): NodeJS.Timeout | null {
    if (!monitoringConfig.healthCheckInterval) return null;

    return setInterval(async () => {
      const result = await this.performHealthCheck();
      
      if (result.status === 'unhealthy') {
        console.warn('Health check failed:', result);
        // Here you could integrate with alerting systems
      }
    }, monitoringConfig.healthCheckInterval);
  }

  /**
   * Performance monitoring middleware
   */
  performanceMiddleware() {
    return (req: any, res: any, next: any) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const isError = res.statusCode >= 400;
        
        this.recordRequest(duration, isError);
        
        if (monitoringConfig.performanceMonitoring) {
          logPerformance(`${req.method} ${req.path}`, duration, {
            status: res.statusCode,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });
        }
      });

      next();
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.prisma.$disconnect();
    } catch (error) {
      console.error('Error during monitoring service cleanup:', error);
    }
  }
}