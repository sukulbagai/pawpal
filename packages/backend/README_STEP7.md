# PawPal Backend - Step 7: Adoption Requests

This document covers the adoption request system implementation for PawPal, enabling adopters to submit requests and owners to review, approve, or decline them.

## Overview

Step 7 introduces a complete adoption workflow:
- Adopters can submit adoption requests from dog detail pages
- Owners receive incoming requests and can approve/decline them
- On approval, mutual contact details are revealed to both parties
- Dog status automatically updates to "pending" when first approved

## Database Schema

The adoption request system uses the `adoption_requests` table:

```sql
CREATE TABLE adoption_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  adopter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'declined', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(dog_id, adopter_id, status) -- Prevent duplicate pending requests
);
```

## API Endpoints

### POST /adoptions

Create a new adoption request.

**Authentication**: Required  
**Body**: 
```json
{
  "dog_id": "uuid",
  "message": "optional message up to 500 chars"
}
```

**Response (201)**:
```json
{
  "ok": true,
  "request": {
    "id": "uuid",
    "dog_id": "uuid",
    "adopter_id": "uuid",
    "message": "string or null",
    "status": "pending",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

**Response (409)** - Duplicate request:
```json
{
  "ok": false,
  "error": "You already have a pending request for this dog"
}
```

**Example**:
```bash
curl -X POST http://localhost:4000/adoptions \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"dog_id":"550e8400-e29b-41d4-a716-446655440000","message":"We have a yard & time!"}'
```

### GET /adoptions/incoming

List incoming adoption requests for dog owner.

**Authentication**: Required  
**Response**:
```json
{
  "ok": true,
  "items": [
    {
      "id": "uuid",
      "message": "string or null",
      "status": "pending|approved|declined|cancelled",
      "created_at": "timestamp",
      "dog": {
        "id": "uuid",
        "name": "string",
        "area": "string",
        "images": ["url1", "url2"],
        "status": "available|pending|adopted"
      },
      "adopter": {
        "id": "uuid",
        "name": "string",
        "email": "string or null", // null unless approved
        "phone": "string or null"  // null unless approved
      },
      "contact_visible": false // true only if approved
    }
  ]
}
```

**Example**:
```bash
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:4000/adoptions/incoming
```

### GET /adoptions/outgoing

List outgoing adoption requests for adopter.

**Authentication**: Required  
**Response**:
```json
{
  "ok": true,
  "items": [
    {
      "id": "uuid",
      "message": "string or null",
      "status": "pending|approved|declined|cancelled",
      "created_at": "timestamp",
      "dog": {
        "id": "uuid",
        "name": "string",
        "area": "string",
        "images": ["url1", "url2"],
        "status": "available|pending|adopted"
      },
      "owner": {
        "name": "string",
        "email": "string or null", // null unless approved
        "phone": "string or null"  // null unless approved
      },
      "contact_visible": false // true only if approved
    }
  ]
}
```

**Example**:
```bash
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:4000/adoptions/outgoing
```

### PATCH /adoptions/:id

Update adoption request status (approve/decline/cancel).

**Authentication**: Required  
**Body**:
```json
{
  "status": "approved|declined|cancelled"
}
```

**Response**:
```json
{
  "ok": true,
  "request": {
    "id": "uuid",
    "status": "approved",
    "updated_at": "timestamp"
  },
  "dog": {
    "id": "uuid",
    "status": "pending" // updated if approval changed it
  }
}
```

**Response (403)** - Unauthorized:
```json
{
  "ok": false,
  "error": "Unauthorized: You can only update requests for your own dogs"
}
```

**Example**:
```bash
curl -X PATCH http://localhost:4000/adoptions/550e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status":"approved"}'
```

## Business Logic

### Contact Visibility Policy

Contact information (email, phone) is only visible when:
- Request status is "approved"
- Visible to both owner and adopter

### Dog Status Updates

When an adoption request is approved:
- If the dog status is "available", it automatically changes to "pending"
- If dog is already "pending" or "adopted", no change occurs

### Duplicate Request Prevention

- Only one active (pending) request per adopter per dog is allowed
- Returns 409 Conflict with helpful message if duplicate attempted

### Authorization

- Only dog owners can approve/decline requests for their dogs
- Only authenticated users can create requests
- Users cannot request adoption of their own dogs

## Error Handling

Common error scenarios:
- **404**: Dog not found, adoption request not found
- **409**: Duplicate pending request exists
- **403**: Unauthorized (trying to update another owner's requests)
- **400**: Invalid UUID format, validation errors
- **401**: Missing or invalid authentication token

## File Structure

```
packages/backend/src/
├── lib/
│   ├── adoptions.ts          # Core adoption business logic
│   └── validators.ts         # Zod schemas for adoption requests
└── routes/
    └── adoptions.ts          # HTTP route handlers
```

## Testing

### Manual Testing Flow

1. **Setup**: Create two user accounts (Owner A, Adopter B)
2. **Post Dog**: Owner A posts a dog via Step 5
3. **Request Adoption**: Adopter B submits request from dog details page
4. **Review Request**: Owner A sees request in Dashboard → Incoming
5. **Approve Request**: Owner A approves request
6. **Verify Contact Exchange**: Both parties see each other's contact info
7. **Check Dog Status**: Dog status changes to "pending"
8. **Test Duplicate**: Adopter B tries to request same dog again (should fail)

### API Testing Examples

```bash
# 1. Create request
REQUEST_ID=$(curl -s -X POST http://localhost:4000/adoptions \
  -H "Authorization: Bearer $ADOPTER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dog_id":"'$DOG_ID'","message":"Perfect fit for our family!"}' \
  | jq -r '.request.id')

# 2. Check incoming requests (as owner)
curl -H "Authorization: Bearer $OWNER_TOKEN" \
  http://localhost:4000/adoptions/incoming | jq '.items[0].contact_visible'
# Should return: false

# 3. Approve request
curl -X PATCH http://localhost:4000/adoptions/$REQUEST_ID \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"approved"}'

# 4. Check contact visibility (as owner)
curl -H "Authorization: Bearer $OWNER_TOKEN" \
  http://localhost:4000/adoptions/incoming | jq '.items[0].contact_visible'
# Should return: true

# 5. Check outgoing requests (as adopter)
curl -H "Authorization: Bearer $ADOPTER_TOKEN" \
  http://localhost:4000/adoptions/outgoing | jq '.items[0].contact_visible'
# Should return: true
```

## Implementation Notes

- Uses service role Supabase client for data access
- Joins across users, dogs, and adoption_requests tables
- Implements proper data sanitization for contact visibility
- Handles concurrent requests safely with database constraints
- Follows existing error handling patterns from previous steps
