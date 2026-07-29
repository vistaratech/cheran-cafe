import { NextResponse } from 'next/server';
import { Restaurant } from '@/models';
import { errorReporter } from '@/lib/helpers';
import { connectToDatabase, isDatabaseConnected } from '@/lib/mongo-init';
import { v4 as uuidv4 } from 'uuid';
import { seedRestaurantData } from '@/lib/seed-data';

// Define response structure
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// Helper function to create standardized API responses
function createApiResponse<T>(data?: T, error?: string): ApiResponse<T> {
  return {
    success: !error,
    data,
    error,
    timestamp: new Date().toISOString()
  };
}

export async function GET() {
  try {
    // Ensure mongoose is connected using centralized function
    if (!isDatabaseConnected()) {
      await connectToDatabase();
    }
    
    const restaurants = await Restaurant.find({});
    
    // Validate response data
    if (!Array.isArray(restaurants)) {
      throw new Error('Invalid data format received from database');
    }
    
    return NextResponse.json(
      createApiResponse(restaurants.map(r => r.toObject())),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching restaurants:', error);
    
    // Use the enhanced error reporting utility
    const errorResponse = errorReporter.createErrorResponse(
      error, 
      { 
        operation: 'GET /api/restaurants',
        timestamp: new Date().toISOString()
      }
    );
    
    return NextResponse.json(
      createApiResponse(undefined, errorResponse.message),
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Ensure mongoose is connected using centralized function
    if (!isDatabaseConnected()) {
      await connectToDatabase();
    }
    
    const restaurantData = await request.json();
    
    // Generate a unique ID if not provided
    if (!restaurantData.id) {
      restaurantData.id = uuidv4();
    }
    
    // Create new restaurant
    const newRestaurant = new Restaurant(restaurantData);
    const savedRestaurant = await newRestaurant.save();
    
    // Seed default data so new users can test the app immediately
    await seedRestaurantData(savedRestaurant.id);
    
    return NextResponse.json(
      createApiResponse(savedRestaurant.toObject()),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error saving restaurants:', error);
    
    // Use the enhanced error reporting utility
    const errorResponse = errorReporter.createErrorResponse(
      error,
      {
        operation: 'POST /api/restaurants',
        timestamp: new Date().toISOString()
      }
    );
    
    return NextResponse.json(
      createApiResponse(undefined, errorResponse.message),
      { status: 500 }
    );
  }
}