import { Injectable } from '@angular/core';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private currentLogLevel: LogLevel = LogLevel.INFO;

  constructor() {
    // Set log level based on environment
    if (this.isProduction()) {
      this.currentLogLevel = LogLevel.WARN;
    }
  }

  private isProduction(): boolean {
    return !window.location.hostname.includes('localhost');
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.currentLogLevel;
  }

  private formatMessage(level: string, message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${context}]` : '';
    return `${timestamp} ${level}${contextStr}: ${message}`;
  }

  error(message: string, error?: any, context?: string): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const formattedMessage = this.formatMessage('ERROR', message, context);
      console.error(formattedMessage, error);
    }
  }

  warn(message: string, context?: string): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const formattedMessage = this.formatMessage('WARN', message, context);
      console.warn(formattedMessage);
    }
  }

  info(message: string, context?: string): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const formattedMessage = this.formatMessage('INFO', message, context);
      console.log(formattedMessage);
    }
  }

  debug(message: string, data?: any, context?: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const formattedMessage = this.formatMessage('DEBUG', message, context);
      console.log(formattedMessage, data);
    }
  }

  // Utility methods for common admin operations
  logCategoryOperation(operation: string, categoryData?: any): void {
    this.info(`Category ${operation}`, 'CategoryManagement');
    if (categoryData) {
      this.debug(`Category ${operation} data:`, categoryData, 'CategoryManagement');
    }
  }

  logPostOperation(operation: string, postData?: any): void {
    this.info(`Post ${operation}`, 'PostManagement');
    if (postData) {
      this.debug(`Post ${operation} data:`, postData, 'PostManagement');
    }
  }

  logMediaOperation(operation: string, mediaType?: string, filename?: string): void {
    const details = mediaType && filename ? ` (${mediaType}: ${filename})` : '';
    this.info(`Media ${operation}${details}`, 'MediaManagement');
  }
}