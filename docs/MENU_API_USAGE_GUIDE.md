# Menu Management API - Complete Usage Guide

## Overview
This guide provides step-by-step examples for using the enhanced Restaurant Menu Management API. It covers the complete workflow from creating menus to managing items and images.

---

## Quick Start Workflow

### Step 1: Create a Menu
First, create a menu that will contain your categories and items:

```javascript
const createMenu = async (merchantId) => {
  const response = await fetch(`/api/merchants/${merchantId}/menu/menus`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: "Breakfast",
      description: "Morning specialties served until 11 AM",
      timeSlots: [
        {
          startTime: "06:00",
          endTime: "11:00",
          daysOfWeek: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]
        },
        {
          startTime: "07:00", 
          endTime: "12:00",
          daysOfWeek: ["SATURDAY", "SUNDAY"]
        }
      ],
      isActive: true,
      displayOrder: 1
    })
  });

  const result = await response.json();
  if (result.success) {
    console.log('Menu created:', result.data.menu);
    return result.data.menu.id;
  }
  throw new Error(result.error);
};
```

### Step 2: Create Categories
Create categories within your menu:

```javascript
const createCategory = async (merchantId, menuId) => {
  const response = await fetch(`/api/merchants/${merchantId}/menu/categories`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      menuId: menuId,
      name: "Pancakes & Waffles",
      description: "Fluffy pancakes and crispy waffles made fresh to order",
      displayOrder: 1
    })
  });

  const result = await response.json();
  if (result.success) {
    console.log('Category created:', result.data.category);
    return result.data.category.id;
  }
  throw new Error(result.error);
};
```

### Step 3: Add Menu Items
Add items to your categories with all the enhanced fields:

```javascript
const createMenuItem = async (merchantId, menuId, categoryId) => {
  const response = await fetch(`/api/merchants/${merchantId}/menu/items`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      menuId: menuId,
      categoryId: categoryId,
      name: "Blueberry Pancakes",
      description: "Stack of three fluffy buttermilk pancakes loaded with fresh Maine blueberries, served with maple syrup and butter",
      shortDescription: "Fluffy blueberry pancakes",
      basePrice: 12.99,
      compareAtPrice: 15.99, // Original price (showing as on sale)
      tax: 1.30,
      preparationTime: 15,
      servingSize: "3 pancakes",
      calories: 450,
      tags: ["VEGETARIAN", "SIGNATURE"],
      allergens: ["WHEAT", "DAIRY", "EGGS"],
      spiceLevel: null,
      dietaryInfo: {
        isVegetarian: true,
        isVegan: false,
        isGlutenFree: false,
        isKeto: false,
        isDairyFree: false,
        isNutFree: true,
        isHalal: true,
        isKosher: false
      },
      modifierGroups: [
        {
          id: "syrup-choice",
          name: "Syrup Selection",
          description: "Choose your favorite syrup",
          type: "SINGLE_CHOICE",
          minSelections: 0,
          maxSelections: 1,
          isRequired: false,
          displayOrder: 1,
          isCollapsible: false,
          modifiers: [
            {
              id: "maple-syrup",
              name: "Pure Maple Syrup",
              description: "Grade A Vermont maple syrup",
              priceModifier: 0,
              priceType: "FIXED",
              isAvailable: true,
              isDefault: true,
              displayOrder: 1
            },
            {
              id: "strawberry-syrup",
              name: "Strawberry Syrup",
              priceModifier: 1.50,
              priceType: "FIXED",
              isAvailable: true,
              isDefault: false,
              displayOrder: 2
            }
          ]
        }
      ],
      isSingularItem: false
    })
  });

  const result = await response.json();
  if (result.success) {
    console.log('Menu item created:', result.data.item);
    return result.data.item.id;
  }
  throw new Error(result.error);
};
```

### Step 4: Add Images to Menu Items
Upload and associate images with your menu items:

```javascript
const addImageToMenuItem = async (merchantId, itemId, imageData) => {
  const response = await fetch(`/api/merchants/${merchantId}/menu/items/${itemId}/images`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/pancakes.jpg",
      publicId: "menu_items/blueberry_pancakes_001",
      alt: "Stack of blueberry pancakes with maple syrup and butter",
      width: 800,
      height: 600
    })
  });

  const result = await response.json();
  if (result.success) {
    console.log('Image added:', result.data);
    return result.data.image;
  }
  throw new Error(result.error);
};
```

---

## Complete Setup Example

Here's a complete example that sets up an entire breakfast menu:

```javascript
class MenuManager {
  constructor(merchantId, authToken) {
    this.merchantId = merchantId;
    this.authToken = authToken;
    this.baseUrl = '/api/merchants';
  }

  async request(endpoint, method = 'GET', data = null) {
    const config = {
      method,
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      }
    };

    if (data && method !== 'GET') {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${this.baseUrl}/${this.merchantId}${endpoint}`, config);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    return result.data;
  }

  // Setup complete breakfast menu
  async setupBreakfastMenu() {
    try {
      console.log('🍳 Setting up breakfast menu...');

      // 1. Create breakfast menu
      const menu = await this.request('/menu/menus', 'POST', {
        name: "Breakfast",
        description: "Fresh breakfast favorites served all morning",
        timeSlots: [
          {
            startTime: "06:00",
            endTime: "11:30",
            daysOfWeek: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]
          },
          {
            startTime: "07:00",
            endTime: "12:00", 
            daysOfWeek: ["SATURDAY", "SUNDAY"]
          }
        ],
        isActive: true,
        displayOrder: 1
      });
      console.log('✅ Menu created:', menu.menu.name);

      // 2. Create categories
      const categories = await Promise.all([
        this.request('/menu/categories', 'POST', {
          menuId: menu.menu.id,
          name: "Pancakes & Waffles",
          description: "Fluffy pancakes and crispy waffles",
          displayOrder: 1
        }),
        this.request('/menu/categories', 'POST', {
          menuId: menu.menu.id, 
          name: "Eggs & Benedicts",
          description: "Farm fresh eggs prepared your way",
          displayOrder: 2
        }),
        this.request('/menu/categories', 'POST', {
          menuId: menu.menu.id,
          name: "Morning Sides",
          description: "Perfect accompaniments to your breakfast",
          displayOrder: 3
        })
      ]);
      console.log('✅ Categories created:', categories.length);

      // 3. Create menu items
      const pancakeItems = await Promise.all([
        this.request('/menu/items', 'POST', {
          menuId: menu.menu.id,
          categoryId: categories[0].category.id,
          name: "Classic Buttermilk Pancakes",
          description: "Three fluffy buttermilk pancakes served with butter and maple syrup",
          shortDescription: "Classic buttermilk pancakes",
          basePrice: 9.99,
          tax: 1.00,
          preparationTime: 12,
          servingSize: "3 pancakes",
          calories: 380,
          tags: ["VEGETARIAN"],
          allergens: ["WHEAT", "DAIRY", "EGGS"],
          dietaryInfo: {
            isVegetarian: true,
            isVegan: false,
            isGlutenFree: false
          },
          isSingularItem: false
        }),
        this.request('/menu/items', 'POST', {
          menuId: menu.menu.id,
          categoryId: categories[0].category.id,
          name: "Blueberry Pancakes",
          description: "Three fluffy pancakes with fresh Maine blueberries",
          shortDescription: "Fresh blueberry pancakes", 
          basePrice: 12.99,
          compareAtPrice: 14.99,
          tax: 1.30,
          preparationTime: 15,
          servingSize: "3 pancakes",
          calories: 420,
          tags: ["VEGETARIAN", "SIGNATURE"],
          allergens: ["WHEAT", "DAIRY", "EGGS"],
          dietaryInfo: {
            isVegetarian: true,
            isVegan: false,
            isGlutenFree: false
          },
          isSingularItem: false
        })
      ]);

      const eggItems = await Promise.all([
        this.request('/menu/items', 'POST', {
          menuId: menu.menu.id,
          categoryId: categories[1].category.id,
          name: "Eggs Benedict",
          description: "Poached eggs on English muffins with Canadian bacon and hollandaise",
          shortDescription: "Classic eggs benedict",
          basePrice: 16.99,
          tax: 1.70,
          preparationTime: 18,
          servingSize: "2 halves",
          calories: 520,
          tags: ["PROTEIN_RICH"],
          allergens: ["WHEAT", "DAIRY", "EGGS"],
          dietaryInfo: {
            isVegetarian: false,
            isVegan: false,
            isGlutenFree: false
          },
          isSingularItem: false
        })
      ]);

      const sideItems = await Promise.all([
        this.request('/menu/items', 'POST', {
          menuId: menu.menu.id,
          categoryId: categories[2].category.id,
          name: "Applewood Smoked Bacon",
          description: "Crispy strips of applewood smoked bacon",
          shortDescription: "Smoked bacon",
          basePrice: 4.99,
          tax: 0.50,
          preparationTime: 5,
          servingSize: "3 strips",
          calories: 180,
          tags: ["PROTEIN_RICH"],
          allergens: [],
          dietaryInfo: {
            isVegetarian: false,
            isVegan: false,
            isGlutenFree: true,
            isKeto: true
          },
          isSingularItem: false
        })
      ]);

      console.log('✅ Menu items created:', {
        pancakes: pancakeItems.length,
        eggs: eggItems.length, 
        sides: sideItems.length
      });

      // 4. Add images to featured items
      await this.request(`/menu/items/${pancakeItems[1].item.id}/images`, 'POST', {
        url: "https://example.com/blueberry-pancakes.jpg",
        publicId: "menu/blueberry_pancakes_main",
        alt: "Stack of blueberry pancakes with maple syrup",
        width: 800,
        height: 600
      });

      console.log('🎉 Breakfast menu setup complete!');
      return {
        menu: menu.menu,
        categories: categories.map(c => c.category),
        items: {
          pancakes: pancakeItems.map(i => i.item),
          eggs: eggItems.map(i => i.item),
          sides: sideItems.map(i => i.item)
        }
      };

    } catch (error) {
      console.error('❌ Error setting up menu:', error.message);
      throw error;
    }
  }
}

// Usage
const setupRestaurantMenu = async () => {
  const menuManager = new MenuManager('merchant_123', 'your_jwt_token');
  
  try {
    const result = await menuManager.setupBreakfastMenu();
    console.log('Menu setup result:', result);
  } catch (error) {
    console.error('Setup failed:', error);
  }
};
```

---

## Querying and Filtering Examples

### Get All Menus
```javascript
const getMenus = async (merchantId) => {
  const response = await fetch(`/api/merchants/${merchantId}/menu/menus`);
  const result = await response.json();
  
  if (result.success) {
    return result.data.menus;
  }
  throw new Error(result.error);
};
```

### Get Categories for Specific Menu
```javascript
const getCategoriesForMenu = async (merchantId, menuId) => {
  const response = await fetch(`/api/merchants/${merchantId}/menu/categories?menuId=${menuId}`);
  const result = await response.json();
  
  if (result.success) {
    return result.data.categories;
  }
  throw new Error(result.error);
};
```

### Get Menu Items with Filters
```javascript
const getMenuItems = async (merchantId, filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.menuId) params.append('menuId', filters.menuId);
  if (filters.categoryId) params.append('categoryId', filters.categoryId);
  if (filters.isAvailable !== undefined) params.append('isAvailable', filters.isAvailable);
  if (filters.tags) params.append('tags', filters.tags.join(','));
  if (filters.includeSingular) params.append('includeSingular', 'true');

  const response = await fetch(`/api/merchants/${merchantId}/menu/items?${params}`);
  const result = await response.json();
  
  if (result.success) {
    return result.data.items;
  }
  throw new Error(result.error);
};

// Usage examples:
const allItems = await getMenuItems('merchant_123');
const breakfastItems = await getMenuItems('merchant_123', { menuId: 'breakfast_menu' });
const vegetarianItems = await getMenuItems('merchant_123', { tags: ['VEGETARIAN'] });
const availableAppetizers = await getMenuItems('merchant_123', { 
  categoryId: 'appetizers_cat',
  isAvailable: true 
});
```

---

## Update Operations

### Update Menu
```javascript
const updateMenu = async (merchantId, menuId, updates) => {
  const response = await fetch(`/api/merchants/${merchantId}/menu/menus/${menuId}`, {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  const result = await response.json();
  if (result.success) {
    return result.data.menu;
  }
  throw new Error(result.error);
};

// Example: Change menu hours
await updateMenu('merchant_123', 'breakfast_menu', {
  timeSlots: [
    {
      startTime: "07:00",
      endTime: "12:00",
      daysOfWeek: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]
    }
  ]
});
```

### Update Category
```javascript
const updateCategory = async (merchantId, categoryId, updates) => {
  const response = await fetch(`/api/merchants/${merchantId}/menu/categories/${categoryId}`, {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  return response.json();
};

// Example: Rename category
await updateCategory('merchant_123', 'pancakes_cat', {
  name: "Pancakes & French Toast",
  description: "Fluffy pancakes and golden French toast"
});
```

---

## Image Management

### Add Multiple Images
```javascript
const addMenuItemImages = async (merchantId, itemId, images) => {
  const results = [];
  
  for (const imageData of images) {
    const response = await fetch(`/api/merchants/${merchantId}/menu/items/${itemId}/images`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_JWT_TOKEN',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(imageData)
    });
    
    const result = await response.json();
    if (result.success) {
      results.push(result.data.image);
    }
  }
  
  return results;
};

// Usage:
const images = await addMenuItemImages('merchant_123', 'pancakes_item', [
  {
    url: "https://cdn.example.com/pancakes-main.jpg",
    publicId: "menu/pancakes_main_001",
    alt: "Stack of blueberry pancakes - main view",
    width: 800,
    height: 600
  },
  {
    url: "https://cdn.example.com/pancakes-close.jpg",
    publicId: "menu/pancakes_close_001",
    alt: "Close-up of blueberry pancakes showing texture",
    width: 600,
    height: 400
  }
]);
```

### Remove Image
```javascript
const removeMenuItemImage = async (merchantId, itemId, imageId) => {
  const response = await fetch(`/api/merchants/${merchantId}/menu/items/${itemId}/images/${imageId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    }
  });

  return response.json();
};
```

---

## Error Handling

### Robust Error Handling Example
```javascript
class MenuAPIClient {
  constructor(merchantId, authToken) {
    this.merchantId = merchantId;
    this.authToken = authToken;
  }

  async makeRequest(endpoint, method = 'GET', data = null) {
    try {
      const config = {
        method,
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      };

      if (data && method !== 'GET') {
        config.body = JSON.stringify(data);
      }

      const response = await fetch(`/api/merchants/${this.merchantId}${endpoint}`, config);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${result.error || 'Unknown error'}`);
      }

      if (!result.success) {
        throw new Error(result.error || 'API request failed');
      }

      return result.data;

    } catch (error) {
      console.error(`API Error [${method} ${endpoint}]:`, error.message);
      
      // Handle specific error types
      if (error.message.includes('401')) {
        throw new Error('Authentication required. Please log in again.');
      } else if (error.message.includes('403')) {
        throw new Error('Access denied. You don\'t have permission for this operation.');
      } else if (error.message.includes('404')) {
        throw new Error('Resource not found. Please check the ID and try again.');
      } else if (error.message.includes('400')) {
        throw new Error('Invalid request. Please check your data and try again.');
      }
      
      throw error;
    }
  }

  async createMenuItem(menuId, categoryId, itemData) {
    return this.makeRequest('/menu/items', 'POST', {
      menuId,
      categoryId,
      ...itemData
    });
  }

  async getMenuItems(filters = {}) {
    const params = new URLSearchParams(filters);
    const endpoint = `/menu/items${params.toString() ? `?${params}` : ''}`;
    return this.makeRequest(endpoint);
  }
}
```

---

## Performance Tips

### 1. Efficient Data Fetching
```javascript
// ✅ Good: Fetch specific data you need
const breakfastItems = await getMenuItems('merchant_123', { 
  menuId: 'breakfast',
  isAvailable: true 
});

// ❌ Avoid: Fetching all data and filtering client-side
const allItems = await getMenuItems('merchant_123');
const breakfastItems = allItems.filter(item => item.menuId === 'breakfast');
```

### 2. Batch Operations
```javascript
// ✅ Good: Create multiple categories in parallel
const categories = await Promise.all([
  createCategory(merchantId, menuId, 'Appetizers'),
  createCategory(merchantId, menuId, 'Main Courses'),
  createCategory(merchantId, menuId, 'Desserts')
]);

// ❌ Avoid: Sequential operations
const cat1 = await createCategory(merchantId, menuId, 'Appetizers');
const cat2 = await createCategory(merchantId, menuId, 'Main Courses');
const cat3 = await createCategory(merchantId, menuId, 'Desserts');
```

### 3. Image Optimization
```javascript
// ✅ Good: Provide width/height for better loading
await addImageToMenuItem(merchantId, itemId, {
  url: "https://cdn.example.com/optimized-image.webp",
  publicId: "menu_items/item_001",
  alt: "Description for accessibility",
  width: 800,
  height: 600
});
```

---

## Testing Your Implementation

### Basic Integration Test
```javascript
const testMenuAPI = async () => {
  const merchantId = 'test_merchant_123';
  const authToken = 'your_test_token';
  
  try {
    console.log('🧪 Testing Menu API...');

    // Test 1: Create menu
    const menu = await createMenu(merchantId);
    assert(menu.id, 'Menu should have an ID');

    // Test 2: Create category
    const category = await createCategory(merchantId, menu.id);
    assert(category.id, 'Category should have an ID');

    // Test 3: Create menu item
    const item = await createMenuItem(merchantId, menu.id, category.id);
    assert(item.id, 'Item should have an ID');
    assert(item.tax === 1.30, 'Item should have correct tax amount');

    // Test 4: Add image
    const image = await addImageToMenuItem(merchantId, item.id, {
      url: "https://example.com/test.jpg",
      publicId: "test_image",
      alt: "Test image"
    });
    assert(image.url, 'Image should be added successfully');

    // Test 5: Fetch items with filters
    const items = await getMenuItems(merchantId, { menuId: menu.id });
    assert(items.length > 0, 'Should retrieve created items');

    console.log('✅ All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};
```

This comprehensive guide covers all aspects of using the enhanced Menu Management API. The examples show real-world usage patterns and best practices for building a robust restaurant menu system. 