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
  categories: Category[];
  isActive: boolean;
  displayOrder: number;
}
```

### Category Interface
```typescript
interface Category {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  menuId: string;
  menuName: string;
}
```

### Enhanced MenuItem Interface
```typescript
interface MenuItem {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  images: ImageObject[];
  basePrice: number;
  compareAtPrice?: number;
  tax?: number; // New field
  isOnSale: boolean;
  saleEndDate?: Date;
  preparationTime: number;
  servingSize?: string;
  calories?: number;
  isAvailable: boolean;
  tags: ItemTag[];
  dietaryInfo: DietaryInfo;
  allergens: Allergen[];
  spiceLevel?: SpiceLevel;
  displayOrder: number;
  isPopular: boolean;
  isFeatured: boolean;
  isNewItem: boolean;
  badgeText?: string;
  modifierGroups: ModifierGroup[];
  recommendedWith?: string[];
  substitutes?: string[];
  menuId?: string; // New field
  categoryId?: string; // New field
  isSingularItem?: boolean; // New field
  menuName: string;
  categoryName: string;
  createdAt: Date;
  updatedAt: Date;
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

The Menu API automatically handles image uploads to Cloudinary with the following features:

### **Folder Structure**
Images are uploaded to: `fincotech/Merchant/[merchantId]/[itemId]`

### **Supported Image Formats**
- **Base64 Data URLs**: `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...`
- **Raw Base64**: Long base64 strings (detected if > 1000 characters)
- **Existing URLs**: HTTP/HTTPS URLs are preserved as-is
- **File URLs**: `file://` URLs should be converted to base64 by frontend

### **Frontend Integration Example**
```javascript
// Convert file to base64 for upload
const convertImageToBase64 = (imageUri) => {
  return new Promise((resolve, reject) => {
    if (imageUri.startsWith('file://')) {
      // For React Native, use expo-file-system or similar
      FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      }).then(base64 => {
        resolve(`data:image/jpeg;base64,${base64}`);
      }).catch(reject);
    } else {
      resolve(imageUri); // Already in correct format
    }
  });
};

// Example menu item with image
const menuItem = {
  name: "Garlic Dip",
  price: "1.25",
  tax: "0.00",
  image: await convertImageToBase64(selectedImageUri), // Convert to base64
  categories: ["Dips"]
};
```

### **Response Format**
After successful upload, the menu item will include:
```javascript
{
  name: "Garlic Dip",
  image: "https://res.cloudinary.com/yourcloud/image/upload/v1234567890/fincotech/Merchant/683beca56d412c1d572afdda/item_1234567890_0/image.jpg",
  imagePublicId: "fincotech/Merchant/683beca56d412c1d572afdda/item_1234567890_0/Garlic_dip_image",
  imageUploadedAt: "2024-01-01T00:00:00.000Z"
}
```

--- 