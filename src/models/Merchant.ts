import mongoose, { Document, Schema } from 'mongoose';

// Interface for an embedded notification
export interface IEmbeddedNotification {
  _id?: string;
  title: string;
  message: string;
  creationTime: Date;
  isRead: boolean;
  type: 'UPDATE' | 'SYSTEM' | 'PROMOTIONAL' | 'SECURITY';
  pinned: boolean;
  metadata?: Record<string, any>;
}

// Interface for a merchant advertisement
export interface IAdvertisement {
  _id?: string;
  title: string;
  description: string;
  image: {
    url: string;
    publicId: string;
  };
  link: string;
  startDate: Date;
  endDate: Date;
  video: {
    url: string;
    publicId: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  clicks: number;
  views: number;
  impressions: number;
  location: string;
  category: string;
  targetAudience?: string;
  targetLocation?: string;
  targetGender?: string;
  targetAge?: number;
  targetIncome?: number;
  targetInterests?: string[];
  targetBehavior?: string;
  targetDevice?: string;
  targetOS?: string;
  targetBrowser?: string;
  targetLanguage?: string;
  targetKeywords?: string[];
}

// Restaurant Menu Types for Embedded Menu
export interface IImageObject {
  url: string;
  publicId: string;
  alt: string;
  width?: number;
  height?: number;
  sizes?: {
    original: string;    // Highest quality original
    display: string;     // 1200x600 max (main display)
    medium: string;      // 400x400 square
    small: string;       // 200x200 square  
    thumbnail: string;   // 100x100 square
  };
}

export interface ICoordinate {
  latitude: number;
  longitude: number;
}

export interface ITimePeriod {
  openTime: string; // "09:00"
  closeTime: string; // "22:00"
  serviceTypes: ServiceType[];
}

export interface IDaySchedule {
  isOpen: boolean;
  periods: ITimePeriod[];
  breaks?: ITimePeriod[];
}

export interface ISpecialHours {
  date: string; // "2025-12-25"
  name: string; // "Christmas Day"
  schedule: IDaySchedule | null;
  isRecurring: boolean;
}

export interface ITemporaryClosure {
  startDate: Date;
  endDate: Date;
  reason: string;
  message?: string;
}

export interface IOperatingHours {
  timezone: string;
  schedule: {
    [key in DayOfWeek]: IDaySchedule;
  };
  specialHours: ISpecialHours[];
  temporaryClosures: ITemporaryClosure[];
}

export interface IDeliveryZone {
  name: string;
  polygon: ICoordinate[];
  deliveryFee: number;
  estimatedTime: number;
  minimumOrder?: number;
}

export interface IServiceOptions {
  dineIn: {
    available: boolean;
    tableReservations: boolean;
    walkInsAccepted: boolean;
  };
  takeout: {
    available: boolean;
    estimatedWaitTime: number;
    orderAheadTime: number;
  };
  delivery: {
    available: boolean;
    radius: number;
    minimumOrder: number;
    deliveryFee: number;
    freeDeliveryThreshold?: number;
    estimatedDeliveryTime: number;
    deliveryZones: IDeliveryZone[];
  };
  curbside: {
    available: boolean;
    instructions: string;
  };
}

export interface IBusinessStatus {
  isOpen: boolean;
  currentStatus: RestaurantStatus;
  statusMessage?: string;
  estimatedReopenTime?: Date;
  pausedServices: ServiceType[];
  busyLevel: BusyLevel;
}

export interface IMenuAvailability {
  timeRestrictions: {
    [key in DayOfWeek]: ITimePeriod[];
  };
  dateRestrictions?: {
    startDate?: Date;
    endDate?: Date;
  };
}

export interface IDietaryInfo {
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isKeto: boolean;
  isDairyFree: boolean;
  isNutFree: boolean;
  isHalal: boolean;
  isKosher: boolean;
}

export interface IInventoryTracking {
  trackInventory: boolean;
  currentStock?: number;
  lowStockThreshold?: number;
}

export interface IModifier {
  id: string;
  name: string;
  description?: string;
  priceModifier: number;
  priceType: PriceType;
  isAvailable: boolean;
  isDefault: boolean;
  inventoryTracking?: IInventoryTracking;
  allergenInfo?: Allergen[];
  calorieImpact?: number;
  displayOrder: number;
  image?: IImageObject;
}

export interface IModifierGroup {
  id: string;
  name: string;
  description?: string;
  type: ModifierType;
  minSelections: number;
  maxSelections: number;
  isRequired: boolean;
  displayOrder: number;
  isCollapsible: boolean;
  modifiers: IModifier[];
}

export interface IMenuItem {
  id: string;
  name: string;
  description: string;
  image: IImageObject | null;      // Single image object instead of array
  basePrice: number;
  tax: number;
  preparationTime: number;
  calories?: number;
  isAvailable: boolean;
  displayOrder: number;
  modifierGroups: IModifierGroup[];
  categoryId: string;              // Reference to category ID
  menuId: string;                  // Reference to menu ID (unidirectional)
}

export interface IMenuCategory {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface IMenu {
  id: string;
  name: string;
  description?: string;
  timeSlots: any[];                // Time-based availability
  displayOrder: number;
  isActive: boolean;
  // Removed itemIds - items will reference menus instead
}

export interface IOrderingRules {
  minimumOrder: {
    amount: number;
    serviceTypes: ServiceType[];
  };
  maximumOrder?: {
    amount?: number;
    itemCount?: number;
  };
  advanceOrderTime: {
    minimum: number;
    maximum: number;
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
    timeLimit: number;
    refundPolicy: string;
  };
}

export interface IRestaurantInfo {
  cuisineTypes: CuisineType[];
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  averagePreparationTime: number;
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

export interface IRestaurantMenu {
  restaurantInfo: IRestaurantInfo;
  operatingHours: IOperatingHours;
  serviceOptions: IServiceOptions;
  businessStatus: IBusinessStatus;
  menus: IMenu[];
  categories: IMenuCategory[];
  items: IMenuItem[];
  orderingRules: IOrderingRules;
  version: number;
  isActive: boolean;
}

// Type definitions
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
export type ServiceType = 'DINE_IN' | 'TAKEOUT' | 'DELIVERY' | 'CURBSIDE';
export type RestaurantStatus = 'OPEN' | 'CLOSED' | 'BUSY' | 'TEMPORARILY_CLOSED' | 'PERMANENTLY_CLOSED';
export type BusyLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
export type ModifierType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'QUANTITY' | 'TEXT_INPUT';
export type PriceType = 'FIXED' | 'PERCENTAGE' | 'REPLACEMENT';
export type ItemTag = 'VEGETARIAN' | 'VEGAN' | 'GLUTEN_FREE' | 'KETO' | 'LOW_CARB' | 'PROTEIN_RICH' | 'SPICY' | 'COLD' | 'HOT' | 'SIGNATURE' | 'HEALTHY';
export type Allergen = 'NUTS' | 'DAIRY' | 'EGGS' | 'SOY' | 'WHEAT' | 'FISH' | 'SHELLFISH' | 'SESAME';
export type SpiceLevel = 'MILD' | 'MEDIUM' | 'HOT' | 'EXTRA_HOT';
export type PaymentMethod = 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'DIGITAL_WALLET' | 'LOYALTY_POINTS';
export type CuisineType = 'ITALIAN' | 'CHINESE' | 'MEXICAN' | 'INDIAN' | 'AMERICAN' | 'JAPANESE' | 'THAI' | 'FRENCH' | 'MEDITERRANEAN' | 'FAST_FOOD' | 'COFFEE' | 'DESSERTS' | 'HEALTHY' | 'BBQ' | 'SEAFOOD' | 'VEGETARIAN' | 'PIZZA' | 'BURGERS' | 'SUSHI';

// Interface for Merchant document
export interface IMerchant extends Document {
  _id: string;
  phoneNumber: string;
  email: string;
  merchantName: string;
  merchantType: 'RESTAURANT' | 'RETAIL' | 'MARKET' | 'SERVICE' | 'EDUCATIONAL' | 'ENTERTAINMENT' | 'HOTEL' | 'RENTAL' | 'TRANSPORTATION' | 'OTHER';
  merchantAddress: string;
  merchantLicense: string;
  profileImage?: IImageObject;      // Profile image for the merchant
  merchantStaff: {
    name: string;
    role: 'ADMIN' | 'MERCHANT_OWNER' | 'MERCHANT_MANAGER' | 'MERCHANT_STAFF';
    email: string;
    phoneNumber: string;
    userId: string;
    pushToken: string[];
  }[];
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  currentRegion: string;
  currentAddress: string;
  hasUnreadNotifications: boolean;
  notifications: IEmbeddedNotification[];
  advertisements?: IAdvertisement[];
  
  // Optional restaurant menu - only for RESTAURANT type merchants
  restaurantMenu?: IRestaurantMenu;
  
  notificationPreferences: {
    paymentReceived: {
      roles: 'ADMIN' | 'MERCHANT_OWNER' | 'MERCHANT_MANAGER' | 'MERCHANT_STAFF';
      sms: boolean;
      push: boolean;
      email: boolean;
    };
    paymentSent: {
      roles: 'ADMIN' | 'MERCHANT_OWNER' | 'MERCHANT_MANAGER' | 'MERCHANT_STAFF';
      sms: boolean;
      push: boolean;
      email: boolean;
    };
    systemUpdates: {
      roles: 'ADMIN' | 'MERCHANT_OWNER' | 'MERCHANT_MANAGER' | 'MERCHANT_STAFF';
      sms: boolean;
      push: boolean;
      email: boolean;
    };
    security: {
      roles: 'ADMIN' | 'MERCHANT_OWNER' | 'MERCHANT_MANAGER' | 'MERCHANT_STAFF';
      sms: boolean;
      push: boolean;
      email: boolean;
    };
    promotions: {
      roles: 'ADMIN' | 'MERCHANT_OWNER' | 'MERCHANT_MANAGER' | 'MERCHANT_STAFF';
      sms: boolean;
      push: boolean;
      email: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

// Define the User schema
const MerchantSchema = new Schema<IMerchant>(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String, 
      required: true,
      unique: true,
    },
    merchantName: {
      type: String,
      required: true,
    },    
    merchantType: {
      type: String,
      required: true,
    },
    merchantAddress: {
      type: String, 
      required: true,
    },
    merchantLicense: {
      type: String,
      required: true,
    },    
    profileImage: {
      type: {
        url: String,
        publicId: String,
        alt: String,
        width: Number,
        height: Number,
        sizes: {
          original: String,
          display: String,
          medium: String,
          small: String,
          thumbnail: String,
        },
      },
      required: false,
    },
    merchantStaff: {
      type: [{
        name: String,
        role: String,
        email: String,  
        phoneNumber: String,
        userId: String,
        pushToken: [String],
      }],
    },
    verificationStatus: {
      type: String,
      required: true,
    },
    currentRegion: {
      type: String,
      required: true,
    },  
    currentAddress: {   
      type: String,
      required: true,
    },
    hasUnreadNotifications: {
      type: Boolean,
      required: true,
    },        
    notifications: {
      type: [{
        title: {
          type: String,
          required: [true, 'Notification title is required'],
          trim: true,
        },
        message: {
          type: String,
          required: [true, 'Notification message is required'],
          trim: true,
        },
        creationTime: {
          type: Date,
          default: Date.now,
        },
        isRead: {
          type: Boolean,
          default: false,
        },    
        pinned: {
          type: Boolean,
          default: false,
        },
        type: {
          type: String,
          enum: ['UPDATE', 'SYSTEM', 'PROMOTIONAL', 'SECURITY'],
          required: [true, 'Notification type is required'],
        },
        metadata: {
          type: Schema.Types.Mixed,
          default: {},
        }
      }],
      default: [],
    },  
    advertisements: {
      type: [{
        title: String,
        description: String,
        image: {
          url: String,
          publicId: String,
        },  
        link: String,
        startDate: Date,
        endDate: Date,
        video: {
          url: String,
          publicId: String,
        },  
        isActive: Boolean,
        createdAt: Date,
        updatedAt: Date,
        clicks: Number,
        views: Number,
        impressions: Number,
        location: String,
        category: String,
        targetAudience: String,
        targetLocation: String,
        targetGender: String,
        targetAge: Number,
        targetIncome: Number,
        targetInterests: [String],  
        targetBehavior: String,
        targetDevice: String,
        targetOS: String,
        targetBrowser: String,
        targetLanguage: String,
        targetKeywords: [String],
      }]
    },
    
    // Optional restaurant menu - only for RESTAURANT type merchants
    restaurantMenu: {
      type: {
        restaurantInfo: {
          cuisineTypes: [String],
          priceRange: String,
          averagePreparationTime: Number,
          images: {
            logo: {
              url: String,
              publicId: String,
              alt: String,
              width: Number,
              height: Number,
            },
            cover: {
              url: String,
              publicId: String,
              alt: String,
              width: Number,
              height: Number,
            },
            gallery: [{
              url: String,
              publicId: String,
              alt: String,
              width: Number,
              height: Number,
            }],
          },
          rating: {
            average: Number,
            totalReviews: Number,
          },
        },
        operatingHours: {
          timezone: String,
          schedule: Schema.Types.Mixed, // Dynamic keys for days of week
          specialHours: [{
            date: String,
            name: String,
            schedule: Schema.Types.Mixed,
            isRecurring: Boolean,
          }],
          temporaryClosures: [{
            startDate: Date,
            endDate: Date,
            reason: String,
            message: String,
          }],
        },
        serviceOptions: {
          dineIn: {
            available: Boolean,
            tableReservations: Boolean,
            walkInsAccepted: Boolean,
          },
          takeout: {
            available: Boolean,
            estimatedWaitTime: Number,
            orderAheadTime: Number,
          },
          delivery: {
            available: Boolean,
            radius: Number,
            minimumOrder: Number,
            deliveryFee: Number,
            freeDeliveryThreshold: Number,
            estimatedDeliveryTime: Number,
            deliveryZones: [{
              name: String,
              polygon: [{
                latitude: Number,
                longitude: Number,
              }],
              deliveryFee: Number,
              estimatedTime: Number,
              minimumOrder: Number,
            }],
          },
          curbside: {
            available: Boolean,
            instructions: String,
          },
        },
        businessStatus: {
          isOpen: Boolean,
          currentStatus: String,
          statusMessage: String,
          estimatedReopenTime: Date,
          pausedServices: [String],
          busyLevel: String,
        },
        menus: [{
          id: String,
          name: String,
          description: String,
          timeSlots: [Schema.Types.Mixed],  // Array of time slot objects
          displayOrder: Number,
          isActive: Boolean,
          // Items reference menus via menuId - no itemIds array needed
        }],
        categories: [{
          id: String,
          name: String,
          description: String,
          displayOrder: Number,
          isActive: Boolean,
        }],
        items: [{
          id: String,
          name: String,
          description: String,
          image: {
            url: String,
            publicId: String,
            alt: String,
            width: Number,
            height: Number,
          },
          basePrice: Number,
          tax: Number,
          preparationTime: Number,
          calories: Number,
          isAvailable: Boolean,
          displayOrder: Number,
          modifierGroups: [{
            id: String,
            name: String,
            description: String,
            type: String,
            minSelections: Number,
            maxSelections: Number,
            isRequired: Boolean,
            displayOrder: Number,
            isCollapsible: Boolean,
            modifiers: [{
              id: String,
              name: String,
              description: String,
              priceModifier: Number,
              priceType: String,
              isAvailable: Boolean,
              isDefault: Boolean,
              inventoryTracking: {
                trackInventory: Boolean,
                currentStock: Number,
                lowStockThreshold: Number,
              },
              allergenInfo: [String],
              calorieImpact: Number,
              displayOrder: Number,
              image: {
                url: String,
                publicId: String,
                alt: String,
                width: Number,
                height: Number,
              },
            }],
          }],
          categoryId: String,
          menuId: String,
        }],
        orderingRules: {
          minimumOrder: {
            amount: Number,
            serviceTypes: [String],
          },
          maximumOrder: {
            amount: Number,
            itemCount: Number,
          },
          advanceOrderTime: {
            minimum: Number,
            maximum: Number,
          },
          paymentMethods: [String],
          tips: {
            allowTips: Boolean,
            suggestedPercentages: [Number],
            minimumTip: Number,
            maximumTip: Number,
          },
          cancellationPolicy: {
            allowCancellation: Boolean,
            timeLimit: Number,
            refundPolicy: String,
          },
        },
        version: {
          type: Number,
          default: 1,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
      required: false,
    },
    
    notificationPreferences: {
      paymentReceived: {
        roles: [String],
        sms: Boolean,
        push: Boolean,
        email: Boolean,
      },
      paymentSent: {  
        roles: [String],
        sms: Boolean,
        push: Boolean,
        email: Boolean,
      },
      systemUpdates: {
        roles: [String],
        sms: Boolean,
        push: Boolean,
        email: Boolean,
      },
      security: {
        roles: [String],
        sms: Boolean,
        push: Boolean,
        email: Boolean,
      },
      promotions: {
        roles: [String],
        sms: Boolean,
        push: Boolean,
        email: Boolean,
      },
    },
  },
  {
    timestamps: true,
  }
);



// Create or retrieve the User model
export const Merchant = mongoose.models.Merchant as mongoose.Model<IMerchant> || 
  mongoose.model<IMerchant>('Merchant', MerchantSchema);

export default Merchant; 