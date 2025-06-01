# Restaurant Menu Data Model

## Overview
Comprehensive data structure for restaurant menus supporting categories, items, modifiers, and business operations similar to Uber Eats. **This is embedded as an optional field (`restaurantMenu`) in the Merchant model for merchants with `merchantType: 'RESTAURANT'`.**

---

## Integration with Merchant Model

The restaurant menu is embedded as an optional field in the existing Merchant model:

```typescript
interface IMerchant extends Document {
  // ... existing merchant fields ...
  merchantType: 'RESTAURANT' | 'RETAIL' | 'MARKET' | 'SERVICE' | 'EDUCATIONAL' | 'ENTERTAINMENT' | 'HOTEL' | 'RENTAL' | 'TRANSPORTATION' | 'OTHER';
  
  // Optional restaurant menu - only for RESTAURANT type merchants
  restaurantMenu?: IRestaurantMenu;
  
  // ... other merchant fields ...
}
```

This approach ensures:
- **Efficiency**: No additional database joins required
- **Scalability**: Only restaurant merchants have menu data
- **Consistency**: All merchant data stays together
- **Performance**: Faster queries for restaurant-specific operations

---

## Core Data Structure

### Embedded Restaurant Menu Configuration
```typescript
interface IRestaurantMenu {
  restaurantInfo: IRestaurantInfo;
  operatingHours: IOperatingHours;
  serviceOptions: IServiceOptions;
  businessStatus: IBusinessStatus;
  menus: IMenu[];
  orderingRules: IOrderingRules;
  version: number;
  isActive: boolean;
}
```

**Note**: The `restaurantId` field is not needed since this is embedded within the Merchant document. The merchant's basic information (name, address, contact details) comes from the parent Merchant model.

### Restaurant Info (Embedded)
```typescript
interface IRestaurantInfo {
  cuisineTypes: CuisineType[];
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  averagePreparationTime: number; // minutes
  
  // Restaurant-specific images (merchant basic info in parent model)
  images: {
    logo?: IImageObject;
    cover?: IImageObject;
    gallery: IImageObject[];
  };
  rating: {
    average: number;
    totalReviews: number;
  };
}
```

**Note**: Basic merchant information like `name`, `address`, `phoneNumber`, `email` comes from the parent Merchant model and doesn't need to be duplicated here.

### Operating Hours
```typescript
interface OperatingHours {
  timezone: string; // e.g., "America/Vancouver"
  schedule: {
    [key in DayOfWeek]: DaySchedule;
  };
  specialHours: SpecialHours[]; // holidays, special events
  temporaryClosures: TemporaryClosure[];
}

interface DaySchedule {
  isOpen: boolean;
  periods: TimePeriod[];
  breaks?: TimePeriod[]; // lunch breaks, etc.
}

interface TimePeriod {
  openTime: string; // "09:00"
  closeTime: string; // "22:00"
  serviceTypes: ServiceType[]; // ['DINE_IN', 'TAKEOUT', 'DELIVERY']
}

interface SpecialHours {
  date: string; // "2025-12-25"
  name: string; // "Christmas Day"
  schedule: DaySchedule | null; // null if closed
  isRecurring: boolean;
}

interface TemporaryClosure {
  startDate: Date;
  endDate: Date;
  reason: string;
  message?: string; // customer-facing message
}

type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
type ServiceType = 'DINE_IN' | 'TAKEOUT' | 'DELIVERY' | 'CURBSIDE';
```

### Service Options
```typescript
interface ServiceOptions {
  dineIn: {
    available: boolean;
    tableReservations: boolean;
    walkInsAccepted: boolean;
  };
  takeout: {
    available: boolean;
    estimatedWaitTime: number; // minutes
    orderAheadTime: number; // how far in advance can orders be placed
  };
  delivery: {
    available: boolean;
    radius: number; // delivery radius in km
    minimumOrder: number;
    deliveryFee: number;
    freeDeliveryThreshold?: number;
    estimatedDeliveryTime: number; // minutes
    deliveryZones: DeliveryZone[];
  };
  curbside: {
    available: boolean;
    instructions: string;
  };
}

interface DeliveryZone {
  name: string;
  polygon: Coordinate[]; // geographical boundaries
  deliveryFee: number;
  estimatedTime: number;
  minimumOrder?: number;
}

interface Coordinate {
  latitude: number;
  longitude: number;
}
```

### Menu Structure
```typescript
interface Menu {
  id: string;
  name: string; // "Breakfast", "Lunch", "Dinner", "Drinks"
  description?: string;
  availability: MenuAvailability;
  displayOrder: number;
  isActive: boolean;
  categories: MenuCategory[];
}

interface MenuAvailability {
  timeRestrictions: {
    [key in DayOfWeek]: TimePeriod[];
  };
  dateRestrictions?: {
    startDate?: Date;
    endDate?: Date;
  };
}
```

### Categories
```typescript
interface MenuCategory {
  id: string;
  name: string; // "Appetizers", "Main Courses", "Desserts"
  description?: string;
  image?: ImageObject;
  displayOrder: number;
  isActive: boolean;
  isPopular?: boolean;
  items: MenuItem[];
  
  // Category-specific settings
  maxItemsPerOrder?: number;
  requiredWithOtherCategory?: string; // category ID
}
```

### Menu Items
```typescript
interface MenuItem {
  id: string;
  name: string;
  description: string;
  shortDescription?: string; // for mobile displays
  images: ImageObject[];
  
  // Pricing
  basePrice: number;
  compareAtPrice?: number; // original price if on sale
  isOnSale: boolean;
  saleEndDate?: Date;
  
  // Item Properties
  preparationTime: number; // minutes
  servingSize?: string; // "Serves 2-3"
  calories?: number;
  
  // Availability
  isAvailable: boolean;
  availabilitySchedule?: MenuAvailability;
  inventoryTracking?: {
    trackInventory: boolean;
    currentStock?: number;
    lowStockThreshold?: number;
  };
  
  // Classification
  tags: ItemTag[];
  dietaryInfo: DietaryInfo;
  allergens: Allergen[];
  spiceLevel?: SpiceLevel;
  
  // Display & Marketing
  displayOrder: number;
  isPopular: boolean;
  isFeatured: boolean;
  isNew: boolean;
  badgeText?: string; // "Chef's Special", "Limited Time"
  
  // Modifiers
  modifierGroups: ModifierGroup[];
  
  // Related Items
  recommendedWith?: string[]; // item IDs
  substitutes?: string[]; // item IDs for out-of-stock alternatives
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

interface ImageObject {
  url: string;
  publicId: string;
  alt: string;
  width?: number;
  height?: number;
}

type ItemTag = 'VEGETARIAN' | 'VEGAN' | 'GLUTEN_FREE' | 'KETO' | 'LOW_CARB' | 'PROTEIN_RICH' | 'SPICY' | 'COLD' | 'HOT' | 'SIGNATURE' | 'HEALTHY';

interface DietaryInfo {
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isKeto: boolean;
  isDairyFree: boolean;
  isNutFree: boolean;
  isHalal: boolean;
  isKosher: boolean;
}

type Allergen = 'NUTS' | 'DAIRY' | 'EGGS' | 'SOY' | 'WHEAT' | 'FISH' | 'SHELLFISH' | 'SESAME';
type SpiceLevel = 'MILD' | 'MEDIUM' | 'HOT' | 'EXTRA_HOT';
```

### Modifiers System
```typescript
interface ModifierGroup {
  id: string;
  name: string; // "Size", "Add-ons", "Sauce Choice"
  description?: string;
  type: ModifierType;
  
  // Selection Rules
  minSelections: number; // 0 for optional, 1+ for required
  maxSelections: number; // 1 for single choice, unlimited for multiple
  isRequired: boolean;
  
  // Display
  displayOrder: number;
  isCollapsible: boolean; // can be collapsed in UI
  
  // Options
  modifiers: Modifier[];
}

interface Modifier {
  id: string;
  name: string;
  description?: string;
  
  // Pricing
  priceModifier: number; // positive for add-on cost, negative for discount
  priceType: PriceType;
  
  // Availability
  isAvailable: boolean;
  isDefault: boolean; // pre-selected option
  
  // Inventory (for physical add-ons)
  inventoryTracking?: {
    trackInventory: boolean;
    currentStock?: number;
    lowStockThreshold?: number;
  };
  
  // Dietary Impact
  allergenInfo?: Allergen[];
  calorieImpact?: number; // additional calories
  
  // Display
  displayOrder: number;
  image?: ImageObject;
}

type ModifierType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'QUANTITY' | 'TEXT_INPUT';
type PriceType = 'FIXED' | 'PERCENTAGE' | 'REPLACEMENT';
```

### Business Rules
```typescript
interface OrderingRules {
  minimumOrder: {
    amount: number;
    serviceTypes: ServiceType[];
  };
  maximumOrder?: {
    amount?: number;
    itemCount?: number;
  };
  advanceOrderTime: {
    minimum: number; // minutes
    maximum: number; // days converted to minutes
  };
  paymentMethods: PaymentMethod[];
  tips: {
    allowTips: boolean;
    suggestedPercentages: number[];
    minimumTip?: number;
    maximumTip?: number;
  };
  cancellationPolicy: {
    allowCancellation: boolean;
    timeLimit: number; // minutes before pickup/delivery
    refundPolicy: string;
  };
}

type PaymentMethod = 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'DIGITAL_WALLET' | 'LOYALTY_POINTS';
```

### Business Status
```typescript
interface BusinessStatus {
  isOpen: boolean;
  currentStatus: RestaurantStatus;
  statusMessage?: string; // "Busy - longer wait times"
  estimatedReopenTime?: Date;
  pausedServices: ServiceType[];
  busyLevel: BusyLevel;
}

type RestaurantStatus = 'OPEN' | 'CLOSED' | 'BUSY' | 'TEMPORARILY_CLOSED' | 'PERMANENTLY_CLOSED';
type BusyLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
```

### Additional Types
```typescript
type CuisineType = 'ITALIAN' | 'CHINESE' | 'MEXICAN' | 'INDIAN' | 'AMERICAN' | 'JAPANESE' | 'THAI' | 'FRENCH' | 'MEDITERRANEAN' | 'FAST_FOOD' | 'COFFEE' | 'DESSERTS' | 'HEALTHY' | 'BBQ' | 'SEAFOOD' | 'VEGETARIAN' | 'PIZZA' | 'BURGERS' | 'SUSHI';
```

---

## Example Implementation

### Sample Merchant with Restaurant Menu
```typescript
const sampleMerchantWithMenu: IMerchant = {
  // Standard merchant fields
  _id: "merchant_123",
  phoneNumber: "+1234567890",
  email: "orders@marios.com",
  merchantName: "Mario's Italian Kitchen",
  merchantType: 'RESTAURANT',
  merchantAddress: "123 Main St, Vancouver, BC V6B 1A1",
  merchantLicense: "LICENSE_12345",
  merchantStaff: [{
    name: "Mario Rossi",
    role: 'ADMIN',
    email: "mario@marios.com",
    phoneNumber: "+1234567890",
    userId: "user_123",
    pushToken: []
  }],
  verificationStatus: 'VERIFIED',
  currentRegion: "Vancouver",
  currentAddress: "123 Main St, Vancouver, BC V6B 1A1",
  hasUnreadNotifications: false,
  notifications: [],
  
  // Embedded restaurant menu
  restaurantMenu: {
    restaurantInfo: {
      cuisineTypes: ['ITALIAN'],
      priceRange: '$$',
      averagePreparationTime: 25,
      images: {
        logo: { url: "...", publicId: "...", alt: "Mario's Logo" },
        cover: { url: "...", publicId: "...", alt: "Restaurant Interior" },
        gallery: []
      },
      rating: {
        average: 4.5,
        totalReviews: 324
      }
    },
    
    operatingHours: {
      timezone: "America/Vancouver",
      schedule: {
        MONDAY: {
          isOpen: true,
          periods: [{
            openTime: "11:00",
            closeTime: "22:00", 
            serviceTypes: ['DINE_IN', 'TAKEOUT', 'DELIVERY']
          }]
        },
        TUESDAY: {
          isOpen: true,
          periods: [{
            openTime: "11:00",
            closeTime: "22:00", 
            serviceTypes: ['DINE_IN', 'TAKEOUT', 'DELIVERY']
          }]
        },
        WEDNESDAY: {
          isOpen: true,
          periods: [{
            openTime: "11:00",
            closeTime: "22:00", 
            serviceTypes: ['DINE_IN', 'TAKEOUT', 'DELIVERY']
          }]
        },
        THURSDAY: {
          isOpen: true,
          periods: [{
            openTime: "11:00",
            closeTime: "22:00", 
            serviceTypes: ['DINE_IN', 'TAKEOUT', 'DELIVERY']
          }]
        },
        FRIDAY: {
          isOpen: true,
          periods: [{
            openTime: "11:00",
            closeTime: "23:00", 
            serviceTypes: ['DINE_IN', 'TAKEOUT', 'DELIVERY']
          }]
        },
        SATURDAY: {
          isOpen: true,
          periods: [{
            openTime: "11:00",
            closeTime: "23:00", 
            serviceTypes: ['DINE_IN', 'TAKEOUT', 'DELIVERY']
          }]
        },
        SUNDAY: {
          isOpen: true,
          periods: [{
            openTime: "12:00",
            closeTime: "21:00", 
            serviceTypes: ['DINE_IN', 'TAKEOUT', 'DELIVERY']
          }]
        }
      },
      specialHours: [],
      temporaryClosures: []
    },
    
    serviceOptions: {
      dineIn: {
        available: true,
        tableReservations: true,
        walkInsAccepted: true
      },
      takeout: {
        available: true,
        estimatedWaitTime: 15,
        orderAheadTime: 120
      },
      delivery: {
        available: true,
        radius: 5,
        minimumOrder: 25,
        deliveryFee: 3.99,
        freeDeliveryThreshold: 50,
        estimatedDeliveryTime: 35,
        deliveryZones: []
      },
      curbside: {
        available: false,
        instructions: ""
      }
    },
    
    businessStatus: {
      isOpen: true,
      currentStatus: 'OPEN',
      pausedServices: [],
      busyLevel: 'MODERATE'
    },
    
    menus: [{
      id: "dinner_menu",
      name: "Dinner Menu",
      description: "Available all day",
      availability: {
        timeRestrictions: {
          MONDAY: [{ openTime: "11:00", closeTime: "22:00", serviceTypes: ['DINE_IN', 'TAKEOUT', 'DELIVERY'] }],
          TUESDAY: [{ openTime: "11:00", closeTime: "22:00", serviceTypes: ['DINE_IN', 'TAKEOUT', 'DELIVERY'] }],
          WEDNESDAY: [{ openTime: "11:00", closeTime: "22:00", serviceTypes: ['DINE_IN', 'TAKEOUT', 'DELIVERY'] }],
          THURSDAY: [{ openTime: "11:00", closeTime: "22:00", serviceTypes: ['DINE_IN', 'TAKEOUT', 'DELIVERY'] }],
          FRIDAY: [{ openTime: "11:00", closeTime: "23:00", serviceTypes: ['DINE_IN', 'TAKEOUT', 'DELIVERY'] }],
          SATURDAY: [{ openTime: "11:00", closeTime: "23:00", serviceTypes: ['DINE_IN', 'TAKEOUT', 'DELIVERY'] }],
          SUNDAY: [{ openTime: "12:00", closeTime: "21:00", serviceTypes: ['DINE_IN', 'TAKEOUT', 'DELIVERY'] }]
        }
      },
      displayOrder: 1,
      isActive: true,
      categories: [{
        id: "appetizers",
        name: "Appetizers", 
        description: "Start your meal right",
        displayOrder: 1,
        isActive: true,
        items: [{
          id: "bruschetta",
          name: "Classic Bruschetta",
          description: "Toasted bread topped with fresh tomatoes, basil, and garlic",
          images: [{ url: "...", publicId: "...", alt: "Bruschetta" }],
          basePrice: 12.99,
          isOnSale: false,
          preparationTime: 10,
          isAvailable: true,
          tags: ['VEGETARIAN'],
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
          allergens: ['WHEAT'],
          displayOrder: 1,
          isPopular: true,
          isFeatured: false,
          isNew: false,
          modifierGroups: [{
            id: "bread_type",
            name: "Bread Choice",
            type: 'SINGLE_CHOICE',
            minSelections: 1,
            maxSelections: 1,
            isRequired: true,
            displayOrder: 1,
            isCollapsible: false,
            modifiers: [
              {
                id: "regular_bread",
                name: "Regular Bread",
                priceModifier: 0,
                priceType: 'FIXED',
                isAvailable: true,
                isDefault: true,
                displayOrder: 1
              },
              {
                id: "gluten_free_bread", 
                name: "Gluten-Free Bread",
                priceModifier: 2.00,
                priceType: 'FIXED',
                isAvailable: true,
                isDefault: false,
                displayOrder: 2
              }
            ]
          }],
          createdAt: new Date(),
          updatedAt: new Date()
        }]
      }]
    }],
    
    orderingRules: {
      minimumOrder: {
        amount: 15,
        serviceTypes: ['TAKEOUT', 'DELIVERY']
      },
      advanceOrderTime: {
        minimum: 30,
        maximum: 10080 // 7 days in minutes
      },
      paymentMethods: ['CREDIT_CARD', 'DEBIT_CARD', 'DIGITAL_WALLET'],
      tips: {
        allowTips: true,
        suggestedPercentages: [15, 18, 20, 25]
      },
      cancellationPolicy: {
        allowCancellation: true,
        timeLimit: 30,
        refundPolicy: "Full refund if cancelled 30+ minutes before pickup/delivery"
      }
    },
    
    version: 1,
    isActive: true
  },
  
  // Standard merchant fields continued
  notificationPreferences: {
    paymentReceived: { roles: 'ADMIN', sms: true, push: true, email: true },
    paymentSent: { roles: 'ADMIN', sms: true, push: true, email: true },
    systemUpdates: { roles: 'ADMIN', sms: true, push: true, email: true },
    security: { roles: 'ADMIN', sms: true, push: true, email: true },
    promotions: { roles: 'ADMIN', sms: false, push: true, email: false }
  },
  createdAt: new Date(),
  updatedAt: new Date()
};
```

---

## Database Schema Considerations

### MongoDB Schema (Embedded in Merchant)
The restaurant menu is embedded as an optional field in the existing Merchant model:

```typescript
const MerchantSchema = new Schema<IMerchant>({
  // ... existing merchant fields ...
  
  // Optional restaurant menu - only for RESTAURANT type merchants
  restaurantMenu: {
    type: {
      restaurantInfo: { /* detailed schema */ },
      operatingHours: { /* detailed schema */ },
      serviceOptions: { /* detailed schema */ },
      businessStatus: { /* detailed schema */ },
      menus: [{ /* detailed menu schema */ }],
      orderingRules: { /* detailed rules schema */ },
      version: { type: Number, default: 1 },
      isActive: { type: Boolean, default: true }
    },
    required: false
  },
  
  // ... other merchant fields ...
});

// Indexes for performance
MerchantSchema.index({ merchantType: 1 });
MerchantSchema.index({ 'restaurantMenu.businessStatus.isOpen': 1 });
MerchantSchema.index({ 'restaurantMenu.menus.categories.items.isAvailable': 1 });
MerchantSchema.index({ 'restaurantMenu.menus.categories.items.tags': 1 });
MerchantSchema.index({ 'restaurantMenu.isActive': 1 });
```

### Query Examples

**Get all restaurant merchants with active menus:**
```typescript
const restaurants = await Merchant.find({
  merchantType: 'RESTAURANT',
  'restaurantMenu.isActive': true
});
```

**Get available menu items for a restaurant:**
```typescript
const restaurant = await Merchant.findById(merchantId, {
  'restaurantMenu.menus.categories.items': {
    $elemMatch: { isAvailable: true }
  }
});
```

**Update menu item availability:**
```typescript
await Merchant.updateOne(
  { _id: merchantId, 'restaurantMenu.menus.categories.items.$.isAvailable': false }
);
```

---

## Benefits of Embedded Approach

✅ **Performance**: No joins required, faster queries
✅ **Consistency**: All merchant data in one document
✅ **Efficiency**: Only restaurants have menu data
✅ **Scalability**: Document-based approach scales well
✅ **Atomic Updates**: Menu changes are atomic with merchant updates
✅ **Simplified Queries**: Single collection queries for restaurant operations

---

## Key Features

✅ **Hierarchical Structure**: Restaurant → Menu → Category → Item → Modifiers
✅ **Flexible Operating Hours**: Daily schedules, special hours, temporary closures  
✅ **Multiple Service Types**: Dine-in, takeout, delivery, curbside
✅ **Rich Item Information**: Dietary info, allergens, nutrition, preparation time
✅ **Advanced Modifiers**: Single/multiple choice, quantity, pricing options
✅ **Business Intelligence**: Popularity tracking, featured items, sales data
✅ **Inventory Management**: Stock tracking for items and modifiers
✅ **Scheduling**: Time-based availability for menus and items
✅ **Multi-location Ready**: Designed to scale for restaurant chains 