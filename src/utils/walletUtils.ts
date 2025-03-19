import bcrypt from 'bcrypt';
import { Wallet, IWallet } from '@/models/Wallet';
import { IUser, User } from '@/models/User';
import mongoose from 'mongoose';
/**
 * Creates a wallet for a user
 * 
 * @param userId - The user ID to create the wallet for
 * @returns The created wallet and a flag indicating if it was newly created
 */
export async function createWallet(userId: string): Promise<{ wallet: IWallet; created: boolean }> {
  try {
    console.log(`Creating wallet for user: ${userId}`);
    
    // Check if wallet already exists
    const existingWallet = await Wallet.findOne({ userId });
    if (existingWallet) {
      console.log(`Wallet already exists for user: ${userId}`);
      return { wallet: existingWallet, created: false };
    }
    
    // Find the user to get their information
    const user = await User.findById(userId);
    if (!user) {
      console.error(`User not found: ${userId}`);
      throw new Error('User not found');
    }

    // Create the wallet first without the address
    const wallet = new Wallet({
      userId,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      balance: 0,
      currency: 'USD',
      isActive: true,
      privacy: false,
      tier: 'STANDARD',
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
    // Use a type-safe way to get the wallet ID
    const walletId = wallet._id ? wallet._id.toString() : wallet.id;
    const address = await bcrypt.hash(walletId, salt);
 
    
    // Update the wallet with the generated address
    wallet.address = address;
    await wallet.save();
    
    console.log(`Wallet created successfully for user: ${userId} with address derived from wallet ID`);

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
    const wallet = await Wallet.findOne({ userId }).populate('contacts.userId', 'fullName phoneNumber email');
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
