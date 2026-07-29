import { MongoClient, Db, Document } from 'mongodb';
import { parse } from 'url';

// Load environment variables
if (typeof process.env.NODE_ENV === 'undefined' || process.env.NODE_ENV !== 'production') {
  const path = require('path');
  const dotenv = require('dotenv');
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'chefcito';

// Parse database name from URI if not explicitly provided
let dbName = MONGODB_DB;
if (MONGODB_URI && !process.env.MONGODB_DB && MONGODB_URI.startsWith('mongodb+srv://')) {
  try {
    const parsed = parse(MONGODB_URI, true);
    if (parsed.pathname && parsed.pathname.length > 1) {
      dbName = parsed.pathname.substring(1); // Remove leading slash
    }
  } catch (e) {
    console.warn('Could not parse database name from MONGODB_URI, using default:', dbName);
  }
} else if (MONGODB_URI && !process.env.MONGODB_DB && MONGODB_URI.startsWith('mongodb://')) {
  try {
    const parsed = parse(MONGODB_URI, true);
    if (parsed.pathname && parsed.pathname.length > 1) {
      dbName = parsed.pathname.substring(1);
    }
  } catch (e) {
    console.warn('Could not parse database name from MONGODB_URI, using default:', dbName);
  }
}

// Global variables to maintain connection across hot reloads in development
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

class DatabaseManager {
  private client: MongoClient | null = null;
  private clientPromise: Promise<MongoClient> | null = null;

  connect = async (): Promise<MongoClient> => {
    if (this.clientPromise) {
      return this.clientPromise;
    }

    console.log('Creating new MongoDB client with URI:', MONGODB_URI);
    
    // In development, store the promise in a global variable to avoid multiple connections
    if (process.env.NODE_ENV === 'development') {
      if (!global._mongoClientPromise) {
        this.client = new MongoClient(MONGODB_URI, {
          serverSelectionTimeoutMS: 10000, // Timeout after 10s instead of 5s
          socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
          maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
          connectTimeoutMS: 10000, // Connection timeout 10s
          retryWrites: true,
          retryReads: true
        });
        global._mongoClientPromise = this.client.connect();
      }
      this.clientPromise = global._mongoClientPromise;
    } else {
      // In production, create a new connection
      this.client = new MongoClient(MONGODB_URI, {
        serverSelectionTimeoutMS: 10000, // Timeout after 10s instead of 5s
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
        connectTimeoutMS: 10000, // Connection timeout 10s
        retryWrites: true,
        retryReads: true
      });
      this.clientPromise = this.client.connect();
    }

    // Add connection error handling
    this.clientPromise.catch(err => {
      console.error('MongoDB connection error:', err);
    });

    return this.clientPromise;
  };

  getDb = async (): Promise<Db> => {
    try {
      const client = await this.connect();
      return client.db(dbName);
    } catch (error) {
      console.error('Error getting database connection:', error);
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  getCollection = async (collectionName: string) => {
    try {
      const db = await this.getDb();
      return db.collection(collectionName);
    } catch (error) {
      console.error(`Error getting collection ${collectionName}:`, error);
      throw new Error(`Failed to access collection ${collectionName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  close = async () => {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.clientPromise = null;
      if (process.env.NODE_ENV === 'development') {
        global._mongoClientPromise = undefined;
      }
    }
  };
  
  isConnected = (): boolean => {
    return !!this.clientPromise;
  };
}

// Export a singleton instance
export const dbManager = new DatabaseManager();

// Add the missing functions
export const connectToDatabase = async () => {
  await dbManager.connect();
};

export const isDatabaseConnected = () => {
  return dbManager.isConnected();
};

// Helper functions for common operations with timeout handling
export const findOne = async <T>(collectionName: string, filter: any = {}): Promise<T | null> => {
  try {
    const collection = await dbManager.getCollection(collectionName);
    return (await collection.findOne(filter)) as T | null;
  } catch (error) {
    console.error(`Error finding document in ${collectionName}:`, error);
    throw error;
  }
};

export const findMany = async <T>(collectionName: string, filter: any = {}): Promise<T[]> => {
  try {
    await dbManager.connect();
    const collection = await dbManager.getCollection(collectionName);
    return (await collection.find(filter).maxTimeMS(10000).toArray()) as T[];
  } catch (error) {
    console.error(`Error finding documents in ${collectionName}:`, error);
    throw error;
  }
};

export const insertOne = async <T extends Document>(collectionName: string, document: T): Promise<any> => {
  try {
    const collection = await dbManager.getCollection(collectionName);
    return await collection.insertOne(document);
  } catch (error) {
    console.error(`Error inserting document in ${collectionName}:`, error);
    throw error;
  }
};

export const insertMany = async <T extends Document>(collectionName: string, documents: T[]): Promise<any> => {
  try {
    const collection = await dbManager.getCollection(collectionName);
    return await collection.insertMany(documents);
  } catch (error) {
    console.error(`Error inserting documents in ${collectionName}:`, error);
    throw error;
  }
};

export const updateOne = async <T>(
  collectionName: string,
  filter: any,
  update: any
): Promise<any> => {
  try {
    const collection = await dbManager.getCollection(collectionName);
    return await collection.updateOne(filter, update);
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
};

export const updateMany = async <T>(
  collectionName: string,
  filter: any,
  update: any
): Promise<any> => {
  try {
    const collection = await dbManager.getCollection(collectionName);
    return await collection.updateMany(filter, update);
  } catch (error) {
    console.error(`Error updating documents in ${collectionName}:`, error);
    throw error;
  }
};

export const deleteOne = async (collectionName: string, filter: any): Promise<any> => {
  try {
    const collection = await dbManager.getCollection(collectionName);
    return await collection.deleteOne(filter);
  } catch (error) {
    console.error(`Error deleting document in ${collectionName}:`, error);
    throw error;
  }
};

export const deleteMany = async (collectionName: string, filter: any): Promise<any> => {
  try {
    const collection = await dbManager.getCollection(collectionName);
    return await collection.deleteMany(filter);
  } catch (error) {
    console.error(`Error deleting documents in ${collectionName}:`, error);
    throw error;
  }
};