# Restaurant Menu Management API Documentation

## Overview
Comprehensive API endpoints for managing restaurant menus, categories, and menu items. This includes full CRUD operations for menus, categories, items, and image management.

**Base URL**: `/api/merchants/[merchantId]/menu`

---

## Authentication & Permissions
All endpoints require JWT authentication and appropriate merchant access:

- **Read Operations**: All roles with merchant access
- **Create/Update Operations**: ADMIN, MERCHANT_OWNER, MERCHANT_MANAGER
- **Delete Operations**: ADMIN, MERCHANT_OWNER only

---

## Menu Management Endpoints

### 1. Get All Menus
```
GET /api/merchants/[merchantId]/menu/menus
```

**Response:**
```json
{
  "success": true,
  "data": {
    "merchantId": "merchant123",
    "menus": [
      {
        "id": "menu-id-1",
        "name": "Breakfast",
        "description": "Morning menu items",
        "timeSlots": [
          {
            "startTime": "06:00",
            "endTime": "11:00",
            "daysOfWeek": ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]
          }
        ],
        "categories": [
          {
            "id": "cat-1",
            "name": "Appetizers",
            "description": "Starter dishes",
            "displayOrder": 1
          }
        ],
        "isActive": true,
        "displayOrder": 1
      }
    ]
  }
}
```

### 2. Create New Menu
```
POST /api/merchants/[merchantId]/menu/menus
```

**Request Body:**
```json
{
  "name": "Breakfast",
  "description": "Morning menu items",
  "timeSlots": [
    {
      "startTime": "06:00",
      "endTime": "11:00",
      "daysOfWeek": ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]
    }
  ],
  "isActive": true,
  "displayOrder": 1
}
```

### 3. Update Menu
```
PUT /api/merchants/[merchantId]/menu/menus/[menuId]
```

**Request Body:** (All fields optional)
```json
{
  "name": "Updated Breakfast Menu",
  "description": "Updated description",
  "timeSlots": [...],
  "isActive": false,
  "displayOrder": 2
}
```

### 4. Delete Menu
```
DELETE /api/merchants/[merchantId]/menu/menus/[menuId]
```
**Note:** Only ADMIN and MERCHANT_OWNER can delete menus.

### 5. Get Menu Data
```
GET /api/merchants/[merchantId]/menu
```

Retrieve the complete menu data for a merchant with **flat, normalized structure**.

**Permissions Required:**
- ADMIN, MERCHANT_OWNER, MERCHANT_MANAGER, MERCHANT_STAFF (read access)

**Response:**
```json
{
  "success": true,
  "data": {
    "merchantId": "683beca56d412c1d572afdda",
    "merchantName": "Nandos",
    "hasMenu": true,
    "menuData": {
      "merchantId": "683beca56d412c1d572afdda",
      "merchantName": "Nandos",
      "businessHours": {
        "monday": { "isOpen": true, "startTime": "9:00 AM", "endTime": "5:00 PM" },
        "tuesday": { "isOpen": true, "startTime": "9:00 AM", "endTime": "5:00 PM" },
        "wednesday": { "isOpen": false, "startTime": "9:00 AM", "endTime": "5:00 PM" },
        "thursday": { "isOpen": false, "startTime": "9:00 AM", "endTime": "5:00 PM" },
        "friday": { "isOpen": false, "startTime": "9:00 AM", "endTime": "5:00 PM" },
        "saturday": { "isOpen": true, "startTime": "9:00 AM", "endTime": "5:00 PM" },
        "sunday": { "isOpen": true, "startTime": "9:00 AM", "endTime": "5:00 PM" }
      },
      "menus": [
        {
          "id": "menu_1748891586702",
          "name": "Dinner",
          "description": "",
          "timeSlots": [],
          "categories": ["Appetizers", "Dips"], // All categories (for frontend compatibility)
          "isActive": true,
          "displayOrder": 1,
          "itemCount": 1
        }
      ],
      "categories": ["Appetizers", "Dips"], // Simple array for frontend
      "menuItems": [
        {
          "name": "Garlic dip",
          "description": "No description",
          "price": "1.25",
          "tax": "0.00",
          "image": "https://res.cloudinary.com/yourcloud/image/upload/.../Garlic_dip_image.jpg",
          "imagePublicId": "fincotech/Merchant/683beca56d412c1d572afdda/item_1748891586702_0/Garlic_dip_image",
          "categories": ["Dips"],
          "menu": "Dinner",
          "modifiers": [],
          "isSingularItem": true
        }
      ],
      "totalMenus": 1,
      "totalCategories": 2,
      "totalItems": 1,
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  },
  "message": "Menu data retrieved successfully"
}
```

**Database Structure (Internal):**
The data is stored internally with a flat, normalized structure:

```json
{
  "restaurantMenu": {
    "menus": [
      {
        "id": "menu_1748891586702",
        "name": "Dinner",
        "description": "",
        "timeSlots": [],
        "isActive": true,
        "displayOrder": 1,
        "itemIds": ["item_1748891586702_0"] // References to item IDs
      }
    ],
    "categories": [
      {
        "id": "category_1748891586702_0",
        "name": "Appetizers",
        "description": "",
        "displayOrder": 1,
        "isActive": true
      },
      {
        "id": "category_1748891586702_1", 
        "name": "Dips",
        "description": "",
        "displayOrder": 2,
        "isActive": true
      }
    ],
    "items": [
      {
        "id": "item_1748891586702_0",
        "name": "Garlic dip",
        "description": "No description",
        "image": {
          "url": "https://res.cloudinary.com/yourcloud/image/upload/.../Garlic_dip_image.jpg",
          "publicId": "fincotech/Merchant/683beca56d412c1d572afdda/item_1748891586702_0/Garlic_dip_image",
          "alt": "Garlic dip",
          "width": 800,
          "height": 600
        },
        "basePrice": 1.25,
        "tax": 0.00,
        "preparationTime": 15,
        "calories": null,
        "isAvailable": true,
        "displayOrder": 1,
        "modifierGroups": [],
        "categoryId": "category_1748891586702_1"
      }
    ]
  }
}
```

**If No Menu Exists:**
```json
{
  "success": true,
  "data": {
    "merchantId": "683beca56d412c1d572afdda",
    "merchantName": "Nandos",
    "hasMenu": false,
    "menuData": null
  },
  "message": "No menu data found for this merchant"
}
```

### 6. Update Complete Menu
```
PUT /api/merchants/[merchantId]/menu
```

Update the complete menu data for a merchant (see Image Upload Integration section for handling images).

---

## Category Management Endpoints

### 1. Get Categories
```
GET /api/merchants/[merchantId]/menu/categories
GET /api/merchants/[merchantId]/menu/categories?menuId=menu-id
```

**Query Parameters:**
- `menuId` (optional): Filter categories by specific menu

**Response:**
```json
{
  "success": true,
  "data": {
    "merchantId": "merchant123",
    "categories": [
      {
        "id": "cat-1",
        "name": "Appetizers",
        "description": "Starter dishes",
        "displayOrder": 1,
        "menuId": "menu-id-1",
        "menuName": "Breakfast"
      }
    ],
    "total": 1
  }
}
```

### 2. Create Category
```
POST /api/merchants/[merchantId]/menu/categories
```

**Request Body:**
```json
{
  "menuId": "menu-id-here",
  "name": "Appetizers",
  "description": "Starter dishes",
  "displayOrder": 1
}
```

### 3. Update Category
```
PUT /api/merchants/[merchantId]/menu/categories/[categoryId]
```

### 4. Delete Category
```
DELETE /api/merchants/[merchantId]/menu/categories/[categoryId]
```
**Note:** Cannot delete categories that contain menu items.

---

## Menu Items Management

### 1. Get Menu Items
```
GET /api/merchants/[merchantId]/menu/items
```

**Enhanced Query Parameters:**
- `menuId`: Filter by specific menu
- `categoryId`: Filter by specific category  
- `isAvailable`: Filter by availability (true/false)
- `tags`: Comma-separated tags to filter by
- `includeSingular`: Include singular items (true/false)

**Example:**
```
GET /api/merchants/[merchantId]/menu/items?menuId=breakfast&categoryId=appetizers&isAvailable=true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "merchantId": "merchant123",
    "items": [
      {
        "id": "item-1",
        "name": "Grilled Salmon",
        "description": "Fresh Atlantic salmon grilled to perfection",
        "shortDescription": "Fresh grilled salmon",
        "images": [
          {
            "url": "https://example.com/salmon.jpg",
            "publicId": "salmon_123",
            "alt": "Grilled salmon dish",
            "width": 800,
            "height": 600
          }
        ],
        "basePrice": 24.99,
        "compareAtPrice": 29.99,
        "tax": 2.50,
        "isOnSale": true,
        "preparationTime": 20,
        "servingSize": "1 fillet",
        "calories": 350,
        "isAvailable": true,
        "tags": ["PROTEIN_RICH", "HEALTHY"],
        "dietaryInfo": {
          "isVegetarian": false,
          "isVegan": false,
          "isGlutenFree": true,
          "isKeto": true,
          "isDairyFree": true,
          "isNutFree": true,
          "isHalal": false,
          "isKosher": false
        },
        "allergens": ["FISH"],
        "spiceLevel": "MILD",
        "displayOrder": 1,
        "isPopular": true,
        "isFeatured": false,
        "isNewItem": false,
        "modifierGroups": [],
        "menuId": "menu-id-1",
        "categoryId": "cat-1", 
        "isSingularItem": false,
        "menuName": "Dinner",
        "categoryName": "Main Courses",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 1,
    "filters": {
      "menuId": "breakfast",
      "categoryId": "appetizers", 
      "isAvailable": "true",
      "tags": null,
      "includeSingular": false
    }
  }
}
```

### 2. Create Menu Item
```
POST /api/merchants/[merchantId]/menu/items
```

**Enhanced Request Body:**
```json
{
  "menuId": "menu-id-here",
  "categoryId": "category-id-here",
  "name": "Grilled Salmon",
  "description": "Fresh Atlantic salmon",
  "shortDescription": "Grilled salmon",
  "basePrice": 24.99,
  "compareAtPrice": 29.99,
  "tax": 2.50,
  "images": [
    {
      "url": "https://example.com/salmon.jpg",
      "publicId": "salmon_123",
      "alt": "Grilled salmon dish"
    }
  ],
  "preparationTime": 20,
  "servingSize": "1 fillet",
  "calories": 350,
  "tags": ["PROTEIN_RICH", "HEALTHY"],
  "allergens": ["FISH"],
  "spiceLevel": "MILD",
  "dietaryInfo": {
    "isGlutenFree": true,
    "isKeto": true
  },
  "modifierGroups": [],
  "isSingularItem": false
}
```

**New Fields:**
- `tax`: Tax amount for the item
- `menuId`: Associates item with specific menu
- `categoryId`: Associates item with specific category
- `isSingularItem`: Boolean for items not tied to specific menus

---

## Image Management Endpoints

### 1. Add Image to Menu Item
```
POST /api/merchants/[merchantId]/menu/items/[itemId]/images
```

**Request Body:**
```json
{
  "url": "https://cloudinary.com/image.jpg",
  "publicId": "cloudinary_public_id", 
  "alt": "Food image description",
  "width": 800,
  "height": 600
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "merchantId": "merchant123",
    "itemId": "item-id",
    "image": {
      "url": "https://cloudinary.com/image.jpg",
      "publicId": "cloudinary_public_id",
      "alt": "Food image description",
      "width": 800,
      "height": 600
    },
    "totalImages": 3
  },
  "message": "Image added to menu item successfully"
}
```

### 2. Delete Image from Menu Item
```
DELETE /api/merchants/[merchantId]/menu/items/[itemId]/images/[imageId]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "merchantId": "merchant123",
    "itemId": "item-id",
    "deletedImage": {
      "publicId": "cloudinary_public_id",
      "url": "https://cloudinary.com/image.jpg",
      "alt": "Food image description"
    },
    "remainingImages": 2
  },
  "message": "Image deleted from menu item successfully"
}
```

---

## Menu Data Structure

### Menu Interface
```typescript
interface Menu {
  id: string;
  name: string;
  description?: string;
  timeSlots: {
    startTime: string;
    endTime: string;
    daysOfWeek: string[];
  }[];
  isActive: boolean;
  displayOrder: number;
  itemIds: string[];                // NEW: Array of item IDs in this menu
}
```

### Category Interface
```typescript
interface Category {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;                // NEW: Enable/disable category
}
```

### Enhanced MenuItem Interface
```typescript
interface MenuItem {
  id: string;
  name: string;
  description: string;
  image: ImageObject | null;       // Single image object
  basePrice: number;
  tax: number;
  preparationTime: number;
  calories?: number;
  isAvailable: boolean;
  displayOrder: number;
  modifierGroups: ModifierGroup[];
  categoryId: string;              // Reference to single category ID
}
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request (validation errors)
- `401`: Authentication required
- `403`: Access denied
- `404`: Resource not found
- `500`: Internal server error

---

## Usage Examples

### Complete Menu Setup Workflow

1. **Create Menu:**
```javascript
const menu = await fetch('/api/merchants/merchant123/menu/menus', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer token' },
  body: JSON.stringify({
    name: 'Breakfast',
    description: 'Morning specialties',
    timeSlots: [{ startTime: '06:00', endTime: '11:00', daysOfWeek: ['MONDAY', 'TUESDAY'] }]
  })
});
```

2. **Create Category:**
```javascript
const category = await fetch('/api/merchants/merchant123/menu/categories', {
  method: 'POST', 
  headers: { 'Authorization': 'Bearer token' },
  body: JSON.stringify({
    menuId: 'menu-id',
    name: 'Pancakes',
    description: 'Fluffy pancakes'
  })
});
```

3. **Add Menu Item:**
```javascript
const item = await fetch('/api/merchants/merchant123/menu/items', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer token' },
  body: JSON.stringify({
    menuId: 'menu-id',
    categoryId: 'category-id',
    name: 'Blueberry Pancakes',
    description: 'Stack of fluffy pancakes with fresh blueberries',
    basePrice: 12.99,
    tax: 1.30,
    preparationTime: 15
  })
});
```

4. **Add Image:**
```javascript
const image = await fetch('/api/merchants/merchant123/menu/items/item-id/images', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer token' },
  body: JSON.stringify({
    url: 'https://cloudinary.com/pancakes.jpg',
    publicId: 'pancakes_123',
    alt: 'Blueberry pancakes'
  })
});
```

This comprehensive API allows full management of restaurant menu hierarchies with proper authentication, validation, and error handling.

## Image Upload Integration

The Menu API uses a **two-step process** to handle large images and avoid 413 (Payload Too Large) errors:

### **Step 1: Upload Images Separately**
**Endpoint:** `POST /api/merchants/[merchantId]/menu/images`

Upload all menu item images first and get back Cloudinary URLs.

**⚠️ Important:** The `base64` field is required and must contain the image data.

**Request Format:**
```javascript
{
  "images": [
    {
      "itemName": "Garlic Dip",
      "itemId": "optional-custom-id", // Optional: will generate if not provided
      "base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..." // REQUIRED
    },
    {
      "itemName": "Chicken Wings", 
      "base64": "/9j/4AAQSkZJRgABAQEAYABgAAD..." // Can be with or without data URL prefix
    }
  ]
}
```

**Test Example:**
```javascript
// Test with a small sample image
const testUpload = {
  images: [
    {
      itemName: "Test Item",
      base64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    }
  ]
};
```

**Response:**
```javascript
{
  "success": true,
  "data": {
    "merchantId": "683beca56d412c1d572afdda",
    "uploadedImages": [
      {
        "itemId": "item_1748891586702_0",
        "itemName": "Garlic Dip",
        "originalIndex": 0,
        "url": "https://res.cloudinary.com/yourcloud/image/upload/.../fincotech/Merchant/683beca56d412c1d572afdda/item_1748891586702_0/Garlic_Dip_image.jpg",
        "publicId": "fincotech/Merchant/683beca56d412c1d572afdda/item_1748891586702_0/Garlic_Dip_image",
        "uploadedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "summary": {
      "total": 1,
      "successful": 1,
      "failed": 0
    }
  },
  "message": "Successfully uploaded 1 of 1 images"
}
```

### **Step 2: Save Menu with Image URLs**
**Endpoint:** `PUT /api/merchants/[merchantId]/menu`

Send your menu data with the Cloudinary URLs from Step 1.

**Request Format:**
```javascript
{
  "merchantId": "683beca56d412c1d572afdda",
  "merchantName": "Nandos",
  "businessHours": { /* ... */ },
  "menus": [ /* ... */ ],
  "categories": ["Appetizers", "Dips"],
  "menuItems": [
    {
      "name": "Garlic Dip",
      "price": "1.25",
      "tax": "0.00",
      "image": "https://res.cloudinary.com/yourcloud/image/upload/.../Garlic_Dip_image.jpg", // URL from Step 1
      "imagePublicId": "fincotech/Merchant/683beca56d412c1d572afdda/item_1748891586702_0/Garlic_Dip_image", // From Step 1
      "categories": ["Dips"],
      "isSingularItem": true
    }
  ]
}
```

### **Frontend Integration Example**
```javascript
// Step 1: Upload images first
const uploadImages = async (menuItems, merchantId) => {
  const itemsWithImages = menuItems.filter(item => 
    item.image && (item.image.startsWith('file://') || item.image.startsWith('data:'))
  );
  
  if (itemsWithImages.length === 0) {
    return []; // No images to upload
  }

  const imagesToUpload = itemsWithImages.map((item, index) => ({
    itemName: item.name,
    itemId: `item_${Date.now()}_${index}`,
    base64: item.image // Should be base64 or data URL
  }));

  const response = await fetch(`/api/merchants/${merchantId}/menu/images`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${yourJWTToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ images: imagesToUpload }),
    timeout: 60000 // 60 seconds for image uploads
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error);
  }

  return result.data.uploadedImages;
};

// Step 2: Save menu with uploaded image URLs
const saveCompleteMenu = async (menuData, merchantId) => {
  try {
    // 1. Upload images first
    console.log('📤 Uploading images...');
    const uploadedImages = await uploadImages(menuData.menuItems, merchantId);
    
    // 2. Update menu items with Cloudinary URLs
    const updatedMenuItems = menuData.menuItems.map(item => {
      const uploadedImage = uploadedImages.find(img => img.itemName === item.name);
      if (uploadedImage && !uploadedImage.error) {
        return {
          ...item,
          image: uploadedImage.url,
          imagePublicId: uploadedImage.publicId,
          imageUploadedAt: uploadedImage.uploadedAt
        };
      }
      return item;
    });

    // 3. Save menu data with image URLs
    console.log('💾 Saving menu data...');
    const response = await fetch(`/api/merchants/${merchantId}/menu`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${yourJWTToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...menuData,
        menuItems: updatedMenuItems
      }),
      timeout: 30000 // Reduced timeout since no image processing
    });

    const result = await response.json();
    if (result.success) {
      console.log('✅ Menu saved successfully!');
      return result.data;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('❌ Error saving menu:', error);
    throw error;
  }
};
```

### **Folder Structure**
Images are uploaded to: `fincotech/Merchant/[merchantId]/[itemId]`

### **Benefits of Two-Step Process**
- ✅ **No 413 errors**: Small JSON payload for menu data
- ✅ **Better error handling**: Images and menu data processed separately  
- ✅ **Faster saves**: Menu data saves quickly once images are uploaded
- ✅ **Progress tracking**: See image upload progress independently
- ✅ **Retry capability**: Can retry just images or just menu data if needed

--- 