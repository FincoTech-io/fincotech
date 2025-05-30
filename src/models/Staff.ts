import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// Interface for Address
export interface IAddress {
  unit?: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

// Interface for Staff document
export interface IStaff extends Document {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: Date;
  employeeNumber: string;
  password: string;
  employmentStatus: 'Active' | 'Inactive' | 'Terminated' | 'On Leave' | 'Probation';
  phoneNumber: string;
  jobTitle: string;
  reportsTo?: mongoose.Types.ObjectId;
  address: IAddress;
  role: 'Admin' | 'Manager' | 'Supervisor' | 'Staff' | 'Support';
  taxId: string;
  email: string;
  team: string;
  hireDate: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Address Schema
const AddressSchema = new Schema<IAddress>({
  unit: {
    type: String,
    required: false,
    trim: true
  },
  street: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  postalCode: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  }
});

// Staff Schema
const StaffSchema = new Schema<IStaff>({
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  middleName: {
    type: String,
    required: false,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  employeeNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: /^[A-Z]{3}-\d{7}$/
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  employmentStatus: {
    type: String,
    required: true,
    enum: ['Active', 'Inactive', 'Terminated', 'On Leave', 'Probation'],
    default: 'Active'
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  jobTitle: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  reportsTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: false
  },
  address: {
    type: AddressSchema,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['Admin', 'Manager', 'Supervisor', 'Staff', 'Support'],
    default: 'Staff'
  },
  taxId: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
    match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
  },
  team: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  hireDate: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

// Index for efficient querying
StaffSchema.index({ employeeNumber: 1 });
StaffSchema.index({ email: 1 });
StaffSchema.index({ phoneNumber: 1 });
StaffSchema.index({ employmentStatus: 1 });
StaffSchema.index({ team: 1 });
StaffSchema.index({ role: 1 });

// Pre-save hook to hash password
StaffSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Static method to generate employee number
StaffSchema.statics.generateEmployeeNumber = async function(countryCode: string): Promise<string> {
  // Ensure country code is 3 letters uppercase
  const formattedCountryCode = countryCode.toUpperCase().padEnd(3, 'X').substring(0, 3);
  
  // Find the highest existing employee number for this country
  const lastEmployee = await this.findOne(
    { employeeNumber: new RegExp(`^${formattedCountryCode}-`) },
    {},
    { sort: { employeeNumber: -1 } }
  );

  let nextNumber = 1;
  if (lastEmployee && lastEmployee.employeeNumber) {
    const lastNumberStr = lastEmployee.employeeNumber.split('-')[1];
    const lastNumber = parseInt(lastNumberStr, 10);
    nextNumber = lastNumber + 1;
  }

  // Format as 7-digit number with leading zeros
  const formattedNumber = nextNumber.toString().padStart(7, '0');
  return `${formattedCountryCode}-${formattedNumber}`;
};

// Instance method to compare password
StaffSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Create and export the model
const Staff = mongoose.models.Staff || mongoose.model<IStaff>('Staff', StaffSchema);
export default Staff; 