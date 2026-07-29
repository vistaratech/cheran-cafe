// Jest setup file
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

console.log('🔧 Loaded MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');
console.log('🔧 Loaded PAYPHONE_TOKEN:', process.env.PAYPHONE_TOKEN ? '✅ Set' : '❌ Missing');

// Mock debug package to avoid console noise
jest.mock('debug', () => {
  return () => (...args: any[]) => {
    // Uncomment to see debug logs
    // console.log(...args);
  };
});

// Global test timeout
jest.setTimeout(30000);
