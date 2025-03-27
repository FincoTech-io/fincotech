import mongoose from 'mongoose';
import User from '../models/User';

// Define the type for our mongoose connection cache
interface MongooseConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Define global mongoose property type
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseConnection | undefined;
}

// Cache for MongoDB connection
const cached: MongooseConnection = global.mongoose || { conn: null, promise: null };

// Add to global
if (!global.mongoose) {
  global.mongoose = cached;
}

// MongoDB connection URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI || '';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Connect to MongoDB database using Mongoose
 * Returns a cached connection when available
 */
export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 30000, // 30 seconds (default is 30000)
      socketTimeoutMS: 45000, // 45 seconds (default is 30000)
      connectTimeoutMS: 30000, // 30 seconds (default is 30000)
      maxPoolSize: 10, // Increase the connection pool size to handle more connections
      minPoolSize: 5, // Maintain a minimum number of connections
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('Connected to MongoDB successfully');
        
        // Listen for connection errors
        mongoose.connection.on('error', (err) => {
          console.error('MongoDB connection error:', err);
        });
        
        // Listen for disconnection events
        mongoose.connection.on('disconnected', () => {
          console.warn('MongoDB disconnected, attempting to reconnect...');
        });
        
        // Listen for reconnection events
        mongoose.connection.on('reconnected', () => {
          console.log('MongoDB reconnected successfully');
        });
        
        return mongoose;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}