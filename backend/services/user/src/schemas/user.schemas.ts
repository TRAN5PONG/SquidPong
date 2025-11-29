import { FastifySchema } from "fastify";

// =============================================
// USER SERVICE SCHEMAS - Complete API Documentation
// =============================================

// Common response schemas
const successResponse = {
  type: "object",
  properties: {
    success: { type: "boolean" }, 
    message: { type: "string" },
    data: {},
  },
  required: ["success", "message"],
};

const errorResponse = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    message: { type: "string" },
    error: { type: "string", nullable: true },
  },
  required: ["success", "message"],
};

// PROFILE MANAGEMENT SCHEMAS
// =============================================

export const createProfileSchema: FastifySchema = {
  description: "Create user profile (internal service call)",
  tags: ["Profile Management"],
  summary: "Create Profile",
  headers: {
    type: "object",
    properties: {
      "x-secret-token": {
        type: "string",
        description: "Internal service authentication token",
      },
    },
    required: ["x-secret-token"],
  },
  body: {
    type: "object",
    properties: {
      userId: {
        type: "number",
        description: "User ID from auth service",
      },
      username: {
        type: "string",
        minLength: 3,
        maxLength: 30,
        description: "Username",
      },
      firstName: {
        type: "string",
        minLength: 1,
        maxLength: 50,
        description: "First name",
      },
      lastName: {
        type: "string",
        minLength: 1,
        maxLength: 50,
        description: "Last name",
      },
      avatar: {
        type: "string",
        description: "Avatar image filename (optional)",
      },
      banner: {
        type: "string",
        description: "Banner image filename (optional)",
      },
      rankDivision: {
        type: "string",
        enum: ["IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND", "ASCENDANT", "IMMORTAL", "MASTER"],
        description: "User's rank division (optional)",
      },
      rankTier: {
        type: "string",
        enum: ["I", "II", "III"],
        description: "User's rank tier (optional)",
      },
    },
    required: ["userId", "username", "firstName", "lastName"],
    additionalProperties: false,
  },
  response: {
    200: {
      ...successResponse,
      description: "Profile created successfully",
    },
    400: {
      ...errorResponse,
      description: "Invalid input data",
    },
    401: {
      ...errorResponse,
      description: "Unauthorized - invalid secret token",
    },
  },
};

export const updateProfileLiveSchema: FastifySchema = {
  description: "Update user profile in real-time (Redis cache)",
  tags: ["Profile Management"],
  summary: "Update Profile (Live)",
  headers: {
    type: "object",
    properties: {
      "x-user-id": {
        type: "string",
        description: "User ID from authentication token",
      },
    },
    required: ["x-user-id"],
  },
  consumes: ["multipart/form-data"],
  body: {
    type: "object",
    properties: {
      username: {
        type: "string",
        minLength: 3,
        maxLength: 30,
        description: "Username",
      },
      firstName: {
        type: "string",
        minLength: 1,
        maxLength: 50,
        description: "First name",
      },
      lastName: {
        type: "string",
        minLength: 1,
        maxLength: 50,
        description: "Last name",
      },
      bio: {
        type: "string",
        maxLength: 500,
        description: "User biography",
      },
      location: {
        type: "string",
        maxLength: 100,
        description: "User location",
      },
      avatar: {
        type: "string",
        description: "Avatar image file",
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {},
      },
      description: "Profile updated successfully",
    },
    400: {
      ...errorResponse,
      description: "Invalid input data",
    },
    404: {
      ...errorResponse,
      description: "Profile not found",
    },
  },
};

export const updateProfileIntraSchema: FastifySchema = {
  description: "Update user profile from Intra (accepts multipart image)",
  tags: ["Profile Management"],
  summary: "Update Profile (Intra)",
  headers: {
    type: "object",
    properties: {
      "x-user-id": {
        type: "string",
        description: "User ID from authentication token",
      },
    },
    required: ["x-user-id"],
  },
  consumes: ["multipart/form-data"],
  body: {
    type: "object",
    properties: {
      username: {
        type: "string",
        minLength: 3,
        maxLength: 30,
        description: "Username",
      },
      firstName: {
        type: "string",
        minLength: 1,
        maxLength: 50,
        description: "First name",
      },
      lastName: {
        type: "string",
        minLength: 1,
        maxLength: 50,
        description: "Last name",
      },
      avatar: { type: "string", description: "Avatar image file" },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      ...successResponse,
      description: "Profile updated successfully",
    },
    400: {
      ...errorResponse,
      description: "Invalid input data",
    },
    404: {
      ...errorResponse,
      description: "Profile not found",
    },
  },
};

export const updateProfileDBSchema: FastifySchema = {
  description: "Update user profile in database",
  tags: ["Profile Management"],
  summary: "Update Profile to Database",
  headers: {
    type: "object",
    properties: {
      "x-user-id": {
        type: "string",
        description: "User ID from authentication token",
      },
    },
    required: ["x-user-id"],
  },
  body: {
    type: "object",
    properties: {
      firstName: {
        type: "string",
        minLength: 1,
        maxLength: 50,
        description: "First name",
      },
      lastName: {
        type: "string",
        minLength: 1,
        maxLength: 50,
        description: "Last name",
      },
      username: {
        type: "string",
        minLength: 3,
        maxLength: 30,
        description: "Username",
      },
      bio: {
        type: "string",
        maxLength: 500,
        description: "User biography",
      },
      banner: {
        type: "string",
        description: "Banner image URL",
      },
      customStatus: {
        type: "string",
        enum: ["ONLINE", "IDLE", "DO_NOT_DISTURB"],
        description: "User status",
      },
      playerCharacters: {
        type: "string",
        enum: [
          "Tbib",
          "Med",
          "Ryu",
          "Hama9a",
          "Mnachit",
          "Mira",
          "Zero",
          "Zenitsu",
          "Xylar",
        ],
        description: "Player character to purchase/select",
      },
      playerSelectedCharacter: {
        type: "string",
        enum: [
          "Tbib",
          "Med",
          "Ryu",
          "Hama9a",
          "Mnachit",
          "Mira",
          "Zero",
          "Zenitsu",
          "Xylar",
        ],
        description: "Selected player character",
      },
      playerPaddles: {
        type: "string",
        enum: ["Boss", "Survivor", "Guard", "Army"],
        description: "Player paddle to purchase/select",
      },
      playerSelectedPaddle: {
        type: "string",
        enum: ["Boss", "Survivor", "Guard", "Army"],
        description: "Selected player paddle",
      },
      isVerified: {
        type: "boolean",
        description: "Verification status",
      },
      preferences: {
        type: "object",
        properties: {
          soundEnabled: {
            type: "boolean",
            description: "Sound enabled preference",
          },
          musicEnabled: {
            type: "boolean",
            description: "Music enabled preference",
          },
          twoFactorEnabled: {
            type: "boolean",
            description: "Two-factor authentication enabled",
          },
          notifications: {
            type: "object",
            properties: {
              friendRequests: {
                type: "boolean",
                description: "Friend requests notifications",
              },
              gameInvites: {
                type: "boolean",
                description: "Game invites notifications",
              },
              tournamentUpdates: {
                type: "boolean",
                description: "Tournament updates notifications",
              },
              chatMessages: {
                type: "boolean",
                description: "Chat messages notifications",
              },
            },
            additionalProperties: false,
          },
        },
        additionalProperties: false,
      },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      ...successResponse,
      description: "Profile updated successfully",
    },
    400: {
      ...errorResponse,
      description: "Invalid input data",
    },
    401: {
      ...errorResponse,
      description: "Unauthorized",
    },
    404: {
      ...errorResponse,
      description: "Profile not found",
    },
  },
};

export const getCurrentUserSchema: FastifySchema = {
  description: "Get current user profile",
  tags: ["Profile Management"],
  summary: "Get Current User Profile",
  headers: {
    type: "object",
    properties: {
      "x-user-id": {
        type: "string",
        description: "User ID from authentication token",
      },
    },
    required: ["x-user-id"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {},
      },
      description: "Profile retrieved successfully",
    },
    404: {
      ...errorResponse,
      description: "Profile not found",
    },
  },
};

export const getUserByIdSchema: FastifySchema = {
  description: "Get user profile by ID",
  tags: ["Profile Management"],
  summary: "Get User by ID",
  params: {
    type: "object",
    properties: {
      id: {
        type: "string",
        pattern: "^[0-9]+$",
        description: "User ID (digits only)",
      },
    },
    required: ["id"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {},
      },
      description: "Profile retrieved successfully",
    },
    404: {
      ...errorResponse,
      description: "Profile not found",
    },
  },
};

export const getUserByUserNameSchema: FastifySchema = {
  description: "Get user profile by ID",
  tags: ["Profile Management"],
  summary: "Get User by ID",
  params: {
    type: "object",
    properties: {
      username: {
        type: "string",
        description: "User ID (digits only)",
      },
    },
    required: ["username"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {},
      },
      description: "Profile retrieved successfully",
    },
    404: {
      ...errorResponse,
      description: "Profile not found",
    },
  },
};

export const getAllUsersSchema: FastifySchema = {
  description: "Get all users with online/offline status",
  tags: ["Profile Management"],
  summary: "Get All Users",
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {},
      },
      description: "Users retrieved successfully",
    },
    500: {
      ...errorResponse,
      description: "Internal server error",
    },
  },
};

export const searchUsersSchema: FastifySchema = {
  description: "Search users by username or first name",
  tags: ["Profile Management"],
  summary: "Search Users",
  querystring: {
    type: "object",
    properties: {
      query: {
        type: "string",
        minLength: 1,
        description: "Search query for username or first name",
      },
    },
    required: ["query"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {},
      },
      description: "Search results retrieved successfully",
    },
    400: {
      ...errorResponse,
      description: "Query parameter is required",
    },
  },
};

export const deleteProfileSchema: FastifySchema = {
  description: "Delete user profile (internal service call)",
  tags: ["Profile Management"],
  summary: "Delete Profile",
  headers: {
    type: "object",
    properties: {
      "x-user-id": {
        type: "string",
        description: "User ID from authentication token",
      },
    },
    required: ["x-user-id"],
  },
  response: {
    200: {
      ...successResponse,
      description: "Profile deleted successfully",
    },
    404: {
      ...errorResponse,
      description: "Profile not found",
    },
  },
};

// PURCHASE SCHEMAS
// =============================================

export const updateAvatarSchema: FastifySchema = {
  description: "Upload user avatar image",
  tags: ["Profile Management"],
  summary: "Upload Avatar",
  headers: {
    type: "object",
    properties: {
      "x-user-id": {
        type: "string",
        description: "User ID from authentication token",
      },
    },
    required: ["x-user-id"],
  },
  consumes: ["multipart/form-data"],
  body: {
    type: "object",
    properties: {
      avatar: {
        description: 'Avatar image file (max 5MB). Field name must be "avatar"',
        type: "object",
        properties: {
          type: { type: "string", enum: ["file"] },
          filename: { type: "string" },
          encoding: { type: "string" },
          mimetype: { type: "string", pattern: "^image/" },
        },
      },
    },
    required: ["avatar"],
  },
  response: {
    200: {
      ...successResponse,
      description:
        "Avatar uploaded successfully. The avatar URL is updated in the database.",
    },
    400: {
      ...errorResponse,
      description: "Invalid file format or missing avatar field",
    },
    401: {
      ...errorResponse,
      description: "Unauthorized - invalid or missing user ID",
    },
    413: {
      ...errorResponse,
      description: "File too large - maximum size is 5MB",
    },
  },
};
