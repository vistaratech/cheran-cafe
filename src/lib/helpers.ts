import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { type Order, type OrderItem } from "@/lib/types";

export function buildApiUrl(path: string, restaurantId?: string): string {
  if (!restaurantId) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}restaurantId=${encodeURIComponent(restaurantId)}`;
}

/**
 * Utility function to merge class names with Tailwind CSS
 * Combines clsx and twMerge for optimal class name handling
 * 
 * @param inputs - Class values to merge
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to a relative time string (e.g., "2 hrs")
 * @param date - The date to format
 * @param language - The language to use for formatting ('en' or 'es')
 * @returns A formatted time ago string with abbreviated units
 */
export function formatTimeAgo(date: Date, language: 'en' | 'es' = 'en'): string {
  try {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      // Less than a minute - show "1 min" instead of seconds
      return language === 'es' ? `1 min` : `1 min`;
    } else if (diffInSeconds < 3600) {
      // Less than an hour
      const minutes = Math.floor(diffInSeconds / 60);
      return language === 'es' ? `${minutes} min` : `${minutes} min`;
    } else if (diffInSeconds < 86400) {
      // Less than a day
      const hours = Math.floor(diffInSeconds / 3600);
      return language === 'es' ? `${hours} hr` : `${hours} hr`;
    } else {
      // A day or more
      const days = Math.floor(diffInSeconds / 86400);
      return language === 'es' ? `${days} d` : `${days} d`;
    }
  } catch (error) {
    // Fallback to a simple date format if there's an error
    return format(date, 'PPp');
  }
}

/**
 * Calculate the total amount for an order
 * 
 * @param order - The order to calculate total for
 * @returns The total amount for the order
 */
/**
 * Calculate the total amount for a single order item including extras
 * 
 * @param item - The order item to calculate total for
 * @returns The total amount for the order item
 */
export const getItemTotal = (item: OrderItem): number => {
    const extrasTotal = item.selectedExtras?.reduce((acc, extra) => acc + extra.price, 0) || 0;
    return (item.menuItem.price + extrasTotal) * item.quantity;
};

/**
 * Calculate the total amount for an entire order
 * 
 * @param order - The order to calculate total for
 * @returns The total amount for the order
 */
export const getOrderTotal = (order: Order): number => {
    return order.items.reduce((total, item) => total + getItemTotal(item), 0);
};

// Debug utilities for error reporting and debugging

export interface ErrorContext {
  operation?: string;
  timestamp?: string;
  userId?: string;
  endpoint?: string;
  [key: string]: any;
}

export interface ErrorResponse {
  message: string;
  stack?: string;
  context?: ErrorContext;
  timestamp: string;
}

class ErrorReporter {
  createErrorResponse(error: any, context?: ErrorContext): ErrorResponse {
    return {
      message: error.message || 'An unknown error occurred',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      context,
      timestamp: new Date().toISOString()
    };
  }
  
  logError(error: any, context?: ErrorContext) {
    const errorResponse = this.createErrorResponse(error, context);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Application Error:', errorResponse);
    }
    
    // In production, you might want to send this to a logging service
    // For example: sendToLoggingService(errorResponse);
  }
  
  // Utility function to wrap async operations with error handling
  async withErrorHandling<T>(
    operation: () => Promise<T>, 
    context?: ErrorContext
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      this.logError(error, context);
      throw error;
    }
  }
}

export const errorReporter = new ErrorReporter();

// Utility functions for debugging
export function logDebug(message: string, data?: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`, data || '');
  }
}

export function logError(error: any, context?: ErrorContext) {
  errorReporter.logError(error, context);
}

export function formatError(error: any): string {
  if (error === null) {
    return 'null';
  }

  if (error === undefined) {
    return 'undefined';
  }

  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    return `${error.message}\n${error.stack || ''}`;
  }
  
  return JSON.stringify(error);
}

import debug from 'debug';

// Consolidated debug logger factory - single source of truth
const createDebugger = (namespace: string) => debug(`chefcito:${namespace}`);

// Application debug loggers
export const debugInventory = createDebugger('inventory');
export const debugOrders = createDebugger('orders');
export const debugAPI = createDebugger('api');
export const debugDB = createDebugger('db');
export const debugAuth = createDebugger('auth');
export const debugMenu = createDebugger('menu');
export const debugPayments = createDebugger('payments');
export const debugWorkstations = createDebugger('workstations');
export const debugReports = createDebugger('reports');
export const debugKDS = createDebugger('kds');

// Enable all chefcito debug logs
if (process.env.NODE_ENV === 'development') {
  debug.enable('chefcito:*');
}