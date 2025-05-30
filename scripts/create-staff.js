#!/usr/bin/env node

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Define Staff schema directly in the script
const { Schema } = mongoose;

// Address Schema
const AddressSchema = new Schema({
  unit: { type: String, required: false, trim: true },
  street: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  postalCode: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true, uppercase: true }
});

// Staff Schema
const StaffSchema = new Schema({
  firstName: { type: String, required: true, trim: true, maxlength: 50 },
  middleName: { type: String, required: false, trim: true, maxlength: 50 },
  lastName: { type: String, required: true, trim: true, maxlength: 50 },
  dateOfBirth: { type: Date, required: true },
  employeeNumber: { type: String, required: true, unique: true, trim: true, match: /^[A-Z]{3}-\d{7}$/ },
  password: { type: String, required: true, minlength: 6 },
  employmentStatus: { type: String, required: true, enum: ['Active', 'Inactive', 'Terminated', 'On Leave', 'Probation'], default: 'Active' },
  phoneNumber: { type: String, required: true, trim: true, unique: true },
  jobTitle: { type: String, required: true, trim: true, maxlength: 100 },
  reportsTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: false },
  address: { type: AddressSchema, required: true },
  role: { type: String, required: true, enum: ['Admin', 'Manager', 'Supervisor', 'Staff', 'Support'], default: 'Staff' },
  taxId: { type: String, required: true, trim: true, unique: true },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true, match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/ },
  team: { type: String, required: true, trim: true, maxlength: 100 },
  hireDate: { type: Date, required: true, default: Date.now },
  lastLogin: { type: Date, required: false }
}, {
  timestamps: true,
  toJSON: { transform: function(doc, ret) { delete ret.password; return ret; } }
});

// Pre-save hook to hash password
StaffSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Static method to generate employee number
StaffSchema.statics.generateEmployeeNumber = async function(countryCode) {
  const formattedCountryCode = countryCode.toUpperCase().padEnd(3, 'X').substring(0, 3);
  const lastEmployee = await this.findOne(
    { employeeNumber: new RegExp(`^${formattedCountryCode}-`) },
    {},
    { sort: { employeeNumber: -1 } }
  );
  let nextNumber = 1;
  if (lastEmployee && lastEmployee.employeeNumber) {
    const lastNumberStr = lastEmployee.employeeNumber.split('-')[1];
    nextNumber = parseInt(lastNumberStr, 10) + 1;
  }
  return `${formattedCountryCode}-${nextNumber.toString().padStart(7, '0')}`;
};

const Staff = mongoose.models.Staff || mongoose.model('Staff', StaffSchema);

// Connect to MongoDB
async function connectDB() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

// Validate email
function isValidEmail(email) {
  return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
}

// Prompt with basic readline that won't break
const readline = require('readline');
async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function promptPassword(question) {
  console.log('⚠️  Note: Password will be visible while typing (for terminal compatibility)');
  return await prompt(question);
}

// Interactive staff creation
async function createStaff() {
  console.log('\n🚀 FincoTech Staff Creation Tool\n');
  
  try {
    const firstName = await prompt('First Name: ');
    if (!firstName) {
      console.log('❌ First name is required');
      return;
    }

    const middleName = await prompt('Middle Name (optional): ');
    
    const lastName = await prompt('Last Name: ');
    if (!lastName) {
      console.log('❌ Last name is required');
      return;
    }

    const email = await prompt('Email: ');
    if (!email || !isValidEmail(email)) {
      console.log('❌ Valid email is required');
      return;
    }

    const password = await promptPassword('Password: ');
    if (!password || password.length < 6) {
      console.log('❌ Password must be at least 6 characters');
      return;
    }

    const phoneNumber = await prompt('Phone Number: ');
    if (!phoneNumber) {
      console.log('❌ Phone number is required');
      return;
    }

    const dateOfBirth = await prompt('Date of Birth (YYYY-MM-DD): ');
    if (!dateOfBirth || !Date.parse(dateOfBirth)) {
      console.log('❌ Valid date of birth is required (YYYY-MM-DD)');
      return;
    }

    const jobTitle = await prompt('Job Title: ');
    if (!jobTitle) {
      console.log('❌ Job title is required');
      return;
    }

    const team = await prompt('Team: ');
    if (!team) {
      console.log('❌ Team is required');
      return;
    }

    const taxId = await prompt('Tax ID: ');
    if (!taxId) {
      console.log('❌ Tax ID is required');
      return;
    }

    console.log('\nSelect Role:');
    console.log('1. Admin\n2. Manager\n3. Supervisor\n4. Staff\n5. Support');
    const roleChoice = await prompt('Choice (1-5): ');
    const roles = ['Admin', 'Manager', 'Supervisor', 'Staff', 'Support'];
    const role = roles[parseInt(roleChoice) - 1];
    if (!role) {
      console.log('❌ Invalid role selection');
      return;
    }

    console.log('\nSelect Employment Status:');
    console.log('1. Active\n2. Inactive\n3. On Leave\n4. Probation');
    const statusChoice = await prompt('Choice (1-4) [default: Active]: ') || '1';
    const statuses = ['Active', 'Inactive', 'On Leave', 'Probation'];
    const employmentStatus = statuses[parseInt(statusChoice) - 1] || 'Active';

    const countryCode = await prompt('Country Code (3 letters) [default: ZWE]: ') || 'ZWE';

    console.log('\n📍 Address Information:');
    const unit = await prompt('Unit/Apt (optional): ');
    const street = await prompt('Street: ');
    if (!street) {
      console.log('❌ Street is required');
      return;
    }

    const city = await prompt('City: ');
    if (!city) {
      console.log('❌ City is required');
      return;
    }

    const postalCode = await prompt('Postal Code: ');
    if (!postalCode) {
      console.log('❌ Postal code is required');
      return;
    }

    const country = await prompt('Country: ');
    if (!country) {
      console.log('❌ Country is required');
      return;
    }

    const address = { street, city, postalCode, country: country.toUpperCase() };
    if (unit) address.unit = unit;

    console.log('\n⏳ Generating employee number...');
    const employeeNumber = await Staff.generateEmployeeNumber(countryCode);

    console.log('⏳ Creating staff member...');
    const staffData = {
      firstName, lastName, email: email.toLowerCase(), password, phoneNumber,
      dateOfBirth: new Date(dateOfBirth), jobTitle, team, taxId, role,
      employmentStatus, employeeNumber, address, hireDate: new Date()
    };
    if (middleName) staffData.middleName = middleName;

    const newStaff = new Staff(staffData);
    const savedStaff = await newStaff.save();

    console.log('\n✅ Staff member created successfully!');
    console.log('📋 Details:');
    console.log(`   Employee Number: ${savedStaff.employeeNumber}`);
    console.log(`   Name: ${savedStaff.firstName} ${savedStaff.middleName || ''} ${savedStaff.lastName}`.trim());
    console.log(`   Email: ${savedStaff.email}`);
    console.log(`   Role: ${savedStaff.role}`);
    console.log(`   Team: ${savedStaff.team}`);
    console.log(`   Status: ${savedStaff.employmentStatus}`);
    console.log('\n🔐 Login Credentials:');
    console.log(`   Employee ID: ${savedStaff.employeeNumber}`);
    console.log(`   Password: [Hidden]`);
    console.log('\n🌐 Login URL: http://localhost:3000/management');

  } catch (error) {
    if (error.code === 11000) {
      console.log('❌ Error: A staff member with this email, phone number, or tax ID already exists');
    } else {
      console.log('❌ Error creating staff member:', error.message);
    }
  }
}

// Quick creation mode
async function quickCreate() {
  console.log('🚀 Quick Staff Creation Mode\n');
  
  const firstName = await prompt('First Name: ');
  const lastName = await prompt('Last Name: ');
  const email = await prompt('Email: ');
  const password = await promptPassword('Password: ');
  
  if (!firstName || !lastName || !email || !password) {
    console.log('❌ All fields are required');
    return;
  }
  
  console.log('\n⏳ Creating staff with default values...');
  
  try {
    const employeeNumber = await Staff.generateEmployeeNumber('ZWE');
    const staffData = {
      firstName, lastName, email: email.toLowerCase(), password,
      phoneNumber: `+263${Date.now().toString().slice(-9)}`, 
      dateOfBirth: new Date('1990-01-01'),
      jobTitle: 'Staff Member', team: 'General', 
      taxId: `TAX-${Date.now()}`,
      role: 'Staff', employmentStatus: 'Active', employeeNumber,
      address: { street: '123 Main Street', city: 'Harare', postalCode: '00263', country: 'ZWE' },
      hireDate: new Date()
    };

    const newStaff = new Staff(staffData);
    const savedStaff = await newStaff.save();

    console.log(`\n✅ Staff created! Employee ID: ${savedStaff.employeeNumber}`);
    console.log(`🌐 Login at: http://localhost:3000/management`);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args[0] === '--help') {
    console.log('\n🚀 FincoTech Staff Creation Tool\n');
    console.log('Usage:');
    console.log('  node scripts/create-staff.js           # Interactive mode');
    console.log('  node scripts/create-staff.js --quick   # Quick mode');
    console.log('  node scripts/create-staff.js --help    # This help');
    return;
  }

  await connectDB();
  
  if (args[0] === '--quick') {
    await quickCreate();
  } else {
    await createStaff();
  }
  
  mongoose.connection.close();
  console.log('\n👋 Goodbye!');
}

main().catch((error) => {
  console.error('❌ Script error:', error);
  process.exit(1);
}); 