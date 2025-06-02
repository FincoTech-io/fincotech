# Restaurant Menu Model Documentation

## Overview
Complete data model for restaurant menu management system embedded within the Merchant model. This includes hierarchical menu structure, categories, items, and management features.

---

## Core Model Structure

### Restaurant Menu (IRestaurantMenu)
The main container for all restaurant-related data with **flat, normalized structure**:

```typescript
interface IRestaurantMenu {
  restaurantInfo: IRestaurantInfo;
  operatingHours: IOperatingHours;
  serviceOptions: IServiceOptions;
  businessStatus: IBusinessStatus;
  menus: IMenu[];                    // Flat array of menus
  categories: IMenuCategory[];       // Flat array of categories  
  items: IMenuItem[];                // Flat array of items
  orderingRules: IOrderingRules;
  version: number;                   // Auto-incremented on changes
  isActive: boolean;
}
```

### Menu Structure (IMenu)
Individual menus that reference items by ID:

```typescript
interface IMenu {
  id: string;                       // Unique menu identifier
  name: string;                     // "Breakfast", "Lunch", "Dinner", etc.
  description?: string;             // Optional menu description
  timeSlots: ITimeSlot[];          // Time-based availability
  displayOrder: number;            // Sort order for display
  isActive: boolean;               // Enable/disable menu
  itemIds: string[];               // Array of item IDs in this menu
}
```

### Menu Category (IMenuCategory)
Standalone categories that items reference:

```typescript
interface IMenuCategory {
  id: string;                      // Unique category identifier
  name: string;                    // "Appetizers", "Main Courses", etc.
  description?: string;            // Optional category description
  displayOrder: number;           // Sort order within menu
  isActive: boolean;              // Enable/disable category
}
```

### Enhanced Menu Item (IMenuItem)
Individual menu items with category and menu references:

```typescript
interface IMenuItem {
  // Basic Information
  id: string;
  name: string;
  description: string;
  image: IImageObject | null;      // Single image object

  // Pricing
  basePrice: number;
  tax: number;

  // Preparation & Serving
  preparationTime: number;         // Minutes
  calories?: number;

  // Availability
  isAvailable: boolean;

  // Display
  displayOrder: number;

  // Customization
  modifierGroups: IModifierGroup[];

  // Category Reference
  categoryId: string;              // Reference to single category ID
}
```

---

## Supporting Data Models

### Image Object (IImageObject)
Standardized image structure:

```typescript
interface IImageObject {
  url: string;                     // Full image URL
  publicId: string;               // Cloudinary/storage ID
  alt: string;                    // Alt text for accessibility
  width?: number;                 // Image width in pixels
  height?: number;                // Image height in pixels
}
```

### Menu Availability (IMenuAvailability)
Time-based availability restrictions:

```typescript
interface IMenuAvailability {
  timeRestrictions: {
    [key in DayOfWeek]: ITimePeriod[];
  };
  dateRestrictions?: {
    startDate?: Date;
    endDate?: Date;
  };
}

interface ITimePeriod {
  openTime: string;               // "09:00"
  closeTime: string;              // "22:00"
  serviceTypes: ServiceType[];    // DINE_IN, TAKEOUT, DELIVERY
}
```

### Dietary Information (IDietaryInfo)
Comprehensive dietary classification:

```typescript
interface IDietaryInfo {
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isKeto: boolean;
  isDairyFree: boolean;
  isNutFree: boolean;
  isHalal: boolean;
  isKosher: boolean;
}
```

### Modifier System
Complex customization options:

```typescript
interface IModifierGroup {
  id: string;
  name: string;                   // "Size", "Toppings", "Cooking Style"
  description?: string;
  type: ModifierType;            // SINGLE_CHOICE, MULTIPLE_CHOICE, etc.
  minSelections: number;
  maxSelections: number;
  isRequired: boolean;
  displayOrder: number;
  isCollapsible: boolean;
  modifiers: IModifier[];
}

interface IModifier {
  id: string;
  name: string;                  // "Large", "Extra Cheese", "Well Done"
  description?: string;
  priceModifier: number;         // Price change (+2.50, -1.00)
  priceType: PriceType;         // FIXED, PERCENTAGE, REPLACEMENT
  isAvailable: boolean;
  isDefault: boolean;
  inventoryTracking?: IInventoryTracking;
  allergenInfo?: Allergen[];
  calorieImpact?: number;
  displayOrder: number;
  image?: IImageObject;
}
```

### Restaurant Information (IRestaurantInfo)
Basic restaurant metadata:

```typescript
interface IRestaurantInfo {
  cuisineTypes: CuisineType[];     // ITALIAN, CHINESE, MEXICAN, etc.
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  averagePreparationTime: number;  // Overall average in minutes
  images: {
    logo?: IImageObject;
    cover?: IImageObject;
    gallery: IImageObject[];
  };
  rating: {
    average: number;               // 0.0 - 5.0
    totalReviews: number;
  };
}
```

### Business Status (IBusinessStatus)
Real-time operational status:

```typescript
interface IBusinessStatus {
  isOpen: boolean;
  currentStatus: RestaurantStatus;  // OPEN, CLOSED, BUSY, etc.
  statusMessage?: string;           // Custom status message
  estimatedReopenTime?: Date;
  pausedServices: ServiceType[];    // Temporarily disabled services
  busyLevel: BusyLevel;            // LOW, MODERATE, HIGH, VERY_HIGH
}
```

### Operating Hours (IOperatingHours)
Comprehensive scheduling system:

```typescript
interface IOperatingHours {
  timezone: string;                // "America/Vancouver"
  schedule: {
    [key in DayOfWeek]: IDaySchedule;
  };
  specialHours: ISpecialHours[];   // Holidays, special events
  temporaryClosures: ITemporaryClosure[];
}

interface IDaySchedule {
  isOpen: boolean;
  periods: ITimePeriod[];          // Multiple periods per day
  breaks?: ITimePeriod[];          // Break periods
}
```

### Service Options (IServiceOptions)
Available service types and configurations:

```typescript
interface IServiceOptions {
  dineIn: {
    available: boolean;
    tableReservations: boolean;
    walkInsAccepted: boolean;
  };
  takeout: {
    available: boolean;
    estimatedWaitTime: number;      // Minutes
    orderAheadTime: number;         // Minutes advance notice
  };
  delivery: {
    available: boolean;
    radius: number;                 // Delivery radius in km/miles
    minimumOrder: number;           // Minimum order amount
    deliveryFee: number;
    freeDeliveryThreshold?: number;
    estimatedDeliveryTime: number;  // Minutes
    deliveryZones: IDeliveryZone[];
  };
  curbside: {
    available: boolean;
    instructions: string;
  };
}
```

---

## Type Definitions

### Enums and Union Types
```typescript
// Days of the week
type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

// Service types
type ServiceType = 'DINE_IN' | 'TAKEOUT' | 'DELIVERY' | 'CURBSIDE';

// Restaurant status
type RestaurantStatus = 'OPEN' | 'CLOSED' | 'BUSY' | 'TEMPORARILY_CLOSED' | 'PERMANENTLY_CLOSED';

// Busy levels
type BusyLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';

// Modifier types
type ModifierType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'QUANTITY' | 'TEXT_INPUT';

// Price modification types
type PriceType = 'FIXED' | 'PERCENTAGE' | 'REPLACEMENT';

// Item tags
type ItemTag = 'VEGETARIAN' | 'VEGAN' | 'GLUTEN_FREE' | 'KETO' | 'LOW_CARB' | 'PROTEIN_RICH' | 'SPICY' | 'COLD' | 'HOT' | 'SIGNATURE' | 'HEALTHY';

// Allergens
type Allergen = 'NUTS' | 'DAIRY' | 'EGGS' | 'SOY' | 'WHEAT' | 'FISH' | 'SHELLFISH' | 'SESAME';

// Spice levels
type SpiceLevel = 'MILD' | 'MEDIUM' | 'HOT' | 'EXTRA_HOT';

// Payment methods
type PaymentMethod = 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'DIGITAL_WALLET' | 'LOYALTY_POINTS';

// Cuisine types
type CuisineType = 'ITALIAN' | 'CHINESE' | 'MEXICAN' | 'INDIAN' | 'AMERICAN' | 'JAPANESE' | 'THAI' | 'FRENCH' | 'MEDITERRANEAN' | 'FAST_FOOD' | 'COFFEE' | 'DESSERTS' | 'HEALTHY' | 'BBQ' | 'SEAFOOD' | 'VEGETARIAN' | 'PIZZA' | 'BURGERS' | 'SUSHI';
```

---

## Data Relationships

### Hierarchical Structure
```
Restaurant Menu
├── Restaurant Info
├── Operating Hours
├── Service Options
├── Business Status
├── Ordering Rules
└── Menus []
    └── Categories []
        └── Items []
            └── Modifier Groups []
                └── Modifiers []
```

### NEW: Menu Association Fields
The enhanced model now supports better item organization:

1. **Traditional Hierarchy**: Items belong to Categories, Categories belong to Menus
2. **Direct Association**: Items can reference `menuId` and `categoryId` directly
3. **Singular Items**: Items with `isSingularItem: true` can exist independently

### Cross-References
- Items can reference other items via `recommendedWith` and `substitutes`
- Categories can require other categories via `requiredWithOtherCategory`
- Modifier groups can be shared across multiple items
- Images are embedded objects with external storage references

---

## Key Features

### NEW Features Added
1. **Enhanced Menu Management**: Full CRUD operations on menus and categories
2. **Tax Field**: Direct tax amount storage on menu items
3. **Menu Association**: Items can be directly associated with menus/categories
4. **Singular Items**: Support for items not tied to specific menu structure
5. **Image Management**: Dedicated endpoints for adding/removing item images
6. **Improved Filtering**: Enhanced query capabilities with multiple filter options

### Version Control
- `version` field auto-increments on any menu changes
- Enables cache invalidation and synchronization
- Tracks menu evolution over time

### Performance Optimizations
- Lean queries for list operations
- Embedded structure reduces database joins
- Indexed fields for common queries
- Image URLs for CDN optimization

### Validation Rules
- Required fields marked in interfaces
- Enum validation for categorical data
- Price validation (positive numbers)
- Time format validation (HH:MM)
- Image URL validation

### Extensibility
- Metadata fields for custom data
- Flexible modifier system
- Expandable enum types
- Optional fields for gradual adoption

---

## Database Storage

### MongoDB Schema Considerations
```javascript
// Embedded in Merchant model
{
  _id: ObjectId,
  merchantType: "RESTAURANT",
  restaurantMenu: {
    // Full IRestaurantMenu structure
    menus: [
      {
        id: "uuid",
        name: "Breakfast",
        categories: [
          {
            id: "uuid",
            name: "Pancakes",
            items: [
              {
                id: "uuid",
                name: "Blueberry Pancakes",
                basePrice: 12.99,
                tax: 1.30,              // NEW
                menuId: "menu-uuid",    // NEW
                categoryId: "cat-uuid", // NEW
                isSingularItem: false,  // NEW
                // ... other fields
              }
            ]
          }
        ]
      }
    ],
    version: 3
  }
}
```

### Indexing Strategy
```javascript
// Recommended indexes for performance
db.merchants.createIndex({ "merchantType": 1 });
db.merchants.createIndex({ "restaurantMenu.isActive": 1 });
db.merchants.createIndex({ "restaurantMenu.menus.id": 1 });
db.merchants.createIndex({ "restaurantMenu.menus.categories.id": 1 });
db.merchants.createIndex({ "restaurantMenu.menus.categories.items.id": 1 });
```

---

## Usage Examples

### Creating Menu Hierarchy
```javascript
// 1. Create menu
const menu = {
  id: "breakfast-menu",
  name: "Breakfast",
  description: "Morning favorites",
  availability: {
    timeRestrictions: {
      MONDAY: [{ openTime: "06:00", closeTime: "11:00", serviceTypes: ["DINE_IN", "TAKEOUT"] }],
      TUESDAY: [{ openTime: "06:00", closeTime: "11:00", serviceTypes: ["DINE_IN", "TAKEOUT"] }]
    }
  },
  displayOrder: 1,
  isActive: true,
  categories: []
};

// 2. Add category
const category = {
  id: "pancakes-category",
  name: "Pancakes & Waffles",
  description: "Fluffy goodness",
  displayOrder: 1,
  isActive: true,
  items: []
};

// 3. Add menu item with new fields
const item = {
  id: "blueberry-pancakes",
  name: "Blueberry Pancakes",
  description: "Stack of fluffy pancakes with fresh Maine blueberries",
  basePrice: 12.99,
  tax: 1.30,                    // NEW: Direct tax amount
  menuId: "breakfast-menu",     // NEW: Direct menu reference
  categoryId: "pancakes-category", // NEW: Direct category reference
  isSingularItem: false,        // NEW: Part of menu hierarchy
  preparationTime: 15,
  tags: ["VEGETARIAN"],
  dietaryInfo: {
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: false
  },
  images: [
    {
      url: "https://cdn.example.com/blueberry-pancakes.jpg",
      publicId: "pancakes_blueberry_001",
      alt: "Stack of blueberry pancakes with butter and syrup",
      width: 800,
      height: 600
    }
  ],
  modifierGroups: [
    {
      id: "syrup-choice",
      name: "Syrup Selection",
      type: "SINGLE_CHOICE",
      minSelections: 1,
      maxSelections: 1,
      isRequired: false,
      modifiers: [
        {
          id: "maple-syrup",
          name: "Pure Maple Syrup",
          priceModifier: 2.00,
          priceType: "FIXED",
          isDefault: true
        }
      ]
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
};
```

This comprehensive model supports complex restaurant operations while maintaining flexibility for different business needs and menu structures. 