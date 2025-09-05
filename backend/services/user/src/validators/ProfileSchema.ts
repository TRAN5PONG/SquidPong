// Swagger Schemas for User Profile Routes

export const createProfileSchema = {
  tags: ['User Profile'],
  summary: 'Create user profile',
  description: 'Creates a new user profile',
  body: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        description: 'User ID'
      },
      fname: {
        type: 'string',
        description: 'First name'
      },
      lname: {
        type: 'string',
        description: 'Last name'
      },
      username: {
        type: 'string',
        description: 'Username'
      },
      bio: {
        type: 'string',
        description: 'User biography (optional)'
      },
      avatar: {
        type: 'string',
        description: 'Avatar image URL'
      }
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    },
    400: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  }
};

export const updateProfileSchema = {
  tags: ['User Profile'],
  summary: 'Update user profile',
  description: 'Updates the current user profile',
  body: {
    type: 'object',
    properties: {
      fname: {
        type: 'string',
        description: 'First name'
      },
      lname: {
        type: 'string',
        description: 'Last name'
      },
      username: {
        type: 'string',
        description: 'Username'
      },
      bio: {
        type: 'string',
        description: 'User biography'
      },
      avatar: {
        type: 'string',
        description: 'Avatar image URL'
      },
      banner: {
        type: 'string',
        description: 'Banner image URL'
      }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    },
    400: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  }
};

export const deleteProfileSchema = {
  tags: ['User Profile'],
  summary: 'Delete user profile',
  description: 'Deletes the current user profile',
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    },
    400: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  }
};

export const getCurrentUserSchema = {
  tags: ['User Profile'],
  summary: 'Get current user profile',
  description: 'Retrieves the current user profile information',
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            userId: { type: 'integer' },
            username: { type: 'string' },
            fname: { type: 'string' },
            lname: { type: 'string' },
            bio: { type: 'string', nullable: true },
            banner: { type: 'string', nullable: true },
            avatar: { type: 'string' },
            status: { type: 'string' },
            walletBalance: { type: 'number' },
            playerStats: { type: 'object' },
            playerCharacters: { type: 'object' },
            playerSelectedCharacter: { type: 'string', nullable: true },
            preferences: { type: 'object' },
            matchHistory: { type: 'object' },
            isVerified: { type: 'boolean' },
            rankDivision: { type: 'string' },
            rankTier: { type: 'string' },
            totalGames: { type: 'integer' },
            wins: { type: 'integer' },
            losses: { type: 'integer' },
            rank: { type: 'integer' },
            level: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          },
          nullable: true
        }
      }
    },
    400: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  }
};

export const getUserByIdSchema = {
  tags: ['User Profile'],
  summary: 'Get user profile by ID',
  description: 'Retrieves a specific user profile by their ID',
  params: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'User ID'
      }
    },
    required: ['id']
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            userId: { type: 'integer' },
            username: { type: 'string' },
            fname: { type: 'string' },
            lname: { type: 'string' },
            bio: { type: 'string', nullable: true },
            banner: { type: 'string', nullable: true },
            avatar: { type: 'string' },
            status: { type: 'string' },
            walletBalance: { type: 'number' },
            playerStats: { type: 'object' },
            playerCharacters: { type: 'object' },
            playerSelectedCharacter: { type: 'string', nullable: true },
            preferences: { type: 'object' },
            matchHistory: { type: 'object' },
            isVerified: { type: 'boolean' },
            rankDivision: { type: 'string' },
            rankTier: { type: 'string' },
            totalGames: { type: 'integer' },
            wins: { type: 'integer' },
            losses: { type: 'integer' },
            rank: { type: 'integer' },
            level: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          },
          nullable: true
        }
      }
    },
    400: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  }
};

export const getAllUserSchema = {
  tags: ['User Profile'],
  summary: 'Get all available users',
  description: 'Retrieves all users that are not friends with the current user',
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              userId: { type: 'integer' },
              username: { type: 'string' },
              fname: { type: 'string' },
              lname: { type: 'string' },
              bio: { type: 'string', nullable: true },
              banner: { type: 'string', nullable: true },
              avatar: { type: 'string' },
              status: { type: 'string' },
              walletBalance: { type: 'number' },
              playerStats: { type: 'object' },
              playerCharacters: { type: 'object' },
              playerSelectedCharacter: { type: 'string', nullable: true },
              preferences: { type: 'object' },
              matchHistory: { type: 'object' },
              isVerified: { type: 'boolean' },
              rankDivision: { type: 'string' },
              rankTier: { type: 'string' },
              totalGames: { type: 'integer' },
              wins: { type: 'integer' },
              losses: { type: 'integer' },
              rank: { type: 'integer' },
              level: { type: 'integer' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    },
    400: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  }
};