import { MongoClient, ServerApiVersion } from 'mongodb';

// Define a type for global variables in the Node.js global scope
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// MongoDB connection URI from environment variables
const uri = process.env.MONGODB_URI || '';

// MongoDB client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Connection cache - use const since it won't be reassigned
const clientPromise: Promise<MongoClient> = global._mongoClientPromise || client.connect();

// Store the connection promise in the global scope if it's not already there
if (!global._mongoClientPromise) {
  global._mongoClientPromise = clientPromise;
}

export async function getDatabase() {
  const client = await clientPromise;
  return client.db('fincotech');
}

// Helper function to check if a user with a specific phone number exists
export async function userExistsByPhone(phoneNumber: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const collection = db.collection('user');

    // Query to find a user with the given phone number
    const user = await collection.findOne({ phoneNumber });

    // Return true if user exists, false otherwise
    return !!user;
  } catch (error) {
    console.error('Error checking user by phone:', error);
    throw error;
  }
}