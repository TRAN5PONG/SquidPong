// Swagger Schemas for Friend Management Routes

export const sendFriendRequestSchema = {
  tags: ['Friends'],
  summary: 'Send friend request',
  description: 'Sends a friend request to another user',
  body: {
    type: 'object',
    properties: {
      friendId: {
        type: 'integer',
        description: 'ID of the user to send friend request to'
      }
    },
    required: ['friendId']
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

export const acceptFriendRequestSchema = {
  tags: ['Friends'],
  summary: 'Accept friend request',
  description: 'Accepts a pending friend request',
  body: {
    type: 'object',
    properties: {
      friendId: {
        type: 'integer',
        description: 'ID of the user whose friend request to accept'
      }
    },
    required: ['friendId']
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

export const rejectFriendRequestSchema = {
  tags: ['Friends'],
  summary: 'Reject friend request',
  description: 'Rejects a pending friend request',
  body: {
    type: 'object',
    properties: {
      friendId: {
        type: 'integer',
        description: 'ID of the user whose friend request to reject'
      }
    },
    required: ['friendId']
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

export const getFriendsListSchema = {
  tags: ['Friends'],
  summary: 'Get friends list',
  description: 'Retrieves the current user\'s friends list',
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

export const removeFriendSchema = {
  tags: ['Friends'],
  summary: 'Remove friend',
  description: 'Removes a user from friends list',
  params: {
    type: 'object',
    properties: {
      friendId: {
        type: 'string',
        description: 'ID of the friend to remove'
      }
    },
    required: ['friendId']
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

export const getPendingRequestsSchema = {
  tags: ['Friends'],
  summary: 'Get pending friend requests',
  description: 'Retrieves pending friend requests received by the current user',
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

export const blockUserSchema = {
  tags: ['Block Management'],
  summary: 'Block user',
  description: 'Blocks a user',
  params: {
    type: 'object',
    properties: {
      blockId: {
        type: 'string',
        description: 'ID of the user to block'
      }
    },
    required: ['blockId']
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

export const unblockUserSchema = {
  tags: ['Block Management'],
  summary: 'Unblock user',
  description: 'Unblocks a previously blocked user',
  params: {
    type: 'object',
    properties: {
      blockId: {
        type: 'string',
        description: 'ID of the user to unblock'
      }
    },
    required: ['blockId']
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

export const getBlockedUsersSchema = {
  tags: ['Block Management'],
  summary: 'Get blocked users',
  description: 'Retrieves list of blocked users',
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