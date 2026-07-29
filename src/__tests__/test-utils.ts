/**
 * Test utilities for MongoDB connection and cleanup
 */
import mongoose from 'mongoose';
import Subscription from '@/models/Subscription';
import User from '@/models/User';

/**
 * Clean up test data
 */
export const cleanupTestData = async (clientTransactionId?: string) => {
  if (clientTransactionId) {
    await Subscription.deleteMany({
      clientTransactionId: { $regex: '^SUB-TEST-' },
    });
  }
};

/**
 * Close MongoDB connection
 */
export const closeDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
};

/**
 * Get or create test user
 */
export const getOrCreateTestUser = async () => {
  let user = await User.findOne({ email: 'montuviorestaurante@gmail.com' });
  
  if (!user) {
    user = await User.create({
      id: 'test-user-' + Date.now(),
      email: 'test@chefcito.com',
      name: 'Test User',
    });
  }

  return user;
};
