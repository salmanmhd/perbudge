# API Documentation

## User Endpoints

### POST /api/v1/user/register
Register a new user.

**Payload:**
```json
{
  "fullName": "string (required, min 3 chars)",
  "email": "string (required, unique)",
  "password": "string (required)"
}
```

**Success Response (201):**
```json
{
  "status": 201,
  "message": "User created successfully",
  "data": {
    "_id": "user_id",
    "fullName": "string",
    "email": "string",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

**Failure Responses:**
- 409: User already exists
- 500: Missing required fields or server error

### POST /api/v1/user/login
Login an existing user.

**Payload:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Success Response (200):**
```json
{
  "message": "user logged in successfully",
  "response": 200,
  "data": {
    "loggedInUser": {
      "_id": "user_id",
      "fullName": "string",
      "email": "string",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    },
    "refreshToken": "string",
    "accessToken": "string"
  }
}
```
Cookies set: accessToken, refreshToken

**Failure Responses:**
- 500: Invalid credentials or user not found

## Expense Endpoints

### POST /api/v1/expense/add
Add a new expense (requires authentication).

**Headers:**
- Authorization: Bearer {accessToken}

**Payload:**
```json
{
  "amount": "number (required)",
  "description": "string (required)",
  "category": "string (required)",
  "date": "date (required)"
}
```

**Success Response (200):**
```json
{
  "message": "Expense added successfully"
}
```

**Failure Responses:**
- 401: Unauthorized (invalid/missing token)
- 500: Server error
