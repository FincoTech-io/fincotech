import Redis from 'ioredis';

// Parse Redis URL to extract hostname for TLS
function getRedisConfig(): Redis.RedisOptions {
  if (!process.env.REDIS_URL) {
    return {
      host: '127.0.0.1',
      port: 6379
    };
  }
  
  // Parse the Redis URL
  const url = new URL(process.env.REDIS_URL);
  
  // For Upstash and other cloud Redis providers that require TLS
  return {
    host: url.hostname,
    port: parseInt(url.port || '6379'),
    username: url.username || undefined,
    password: url.password || undefined,
    tls: {
      rejectUnauthorized: false,
      servername: url.hostname
    }
  };
}

// Track connection state
let isRedisConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Create a Redis instance with improved configuration for serverless
const redis = new Redis(getRedisConfig());

// Configure Redis options
redis.options.retryStrategy = (times) => {
  reconnectAttempts = times;
  console.log(`Redis reconnection attempt ${times}`);
  
  if (times > MAX_RECONNECT_ATTEMPTS) {
    console.error(`Maximum Redis reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached`);
    // Return null to stop trying to reconnect
    return null; 
  }
  
  // Exponential backoff with a maximum delay of 3 seconds (reduced for serverless environment)
  const delay = Math.min(Math.pow(2, times) * 100, 3000);
  console.log(`Redis will try to reconnect in ${delay}ms`);
  return delay;
};

redis.options.maxRetriesPerRequest = 2;
redis.options.connectTimeout = 5000;
redis.options.enableOfflineQueue = true;
redis.options.commandTimeout = 5000;
redis.options.showFriendlyErrorStack = true;

// Log connection events
redis.on('connect', () => {
  console.log('Redis: Connecting to server...');
});

redis.on('ready', () => {
  isRedisConnected = true;
  reconnectAttempts = 0;
  console.log('Redis: Connection established and ready');
});

redis.on('error', (err) => {
  console.error('Redis error:', err);
  // Log extra details for connection errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.message.includes('timeout')) {
    console.error(`Redis connection issue (${err.code}): This may be due to network problems, Redis server overload, or restricted firewall settings.`);
  }
});

redis.on('reconnecting', () => {
  isRedisConnected = false;
  console.log(`Redis: Reconnecting (attempt ${reconnectAttempts})...`);
});

redis.on('close', () => {
  isRedisConnected = false;
  console.log('Redis: Connection closed');
});

redis.on('end', () => {
  isRedisConnected = false;
  console.log('Redis: Connection ended');
});

/**
 * Store a value in Redis with an expiry time
 * @param {string} key Redis key
 * @param {string} value Value to store
 * @param {number} expirySeconds Expiry time in seconds
 * @returns {Promise<boolean>} Success indicator
 */
const setWithExpiry = async (key: string, value: string, expirySeconds: number): Promise<boolean> => {
  try {
    // Set a timeout promise to avoid hanging on Redis operations
    await Promise.race([
      redis.set(key, value, 'EX', expirySeconds),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Redis operation timeout')), 10000)
      )
    ]);
    return true;
  } catch (error) {
    console.error(`Redis setWithExpiry error for key ${key}:`, error);
    // Continue app execution even if Redis fails
    return false;
  }
};

/**
 * Get a value from Redis
 * @param {string} key Redis key
 * @returns {Promise<string|null>} Stored value or null
 */
const get = async (key: string): Promise<string | null> => {
  try {
    // Set a timeout promise to avoid hanging on Redis operations
    const result = await Promise.race([
      redis.get(key),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Redis operation timeout')), 10000)
      )
    ]) as string | null;
    return result;
  } catch (error) {
    console.error(`Redis get error for key ${key}:`, error);
    // Continue app execution even if Redis fails
    return null;
  }
};

/**
 * Delete a key from Redis
 * @param {string} key Redis key
 * @returns {Promise<boolean>} Success indicator
 */
const del = async (key: string): Promise<boolean> => {
  try {
    // Set a timeout promise to avoid hanging on Redis operations
    await Promise.race([
      redis.del(key),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Redis operation timeout')), 10000)
      )
    ]);
    return true;
  } catch (error) {
    console.error(`Redis del error for key ${key}:`, error);
    // Continue app execution even if Redis fails
    return false;
  }
};

/**
 * Check if Redis is connected
 * @returns {Promise<boolean>} Connection status
 */
const isConnected = async (): Promise<boolean> => {
  if (!isRedisConnected) {
    return false;
  }
  
  try {
    const pong = await Promise.race([
      redis.ping(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Redis ping timeout')), 2000)
      )
    ]) as string;
    return pong === 'PONG';
  } catch (error) {
    console.error('Redis ping error:', error);
    return false;
  }
};

/**
 * Get connection status details for debugging
 * @returns {Object} Connection status details
 */
const getConnectionDetails = () => {
  const redisUrl = process.env.REDIS_URL || '';
  return {
    isConnected: isRedisConnected,
    reconnectAttempts,
    url: redisUrl.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'), // Mask password
    options: {
      maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS
    },
    config: {
      host: redisUrl ? new URL(redisUrl).hostname : 'localhost',
      usingTLS: !!redisUrl
    }
  };
};

// Add graceful shutdown handler for environments that support it
if (typeof process !== 'undefined' && process.on) {
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing Redis connection...');
    await redis.quit();
    process.exit(0);
  });
}

export default {
  client: redis,
  setWithExpiry,
  get,
  del,
  isConnected,
  getConnectionDetails
}; 