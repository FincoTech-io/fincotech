import bcrypt from 'bcrypt';
import { Wallet, IWallet } from '@/models/Wallet';
import { IUser, User } from '@/models/User';
import mongoose from 'mongoose';
/**
 * Creates a wallet for a user, merchant, or driver
 * 
 * @param entityId - The entity ID (user, merchant, or driver ID)
 * @param tier - The wallet tier 
 * @param entityType - The type of entity ('USER', 'MERCHANT', 'DRIVER')
 * @returns The created wallet and a flag indicating if it was newly created
 */
export async function createWallet(
  entityId: string, 
  tier: string = 'BASIC',
  entityType: 'USER' | 'MERCHANT' | 'DRIVER' = 'USER'
): Promise<{ wallet: IWallet; created: boolean }> {
  try {
    console.log(`Creating wallet for ${entityType.toLowerCase()}: ${entityId}`);
    
    // Check if wallet already exists for this entity
    const existingWallet = await Wallet.findOne({ entityType, entityId });
    if (existingWallet) {
      console.log(`Wallet already exists for ${entityType.toLowerCase()}: ${entityId}`);
      return { wallet: existingWallet, created: false };
    }
    
    let fullName = '';
    let phoneNumber = '';

    // Get entity information based on type
    if (entityType === 'USER') {
      const user = await User.findById(entityId);
      if (!user) {
        console.error(`User not found: ${entityId}`);
        throw new Error('User not found');
      }
      fullName = user.fullName;
      phoneNumber = user.phoneNumber;
    } else if (entityType === 'MERCHANT') {
      const Merchant = (await import('@/models/Merchant')).default;
      const merchant = await Merchant.findById(entityId);
      if (!merchant) {
        console.error(`Merchant not found: ${entityId}`);
        throw new Error('Merchant not found');
      }
      fullName = merchant.merchantName;
      phoneNumber = merchant.phoneNumber;
    } else if (entityType === 'DRIVER') {
      const Driver = (await import('@/models/Driver')).default;
      const driver = await Driver.findById(entityId);
      if (!driver) {
        console.error(`Driver not found: ${entityId}`);
        throw new Error('Driver not found');
      }
      fullName = driver.accountHolderName;
      
      // Get phone number from the associated user
      try {
        const user = await User.findById(driver.applicantUserId);
        phoneNumber = user?.phoneNumber || '';
      } catch (userError) {
        console.warn(`Could not get phone number for driver ${entityId}:`, userError);
        phoneNumber = '';
      }
    }

    // Create the wallet first without the address
    const wallet = new Wallet({
      userId: entityType === 'USER' ? entityId : undefined, // Set userId only for USER entities
      entityType,
      entityId,
      fullName,
      phoneNumber,
      balance: 0,
      currency: 'USD',
      isActive: true,
      privacy: false, 
      tier: tier,
      monthlyTransactionCount: 0,
      lastTransactionReset: new Date(),
      transfersReceived: [],
      transfersSent: [],
      contacts: []
    });

    // Save the wallet to get its ID
    await wallet.save();
    
    // Now generate the address using the wallet ID
    const salt = await bcrypt.genSalt(10);
    const walletId = wallet._id ? wallet._id.toString() : wallet.id;
    const address = await bcrypt.hash(walletId, salt);
    
    // Update the wallet with the generated address
    wallet.address = address;
    await wallet.save();
    
    console.log(`Wallet created successfully for ${entityType.toLowerCase()}: ${entityId} with address derived from wallet ID`);

    return { wallet, created: true };
  } catch (error) {
    console.error('Error creating wallet:', error);
    throw error;
  }
}

export async function getContacts(userId: string): Promise<Array<{
  userId: mongoose.Types.ObjectId | IUser;
  nickname: string;
  lastTransactionDate: Date;
}> | null> {
  try {
    // Try to find wallet by userId first (backward compatibility)
    let wallet = await Wallet.findOne({ userId }).populate('contacts.userId', 'fullName phoneNumber email');
    
    // If not found, try by entityType and entityId
    if (!wallet) {
      wallet = await Wallet.findOne({ 
        entityType: 'USER', 
        entityId: userId 
      }).populate('contacts.userId', 'fullName phoneNumber email');
    }
    
    if (!wallet) {
      console.error('Wallet not found:', userId);
      return null;
    }
    return wallet.contacts;
  } catch (error) {
    console.error('Error getting contacts:', error);
    throw error;
  }
}

/**
 * Find a wallet by entity type and ID
 */
export async function findWalletByEntity(
  entityType: 'USER' | 'MERCHANT' | 'DRIVER',
  entityId: string
): Promise<IWallet | null> {
  try {
    const wallet = await Wallet.findOne({ entityType, entityId });
    return wallet;
  } catch (error) {
    console.error('Error finding wallet by entity:', error);
    throw error;
  }
}

/**
 * Find a user's wallet (backward compatible)
 */
export async function findUserWallet(userId: string): Promise<IWallet | null> {
  try {
    // Try to find wallet by userId first (backward compatibility)
    let wallet = await Wallet.findOne({ userId });
    
    // If not found, try by entityType and entityId
    if (!wallet) {
      wallet = await Wallet.findOne({ 
        entityType: 'USER', 
        entityId: userId 
      });
    }
    
    return wallet;
  } catch (error) {
    console.error('Error finding user wallet:', error);
    throw error;
  }
}
