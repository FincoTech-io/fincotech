# Merchant Account Management API Documentation

## Overview
API endpoints for merchants to manage their own account data. These endpoints allow merchants to view, update, and delete their merchant account information. Each merchant account has a linked wallet for handling transactions and payments.

---

## Authentication
All endpoints require JWT authentication via:
- **Authorization Header**: `Bearer <token>`
- **Cookie**: `auth_token=<token>`

## Base URL
All endpoints are prefixed with: `/api/merchants/[merchantId]`

---

## Merchant Account Operations

### 1. Get Merchant Account Data
**GET** `/api/merchants/[merchantId]`

Retrieve complete merchant account information including linked wallet data.

**Required Access**: Any role with access to the merchant (`ADMIN`, `MERCHANT_OWNER`, `MERCHANT_MANAGER`, `MERCHANT_STAFF`)

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
    "merchant": { /* updated merchant object including wallet data */ }
  },
  "message": "Merchant account updated successfully"
}
```

### 3. Delete Merchant Account
**DELETE** `/api/merchants/[merchantId]`

Permanently delete a merchant account and remove access from all users. The linked wallet will also be closed and any remaining balance must be withdrawn before deletion.

**Required Access**: `ADMIN`, `MERCHANT_OWNER` only

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
| 400 | Bad Request - Invalid data or duplicate email/phone |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Merchant not found |
| 500 | Internal Server Error |

---

## Permission Matrix

| Operation | ADMIN | MERCHANT_OWNER | MERCHANT_MANAGER | MERCHANT_STAFF |
|-----------|-------|----------------|------------------|----------------|
| View Account | ✅ | ✅ | ✅ | ✅ |
| Update Account | ✅ | ✅ | ✅ | ❌ |
| Delete Account | ✅ | ✅ | ❌ | ❌ |

---

## Usage Examples

### Get Merchant Account
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
console.log('Wallet Balance:', data.data.merchant.wallet.balance);
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

---

## Notes

- All timestamps are in ISO 8601 format
- The `updatedAt` field is automatically updated on any changes
- Account deletion is permanent and cannot be undone
- Deleting a merchant account removes all user access permissions and closes the linked wallet
- For restaurant merchants, the `restaurantMenu` field contains the embedded menu data
- All endpoints return consistent JSON response format including wallet information
- Email and phone number uniqueness is enforced across all merchants
- Staff management should be handled through dedicated staff management endpoints
- Wallet operations require separate API calls to wallet endpoints 