# User API Documentation

## Overview
Complete API documentation for user management, authentication, and profile operations.

## Base URL
- **User Operations**: `/api/user`

---

## User Endpoints

### POST `/api/user/register`
**Purpose**: Register a new user account

**Authentication**: None required

**Body**:
```typescript
{
  phoneNumber: string;
  fullName: string;
  email: string;
  pin: string;           // 4-6 digits
  security: {
    question: string;
    answer: string;
  };
  nationality: string;
  idType: 'PASSPORT' | 'DRIVERS_LICENSE' | 'NATIONAL_ID';
  idNumber: string;
  pushToken?: string;
}
```

**Response**:
```typescript
{
  success: boolean;
  message: string;
  user: {
    id: string;
    fullName: string;
    phoneNumber: string;
    email: string;
    // Additional user fields...
  };
  wallet: {
    address: string;
    balance: number;
    currency: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}
```

### POST `/api/user/exists`
**Purpose**: Check if user exists by phone number

**Authentication**: None required

**Body**:
```typescript
{
  phoneNumber: string;
}
```

**Response**:
```typescript
{
  exists: boolean;
}
```

### GET `/api/user/profile`
**Purpose**: Get authenticated user's profile

**Authentication**: User token required

**Response**:
```typescript
{
  success: boolean;
  user: {
    id: string;
    fullName: string;
    phoneNumber: string;
    email: string;
    isVerified: boolean;
    wallet: {
      balance: number;
      currency: string;
      tier: string;
      address: string;
    };
    createdAt: Date;
    updatedAt: Date;
  };
}
```

### PATCH `/api/user/profile`
**Purpose**: Update authenticated user's profile

**Authentication**: User token required

**Body**:
```typescript
{
  fullName?: string;
  email?: string;
  profileImage?: {
    url: string;
    publicId: string;
  };
  currentRegion?: string;
  pushToken?: string;
  notificationPreferences?: NotificationPreferences;
  nationality?: string;
  idType?: 'PASSPORT' | 'DRIVERS_LICENSE' | 'NATIONAL_ID';
  idNumber?: string;
}
```

**Response**:
```typescript
{
  success: boolean;
  user: UpdatedUserData;
}
```

### GET `/api/user/applications`
**Purpose**: Get authenticated user's applications

**Authentication**: User token required

**Response**:
```typescript
{
  success: boolean;
  data: {
    userId: string;
    userInfo: {
      fullName: string;
      phoneNumber: string;
    };
    applications: ApplicationReference[];
    totalApplications: number;
  };
}
```

### GET `/api/user/sync-applications`
**Purpose**: Check sync status between user document and applications collection

**Authentication**: User token required

**Response**:
```typescript
{
  success: boolean;
  data: {
    user: {
      id: string;
      fullName: string;
      phoneNumber: string;
    };
    userApplications: number;
    databaseApplications: number;
    isInSync: boolean;
    discrepancies: {
      missingFromUser: number;
      extraInUser: number;
      missingApplications: string[];
      extraApplications: string[];
    };
    userApplicationsList: ApplicationReference[];
    databaseApplicationsList: Application[];
  };
}
```

### POST `/api/user/sync-applications`
**Purpose**: Sync applications from applications collection to user document

**Authentication**: User token required

**Response**:
```typescript
{
  success: boolean;
  message: string;
  data: {
    userApplicationsBefore: number;
    userApplicationsAfter: number;
    databaseApplications: number;
    synced: number;
    syncedApplications: string[];
  };
}
```

### POST `/api/user/push-token`
**Purpose**: Update user's push notification token

**Authentication**: User token required

**Body**:
```typescript
{
  pushToken: string;
}
```

**Response**:
```typescript
{
  success: boolean;
  message: string;
}
```

### DELETE `/api/user/push-token`
**Purpose**: Remove user's push notification token

**Authentication**: User token required

**Response**:
```typescript
{
  success: boolean;
  message: string;
}
```

---

## Data Models

### User
```typescript
interface User {
  _id: string;
  phoneNumber: string;
  fullName: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN' | 'CUSTOMER_SUPPORT' | 'MERCHANT' | 'DRIVER';
  isVerified: boolean;
  isActive: boolean;
  nationality: string;
  idType: 'PASSPORT' | 'DRIVERS_LICENSE' | 'NATIONAL_ID';
  idNumber: string;
  profileImage: {
    url: string;
    publicId: string;
  };
  pushToken?: string;
  currentRegion?: string;
  currentAddress?: string;
  hasUnreadNotifications: boolean;
  merchantAccess?: MerchantAccess[];
  driverAccountId?: string;
  applications: ApplicationReference[];
  notifications: Notification[];
  notificationPreferences: NotificationPreferences;
  createdAt: Date;
  updatedAt: Date;
}
```

### ApplicationReference
```typescript
interface ApplicationReference {
  applicationId: string;
  applicationRef: string;
  applicationType: 'business' | 'driver';
  status: 'Pending' | 'In Review' | 'Approved' | 'Declined';
  submissionDate: Date;
}
```

### MerchantAccess
```typescript
interface MerchantAccess {
  userRole: 'ADMIN' | 'MERCHANT_OWNER' | 'MERCHANT_MANAGER' | 'MERCHANT_STAFF';
  merchantId: string;
  merchantName: string;
}
```

### NotificationPreferences
```typescript
interface NotificationPreferences {
  paymentReceived: { sms: boolean; push: boolean; email: boolean; };
  paymentSent: { sms: boolean; push: boolean; email: boolean; };
  systemUpdates: { sms: boolean; push: boolean; email: boolean; };
  security: { sms: boolean; push: boolean; email: boolean; };
  promotions: { sms: boolean; push: boolean; email: boolean; };
}
```

---

## Authentication

### Token-Based Authentication
All authenticated endpoints require a valid JWT token:

**Header**:
```
Authorization: Bearer <user-jwt-token>
```

**Cookie** (Alternative):
```
auth_token: <user-jwt-token>
```

### Token Structure
```typescript
{
  userId: string;
  role: string;
  iat: number;    // Issued at
  exp: number;    // Expires at
}
```

---

## Automatic Features

### Wallet Creation
- **Auto-Generated**: Every user gets a wallet upon registration
- **Entity Type**: `USER`
- **Tier**: `BASIC` (default, upgradeable)
- **Address**: Unique wallet address using bcrypt hash

### Merchant Access
- **Auto-Populated**: When business application approved
- **Role**: `ADMIN` (default for applicants)
- **Two-Way Link**: Updates both user and merchant documents

---

## Error Codes

| Code | Description |
|------|-------------|
| `400` | Bad Request - Invalid parameters or validation failed |
| `401` | Unauthorized - Authentication token required/invalid |
| `404` | Not Found - User not found |
| `409` | Conflict - User already exists (phone/email) |
| `500` | Internal Server Error |

---

## Security Features

### Input Validation
- **Phone Number**: Normalized and unique validation
- **Email**: Format validation and uniqueness check
- **PIN**: 4-6 digits, hashed with bcrypt
- **Full Name**: Letters and spaces only, 3-50 characters

### Data Protection
- **PIN**: Never returned in responses (hashed storage)
- **Security Answers**: Excluded from profile responses
- **Token Verification**: All authenticated endpoints verify JWT

### Rate Limiting
- **Registration**: Limited to prevent abuse
- **Token Refresh**: Controlled refresh mechanism
- **Profile Updates**: Reasonable update frequency limits 