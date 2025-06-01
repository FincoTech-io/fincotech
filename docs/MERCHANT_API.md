# Merchant API Documentation

## Overview
Complete API documentation for merchant management, registration, and operations.

## Base URLs
- **Staff Management**: `/api/management/merchants`
- **Registration**: `/api/commerce/register` 
- **Merchant Operations**: `/api/merchants`

---

## Staff Management Endpoints

### GET `/api/management/merchants`
**Purpose**: Retrieve paginated list of merchants (Staff only)

**Authentication**: Staff token required

**Query Parameters**:
```typescript
{
  search?: string;        // Search by name, email, or phone
  status?: 'verified' | 'pending' | 'rejected' | 'all'; // Default: 'verified'
  type?: string;          // Merchant type filter
  limit?: number;         // Default: 50
  skip?: number;          // Default: 0
}
```

**Response**:
```typescript
{
  success: boolean;
  data: {
    merchants: Merchant[];
    pagination: {
      total: number;
      limit: number;
      skip: number;
      hasMore: boolean;
      currentPage: number;
      totalPages: number;
    };
  };
}
```

### PATCH `/api/management/merchants`
**Purpose**: Update merchant verification status (Staff only)

**Authentication**: Staff token required

**Body**:
```typescript
{
  merchantId: string;
  verificationStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  notes?: string;
}
```

**Response**:
```typescript
{
  success: boolean;
  data: {
    merchantId: string;
    verificationStatus: string;
    updatedBy: {
      staffId: string;
      name: string;
      employeeNumber: string;
    };
  };
  message: string;
}
```

---

## Registration Endpoints

### POST `/api/commerce/register`
**Purpose**: Register new merchant (Staff only)

**Authentication**: Staff token required

**Body**:
```typescript
{
  phoneNumber: string;
  email: string;
  merchantName: string;
  merchantType: MerchantType;
  merchantAddress: string;
  merchantLicense: string;
  merchantStaff: StaffMember[];
  verificationStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  currentRegion?: string;
  currentAddress?: string;
  // Additional optional fields...
}
```

**Response**:
```typescript
{
  success: boolean;
  message: string;
  data: {
    merchantId: string;
    merchantName: string;
    email: string;
    phoneNumber: string;
    verificationStatus: string;
    wallet: {
      address?: string;
      success: boolean;
      error?: string;
    };
  };
}
```

### GET `/api/commerce/register`
**Purpose**: Get merchant metadata (types, roles, statuses)

**Authentication**: Staff token required

**Response**:
```typescript
{
  success: boolean;
  data: {
    merchantTypes: string[];
    availableRoles: string[];
    verificationStatuses: string[];
  };
}
```

---

## Application Approval Flow

### Automatic Merchant Creation
When a business application is approved via `PATCH /api/commerce/apply`:

1. **Merchant Account** created from application data
2. **User's merchantAccess** updated with ADMIN role
3. **Merchant Wallet** automatically created
4. **Two-way relationship** established

**Application Approval Body**:
```typescript
{
  applicationRef: string;
  status: 'Approved';
  reviewNotes?: string;
}
```

**Auto-Generated merchantAccess**:
```typescript
{
  userRole: 'ADMIN';
  merchantId: string;
  merchantName: string;
}
```

---

## Data Models

### Merchant
```typescript
interface Merchant {
  _id: string;
  phoneNumber: string;
  email: string;
  merchantName: string;
  merchantType: MerchantType;
  merchantAddress: string;
  merchantLicense: string;
  merchantStaff: StaffMember[];
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  currentRegion: string;
  currentAddress: string;
  hasUnreadNotifications: boolean;
  notifications: Notification[];
  advertisements?: Advertisement[];
  createdAt: Date;
  updatedAt: Date;
}
```

### MerchantType
```typescript
type MerchantType = 
  | 'RESTAURANT' | 'RETAIL' | 'MARKET' | 'SERVICE' 
  | 'EDUCATIONAL' | 'ENTERTAINMENT' | 'HOTEL' 
  | 'RENTAL' | 'TRANSPORTATION' | 'OTHER';
```

### StaffMember
```typescript
interface StaffMember {
  name: string;
  role: 'ADMIN' | 'MERCHANT_OWNER' | 'MERCHANT_MANAGER' | 'MERCHANT_STAFF';
  email: string;
  phoneNumber: string;
  userId: string;
  pushToken: string[];
}
```

### User merchantAccess
```typescript
interface MerchantAccess {
  userRole: 'ADMIN' | 'MERCHANT_OWNER' | 'MERCHANT_MANAGER' | 'MERCHANT_STAFF';
  merchantId: string;
  merchantName: string;
}
```

---

## Utility Functions

### Server-Side Utils (`/utils/merchantUtils.ts`)

```typescript
// Create merchant from approved application
createMerchantFromApplication(
  businessApplication: IBusinessApplication,
  applicantUserId: string,
  approvedByStaffId: string,
  applicationRef: string
): Promise<{ success: boolean; merchant?: any; error?: string }>

// Get user's accessible merchants
getUserMerchants(userId: string): Promise<{ 
  success: boolean; 
  merchants?: any[]; 
  error?: string 
}>

// Check user's merchant access
checkUserMerchantAccess(
  userId: string, 
  merchantId: string
): Promise<{ hasAccess: boolean; role?: string; error?: string }>

// Add user to merchant staff
addUserToMerchant(
  userId: string,
  merchantId: string,
  role: StaffRole,
  addedByStaffId: string
): Promise<{ success: boolean; error?: string }>

// Remove user from merchant staff
removeUserFromMerchant(
  userId: string,
  merchantId: string,
  removedByStaffId: string
): Promise<{ success: boolean; error?: string }>
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `400` | Bad Request - Invalid parameters |
| `401` | Unauthorized - Staff authentication required |
| `404` | Not Found - Merchant not found |
| `409` | Conflict - Merchant already exists |
| `500` | Internal Server Error |

---

## Wallet Integration

**Automatic Wallet Creation**: Every merchant gets a dedicated wallet upon account creation:
- **Entity Type**: `MERCHANT`
- **Tier**: `MERCHANT` 
- **Auto-Generated Address**: Unique wallet address
- **Direct Association**: Linked to merchant via `entityId`

**Access Wallet**:
```typescript
// Merchant wallet automatically created during registration
// Access via standard wallet endpoints using merchantId as entityId
```

---

## Security & Permissions

### Staff Access Levels
- **Admin Staff**: Full merchant management access
- **Customer Support**: View-only access (implementation dependent)

### User-Merchant Relationships
- **ADMIN**: Full merchant access and management
- **MERCHANT_OWNER**: Business owner level access
- **MERCHANT_MANAGER**: Operational management
- **MERCHANT_STAFF**: Basic operational access

### Authentication
All staff endpoints require valid JWT staff token in Authorization header:
```
Authorization: Bearer <staff-jwt-token>
``` 