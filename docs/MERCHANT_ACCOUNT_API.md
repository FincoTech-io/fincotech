# Merchant Account Management API Documentation

## Overview
API endpoints for merchants to manage their own account data. These endpoints allow merchants to view, update, and delete their merchant account information. Each merchant account has a linked wallet for handling transactions and payments.

**Important**: Wallet access is granted to users listed in the Merchant's `merchantStaff` array with `ADMIN`, `MERCHANT_OWNER`, or `MERCHANT_MANAGER` roles.

---

## Authentication
All endpoints require JWT authentication via:
- **Authorization Header**: `Bearer <token>`
- **Cookie**: `auth_token=<token>`

## Permission System

### Merchant Staff Access
Access to merchant accounts is determined by the `merchantStaff` array within each merchant document. Users must be listed in this array with appropriate roles:

```typescript
merchantStaff: [
  {
    userId: "user_123",           // User's ID
    name: "John Doe",
    role: "MERCHANT_OWNER",       // User's role for this merchant
    email: "john@example.com",
    phoneNumber: "+1234567890",
    pushToken: []
  }
]
```

### Wallet Access Requirements
Only users listed in `merchantStaff` with the following roles can access wallet data:
- **ADMIN** - Full system administrator access
- **MERCHANT_OWNER** - Business owner with full merchant access
- **MERCHANT_MANAGER** - Manager with operational access

**MERCHANT_STAFF** role can view merchant data but **cannot access wallet information**.

### Legacy Compatibility
The API also supports legacy `user.merchantAccess` for backward compatibility, but prioritizes `merchantStaff` when both exist.

---

## Base URL
All endpoints are prefixed with: `/api/merchants/[merchantId]`

---

## Merchant Account Operations

### 1. Get Merchant Account Data
**GET** `/api/merchants/[merchantId]`

Retrieve complete merchant account information including linked wallet data (if user has wallet access permissions).

**Required Access**: Any role with access to the merchant (`ADMIN`, `MERCHANT_OWNER`, `MERCHANT_MANAGER`, `MERCHANT_STAFF`)

**Wallet Data Access**: Only `ADMIN`, `MERCHANT_OWNER`, `MERCHANT_MANAGER` roles

**Response**:
```json
{
  "success": true,
  "data": {
    "merchant": {
      "_id": "merchant_123",
      "phoneNumber": "+1234567890",
      "email": "merchant@example.com",
      "merchantName": "Joe's Restaurant",
      "merchantType": "RESTAURANT",
      "merchantAddress": "123 Main St, City, State",
      "merchantLicense": "LIC123456",
      "verificationStatus": "VERIFIED",
      "currentRegion": "Vancouver",
      "currentAddress": "123 Main St, Vancouver, BC",
      "hasUnreadNotifications": false,
      "notifications": [],
      "merchantStaff": [
        {
          "name": "John Doe",
          "role": "MERCHANT_OWNER",
          "email": "john@example.com",
          "phoneNumber": "+1234567890",
          "userId": "user_123",
          "pushToken": []
        }
      ],
      "wallet": {
        "walletId": "wallet_abc123",
        "balance": 1250.75,
        "currency": "CAD",
        "status": "ACTIVE",
        "address": "0x1234...abcd",
        "tier": "MERCHANT",
        "lastTransactionDate": "2025-01-20T14:30:00Z"
      },
      "restaurantMenu": { /* restaurant menu if merchant type is RESTAURANT */ },
      "notificationPreferences": { /* notification settings */ },
      "createdAt": "2025-01-20T10:00:00Z",
      "updatedAt": "2025-01-20T15:30:00Z"
    }
  }
}
```

**Note**: The `wallet` object will only be included if the authenticated user has one of the required roles for wallet access (`ADMIN`, `MERCHANT_OWNER`, `MERCHANT_MANAGER`).

### 2. Update Merchant Account Data
**PUT** `/api/merchants/[merchantId]`

Update merchant account information. Note: Wallet data cannot be updated through this endpoint and must be managed through dedicated wallet APIs.

**Required Access**: `ADMIN`, `MERCHANT_OWNER`, `MERCHANT_MANAGER`

**Request Body** (all fields optional):
```json
{
  "merchantName": "Joe's Updated Restaurant",
  "phoneNumber": "+1987654321",
  "email": "newemail@example.com",
  "merchantAddress": "456 New St, City, State",
  "merchantLicense": "NEWLIC789",
  "currentRegion": "Toronto",
  "currentAddress": "456 New St, Toronto, ON",
  "merchantStaff": [
    {
      "name": "Jane Smith",
      "role": "MERCHANT_MANAGER",
      "email": "jane@example.com",
      "phoneNumber": "+1555000123",
      "userId": "user_456",
      "pushToken": ["token123"]
    }
  ],
  "notificationPreferences": {
    "paymentReceived": {
      "roles": "MERCHANT_OWNER",
      "sms": true,
      "push": true,
      "email": true
    },
    "systemUpdates": {
      "roles": "MERCHANT_OWNER",
      "sms": false,
      "push": true,
      "email": true
    }
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "merchant": { /* updated merchant object including wallet data if user has access */ }
  },
  "message": "Merchant account updated successfully"
}
```

### 3. Delete Merchant Account
**DELETE** `/api/merchants/[merchantId]`

Permanently delete a merchant account and remove access from all users. The linked wallet will also be closed and any remaining balance must be withdrawn before deletion.

**Required Access**: `ADMIN`, `MERCHANT_OWNER` only

**Important**: The merchant's wallet must have a zero balance before deletion is allowed.

**Response**:
```json
{
  "success": true,
  "data": {
    "deletedMerchant": {
      "id": "merchant_123",
      "merchantName": "Joe's Restaurant",
      "email": "merchant@example.com",
      "merchantType": "RESTAURANT",
      "walletId": "wallet_abc123"
    }
  },
  "message": "Merchant account deleted successfully"
}
```

---

## Field Restrictions

### Protected Fields
These fields **cannot** be updated via the PUT endpoint:
- `_id` - Merchant ID (immutable)
- `verificationStatus` - Only staff can modify via management API
- `createdAt` - Creation timestamp (immutable)
- `merchantAccess` - User access permissions (managed separately)
- `wallet` - Wallet data (managed via dedicated wallet APIs)

### Validation Rules

#### Email Updates
- Must be unique across all merchants
- Cannot use an email already associated with another merchant
- Email format validation applies

#### Phone Number Updates
- Must be unique across all merchants
- Cannot use a phone number already associated with another merchant
- Phone number format validation applies

#### Merchant Types
Valid merchant types:
- `RESTAURANT` - Food service establishments
- `RETAIL` - Retail stores and shops
- `MARKET` - Markets and grocery stores
- `SERVICE` - Service-based businesses
- `EDUCATIONAL` - Educational institutions
- `ENTERTAINMENT` - Entertainment venues
- `HOTEL` - Hotels and accommodations
- `RENTAL` - Rental services
- `TRANSPORTATION` - Transportation services
- `OTHER` - Other business types

---

## Error Codes

| Status | Description |
|--------|-------------|
| 400 | Bad Request - Invalid data, duplicate email/phone, or non-zero wallet balance |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Merchant not found |
| 500 | Internal Server Error |

---

## Permission Matrix

| Operation | ADMIN | MERCHANT_OWNER | MERCHANT_MANAGER | MERCHANT_STAFF |
|-----------|-------|----------------|------------------|----------------|
| View Account | ✅ | ✅ | ✅ | ✅ |
| View Wallet | ✅ | ✅ | ✅ | ❌ |
| Update Account | ✅ | ✅ | ✅ | ❌ |
| Delete Account | ✅ | ✅ | ❌ | ❌ |

---

## Access Control Implementation

### Database Structure
```typescript
// Merchant Staff Array (controls access)
merchantStaff: [
  {
    userId: string;        // Links to User._id
    name: string;
    role: 'ADMIN' | 'MERCHANT_OWNER' | 'MERCHANT_MANAGER' | 'MERCHANT_STAFF';
    email: string;
    phoneNumber: string;
    pushToken: string[];
  }
]
```

### Access Validation Process
1. **Authentication**: Verify JWT token and get user ID
2. **Staff Lookup**: Check if user ID exists in `merchant.merchantStaff` array
3. **Role Validation**: Verify user's role meets the endpoint requirements
4. **Wallet Access**: Additional check for wallet data inclusion

### Adding Users to Merchant Staff
To grant a user access to a merchant account and its wallet:

1. Add user to the `merchantStaff` array with appropriate role
2. Optionally update the user's `merchantAccess` array for legacy compatibility
3. User will immediately gain access based on their assigned role

---

## Usage Examples

### Get Merchant Account with Wallet Data
```javascript
const response = await fetch('/api/merchants/merchant_123', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data.data.merchant);

// Check if wallet data is included (depends on user role)
if (data.data.merchant.wallet) {
  console.log('Wallet Balance:', data.data.merchant.wallet.balance);
  console.log('Wallet Address:', data.data.merchant.wallet.address);
} else {
  console.log('User does not have wallet access permissions');
}
```

### Update Merchant Information
```javascript
const response = await fetch('/api/merchants/merchant_123', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    merchantName: "Updated Restaurant Name",
    currentAddress: "New Address",
    notificationPreferences: {
      paymentReceived: {
        roles: "MERCHANT_OWNER",
        sms: true,
        push: true,
        email: true
      }
    }
  })
});

const data = await response.json();
```

### Update Contact Information
```javascript
const response = await fetch('/api/merchants/merchant_123', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: "newemail@restaurant.com",
    phoneNumber: "+1555123456"
  })
});
```

### Delete Merchant Account
```javascript
// Note: Only ADMIN and MERCHANT_OWNER can delete accounts
// Wallet must have zero balance
const response = await fetch('/api/merchants/merchant_123', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
```

---

## Data Models

### Merchant Wallet Structure
```typescript
interface MerchantWallet {
  walletId: string;
  balance: number;
  currency: 'CAD' | 'USD' | 'EUR';
  status: 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
  address: string;
  tier: 'MERCHANT';
  lastTransactionDate?: Date;
}
```

### Merchant Staff Structure
```typescript
interface MerchantStaff {
  name: string;
  role: 'ADMIN' | 'MERCHANT_OWNER' | 'MERCHANT_MANAGER' | 'MERCHANT_STAFF';
  email: string;
  phoneNumber: string;
  userId: string;
  pushToken: string[];
}
```

### Notification Preferences Structure
```typescript
interface NotificationPreferences {
  paymentReceived: NotificationSetting;
  paymentSent: NotificationSetting;
  systemUpdates: NotificationSetting;
  security: NotificationSetting;
  promotions: NotificationSetting;
}

interface NotificationSetting {
  roles: 'ADMIN' | 'MERCHANT_OWNER' | 'MERCHANT_MANAGER' | 'MERCHANT_STAFF';
  sms: boolean;
  push: boolean;
  email: boolean;
}
```

---

## Wallet Management

Each merchant account is automatically linked to a wallet upon account creation. The wallet enables merchants to:

- **Receive Payments**: Accept customer payments for goods/services
- **Send Payments**: Pay suppliers, staff, or other merchants
- **Track Balance**: Monitor available funds in real-time
- **Transaction History**: View detailed payment records
- **Withdraw Funds**: Transfer money to bank accounts

### Wallet Access Requirements
To access wallet data, users must be:
1. **Listed in merchantStaff array** with their user ID
2. **Have one of the required roles**: `ADMIN`, `MERCHANT_OWNER`, or `MERCHANT_MANAGER`
3. **Authenticated** with a valid JWT token

### Wallet API Integration
For wallet-specific operations, use the dedicated wallet management endpoints:
- `/api/wallets/[walletId]` - Wallet operations
- `/api/wallets/[walletId]/transactions` - Transaction management
- `/api/wallets/[walletId]/withdraw` - Fund withdrawals

### Important Wallet Notes
- Wallet data is read-only in merchant account endpoints
- All wallet modifications must use dedicated wallet APIs
- Merchant account deletion requires zero wallet balance
- Wallet status affects merchant's ability to process payments
- Currency is set during initial merchant setup and cannot be changed
- Users with `MERCHANT_STAFF` role cannot access wallet information

---

## Security Considerations

### Role-Based Access Control
- **ADMIN**: System-wide administrative access
- **MERCHANT_OWNER**: Full control over merchant account and wallet
- **MERCHANT_MANAGER**: Operational management including wallet access
- **MERCHANT_STAFF**: Basic access without wallet permissions

### Data Protection
- Wallet information is only exposed to authorized roles
- Sensitive financial data requires elevated permissions
- User access is validated on every request
- Role hierarchy ensures appropriate data visibility

### Audit Trail
- All wallet access is logged for security
- Permission changes affect access immediately
- Failed access attempts are monitored
- Role assignments are tracked for compliance

---

## Notes

- All timestamps are in ISO 8601 format
- The `updatedAt` field is automatically updated on any changes
- Account deletion is permanent and cannot be undone
- Deleting a merchant account removes all user access permissions and closes the linked wallet
- For restaurant merchants, the `restaurantMenu` field contains the embedded menu data
- All endpoints return consistent JSON response format including wallet information (when accessible)
- Email and phone number uniqueness is enforced across all merchants
- Staff management should be handled through dedicated staff management endpoints
- Wallet operations require separate API calls to wallet endpoints
- Users must be in the `merchantStaff` array to access any merchant data
- Wallet access specifically requires `ADMIN`, `MERCHANT_OWNER`, or `MERCHANT_MANAGER` roles 