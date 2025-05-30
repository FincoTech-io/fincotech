# FincoTech Staff Creation Script

This script allows you to easily create staff members for the FincoTech application from the command line.

## Prerequisites

- Node.js installed
- MongoDB connection configured in `.env.local`
- All dependencies installed (`npm install`)

## Usage

### Method 1: Using npm scripts (Recommended)

```bash
# Interactive mode - prompts for all information
npm run create-staff

# Quick mode - minimal prompts with defaults
npm run create-staff:quick
```

### Method 2: Direct node execution

```bash
# Interactive mode
node scripts/create-staff.js

# Quick mode
node scripts/create-staff.js --quick

# Help
node scripts/create-staff.js --help
```

## Modes

### Interactive Mode (Default)
Prompts you for all required information:
- Personal details (name, email, phone, date of birth)
- Job information (title, team, role, employment status)
- Address details
- Tax ID
- Password (hidden input)
- Country code for employee number generation

### Quick Mode
Minimal prompts for essential information:
- First Name
- Last Name  
- Email
- Password

All other fields use sensible defaults.

## Example Usage

```bash
$ npm run create-staff

🚀 FincoTech Staff Creation Tool

First Name: John
Middle Name (optional): Michael
Last Name: Doe
Email: john.doe@fincotech.com
Password: ******
Phone Number: +263771234567
Date of Birth (YYYY-MM-DD): 1990-05-15
Job Title: System Administrator
Team: IT Department
Tax ID: TAX123456789

Select Role:
1. Admin
2. Manager
3. Supervisor
4. Staff
5. Support
Choice (1-5): 1

Select Employment Status:
1. Active
2. Inactive
3. On Leave
4. Probation
Choice (1-4) [default: Active]: 1

Country Code (3 letters) [default: ZWE]: ZWE

📍 Address Information:
Unit/Apt (optional): Suite 100
Street: 123 Innovation Drive
City: Harare
Postal Code: 00263
Country: Zimbabwe

⏳ Generating employee number...
⏳ Creating staff member...

✅ Staff member created successfully!
📋 Details:
   Employee Number: ZWE-0000001
   Name: John Michael Doe
   Email: john.doe@fincotech.com
   Role: Admin
   Team: IT Department
   Status: Active

🔐 Login Credentials:
   Employee ID: ZWE-0000001
   Password: [Hidden - use the password you entered]

🌐 Login URL: http://localhost:3000/management
```

## Features

- ✅ **Auto-generated employee numbers** (format: ZWE-0000001)
- ✅ **Password hashing** with bcrypt
- ✅ **Input validation** for email, dates, etc.
- ✅ **Hidden password input** for security
- ✅ **Duplicate prevention** (email, phone, tax ID)
- ✅ **Database connection handling**
- ✅ **Error handling** with user-friendly messages
- ✅ **Interactive prompts** with default values
- ✅ **Quick mode** for rapid setup

## Employee Number Format

Employee numbers are automatically generated in the format:
- **ZWE-0000001** (Zimbabwe)
- **USA-0000001** (United States)
- **GBR-0000001** (Great Britain)

The script finds the highest existing number for the country and increments it.

## Error Handling

The script handles common errors:
- Duplicate email addresses
- Duplicate phone numbers
- Duplicate tax IDs
- Invalid email formats
- Database connection issues
- Required field validation

## Security

- Passwords are hashed using bcrypt with 12 salt rounds
- Passwords are never displayed in plain text
- Database connection uses environment variables
- Input validation prevents malicious data

## Troubleshooting

### "MONGODB_URI not found"
Make sure you have a `.env.local` file with your MongoDB connection string:
```
MONGODB_URI=mongodb://localhost:27017/fincotech
```

### "Staff member already exists"
Check if someone with the same email, phone number, or tax ID already exists in the database.

### Permission errors on Linux/Mac
Make the script executable:
```bash
chmod +x scripts/create-staff.js
```

## Next Steps

After creating a staff member:
1. The employee can log in at `/management/` using their Employee ID and password
2. They'll have access to the staff dashboard based on their role
3. Admin users can create additional staff members through the web interface 