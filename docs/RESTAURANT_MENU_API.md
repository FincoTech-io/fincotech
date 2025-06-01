# Restaurant Menu API Documentation

## Overview
API endpoints for managing restaurant menus embedded in the Merchant model. These endpoints are specifically for merchants with `merchantType: 'RESTAURANT'`.

---

## Authentication
All endpoints (except GET requests) require JWT authentication via:
- **Authorization Header**: `Bearer <token>`
- **Cookie**: `auth_token=<token>`

## Base URL
All endpoints are prefixed with: `/api/merchants/[merchantId]/menu`

---

## Restaurant Menu Management

### 1. Get Restaurant Menu
**GET** `/api/merchants/[merchantId]/menu`

Get the complete restaurant menu data.

**Response**:
```json
{
  "success": true,
  "data": {
    "merchantId": "merchant_123",
    "menu": {
      "restaurantInfo": { /* restaurant info */ },
      "operatingHours": { /* hours */ },
      "serviceOptions": { /* service options */ },
      "businessStatus": { /* current status */ },
      "menus": [ /* menu array */ ],
      "orderingRules": { /* ordering rules */ },
      "version": 1,
      "isActive": true
    }
  }
}
```

### 2. Create Restaurant Menu
**POST** `/api/merchants/[merchantId]/menu`

Create a new restaurant menu (only if none exists).

**Required Access**: `ADMIN`, `MERCHANT_OWNER`, `MERCHANT_MANAGER`

**Request Body**:
```json
{
  "restaurantInfo": {
    "cuisineTypes": ["ITALIAN"],
    "priceRange": "$$",
    "averagePreparationTime": 25,
    "images": {
      "logo": { "url": "...", "publicId": "...", "alt": "Logo" },
      "gallery": []
    },
    "rating": { "average": 4.5, "totalReviews": 100 }
  },
  "operatingHours": {
    "timezone": "America/Vancouver",
    "schedule": {
      "MONDAY": {
        "isOpen": true,
        "periods": [{
          "openTime": "11:00",
          "closeTime": "22:00",
          "serviceTypes": ["DINE_IN", "TAKEOUT", "DELIVERY"]
        }]
      }
      // ... other days
    },
    "specialHours": [],
    "temporaryClosures": []
  },
  "serviceOptions": {
    "dineIn": { "available": true, "tableReservations": true, "walkInsAccepted": true },
    "takeout": { "available": true, "estimatedWaitTime": 15, "orderAheadTime": 120 },
    "delivery": {
      "available": true,
      "radius": 5,
      "minimumOrder": 25,
      "deliveryFee": 3.99,
      "estimatedDeliveryTime": 35,
      "deliveryZones": []
    },
    "curbside": { "available": false, "instructions": "" }
  }
}
```

### 3. Update Restaurant Menu
**PUT** `/api/merchants/[merchantId]/menu`

Update existing restaurant menu data.

**Required Access**: `ADMIN`, `MERCHANT_OWNER`, `MERCHANT_MANAGER`

**Request Body**: Partial menu data to update

### 4. Delete Restaurant Menu
**DELETE** `/api/merchants/[merchantId]/menu`

Delete the entire restaurant menu.

**Required Access**: `ADMIN`, `MERCHANT_OWNER` only

---

## Menu Items Management

### 1. Get All Menu Items
**GET** `/api/merchants/[merchantId]/menu/items`

Get all menu items with optional filtering.

**Query Parameters**:
- `categoryId`: Filter by category ID
- `isAvailable`: Filter by availability (`true`/`false`)
- `tags`: Comma-separated tags (e.g., `VEGETARIAN,GLUTEN_FREE`)

**Response**:
```json
{
  "success": true,
  "data": {
    "merchantId": "merchant_123",
    "items": [
      {
        "id": "item_123",
        "name": "Classic Bruschetta",
        "description": "Toasted bread with tomatoes",
        "basePrice": 12.99,
        "isAvailable": true,
        "tags": ["VEGETARIAN"],
        "categoryId": "appetizers",
        "categoryName": "Appetizers",
        "menuId": "dinner_menu",
        "menuName": "Dinner Menu"
      }
    ],
    "total": 1
  }
}
```

### 2. Add Menu Item
**POST** `/api/merchants/[merchantId]/menu/items`

Add a new menu item to a specific category.

**Required Access**: `ADMIN`, `MERCHANT_OWNER`, `MERCHANT_MANAGER`

**Request Body**:
```json
{
  "menuId": "dinner_menu",
  "categoryId": "appetizers",
  "item": {
    "name": "Classic Bruschetta",
    "description": "Toasted bread topped with fresh tomatoes, basil, and garlic",
    "basePrice": 12.99,
    "preparationTime": 10,
    "tags": ["VEGETARIAN"],
    "dietaryInfo": {
      "isVegetarian": true,
      "isVegan": false,
      "isGlutenFree": false
    },
    "allergens": ["WHEAT"],
    "modifierGroups": [
      {
        "id": "bread_type",
        "name": "Bread Choice",
        "type": "SINGLE_CHOICE",
        "minSelections": 1,
        "maxSelections": 1,
        "isRequired": true,
        "modifiers": [
          {
            "id": "regular_bread",
            "name": "Regular Bread",
            "priceModifier": 0,
            "priceType": "FIXED",
            "isDefault": true
          }
        ]
      }
    ]
  }
}
```

### 3. Get Specific Menu Item
**GET** `/api/merchants/[merchantId]/menu/items/[itemId]`

Get details of a specific menu item.

**Response**:
```json
{
  "success": true,
  "data": {
    "merchantId": "merchant_123",
    "item": { /* full item data */ },
    "context": {
      "menuId": "dinner_menu",
      "menuName": "Dinner Menu",
      "categoryId": "appetizers",
      "categoryName": "Appetizers"
    }
  }
}
```

### 4. Update Menu Item
**PUT** `/api/merchants/[merchantId]/menu/items/[itemId]`

Update a specific menu item.

**Required Access**: `ADMIN`, `MERCHANT_OWNER`, `MERCHANT_MANAGER`

**Request Body**: Partial item data to update

### 5. Delete Menu Item
**DELETE** `/api/merchants/[merchantId]/menu/items/[itemId]`

Delete a specific menu item.

**Required Access**: `ADMIN`, `MERCHANT_OWNER` only

---

## Business Status Management

### 1. Get Restaurant Status
**GET** `/api/merchants/[merchantId]/menu/status`

Get current business status and operating hours.

**Response**:
```json
{
  "success": true,
  "data": {
    "merchantId": "merchant_123",
    "businessStatus": {
      "isOpen": true,
      "currentStatus": "OPEN",
      "statusMessage": null,
      "estimatedReopenTime": null,
      "pausedServices": [],
      "busyLevel": "MODERATE"
    },
    "operatingHours": { /* operating hours data */ }
  }
}
```

### 2. Update Restaurant Status
**PUT** `/api/merchants/[merchantId]/menu/status`

Update restaurant business status.

**Required Access**: `ADMIN`, `MERCHANT_OWNER`, `MERCHANT_MANAGER`

**Request Body**:
```json
{
  "isOpen": false,
  "currentStatus": "TEMPORARILY_CLOSED",
  "statusMessage": "Busy - longer wait times",
  "estimatedReopenTime": "2025-01-20T15:00:00Z",
  "pausedServices": ["DELIVERY"],
  "busyLevel": "HIGH"
}
```

### 3. Toggle Restaurant Open/Close
**POST** `/api/merchants/[merchantId]/menu/status/toggle`

Quick toggle between open and closed status.

**Required Access**: `ADMIN`, `MERCHANT_OWNER`, `MERCHANT_MANAGER`

**Response**:
```json
{
  "success": true,
  "data": {
    "merchantId": "merchant_123",
    "businessStatus": { /* updated status */ },
    "action": "closed"
  },
  "message": "Restaurant closed successfully"
}
```

---

## Data Models

### Menu Item Structure
```typescript
interface IMenuItem {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  images: IImageObject[];
  basePrice: number;
  compareAtPrice?: number;
  isOnSale: boolean;
  saleEndDate?: Date;
  preparationTime: number;
  servingSize?: string;
  calories?: number;
  isAvailable: boolean;
  availabilitySchedule?: IMenuAvailability;
  inventoryTracking?: IInventoryTracking;
  tags: ItemTag[];
  dietaryInfo: IDietaryInfo;
  allergens: Allergen[];
  spiceLevel?: SpiceLevel;
  displayOrder: number;
  isPopular: boolean;
  isFeatured: boolean;
  isNew: boolean;
  badgeText?: string;
  modifierGroups: IModifierGroup[];
  recommendedWith?: string[];
  substitutes?: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Business Status Structure
```typescript
interface IBusinessStatus {
  isOpen: boolean;
  currentStatus: 'OPEN' | 'CLOSED' | 'BUSY' | 'TEMPORARILY_CLOSED' | 'PERMANENTLY_CLOSED';
  statusMessage?: string;
  estimatedReopenTime?: Date;
  pausedServices: ServiceType[];
  busyLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
}
```

---

## Error Codes

| Status | Description |
|--------|-------------|
| 400 | Bad Request - Missing required parameters |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Restaurant/menu/item not found |
| 500 | Internal Server Error |

---

## Permission Matrix

| Operation | ADMIN | MERCHANT_OWNER | MERCHANT_MANAGER | MERCHANT_STAFF |
|-----------|-------|----------------|------------------|----------------|
| View Menu | ✅ | ✅ | ✅ | ✅ |
| Create Menu | ✅ | ✅ | ✅ | ❌ |
| Update Menu | ✅ | ✅ | ✅ | ❌ |
| Delete Menu | ✅ | ✅ | ❌ | ❌ |
| Add Items | ✅ | ✅ | ✅ | ❌ |
| Update Items | ✅ | ✅ | ✅ | ❌ |
| Delete Items | ✅ | ✅ | ❌ | ❌ |
| Update Status | ✅ | ✅ | ✅ | ❌ |

---

## Usage Examples

### Creating a Complete Menu
```javascript
// 1. First create the restaurant menu
const menuResponse = await fetch('/api/merchants/merchant_123/menu', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    restaurantInfo: { /* restaurant info */ },
    operatingHours: { /* hours */ },
    serviceOptions: { /* services */ }
  })
});

// 2. Add menu items
const itemResponse = await fetch('/api/merchants/merchant_123/menu/items', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    menuId: "dinner_menu",
    categoryId: "appetizers", 
    item: { /* item data */ }
  })
});

// 3. Update restaurant status
const statusResponse = await fetch('/api/merchants/merchant_123/menu/status', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    isOpen: true,
    currentStatus: "OPEN"
  })
});
```

### Quick Status Toggle
```javascript
// Toggle restaurant open/close
const toggleResponse = await fetch('/api/merchants/merchant_123/menu/status/toggle', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>'
  }
});
```

---

## Notes

- Menu versioning is automatically handled - version increments on any update
- All timestamps are in ISO 8601 format
- Images should be uploaded separately and referenced by URL/publicId
- Menu items support complex modifier groups with pricing rules
- Business status changes are reflected immediately
- Operating hours support timezone-aware scheduling
- All endpoints return consistent JSON response format 