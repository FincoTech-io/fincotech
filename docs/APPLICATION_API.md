# Application API Documentation

The Application API allows users to submit applications for both business merchants and drivers, with document upload support via Cloudinary. Application references are automatically added to the user's document for easy status tracking.

## Endpoints

### 1. Submit Application

**POST** `/api/commerce/apply`

Submit a new business or driver application. The application reference will be automatically added to the user's document if `applicantUserId` is provided.

#### Request Body

```json
{
  "applicationType": "business" | "driver",
  "applicantUserId": "optional-user-id",
  ...applicationData
}
```

#### Business Application Example

```json
{
  "applicationType": "business",
  "applicantUserId": "60d5f60f1234567890abcdef",
  
  // Basic Business Information
  "businessName": "Lululemon",
  "businessDescription": "Clothing",
  "businessCategory": "Retail", 
  "businessIndustry": "retail",
  "businessType": "Corporation",
  "businessWebsite": "whh.hu.com",
  "yearEstablished": "1980",
  "businessOwnershipPercentage": "100",
  
  // Contact Information
  "businessEmail": "support@fgy.con",
  "businessPhone": "+16043475914",
  "useCurrentPhone": true,
  
  // Address Information
  "businessStreetAddress": "147 The chase rd",
  "businessCity": "Harare",
  "businessState": "Harare", 
  "businessZipCode": "00000",
  "businessCountry": "Australia",
  "businessAddress": "",
  
  // Legal & Compliance
  "businessRegistrationNumber": "758575688",
  "businessLicense": "",
  "taxId": "575578755",
  "vatNumber": "646778",
  "authorizedSignatory": "Asher Gumunyu",
  "signatoryTitle": "Director",
  
  // Banking Information
  "businessBankName": "Td",
  "businessAccountType": "Business Checking",
  "businessAccountNumber": "12583655",
  "businessRoutingNumber": "552586358",
  
  // Business Operations
  "primaryBusinessPurpose": "B2B Transactions",
  "averageTransactionAmount": "$100 - $500",
  "expectedMonthlyVolume": "$25,000 - $100,000",
  
  // Document Uploads (base64 data URLs)
  "businessLicensePhoto": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
  "businessRegistrationDocument": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
  "businessInsuranceDocument": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
  "taxCertificatePhoto": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
  
  // Additional Information
  "businessStaff": [],
  "advertisements": [],
  "notifications": [],
  "hasUnreadNotifications": false,
  "notificationPreferences": {
    "email": true,
    "push": true,
    "sms": true
  },
  "currentAddress": "",
  "currentRegion": "",
  "verificationStatus": "pending"
}
```

#### Driver Application Example

```json
{
  "applicationType": "driver",
  "applicantUserId": "60d5f60f1234567890abcdef",
  
  // Personal & Account Information
  "accountHolderName": "Asher",
  
  // Banking Information
  "bankAccountNumber": "55635566",
  "bankName": "Td",
  "routingNumber": "639365825",
  
  // Driver License Information
  "licenseNumber": "5678567656",
  "licenseExpiry": "03/12/2030",
  "licenseState": "Harare",
  "licenseClass": "Class 5",
  
  // Vehicle Information
  "hasVehicle": true,
  "vehicleType": "Car",
  "vehicleMake": "Tesla",
  "vehicleModel": "3",
  "vehicleYear": "2020",
  "vehiclePlate": "Te3gt4",
  "vehicleColor": "White",
  "vehicleCapacity": "4",
  "vehicleVIN": "",
  
  // Insurance Information
  "insuranceProvider": "",
  "insuranceExpiry": "",
  
  // Service Types
  "serviceTypes": {
    "rideShare": true,
    "foodDelivery": true,
    "groceryDelivery": true,
    "packageDelivery": true
  },
  
  // Availability
  "availability": {
    "monday": true,
    "tuesday": true,
    "wednesday": false,
    "thursday": true,
    "friday": false,
    "saturday": false,
    "sunday": true
  },
  
  // Preferred Hours
  "preferredHours": {
    "morning": true,
    "afternoon": true,
    "evening": true,
    "lateNight": true
  },
  
  "maxDeliveryDistance": "10",
  
  // Document Uploads (base64 data URLs)
  "licensePhotoFront": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
  "licensePhotoBack": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
  "registrationPhoto": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
  "insurancePhoto": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
  "profilePhoto": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
  
  // Consent & Background
  "backgroundCheckConsent": true,
  "drivingRecordConsent": true,
  
  // Notifications (auto-populated)
  "notifications": [],
  "hasUnreadNotifications": false,
  "notificationPreferences": {
    "email": true,
    "push": true,
    "sms": true
  },
  "verificationStatus": "pending"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "applicationRef": "DRV-1703123456789-ABC123",
    "applicationId": "60d5f60f1234567890abcdef",
    "status": "Pending",
    "submissionDate": "2023-12-21T10:30:00.000Z",
    "message": "Driver application submitted successfully"
  }
}
```

### 2. Retrieve Applications

**GET** `/api/commerce/apply`

Retrieve applications with optional filtering.

#### Query Parameters

- `applicationRef` - Get specific application by reference
- `applicantUserId` - Filter by applicant user ID
- `applicationType` - Filter by type (`business` or `driver`)
- `status` - Filter by status
- `limit` - Number of results (default: 20)
- `skip` - Number of results to skip (default: 0)

#### Examples

```bash
# Get specific application
GET /api/commerce/apply?applicationRef=DRV-1703123456789-ABC123

# Get all driver applications
GET /api/commerce/apply?applicationType=driver

# Get applications for specific user
GET /api/commerce/apply?applicantUserId=60d5f60f1234567890abcdef

# Get pending applications with pagination
GET /api/commerce/apply?status=submitted&limit=10&skip=0
```

#### Response

```json
{
  "success": true,
  "data": {
    "applications": [...],
    "pagination": {
      "total": 25,
      "limit": 10,
      "skip": 0,
      "hasMore": true,
      "currentPage": 1,
      "totalPages": 3
    }
  }
}
```

### 3. Update Application Status

**PATCH** `/api/commerce/apply`

Update application status and review information. The status will also be updated in the user's document automatically.

#### Request Body

```json
{
  "applicationRef": "DRV-1703123456789-ABC123",
  "status": "Approved",
  "reviewNotes": "All documents verified successfully",
  "reviewedBy": "60d5f60f1234567890admin"
}
```

#### Valid Statuses

- `Pending` - Initial submission (default)
- `In Review` - Being reviewed by admin
- `Approved` - Application approved
- `Declined` - Application rejected

#### Response

```json
{
  "success": true,
  "data": {
    "applicationRef": "DRV-1703123456789-ABC123",
    "status": "Approved",
    "reviewDate": "2023-12-21T11:30:00.000Z",
    "approvalDate": "2023-12-21T11:30:00.000Z",
    "rejectionDate": null
  },
  "message": "Application updated successfully"
}
```

### 4. Get User Applications

**GET** `/api/users/{userId}/applications`

Retrieve all applications for a specific user from their user document. This is a quick way for users to check their application status without querying the main applications collection.

#### Parameters

- `userId` - The user's ID (path parameter)

#### Example

```bash
GET /api/users/60d5f60f1234567890abcdef/applications
```

#### Response

```json
{
  "success": true,
  "data": {
    "userId": "60d5f60f1234567890abcdef",
    "userInfo": {
      "fullName": "John Doe",
      "phoneNumber": "+1234567890"
    },
    "applications": [
      {
        "applicationId": "60d5f60f1234567890abcdef",
        "applicationRef": "DRV-1703123456789-ABC123",
        "applicationType": "driver",
        "status": "Pending",
        "submissionDate": "2023-12-21T10:30:00.000Z"
      },
      {
        "applicationId": "60d5f60f1234567890abcde0",
        "applicationRef": "BIZ-1703123456789-XYZ456",
        "applicationType": "business",
        "status": "In Review",
        "submissionDate": "2023-12-20T08:15:00.000Z"
      }
    ],
    "totalApplications": 2
  }
}
```

## Driver Application Fields

### Required Fields

**Personal & Banking:**
- `accountHolderName` - Driver's full name
- `bankAccountNumber` - Bank account number for payments
- `bankName` - Name of the bank
- `routingNumber` - Bank routing number

**License Information:**
- `licenseNumber` - Driver license number
- `licenseExpiry` - License expiry date (MM/DD/YYYY format)
- `licenseState` - State/province where license was issued
- `licenseClass` - License class (e.g., "Class 5")

**Vehicle Information:**
- `hasVehicle` - Boolean indicating vehicle ownership
- `vehicleType` - Type of vehicle (e.g., "Car", "Motorcycle")
- `vehicleMake` - Vehicle manufacturer
- `vehicleModel` - Vehicle model
- `vehicleYear` - Year of manufacture
- `vehiclePlate` - License plate number
- `vehicleColor` - Vehicle color
- `vehicleCapacity` - Passenger/cargo capacity

**Service & Availability:**
- `serviceTypes` - Object with service type selections
- `availability` - Object with day-of-week availability
- `preferredHours` - Object with time slot preferences
- `maxDeliveryDistance` - Maximum delivery distance in km

**Consent:**
- `backgroundCheckConsent` - Consent for background check
- `drivingRecordConsent` - Consent for driving record check

### Document Requirements

- `licensePhotoFront` - Front of driver license
- `licensePhotoBack` - Back of driver license
- `registrationPhoto` - Vehicle registration document
- `insurancePhoto` - Vehicle insurance document
- `profilePhoto` - Driver profile photo

## Document Upload

### Supported Formats

- **Images**: JPEG, PNG, GIF
- **Maximum Size**: Automatically optimized to 1500x1500px
- **Storage**: Cloudinary with automatic optimization

### Mobile App Integration

For mobile apps using file:// URLs, convert images to base64 before sending:

```javascript
// React Native example with image compression
import { launchImageLibrary } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';

const convertToBase64 = async (fileUri) => {
  try {
    // First, compress/resize the image to reduce payload size
    const resizedImage = await ImageResizer.createResizedImage(
      fileUri,
      800,  // max width
      800,  // max height
      'JPEG',
      60    // quality (0-100)
    );
    
    const base64 = await RNFS.readFile(resizedImage.uri, 'base64');
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error('Error converting to base64:', error);
    return null;
  }
};

// Web example with canvas compression
const compressImage = (file, maxWidth = 800, quality = 0.6) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};
```

## Performance Optimization

### Image Upload Optimization

The API processes multiple document uploads in parallel for better performance. To avoid timeout errors:

1. **Compress images before upload**:
   - Maximum recommended size: 800x800 pixels
   - JPEG quality: 60-80%
   - Target file size: <200KB per image

2. **Total payload recommendations**:
   - Keep total request size under 2MB
   - Driver applications: 5 images max
   - Business applications: 4 images max

3. **Connection requirements**:
   - Stable internet connection
   - Minimum upload speed: 1 Mbps

### Timeout Handling

The API has a 60-second timeout limit. If you encounter 504 timeout errors:

1. **Reduce image sizes** on the client side
2. **Check image quality** - use JPEG with 60-70% quality
3. **Retry with smaller images** if the first attempt fails
4. **Consider uploading one document at a time** for very slow connections

### Error Handling Example

```javascript
const submitApplication = async (applicationData) => {
  try {
    console.log('Submitting application...');
    const response = await fetch('/api/commerce/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(applicationData),
    });
    
    if (!response.ok) {
      if (response.status === 504) {
        throw new Error('Request timeout - please compress your images and try again');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
    
  } catch (error) {
    if (error.message.includes('timeout') || error.message.includes('504')) {
      // Handle timeout - suggest image compression
      console.error('Upload timeout - images may be too large');
      throw new Error('Upload timeout. Please reduce image sizes and try again.');
    }
    throw error;
  }
};
```

## Validation Rules

### Driver Application Validation

- At least one service type must be selected
- At least one availability day must be selected
- At least one preferred hour slot must be selected
- License expiry date must be in the future
- Vehicle year must be between 1990 and current year + 1
- Vehicle capacity must be between 1 and 50
- Maximum delivery distance must be between 1 and 100 km

## Error Handling

### Validation Errors

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "accountHolderName is required",
    "At least one service type must be selected",
    "Driver license must not be expired"
  ]
}
```

### Document Upload Errors

```json
{
  "success": false,
  "error": "Failed to upload image to Cloudinary"
}
```

## Environment Variables

Ensure these Cloudinary environment variables are set:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Database Schema

Applications are stored in the `applications` collection with the following structure:

- **Common Fields**: `applicationType`, `applicationRef`, `status`, `submissionDate`, etc.
- **Business Applications**: Stored in `businessApplication` subdocument
- **Driver Applications**: Stored in `driverApplication` subdocument
- **Documents**: Stored as objects with `url`, `publicId`, `originalName`, `uploadedAt`

## Status Workflow

1. **Pending** → Application initially submitted (default status)
2. **In Review** → Admin reviewing application
3. **Approved** → Application approved, can create merchant/driver account
4. **Declined** → Application rejected with reason

## User Application Tracking

When an application is submitted with a valid `applicantUserId`, the application reference is automatically added to the user's document in the `applications` array. This allows users to easily track their application status.

### User Applications Structure

```json
{
  "applications": [
    {
      "applicationId": "60d5f60f1234567890abcdef",
      "applicationRef": "DRV-1703123456789-ABC123",
      "applicationType": "driver",
      "status": "Pending",
      "submissionDate": "2023-12-21T10:30:00.000Z"
    }
  ]
}
``` 