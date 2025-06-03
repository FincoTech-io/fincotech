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
      "url": "https://res.cloudinary.com/yourcloud/image/upload/.../profile_1748903937183.jpg",
      "publicId": "fincotech/Merchant/683beca56d412c1d572afdda/profile/profile_1748903937183",
      "alt": "Nandos profile image",
      "width": 400,
      "height": 400
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
- **Image Optimization**: Automatically resized to 400x400 with face detection
- **Smart Cropping**: Uses face gravity for better profile pictures
- **Auto Cleanup**: Deletes old profile image when uploading new one
- **Cloudinary Storage**: Organized in `fincotech/Merchant/[merchantId]/profile/`

**Response:**
```json
{
  "success": true,
  "data": {
    "merchantId": "683beca56d412c1d572afdda",
    "merchantName": "Nandos",
    "profileImage": {
      "url": "https://res.cloudinary.com/yourcloud/image/upload/.../profile_1748903937183.jpg",
      "publicId": "fincotech/Merchant/683beca56d412c1d572afdda/profile/profile_1748903937183",
      "alt": "Nandos profile image",
      "width": 400,
      "height": 400
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
}
```

**Upload Profile Image:**
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
      console.log('Profile image updated:', result.data.profileImage.url);
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

---

## Integration with Public API

The profile images are automatically included in the public merchants listing:

```javascript
// Public endpoint now includes profile images
const response = await fetch('/api/merchants?type=RESTAURANT');
const data = await response.json();

data.data.merchants.forEach(merchant => {
  console.log(`${merchant.name}: ${merchant.profileImage?.url || 'No image'}`);
});
```

---

## Image Specifications

**Supported Formats**: JPEG, PNG, WEBP
**Maximum Size**: 10MB
**Output Format**: Auto-optimized (WebP when supported)
**Dimensions**: 400x400 pixels (square)
**Cropping**: Smart crop with face detection
**Quality**: Auto-optimized for web delivery

---

## Security Features

- **Role-based Access**: Only authorized staff can modify settings
- **Input Validation**: Strict validation of image data and formats  
- **Resource Cleanup**: Automatic deletion of old images to prevent storage bloat
- **Error Handling**: Graceful handling of upload failures and network issues
- **Timeout Protection**: 60-second timeout for large image uploads

This API provides a complete solution for merchant profile image management with enterprise-grade security and optimization features. 