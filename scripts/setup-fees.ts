/**
 * Fee Configuration Setup Script
 * 
 * This script sets up various fee configurations in the MongoDB database directly.
 * It provides different fee structures for different user tiers and transaction types.
 * 
 * Usage: 
 * 1. Make sure your .env file has the MONGODB_URI environment variable
 * 2. Run: npx ts-node scripts/setup-fees.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createInterface } from 'readline';
import FeeConfig, { IFeeConfig } from '../src/models/FeeConfig';

// Initialize environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI as string, {
  useNewUrlParser: true,
  useUnifiedTopology: true
} as mongoose.ConnectOptions).then(() => {
  console.log('Connected to MongoDB successfully');
}).catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});

// Define fee configurations
// Omitting the _id, createdAt, and updatedAt fields as they'll be handled by MongoDB
type FeeConfigInput = Omit<IFeeConfig, '_id' | 'createdAt' | 'updatedAt'>;

// Define a more accurate tieredRates type based on the schema
interface TieredRate {
  minAmount: number;
  maxAmount: number;
  fixedAmount: number;
  percentageRate: number;
}

const feeConfigurations: Partial<FeeConfigInput>[] = [
  // ----- TRANSFER FEES BY TIER -----
  {
    name: "Basic Tier Transfer Fee",
    feeType: "transaction_fee",
    transactionType: "transfer",
    calculationType: "percentage",
    percentageRate: 3.0,
    minimumFee: 1.00,
    maximumFee: 50.00,
    currency: "USD",
    applicableTiers: ["BASIC"],
    applicableRegions: ["GLOBAL"],
    isActive: true,
    effectiveStartDate: new Date(),
    description: "Standard percentage fee for basic tier transfers",
    metadata: {
      createdBy: "setup-script",
      notes: "Initial setup for basic tier"
    }
  },
  {
    name: "Standard Tier Transfer Fee",
    feeType: "transaction_fee",
    transactionType: "transfer",
    calculationType: "percentage",
    percentageRate: 2.5,
    minimumFee: 1.00,
    maximumFee: 75.00,
    currency: "USD",
    applicableTiers: ["STANDARD"],
    applicableRegions: ["GLOBAL"],
    isActive: true,
    effectiveStartDate: new Date(),
    description: "Standard percentage fee for standard tier transfers",
    metadata: {
      createdBy: "setup-script",
      notes: "Initial setup for standard tier"
    }
  },
  {
    name: "Premium Tier Transfer Fee",
    feeType: "transaction_fee",
    transactionType: "transfer",
    calculationType: "percentage",
    percentageRate: 1.5,
    minimumFee: 1.00,
    maximumFee: 100.00,
    currency: "USD",
    applicableTiers: ["PREMIUM"],
    applicableRegions: ["GLOBAL"],
    isActive: true,
    effectiveStartDate: new Date(),
    description: "Reduced percentage fee for premium tier transfers",
    metadata: {
      createdBy: "setup-script",
      notes: "Initial setup for premium tier"
    }
  },
  {
    name: "VIP Tier Transfer Fee",
    feeType: "transaction_fee",
    transactionType: "transfer",
    calculationType: "percentage",
    percentageRate: 1.0,
    minimumFee: 1.00,
    maximumFee: 200.00,
    currency: "USD",
    applicableTiers: ["VIP"],
    applicableRegions: ["GLOBAL"],
    isActive: true,
    effectiveStartDate: new Date(),
    description: "Minimal percentage fee for VIP tier transfers",
    metadata: {
      createdBy: "setup-script",
      notes: "Initial setup for VIP tier"
    }
  },

  // ----- WITHDRAWAL FEES -----
  {
    name: "Standard Withdrawal Fee",
    feeType: "withdrawal_fee",
    transactionType: "withdrawal",
    calculationType: "hybrid",
    fixedAmount: 0.50,
    percentageRate: 1.0,
    minimumFee: 1.00,
    maximumFee: 20.00,
    currency: "USD",
    applicableTiers: ["BASIC", "STANDARD"],
    applicableRegions: ["GLOBAL"],
    isActive: true,
    effectiveStartDate: new Date(),
    description: "Hybrid fee for withdrawals (fixed + percentage)",
    metadata: {
      createdBy: "setup-script",
      notes: "Initial setup for withdrawals"
    }
  },
  {
    name: "Premium Withdrawal Fee",
    feeType: "withdrawal_fee",
    transactionType: "withdrawal",
    calculationType: "fixed",
    fixedAmount: 1.00,
    currency: "USD",
    applicableTiers: ["PREMIUM", "VIP"],
    applicableRegions: ["GLOBAL"],
    isActive: true,
    effectiveStartDate: new Date(),
    description: "Fixed fee for premium and VIP withdrawals",
    metadata: {
      createdBy: "setup-script",
      notes: "Initial setup for premium/VIP withdrawals"
    }
  },

  // ----- TIERED FEE EXAMPLE -----
  {
    name: "Tiered Transfer Fee",
    feeType: "transaction_fee",
    transactionType: "transfer",
    calculationType: "tiered",
    currency: "USD",
    tieredRates: [
      {
        minAmount: 0,
        maxAmount: 100,
        fixedAmount: 1.00,
        percentageRate: 0
      } as TieredRate,
      {
        minAmount: 100.01,
        maxAmount: 1000,
        fixedAmount: 0,
        percentageRate: 2.0
      } as TieredRate,
      {
        minAmount: 1000.01,
        maxAmount: 10000,
        fixedAmount: 0,
        percentageRate: 1.5
      } as TieredRate,
      {
        minAmount: 10000.01,
        maxAmount: 50000,
        fixedAmount: 0,
        percentageRate: 1.0
      } as TieredRate
    ],
    applicableTiers: ["ALL"],
    applicableRegions: ["GLOBAL"],
    isActive: false, // Not active by default - enable if you want to use this instead of tier-specific fees
    effectiveStartDate: new Date(),
    description: "Tiered fee structure based on transaction amount",
    metadata: {
      createdBy: "setup-script",
      notes: "Example of tiered fee structure (disabled by default)"
    }
  },

  // ----- SERVICE FEES -----
  {
    name: "Standard Service Fee",
    feeType: "service_fee",
    transactionType: "all",
    calculationType: "fixed",
    fixedAmount: 2.99,
    currency: "USD",
    applicableTiers: ["BASIC", "STANDARD"],
    applicableRegions: ["GLOBAL"],
    isActive: false, // Not active by default
    effectiveStartDate: new Date(),
    description: "Fixed monthly service fee",
    metadata: {
      createdBy: "setup-script",
      notes: "Example of service fee (disabled by default)"
    }
  }
];

// Insert fee configurations
async function setupFeeConfigurations(): Promise<void> {
  try {
    // Check if there are existing configurations
    const existingCount = await FeeConfig.countDocuments();
    
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing fee configurations`);
      const answer = await promptUser('Do you want to delete existing configurations before adding new ones? (yes/no): ');
      
      if (answer.toLowerCase() === 'yes') {
        console.log('Deleting existing fee configurations...');
        await FeeConfig.deleteMany({});
        console.log('Existing configurations deleted');
      } else {
        console.log('Keeping existing configurations');
      }
    }
    
    // Insert new configurations
    console.log(`Inserting ${feeConfigurations.length} fee configurations...`);
    const result = await FeeConfig.insertMany(feeConfigurations);
    
    console.log(`${result.length} fee configurations inserted successfully:`);
    
    // Print a summary of inserted configurations
    result.forEach((config, index) => {
      console.log(`${index + 1}. ${config.name} (${config.feeType} - ${config.calculationType}) - ${config.isActive ? 'ACTIVE' : 'INACTIVE'}`);
    });
    
    console.log('\nFee configuration setup completed successfully!');
    
  } catch (error) {
    console.error('Error setting up fee configurations:', error);
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Simple prompt function with TypeScript
function promptUser(question: string): Promise<string> {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    readline.question(question, (answer: string) => {
      readline.close();
      resolve(answer);
    });
  });
}

// Run the setup
setupFeeConfigurations(); 