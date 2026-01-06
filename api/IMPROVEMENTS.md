# API Improvement Suggestions

## High Priority

### 1. **Batch Submission** - Submit multiple names at once
```typescript
POST /api/submit-name
{
  "names": [
    { "name": "rococo", "description": "..." },
    { "name": "baroque", "description": "..." }
  ]
}
```

### 2. **Check if Name Exists** - Before submitting
```typescript
GET /api/submit-name/check?name=rococo
// Returns: { exists: true/false, name: "rococo" }
```

### 3. **Case-Insensitive Duplicate Detection**
Currently "Rococo" and "rococo" would be treated as different. Should normalize to lowercase for checking.

### 4. **Description Length Validation**
Currently missing - should validate max 500 characters.

### 5. **Rate Limiting**
Prevent abuse with per-IP or per-user rate limits.

### 6. **Request ID Tracking**
Add request IDs for debugging and support.

## Medium Priority

### 7. **Search/Query Endpoint**
```typescript
GET /api/submit-name/search?q=rococo&limit=10
```

### 8. **Categories Support**
Allow submitting names with categories:
```typescript
{
  "name": "rococo",
  "description": "...",
  "categories": ["art", "french", "elegant"]
}
```

### 9. **Statistics Endpoint**
```typescript
GET /api/submit-name/stats
// Returns: total names, recent submissions, etc.
```

### 10. **Input Sanitization**
Sanitize HTML/script tags from descriptions to prevent XSS.

### 11. **Better Error Codes**
Use HTTP status codes more precisely (409 for conflicts, 422 for validation).

### 12. **Webhook Support**
Optional webhook URL to notify on successful submissions.

## Nice to Have

### 13. **API Versioning**
`/api/v1/submit-name` for future compatibility.

### 14. **Bulk Operations**
Update/delete multiple names at once (admin only).

### 15. **OpenAPI/Swagger Docs**
Auto-generated API documentation.

### 16. **Response Caching**
Cache GET requests for better performance.

### 17. **Request Logging**
Log successful submissions for analytics.

### 18. **Admin Endpoints**
Separate endpoints for admin operations (update, delete, hide names).
