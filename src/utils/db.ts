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
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('Connected to MongoDB successfully');
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