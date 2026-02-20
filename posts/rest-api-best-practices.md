---
title: REST API Best Practices
date: 2025-02-15
description: Design clean, intuitive APIs that developers love to use with these REST conventions and patterns.
---

# REST API Best Practices

Good API design makes integration easy and enjoyable. Bad API design frustrates developers and creates support burden. Follow these patterns to build APIs that developers love.

## Use Nouns for Resources

URLs represent resources, not actions:

```
GET    /users          # List users
GET    /users/123      # Get specific user
POST   /users          # Create user
PUT    /users/123      # Update user
DELETE /users/123      # Delete user
```

Not: `/getUsers`, `/createUser`, `/deleteUser`

## Nest Related Resources

Show relationships through URL structure:

```
GET /users/123/posts         # User's posts
GET /users/123/posts/456     # Specific post
POST /users/123/posts        # Create post for user
```

Limit nesting to 2-3 levels maximum.

## Use Proper Status Codes

Return meaningful HTTP codes:

```
200 OK           # Successful GET, PUT
201 Created      # Successful POST
204 No Content   # Successful DELETE
400 Bad Request  # Invalid input
404 Not Found    # Resource doesn't exist
422 Unprocessable # Validation failed
500 Server Error # Something broke
```

## Consistent Response Format

Structure responses predictably:

```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "total": 100
  }
}
```

Error responses should be helpful:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "field": "email"
  }
}
```

## Version Your API

Prevent breaking changes:

```
/api/v1/users
/api/v2/users
```

Use URL versioning for clarity.

## Keep It Simple

Start with these basics. Add complexity only when needed. A simple, well-documented API beats a complex one every time.