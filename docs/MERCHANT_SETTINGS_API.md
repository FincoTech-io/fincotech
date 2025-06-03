# Merchant Settings API Documentation

## Overview
API endpoints for managing merchant settings, including profile image management with role-based access control.

**Base URL**: `/api/merchants/[merchantId]/settings`

---

## Authentication & Permissions
All endpoints require JWT authentication:

- **View Settings (GET)**: ADMIN, MERCHANT_OWNER, MERCHANT_MANAGER
- **Update Settings (PUT)**: ADMIN, MERCHANT_OWNER, MERCHANT_MANAGER  
- **Delete Profile Image (DELETE)**: ADMIN, MERCHANT_OWNER only

---

## Endpoints

### 1. Get Merchant Settings
```
GET /api/merchants/[merchantId]/settings
```

Retrieve the current merchant settings including profile image.

**Authentication Required**: Yes (ADMIN, MERCHANT_OWNER, MERCHANT_MANAGER)

**Response:**
```json
{
  "success": true,
  "data": {
    "merchantId": "683beca56d412c1d572afdda",
    "merchantName": "Nandos",
    "merchantType": "RESTAURANT",
    "profileImage": {
      "url": "https://res.cloudinary.com/yourcloud/image/upload/w_1200,h_600,c_limit/.../profile_1748903937183.jpg",
      "publicId": "fincotech/Merchant/683beca56d412c1d572afdda/profile/profile_1748903937183",
      "alt": "Nandos profile image",
      "width": 1200,
      "height": 600,
      "sizes": {
        "original": "https://res.cloudinary.com/yourcloud/image/upload/.../profile_1748903937183.jpg",
        "display": "https://res.cloudinary.com/yourcloud/image/upload/w_1200,h_600,c_limit/.../profile_1748903937183.jpg",
        "medium": "https://res.cloudinary.com/yourcloud/image/upload/w_400,h_400,c_fill,g_face/.../profile_1748903937183.jpg",
        "small": "https://res.cloudinary.com/yourcloud/image/upload/w_200,h_200,c_fill,g_face/.../profile_1748903937183.jpg",
        "thumbnail": "https://res.cloudinary.com/yourcloud/image/upload/w_100,h_100,c_fill,g_face/.../profile_1748903937183.jpg"
      }
    }
  },
  "message": "Merchant settings retrieved successfully"
}
```

**If No Profile Image:**
```json
{
  "success": true,
  "data": {
    "merchantId": "683beca56d412c1d572afdda",
    "merchantName": "Nandos",
    "merchantType": "RESTAURANT",
    "profileImage": null
  },
  "message": "Merchant settings retrieved successfully"
}
```

### 2. Update Profile Image
```
PUT /api/merchants/[merchantId]/settings
```

Upload or update the merchant's profile image.

**Authentication Required**: Yes (ADMIN, MERCHANT_OWNER, MERCHANT_MANAGER)

**Request Body:**
```json
{
  "profileImage": {
    "base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."
  }
}
```

**Features:**
- **Highest Quality Storage**: Original images stored at full resolution with auto:best quality
- **Optimized Display**: Main display image limited to 1200x600 with maintained aspect ratio
- **Multiple Sizes**: Automatic generation of square sizes for different UI contexts
- **Smart Cropping**: Uses face gravity for optimal cropping on square versions
- **Auto Cleanup**: Deletes old profile image when uploading new one
- **Cloudinary Storage**: Organized in `fincotech/Merchant/[merchantId]/profile/`
- **Eager Loading**: All image sizes generated immediately upon upload

**Response:**
```json
{
  "success": true,
  "data": {
    "merchantId": "683beca56d412c1d572afdda",
    "merchantName": "Nandos",
    "profileImage": {
      "url": "https://res.cloudinary.com/yourcloud/image/upload/w_1200,h_600,c_limit/.../profile_1748903937183.jpg",
      "publicId": "fincotech/Merchant/683beca56d412c1d572afdda/profile/profile_1748903937183",
      "alt": "Nandos profile image",
      "width": 1200,
      "height": 600,
      "sizes": {
        "original": "https://res.cloudinary.com/yourcloud/image/upload/.../profile_1748903937183.jpg",
        "display": "https://res.cloudinary.com/yourcloud/image/upload/w_1200,h_600,c_limit/.../profile_1748903937183.jpg",
        "medium": "https://res.cloudinary.com/yourcloud/image/upload/w_400,h_400,c_fill,g_face/.../profile_1748903937183.jpg",
        "small": "https://res.cloudinary.com/yourcloud/image/upload/w_200,h_200,c_fill,g_face/.../profile_1748903937183.jpg",
        "thumbnail": "https://res.cloudinary.com/yourcloud/image/upload/w_100,h_100,c_fill,g_face/.../profile_1748903937183.jpg"
      }
    },
    "uploadedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Profile image updated successfully"
}
```

### 3. Delete Profile Image
```
DELETE /api/merchants/[merchantId]/settings
```

Remove the merchant's profile image.

**Authentication Required**: Yes (ADMIN, MERCHANT_OWNER only)

**Response:**
```json
{
  "success": true,
  "data": {
    "merchantId": "683beca56d412c1d572afdda",
    "merchantName": "Nandos",
    "deletedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Profile image deleted successfully"
}
```

---

## Error Handling

**Common Error Responses:**

**401 - Authentication Required**
```json
{
  "success": false,
  "error": "Authentication required"
}
```

**403 - Access Denied**
```json
{
  "success": false,
  "error": "Access denied. Insufficient permissions to update merchant settings."
}
```

**400 - Invalid Request**
```json
{
  "success": false,
  "error": "Profile image with base64 data is required"
}
```

**404 - Not Found**
```json
{
  "success": false,
  "error": "Merchant not found"
}
```

**500 - Upload Error**
```json
{
  "success": false,
  "error": "Image upload failed: Invalid image format"
}
```

---

## Usage Examples

### Frontend Integration

**Check Current Settings:**
```javascript
const response = await fetch(`/api/merchants/${merchantId}/settings`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${yourJWTToken}`,
    'Content-Type': 'application/json'
  }
});

const settings = await response.json();
if (settings.success) {
  console.log('Current profile image:', settings.data.profileImage);
  // Access different sizes
  console.log('Thumbnail:', settings.data.profileImage?.sizes?.thumbnail);
  console.log('High quality:', settings.data.profileImage?.sizes?.original);
}
```

**Upload High Quality Profile Image:**
```javascript
// Convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

// Upload image
const handleProfileImageUpload = async (file) => {
  try {
    const base64 = await fileToBase64(file);
    
    const response = await fetch(`/api/merchants/${merchantId}/settings`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${yourJWTToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        profileImage: {
          base64: base64
        }
      })
    });

    const result = await response.json();
    if (result.success) {
      console.log('Profile image updated with multiple sizes:');
      console.log('Original (highest quality):', result.data.profileImage.sizes.original);
      console.log('Display (1200x600 max):', result.data.profileImage.sizes.display);
      console.log('Medium (400x400):', result.data.profileImage.sizes.medium);
      console.log('Small (200x200):', result.data.profileImage.sizes.small);
      console.log('Thumbnail (100x100):', result.data.profileImage.sizes.thumbnail);
    } else {
      console.error('Upload failed:', result.error);
    }
  } catch (error) {
    console.error('Error uploading image:', error);
  }
};
```

**Delete Profile Image:**
```javascript
const deleteProfileImage = async () => {
  try {
    const response = await fetch(`/api/merchants/${merchantId}/settings`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${yourJWTToken}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    if (result.success) {
      console.log('Profile image deleted successfully');
    } else {
      console.error('Delete failed:', result.error);
    }
  } catch (error) {
    console.error('Error deleting image:', error);
  }
};
```

**Responsive Image Display:**
```javascript
// Use appropriate image size based on display context
const getOptimalImageUrl = (profileImage, context) => {
  if (!profileImage?.sizes) return profileImage?.url || null;
  
  switch (context) {
    case 'avatar':
      return profileImage.sizes.thumbnail; // 100x100 for small avatars
    case 'icon':
      return profileImage.sizes.small; // 200x200 for medium icons
    case 'card':
      return profileImage.sizes.medium; // 400x400 for merchant cards
    case 'banner':
    case 'header':
      return profileImage.sizes.display; // 1200x600 max for banners/headers
    case 'detail':
    case 'original':
      return profileImage.sizes.original; // Highest quality for detailed views
    default:
      return profileImage.sizes.display; // Default to display size
  }
};

// Example usage in React
const MerchantCard = ({ merchant }) => (
  <div>
    <img 
      src={getOptimalImageUrl(merchant.profileImage, 'card')}
      alt={merchant.profileImage?.alt}
      width="400" 
      height="400"
    />
    <h3>{merchant.name}</h3>
  </div>
);

// Banner/Header usage
const MerchantHeader = ({ merchant }) => (
  <div>
    <img 
      src={getOptimalImageUrl(merchant.profileImage, 'banner')}
      alt={merchant.profileImage?.alt}
      style={{ maxWidth: '1200px', maxHeight: '600px' }}
    />
    <h1>{merchant.name}</h1>
  </div>
);
```

---

## Integration with Public API

The profile images with multiple sizes are automatically included in the public merchants listing:

```javascript
// Public endpoint now includes profile images with all sizes
const response = await fetch('/api/merchants?type=RESTAURANT');
const data = await response.json();

data.data.merchants.forEach(merchant => {
  if (merchant.profileImage) {
    console.log(`${merchant.name}:`);
    console.log('  Thumbnail:', merchant.profileImage.sizes.thumbnail);
    console.log('  Display Quality:', merchant.profileImage.sizes.display);
    console.log('  Original Quality:', merchant.profileImage.sizes.original);
  }
});
```

---

## Image Specifications

**Supported Formats**: JPEG, PNG, WEBP, GIF
**Maximum Upload Size**: No limit (stores original at highest quality)
**Output Format**: Auto-optimized (WebP when supported)  
**Quality**: Auto:best (highest quality setting)

**Generated Sizes:**
- **Original**: Full resolution at highest quality (unlimited size)
- **Display**: Max 1200x600 with maintained aspect ratio (main display image)
- **Medium**: 400x400 square (for cards and medium displays)
- **Small**: 200x200 square (for icons and medium contexts)
- **Thumbnail**: 100x100 square (for avatars and small previews)

**Processing Features:**
- **Highest Quality Storage**: Original images stored without quality loss
- **Aspect Ratio Preservation**: Display size maintains original proportions up to 1200x600
- **Smart Square Cropping**: Face detection for optimal square versions
- **Eager Generation**: All sizes created immediately upon upload
- **CDN Delivery**: Fast global delivery via Cloudinary CDN
- **Auto Optimization**: Format and quality optimization per device

---

## Security Features

- **Role-based Access**: Only authorized staff can modify settings
- **Input Validation**: Strict validation of image data and formats  
- **Resource Cleanup**: Automatic deletion of old images to prevent storage bloat
- **Error Handling**: Graceful handling of upload failures and network issues
- **Timeout Protection**: 60-second timeout for large image uploads
- **Multiple Size Generation**: Prevents client-side resizing and maintains quality

This API provides a complete solution for high-quality merchant profile image management with multiple sizes for optimal performance across different use cases.