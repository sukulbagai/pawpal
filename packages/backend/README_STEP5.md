# Step 5: Dog Posting Form with Image Upload

This step implements the dog posting functionality where authenticated users can create new dog listings with image uploads.

## Backend Features

### API Endpoints

#### POST /dogs
- **Purpose**: Create a new dog listing
- **Authentication**: Required (Bearer token)
- **Validation**: Zod schema validation
- **Body**: DogCreateInput object

**Example Request:**
```bash
curl -X POST http://localhost:4000/dogs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Buddy",
    "age_years": 3,
    "gender": "male",
    "description": "Friendly and energetic dog looking for a loving home",
    "area": "Connaught Place, Delhi",
    "location_lat": 28.6315,
    "location_lng": 77.2167,
    "health_sterilised": true,
    "health_vaccinated": true,
    "health_dewormed": true,
    "compatibility_kids": true,
    "compatibility_dogs": true,
    "energy_level": "high",
    "temperament": "friendly",
    "personality_tag_ids": [1, 3, 5],
    "images": [
      "https://your-supabase-url.co/storage/v1/object/public/dog-images/user1/1640995200000-0-buddy1.jpg",
      "https://your-supabase-url.co/storage/v1/object/public/dog-images/user1/1640995200000-1-buddy2.jpg"
    ]
  }'
```

**Response (201):**
```json
{
  "id": 123,
  "name": "Buddy",
  "area": "Connaught Place, Delhi",
  "images": ["https://..."],
  "status": "available",
  "created_at": "2025-08-12T..."
}
```

#### GET /tags/personality
- **Purpose**: Get all personality tags for the multi-select
- **Authentication**: Not required
- **Response**: Array of `{id: number, tag_name: string}`

### Validation Schema

The `DogCreateSchema` validates:
- **name**: Optional, max 80 chars
- **age_years**: Optional, 0-25 years
- **gender**: Enum ('male', 'female', 'unknown'), defaults to 'unknown'
- **description**: Optional, max 1000 chars
- **area**: Required, 2-120 chars
- **location_lat/lng**: Optional GPS coordinates
- **health_*** fields**: Boolean flags for health status
- **compatibility_*** fields**: Optional boolean for compatibility
- **energy_level/temperament/playfulness**: Optional strings
- **special_needs**: Optional, max 200 chars
- **personality_tag_ids**: Array of numbers, max 20 tags
- **images**: Array of URLs, 1-6 images required

### Security

- **Authentication**: Required via JWT token
- **Authorization**: User can only post dogs under their own ID
- **Validation**: Server-side Zod validation prevents invalid data
- **RLS**: Database policies ensure users can only insert their own records
- **Image limits**: Max 6 images per dog

## Frontend Features

### Components

1. **PostDog.tsx** - Main form page
2. **ImageUploader.tsx** - Multi-image upload with preview
3. **TagMultiSelect.tsx** - Searchable personality tag selector

### Image Upload Flow

1. User selects images (max 6, 4MB each)
2. Images uploaded to Supabase Storage bucket `dog-images`
3. Storage path: `{userId}/{timestamp}-{index}-{filename}`
4. Public URLs returned and stored in dog record
5. Client validates file types (jpg, png, webp)

### Form Features

- **Location**: "Use my location" button for GPS coordinates
- **Health toggles**: Sterilised, vaccinated, dewormed
- **Compatibility**: Kids, dogs, cats
- **Energy level**: Radio buttons (low/medium/high)
- **Personality tags**: Multi-select from backend data
- **Validation**: Client-side validation mirrors server schema
- **UX**: Disabled submit during upload, progress indicators

### Navigation

- **Navbar**: "Post Dog" link appears for authenticated users
- **Routes**: `/post-dog` protected route
- **Redirect**: Success redirects to home page

## Database Schema

The dog record is inserted with:
- `posted_by`: Set to authenticated user's ID
- `status`: Defaults to 'available'
- `images`: Array of public URLs from Supabase Storage
- `personality_tag_ids`: Linked via `dog_personality_tags` junction table

## Testing Instructions

1. **Start backend**: `cd packages/backend && pnpm dev`
2. **Start frontend**: `cd packages/frontend && pnpm dev`
3. **Login**: Sign in with valid credentials
4. **Navigate**: Click "Post Dog" in navbar
5. **Upload images**: Select 1-6 images
6. **Fill form**: Complete required fields (area, at least)
7. **Submit**: Form should create dog and redirect to home
8. **Verify**: New dog appears at top of home page grid

## Files Modified/Created

**Backend:**
- `src/lib/validators.ts` - Zod schemas
- `src/lib/dogs.ts` - createDog function
- `src/routes/dogs.ts` - POST /dogs endpoint
- `src/routes/tags.ts` - GET /tags/personality
- `src/index.ts` - Added tags router

**Frontend:**
- `src/pages/PostDog.tsx` - Main form
- `src/components/ImageUploader.tsx` - Upload component
- `src/components/TagMultiSelect.tsx` - Tag selector
- `src/lib/upload.ts` - Upload helpers
- `src/components/Navbar.tsx` - Added Post Dog link
- `src/App.tsx` - Added /post-dog route

## Acceptance Criteria

✅ **Form Creation**: Authenticated users can access `/post-dog`  
✅ **Image Upload**: 1-6 images can be uploaded to Supabase Storage  
✅ **Data Validation**: Both client and server validate form data  
✅ **Dog Creation**: POST /dogs creates new listing with 201 response  
✅ **RLS Security**: Only authenticated users can create dogs  
✅ **Home Integration**: New dogs appear at top of home page grid  
✅ **Storage Security**: Image URLs are public but paths include user ID  
✅ **Error Handling**: Invalid data shows appropriate error messages

The implementation provides a complete dog posting workflow with secure image upload, proper validation, and seamless integration with the existing dog listing system.
