/**
 * PayPhone Payment Flow - Unit & Integration Tests
 * 
 * Tests the complete subscription payment flow:
 * 1. Initialize payment (POST /api/payphone/init)
 * 2. Payment confirmation (POST /api/payphone/confirm)
 * 3. Subscription status check (GET /api/subscriptions/status)
 * 4. Complete payment flow integration
 * 5. Edge cases and error handling
 * 
 * Uses mocked MongoDB to avoid database dependency during tests
 */

// Mock MongoDB models
const mockSubscription = {
  findOne: jest.fn(),
  create: jest.fn(),
  deleteMany: jest.fn(),
  updateMany: jest.fn(),
};

const mockRestaurant = {
  findOne: jest.fn(),
  create: jest.fn(),
  findOneAndUpdate: jest.fn(),
};

const mockMongoose = {
  connection: {
    readyState: 1, // Already connected
  },
};

// Mock models before imports
jest.mock('@/models/Subscription', () => mockSubscription);
jest.mock('@/models/Restaurant', () => mockRestaurant);
jest.mock('mongoose', () => mockMongoose);

// Mock database-service
jest.mock('@/lib/database-service', () => ({
  initializeDatabase: jest.fn().mockResolvedValue(undefined),
}));

// Mock fetch for PayPhone API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Import route handlers after mocking
import { POST as confirmPayment } from '@/app/api/payphone/confirm/route';
import { GET as checkSubscriptionStatus } from '@/app/api/subscriptions/status/route';

describe('PayPhone Payment Flow', () => {
  const TEST_CLIENT_TX_ID = 'SUB-TEST-1234567890-abcdef';
  const TEST_PAYPHONE_ID = '83288286';
  const TEST_RESTAURANT_ID = 'test-restaurant-001';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set environment variables
    process.env.PAYPHONE_TOKEN = 'test_token';
    process.env.PAYPHONE_STORE_ID = 'test_store_id';

    // Default mocks
    mockSubscription.findOne.mockResolvedValue(null);
    mockSubscription.create.mockResolvedValue({
      _id: 'mock-sub-id',
      clientTransactionId: TEST_CLIENT_TX_ID,
      restaurantId: TEST_RESTAURANT_ID,
      amount: 499,
      status: 'pending',
      toObject: () => ({
        _id: 'mock-sub-id',
        clientTransactionId: TEST_CLIENT_TX_ID,
        restaurantId: TEST_RESTAURANT_ID,
        amount: 499,
        status: 'pending',
      }),
    });

    mockRestaurant.findOne.mockResolvedValue(null);
    mockRestaurant.findOneAndUpdate.mockResolvedValue({});
  });

  describe('1. Payment Confirmation Endpoint', () => {
    
    it('should activate subscription when PayPhone returns statusCode=3', async () => {
      // Mock successful PayPhone Confirm API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          statusCode: '3',
          status: 'Approved',
          amount: 499,
          reference: 'Suscripción Pro Mensual',
          transactionId: 'PP-' + Date.now(),
        }),
      });

      // Mock existing subscription
      const mockSub: any = {
        _id: 'mock-sub-id',
        clientTransactionId: TEST_CLIENT_TX_ID,
        restaurantId: TEST_RESTAURANT_ID,
        amount: 499,
        status: 'pending',
        save: jest.fn().mockResolvedValue(true),
      };
      mockSubscription.findOne.mockResolvedValue(mockSub);

      // Mock restaurant
      const mockRestaurantObj = {
        id: TEST_RESTAURANT_ID,
        membership: 'free',
        save: jest.fn().mockResolvedValue(true),
      };
      mockRestaurant.findOne.mockResolvedValue(mockRestaurantObj);

      const mockRequest = {
        json: async () => ({
          clientTransactionId: TEST_CLIENT_TX_ID,
          id: TEST_PAYPHONE_ID,
        }),
      } as any;

      const response = await confirmPayment(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('active');
      expect(data.statusCode).toBe('3');

      // Verify subscription save was called
      expect(mockSub.save).toHaveBeenCalled();
      expect(mockSub.status).toBe('active');
      // payphoneTransactionId should come from PayPhone response, not request
      expect(mockSub.payphoneTransactionId).toContain('PP-');

      // Verify restaurant membership update
      expect(mockRestaurantObj.membership).toBe('pro');
      expect(mockRestaurantObj.save).toHaveBeenCalled();

      console.log('✅ Test 1 passed: Subscription activated successfully');
    });

    it('should cancel subscription when PayPhone returns statusCode=2', async () => {
      // Mock cancelled PayPhone response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          statusCode: '2',
          status: 'Canceled',
          amount: 499,
        }),
      });

      const mockSub: any = {
        _id: 'mock-sub-id',
        clientTransactionId: TEST_CLIENT_TX_ID,
        restaurantId: TEST_RESTAURANT_ID,
        amount: 499,
        status: 'pending',
        save: jest.fn().mockResolvedValue(true),
      };
      mockSubscription.findOne.mockResolvedValue(mockSub);

      const mockRequest = {
        json: async () => ({
          clientTransactionId: TEST_CLIENT_TX_ID,
          id: TEST_PAYPHONE_ID,
        }),
      } as any;

      const response = await confirmPayment(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('cancelled');
      expect(data.statusCode).toBe('2');

      expect(mockSub.status).toBe('cancelled');
      expect(mockSub.cancelledAt).toBeTruthy();
      expect(mockSub.cancellationReason).toContain('cancelado');
      expect(mockSub.save).toHaveBeenCalled();

      console.log('✅ Test 2 passed: Subscription cancelled correctly');
    });

    it('should be idempotent - skip PayPhone API for active subscription', async () => {
      const mockSub: any = {
        _id: 'mock-sub-id',
        clientTransactionId: TEST_CLIENT_TX_ID,
        restaurantId: TEST_RESTAURANT_ID,
        status: 'active',
        save: jest.fn(),
      };
      mockSubscription.findOne.mockResolvedValue(mockSub);

      const mockRequest = {
        json: async () => ({
          clientTransactionId: TEST_CLIENT_TX_ID,
          id: TEST_PAYPHONE_ID,
        }),
      } as any;

      const response = await confirmPayment(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('active');
      expect(data.statusCode).toBe('3');
      expect(mockFetch).not.toHaveBeenCalled(); // Should NOT call PayPhone API
      expect(mockSub.save).not.toHaveBeenCalled(); // Should NOT save

      console.log('✅ Test 3 passed: Idempotency works correctly');
    });

    it('should handle subscription not found (404)', async () => {
      mockSubscription.findOne.mockResolvedValue(null);

      const mockRequest = {
        json: async () => ({
          clientTransactionId: 'NONEXISTENT-' + Date.now(),
          id: TEST_PAYPHONE_ID,
        }),
      } as any;

      const response = await confirmPayment(mockRequest);

      expect(response.status).toBe(404);

      console.log('✅ Test 4 passed: Missing subscription returns 404');
    });

    it('should handle PayPhone API failure (500) gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      const mockSub: any = {
        _id: 'mock-sub-id',
        clientTransactionId: TEST_CLIENT_TX_ID,
        restaurantId: TEST_RESTAURANT_ID,
        status: 'pending',
        save: jest.fn(),
      };
      mockSubscription.findOne.mockResolvedValue(mockSub);

      const mockRequest = {
        json: async () => ({
          clientTransactionId: TEST_CLIENT_TX_ID,
          id: TEST_PAYPHONE_ID,
        }),
      } as any;

      const response = await confirmPayment(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('pending'); // Should remain pending
      expect(data.statusCode).toBeNull();
      expect(mockSub.save).not.toHaveBeenCalled(); // Should NOT save if PayPhone failed

      console.log('✅ Test 5 passed: Handles PayPhone API failure gracefully');
    });

    it('should handle network timeout gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('The operation was aborted'));

      const mockSub: any = {
        _id: 'mock-sub-id',
        clientTransactionId: TEST_CLIENT_TX_ID,
        restaurantId: TEST_RESTAURANT_ID,
        status: 'pending',
        save: jest.fn(),
      };
      mockSubscription.findOne.mockResolvedValue(mockSub);

      const mockRequest = {
        json: async () => ({
          clientTransactionId: TEST_CLIENT_TX_ID,
          id: TEST_PAYPHONE_ID,
        }),
      } as any;

      const response = await confirmPayment(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('pending');
      expect(data.message).toContain('Could not confirm');

      console.log('✅ Test 6 passed: Handles network timeout gracefully');
    });

    it('should reject requests without clientTransactionId (400)', async () => {
      const mockRequest = {
        json: async () => ({
          id: TEST_PAYPHONE_ID,
          // Missing clientTransactionId
        }),
      } as any;

      const response = await confirmPayment(mockRequest);

      expect(response.status).toBe(400);

      console.log('✅ Test 7 passed: Validates required fields');
    });

    it('should handle invalid JSON payload (400)', async () => {
      const mockRequest = {
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as any;

      const response = await confirmPayment(mockRequest);

      expect(response.status).toBe(400);

      console.log('✅ Test 8 passed: Handles invalid JSON gracefully');
    });

    it('should save payphoneTransactionId from response', async () => {
      const payphoneTxId = 'PP-RESPONSE-' + Date.now();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          statusCode: '3',
          status: 'Approved',
          amount: 499,
          transactionId: payphoneTxId,
        }),
      });

      const mockSub: any = {
        _id: 'mock-sub-id',
        clientTransactionId: TEST_CLIENT_TX_ID,
        restaurantId: TEST_RESTAURANT_ID,
        status: 'pending',
        save: jest.fn().mockResolvedValue(true),
      };
      mockSubscription.findOne.mockResolvedValue(mockSub);

      const mockRestaurantObj = {
        id: TEST_RESTAURANT_ID,
        membership: 'free',
        save: jest.fn().mockResolvedValue(true),
      };
      mockRestaurant.findOne.mockResolvedValue(mockRestaurantObj);

      const mockRequest = {
        json: async () => ({
          clientTransactionId: TEST_CLIENT_TX_ID,
          id: TEST_PAYPHONE_ID,
        }),
      } as any;

      await confirmPayment(mockRequest);

      expect(mockSub.payphoneTransactionId).toBe(payphoneTxId);
      expect(mockSub.save).toHaveBeenCalled();

      console.log('✅ Test 9 passed: Saves payphoneTransactionId correctly');
    });

    it('should fallback to request id if PayPhone does not return transactionId', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          statusCode: '3',
          status: 'Approved',
          amount: 499,
          // No transactionId in response
        }),
      });

      const mockSub: any = {
        _id: 'mock-sub-id',
        clientTransactionId: TEST_CLIENT_TX_ID,
        restaurantId: TEST_RESTAURANT_ID,
        status: 'pending',
        save: jest.fn().mockResolvedValue(true),
      };
      mockSubscription.findOne.mockResolvedValue(mockSub);

      const mockRestaurantObj = {
        id: TEST_RESTAURANT_ID,
        membership: 'free',
        save: jest.fn().mockResolvedValue(true),
      };
      mockRestaurant.findOne.mockResolvedValue(mockRestaurantObj);

      const mockRequest = {
        json: async () => ({
          clientTransactionId: TEST_CLIENT_TX_ID,
          id: TEST_PAYPHONE_ID,
        }),
      } as any;

      await confirmPayment(mockRequest);

      expect(mockSub.payphoneTransactionId).toBe(TEST_PAYPHONE_ID);
      expect(mockSub.save).toHaveBeenCalled();

      console.log('✅ Test 10 passed: Fallback to request id works');
    });
  });

  describe('2. Subscription Status Check Endpoint', () => {
    
    it('should return subscription for valid clientTransactionId', async () => {
      const mockSub: any = {
        _id: 'mock-sub-id',
        clientTransactionId: TEST_CLIENT_TX_ID,
        restaurantId: TEST_RESTAURANT_ID,
        status: 'pending',
        amount: 499,
        toObject: () => ({
          _id: 'mock-sub-id',
          clientTransactionId: TEST_CLIENT_TX_ID,
          restaurantId: TEST_RESTAURANT_ID,
          status: 'pending',
          amount: 499,
        }),
      };
      mockSubscription.findOne.mockResolvedValue(mockSub);

      const url = `http://localhost/api/subscriptions/status?clientTransactionId=${TEST_CLIENT_TX_ID}`;
      const request = new Request(url);
      
      const response = await checkSubscriptionStatus(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.subscription).toBeTruthy();
      expect(data.subscription.status).toBe('pending');
      expect(data.subscription.clientTransactionId).toBe(TEST_CLIENT_TX_ID);

      console.log('✅ Test 11 passed: Status check works correctly');
    });

    it('should return 404 for non-existent clientTransactionId', async () => {
      mockSubscription.findOne.mockResolvedValue(null);

      const url = 'http://localhost/api/subscriptions/status?clientTransactionId=NONEXISTENT';
      const request = new Request(url);
      
      const response = await checkSubscriptionStatus(request);

      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.subscription).toBeNull();

      console.log('✅ Test 12 passed: Returns 404 for non-existent subscription');
    });

    it('should require clientTransactionId parameter', async () => {
      const url = 'http://localhost/api/subscriptions/status';
      const request = new Request(url);
      
      const response = await checkSubscriptionStatus(request);

      expect(response.status).toBe(400);

      console.log('✅ Test 13 passed: Requires clientTransactionId parameter');
    });
  });

  describe('3. Complete Payment Flow Integration', () => {
    
    it('should complete full payment flow: confirm → active', async () => {
      // Step 1: Mock subscription exists (pending)
      const mockSub: any = {
        _id: 'mock-sub-id',
        clientTransactionId: TEST_CLIENT_TX_ID,
        restaurantId: TEST_RESTAURANT_ID,
        amount: 499,
        status: 'pending',
        save: jest.fn().mockResolvedValue(true),
      };
      mockSubscription.findOne.mockResolvedValue(mockSub);

      const mockRestaurantObj = {
        id: TEST_RESTAURANT_ID,
        membership: 'free',
        save: jest.fn().mockResolvedValue(true),
      };
      mockRestaurant.findOne.mockResolvedValue(mockRestaurantObj);

      // Step 2: Mock PayPhone approval
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          statusCode: '3',
          status: 'Approved',
          amount: 499,
          transactionId: 'PP-FINAL-' + Date.now(),
        }),
      });

      // Step 3: Call confirm
      const confirmResponse = await confirmPayment({
        json: async () => ({
          clientTransactionId: TEST_CLIENT_TX_ID,
          id: TEST_PAYPHONE_ID,
        }),
      } as any);

      const confirmData = await confirmResponse.json();

      expect(confirmResponse.status).toBe(200);
      expect(confirmData.status).toBe('active');
      expect(confirmData.statusCode).toBe('3');

      // Verify subscription activated
      expect(mockSub.status).toBe('active');
      expect(mockSub.startDate).toBeTruthy();
      expect(mockSub.endDate).toBeTruthy();
      expect(mockSub.nextBillingDate).toBeTruthy();

      // Verify restaurant updated
      expect(mockRestaurantObj.membership).toBe('pro');

      console.log('✅ Test 14 passed: Complete payment flow works');
    });

    it('should handle cancelled payment in full flow', async () => {
      const mockSub: any = {
        _id: 'mock-sub-id',
        clientTransactionId: TEST_CLIENT_TX_ID,
        restaurantId: TEST_RESTAURANT_ID,
        amount: 499,
        status: 'pending',
        save: jest.fn().mockResolvedValue(true),
      };
      mockSubscription.findOne.mockResolvedValue(mockSub);

      // Mock PayPhone cancellation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          statusCode: '2',
          status: 'Canceled',
          amount: 499,
        }),
      });

      const confirmResponse = await confirmPayment({
        json: async () => ({
          clientTransactionId: TEST_CLIENT_TX_ID,
          id: TEST_PAYPHONE_ID,
        }),
      } as any);

      const confirmData = await confirmResponse.json();

      expect(confirmData.status).toBe('cancelled');
      expect(mockSub.status).toBe('cancelled');
      expect(mockSub.cancelledAt).toBeTruthy();

      console.log('✅ Test 15 passed: Cancelled payment flow works');
    });
  });

  describe('4. Edge Cases and Security', () => {
    
    it('should handle already cancelled subscription (idempotent)', async () => {
      const mockSub: any = {
        _id: 'mock-sub-id',
        clientTransactionId: TEST_CLIENT_TX_ID,
        restaurantId: TEST_RESTAURANT_ID,
        status: 'cancelled',
        save: jest.fn(),
      };
      mockSubscription.findOne.mockResolvedValue(mockSub);

      const mockRequest = {
        json: async () => ({
          clientTransactionId: TEST_CLIENT_TX_ID,
          id: TEST_PAYPHONE_ID,
        }),
      } as any;

      const response = await confirmPayment(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('cancelled');
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockSub.save).not.toHaveBeenCalled();

      console.log('✅ Test 16 passed: Handles cancelled subscription idempotently');
    });

    it('should handle restaurant not found when activating subscription', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          statusCode: '3',
          status: 'Approved',
          amount: 499,
        }),
      });

      const mockSub: any = {
        _id: 'mock-sub-id',
        clientTransactionId: TEST_CLIENT_TX_ID,
        restaurantId: 'nonexistent-restaurant',
        status: 'pending',
        save: jest.fn().mockResolvedValue(true),
      };
      mockSubscription.findOne.mockResolvedValue(mockSub);

      mockRestaurant.findOne.mockResolvedValue(null);

      const mockRequest = {
        json: async () => ({
          clientTransactionId: TEST_CLIENT_TX_ID,
          id: TEST_PAYPHONE_ID,
        }),
      } as any;

      const response = await confirmPayment(mockRequest);
      const data = await response.json();

      // Should still activate subscription even if restaurant not found
      expect(response.status).toBe(200);
      expect(data.status).toBe('active');
      expect(mockSub.save).toHaveBeenCalled();

      console.log('✅ Test 17 passed: Handles missing restaurant gracefully');
    });

    it('should handle non-terminal statusCode from PayPhone', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          statusCode: '1', // Pending
          status: 'Pending',
          amount: 499,
        }),
      });

      const mockSub: any = {
        _id: 'mock-sub-id',
        clientTransactionId: TEST_CLIENT_TX_ID,
        restaurantId: TEST_RESTAURANT_ID,
        status: 'pending',
        save: jest.fn(),
      };
      mockSubscription.findOne.mockResolvedValue(mockSub);

      const mockRequest = {
        json: async () => ({
          clientTransactionId: TEST_CLIENT_TX_ID,
          id: TEST_PAYPHONE_ID,
        }),
      } as any;

      const response = await confirmPayment(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('pending');
      expect(data.statusCode).toBe('1');
      expect(data.message).toContain('not yet terminal');
      expect(mockSub.save).not.toHaveBeenCalled();

      console.log('✅ Test 18 passed: Handles non-terminal statusCode correctly');
    });

    it('should handle missing PAYPHONE_TOKEN gracefully', async () => {
      delete process.env.PAYPHONE_TOKEN;

      const mockSub: any = {
        _id: 'mock-sub-id',
        clientTransactionId: TEST_CLIENT_TX_ID,
        restaurantId: TEST_RESTAURANT_ID,
        status: 'pending',
        save: jest.fn(),
      };
      mockSubscription.findOne.mockResolvedValue(mockSub);

      const mockRequest = {
        json: async () => ({
          clientTransactionId: TEST_CLIENT_TX_ID,
          id: TEST_PAYPHONE_ID,
        }),
      } as any;

      const response = await confirmPayment(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('pending');
      expect(mockFetch).not.toHaveBeenCalled();

      // Restore token
      process.env.PAYPHONE_TOKEN = 'test_token';

      console.log('✅ Test 19 passed: Handles missing token gracefully');
    });
  });
});
