import redisService from './redis';

const BLACKLIST_PREFIX = 'blacklisted_token:';
const TOKEN_EXPIRY = 60 * 30; // 30 minutes in seconds (matches the token expiry)

/**
 * Blacklist a token by adding it to Redis
 * @param token JWT token to blacklist
 * @param reason Optional reason for blacklisting
 * @returns Success indicator
 */
export const blacklistToken = async (token: string, reason = 'logout'): Promise<boolean> => {
  try {
    const key = `${BLACKLIST_PREFIX}${token}`;
    return await redisService.setWithExpiry(key, reason, TOKEN_EXPIRY);
  } catch (error) {
    console.error('Error blacklisting token:', error);
    return false;
  }
};

/**
 * Check if a token is blacklisted
 * @param token JWT token to check
 * @returns True if token is blacklisted
 */
export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  try {
    const key = `${BLACKLIST_PREFIX}${token}`;
    const result = await redisService.get(key);
    return result !== null;
  } catch (error) {
    console.error('Error checking blacklisted token:', error);
    // Default to allowing the token if we can't check (avoid lockouts)
    return false;
  }
}; 