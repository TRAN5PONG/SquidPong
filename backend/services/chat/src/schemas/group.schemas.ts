import { FastifySchema } from 'fastify';

// =============================================
// GROUP CHAT SCHEMAS - Complete API Documentation
// =============================================

// Common response schemas
const successResponse = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    message: { type: 'string' },
    data: { type: 'object', nullable: true }
  },
  required: ['success', 'message']
};

const errorResponse = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    message: { type: 'string' },
    error: { type: 'string', nullable: true }
  },
  required: ['success', 'message']
};

// Group member schema
const groupMemberSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    userId: { type: 'string' },
    groupId: { type: 'number' },
    role: {
      type: 'string',
      enum: ['OWNER', 'ADMIN', 'MEMBER']
    },
    status: {
      type: 'string',
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'BANNED']
    },
    joinedAt: { type: 'string', format: 'date-time' },
    user: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        userId: { type: 'string' },
        username: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        avatar: { type: 'string' },
        isVerified: { type: 'boolean' }
      }
    }
  }
};

// Group schema
const groupSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    name: { type: 'string' },
    desc: { type: 'string' },
    imageUrl: { type: 'string', nullable: true },
    type: {
      type: 'string',
      enum: ['PUBLIC', 'PRIVATE']
    },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    chat: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        type: { type: 'string', enum: ['GROUP'] },
        createdAt: { type: 'string', format: 'date-time' }
      }
    },
    members: {
      type: 'array',
      items: groupMemberSchema
    }
  }
};

// Message schema for groups
const groupMessageSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    content: { type: 'string' },
    type: { 
      type: 'string',
      enum: ['TEXT', 'IMAGE', 'FILE', 'VOICE', 'VIDEO']
    },
    senderId: { type: 'string' },
    chatId: { type: 'number' },
    timestamp: { type: 'string', format: 'date-time' },
    isEdited: { type: 'boolean' },
    replyToId: { type: 'number', nullable: true },
    sender: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        username: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        avatar: { type: 'string' }
      }
    }
  }
};

// =============================================
// GROUP MANAGEMENT SCHEMAS
// =============================================

export const createGroupSchema: FastifySchema = {
  description: 'Create a new group chat',
  tags: ['Group Management'],
  summary: 'Create Group',
  headers: {
    type: 'object',
    properties: {
      'x-user-id': {
        type: 'string',
        description: 'User ID from authentication token'
      }
    },
    required: ['x-user-id']
  },
  body: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        description: 'Group name'
      },
      desc: {
        type: 'string',
        maxLength: 500,
        description: 'Group description'
      },
      type: {
        type: 'string',
        enum: ['PUBLIC', 'PRIVATE'],
        description: 'Group type (default: PUBLIC)'
      }
    },
    required: ['name', 'desc'],
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: groupSchema
      },
      description: 'Group created successfully'
    },
    400: {
      ...errorResponse,
      description: 'Invalid input data'
    },
    500: {
      ...errorResponse,
      description: 'Internal server error'
    }
  }
};

export const updateGroupInfoSchema: FastifySchema = {
  description: 'Update group information (admin/owner only)',
  tags: ['Group Management'],
  summary: 'Update Group Info',
  headers: {
    type: 'object',
    properties: {
      'x-user-id': {
        type: 'string',
        description: 'User ID from authentication token'
      }
    },
    required: ['x-user-id']
  },
  params: {
    type: 'object',
    properties: {
      groupId: {
        type: 'string',
        description: 'Group ID to update'
      }
    },
    required: ['groupId']
  },
  body: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        description: 'New group name'
      },
      desc: {
        type: 'string',
        maxLength: 500,
        description: 'New group description'
      },
      type: {
        type: 'string',
        enum: ['PUBLIC', 'PRIVATE'],
        description: 'New group type'
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      ...successResponse,
      description: 'Group information updated successfully'
    },
    400: {
      ...errorResponse,
      description: 'Invalid input data'
    },
    403: {
      ...errorResponse,
      description: 'Insufficient permissions (admin/owner required)'
    },
    404: {
      ...errorResponse,
      description: 'Group not found'
    }
  }
};

export const updateGroupImageSchema: FastifySchema = {
  description: 'Update group image (admin/owner only)',
  tags: ['Group Management'],
  summary: 'Update Group Image',
  headers: {
    type: 'object',
    properties: {
      'x-user-id': {
        type: 'string',
        description: 'User ID from authentication token'
      }
    },
    required: ['x-user-id']
  },
  params: {
    type: 'object',
    properties: {
      groupId: {
        type: 'string',
        description: 'Group ID to update'
      }
    },
    required: ['groupId']
  },
  consumes: ['multipart/form-data'],
  body: {
    type: 'object',
    properties: {
      image: {
        description: 'Group image file (max 5MB). Field name must be "image"',
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['file'] },
          filename: { type: 'string' },
          encoding: { type: 'string' },
          mimetype: { type: 'string', pattern: '^image/' }
        }
      }
    },
    required: ['image']
  },
  response: {
    200: {
      ...successResponse,
      description: 'Group image updated successfully'
    },
    400: {
      ...errorResponse,
      description: 'Invalid file format or missing image field'
    },
    403: {
      ...errorResponse,
      description: 'Insufficient permissions (admin/owner required)'
    },
    404: {
      ...errorResponse,
      description: 'Group not found'
    },
    413: {
      ...errorResponse,
      description: 'File too large - maximum size is 5MB'
    }
  }
};

export const removeGroupSchema: FastifySchema = {
  description: 'Delete group (owner only)',
  tags: ['Group Management'],
  summary: 'Delete Group',
  headers: {
    type: 'object',
    properties: {
      'x-user-id': {
        type: 'string',
        description: 'User ID from authentication token'
      }
    },
    required: ['x-user-id']
  },
  params: {
    type: 'object',
    properties: {
      groupId: {
        type: 'string',
        description: 'Group ID to delete'
      }
    },
    required: ['groupId']
  },
  response: {
    200: {
      ...successResponse,
      description: 'Group deleted successfully'
    },
    403: {
      ...errorResponse,
      description: 'Insufficient permissions (owner required)'
    },
    404: {
      ...errorResponse,
      description: 'Group not found'
    }
  }
};

export const getGroupByIdSchema: FastifySchema = {
  description: 'Get group information by ID',
  tags: ['Group Management'],
  summary: 'Get Group by ID',
  params: {
    type: 'object',
    properties: {
      groupId: {
        type: 'string',
        description: 'Group ID to retrieve'
      }
    },
    required: ['groupId']
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: groupSchema
      },
      description: 'Group retrieved successfully'
    },
    404: {
      ...errorResponse,
      description: 'Group not found'
    }
  }
};

export const getGroupsSchema: FastifySchema = {
  description: 'Search and list groups with pagination',
  tags: ['Group Management'],
  summary: 'Search Groups',
  querystring: {
    type: 'object',
    properties: {
      search: {
        type: 'string',
        description: 'Search term for group name'
      },
      type: {
        type: 'string',
        enum: ['PUBLIC', 'PRIVATE'],
        description: 'Filter by group type'
      },
      page: {
        type: 'string',
        description: 'Page number (default: 1)'
      },
      limit: {
        type: 'string',
        description: 'Results per page (default: 10)'
      }
    }
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
            groups: {
              type: 'array',
              items: groupSchema
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                totalPages: { type: 'number' }
              }
            }
          }
        }
      },
      description: 'Groups retrieved successfully'
    },
    500: {
      ...errorResponse,
      description: 'Internal server error'
    }
  }
};

// =============================================
// GROUP MEMBERSHIP SCHEMAS
// =============================================

export const updateMemberSchema: FastifySchema = {
  description: 'Update member role or status (admin/owner only)',
  tags: ['Group Membership'],
  summary: 'Update Member',
  headers: {
    type: 'object',
    properties: {
      'x-user-id': {
        type: 'string',
        description: 'User ID from authentication token'
      }
    },
    required: ['x-user-id']
  },
  params: {
    type: 'object',
    properties: {
      groupId: {
        type: 'string',
        description: 'Group ID'
      }
    },
    required: ['groupId']
  },
  body: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'ID of member to update'
      },
      role: {
        type: 'string',
        enum: ['ADMIN', 'MEMBER'],
        description: 'New role for member'
      },
      status: {
        type: 'string',
        enum: ['APPROVED', 'BANNED'],
        description: 'New status for member'
      }
    },
    required: ['userId'],
    additionalProperties: false
  },
  response: {
    200: {
      ...successResponse,
      description: 'Member updated successfully'
    },
    400: {
      ...errorResponse,
      description: 'Invalid input data'
    },
    403: {
      ...errorResponse,
      description: 'Insufficient permissions'
    },
    404: {
      ...errorResponse,
      description: 'Group or member not found'
    }
  }
};

export const removeGroupMemberSchema: FastifySchema = {
  description: 'Remove member from group (admin/owner only)',
  tags: ['Group Membership'],
  summary: 'Remove Member',
  headers: {
    type: 'object',
    properties: {
      'x-user-id': {
        type: 'string',
        description: 'User ID from authentication token'
      }
    },
    required: ['x-user-id']
  },
  params: {
    type: 'object',
    properties: {
      groupId: {
        type: 'string',
        description: 'Group ID'
      }
    },
    required: ['groupId']
  },
  body: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'ID of member to remove'
      }
    },
    required: ['userId'],
    additionalProperties: false
  },
  response: {
    200: {
      ...successResponse,
      description: 'Member removed successfully'
    },
    403: {
      ...errorResponse,
      description: 'Insufficient permissions'
    },
    404: {
      ...errorResponse,
      description: 'Group or member not found'
    }
  }
};

export const leaveGroupSchema: FastifySchema = {
  description: 'Leave group voluntarily',
  tags: ['Group Membership'],
  summary: 'Leave Group',
  headers: {
    type: 'object',
    properties: {
      'x-user-id': {
        type: 'string',
        description: 'User ID from authentication token'
      }
    },
    required: ['x-user-id']
  },
  params: {
    type: 'object',
    properties: {
      groupId: {
        type: 'string',
        description: 'Group ID to leave'
      }
    },
    required: ['groupId']
  },
  response: {
    200: {
      ...successResponse,
      description: 'Left group successfully'
    },
    400: {
      ...errorResponse,
      description: 'Cannot leave - you are the owner'
    },
    404: {
      ...errorResponse,
      description: 'Group not found or not a member'
    }
  }
};

export const listGroupMembersSchema: FastifySchema = {
  description: 'Get list of group members',
  tags: ['Group Membership'],
  summary: 'List Group Members',
  params: {
    type: 'object',
    properties: {
      groupId: {
        type: 'string',
        description: 'Group ID'
      }
    },
    required: ['groupId']
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'array',
          items: groupMemberSchema
        }
      },
      description: 'Group members retrieved successfully'
    },
    404: {
      ...errorResponse,
      description: 'Group not found'
    }
  }
};

// =============================================
// JOIN REQUEST SCHEMAS
// =============================================

export const requestJoinGroupSchema: FastifySchema = {
  description: 'Request to join a private group',
  tags: ['Join Requests'],
  summary: 'Request Join Group',
  headers: {
    type: 'object',
    properties: {
      'x-user-id': {
        type: 'string',
        description: 'User ID from authentication token'
      }
    },
    required: ['x-user-id']
  },
  params: {
    type: 'object',
    properties: {
      groupId: {
        type: 'string',
        description: 'Group ID to join'
      }
    },
    required: ['groupId']
  },
  body: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        maxLength: 200,
        description: 'Optional message to group admins'
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      ...successResponse,
      description: 'Join request sent successfully'
    },
    400: {
      ...errorResponse,
      description: 'Already a member or request pending'
    },
    404: {
      ...errorResponse,
      description: 'Group not found'
    }
  }
};

export const getJoinRequestsSchema: FastifySchema = {
  description: 'Get pending join requests (admin/owner only)',
  tags: ['Join Requests'],
  summary: 'Get Join Requests',
  headers: {
    type: 'object',
    properties: {
      'x-user-id': {
        type: 'string',
        description: 'User ID from authentication token'
      }
    },
    required: ['x-user-id']
  },
  params: {
    type: 'object',
    properties: {
      groupId: {
        type: 'string',
        description: 'Group ID'
      }
    },
    required: ['groupId']
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'array',
          items: groupMemberSchema
        }
      },
      description: 'Join requests retrieved successfully'
    },
    403: {
      ...errorResponse,
      description: 'Insufficient permissions'
    },
    404: {
      ...errorResponse,
      description: 'Group not found'
    }
  }
};

export const approveJoinRequestSchema: FastifySchema = {
  description: 'Approve join request (admin/owner only)',
  tags: ['Join Requests'],
  summary: 'Approve Join Request',
  headers: {
    type: 'object',
    properties: {
      'x-user-id': {
        type: 'string',
        description: 'User ID from authentication token'
      }
    },
    required: ['x-user-id']
  },
  params: {
    type: 'object',
    properties: {
      groupId: {
        type: 'string',
        description: 'Group ID'
      }
    },
    required: ['groupId']
  },
  body: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'ID of user to approve'
      }
    },
    required: ['userId'],
    additionalProperties: false
  },
  response: {
    200: {
      ...successResponse,
      description: 'Join request approved successfully'
    },
    403: {
      ...errorResponse,
      description: 'Insufficient permissions'
    },
    404: {
      ...errorResponse,
      description: 'Group or join request not found'
    }
  }
};

export const rejectJoinRequestSchema: FastifySchema = {
  description: 'Reject join request (admin/owner only)',
  tags: ['Join Requests'],
  summary: 'Reject Join Request',
  headers: {
    type: 'object',
    properties: {
      'x-user-id': {
        type: 'string',
        description: 'User ID from authentication token'
      }
    },
    required: ['x-user-id']
  },
  params: {
    type: 'object',
    properties: {
      groupId: {
        type: 'string',
        description: 'Group ID'
      }
    },
    required: ['groupId']
  },
  body: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        description: 'ID of user to reject'
      }
    },
    required: ['userId'],
    additionalProperties: false
  },
  response: {
    200: {
      ...successResponse,
      description: 'Join request rejected successfully'
    },
    403: {
      ...errorResponse,
      description: 'Insufficient permissions'
    },
    404: {
      ...errorResponse,
      description: 'Group or join request not found'
    }
  }
};

// =============================================
// GROUP MESSAGES SCHEMAS
// =============================================

export const getGroupMessagesSchema: FastifySchema = {
  description: 'Get group messages with pagination',
  tags: ['Group Messages'],
  summary: 'Get Group Messages',
  headers: {
    type: 'object',
    properties: {
      'x-user-id': {
        type: 'string',
        description: 'User ID from authentication token'
      }
    },
    required: ['x-user-id']
  },
  params: {
    type: 'object',
    properties: {
      groupId: {
        type: 'string',
        description: 'Group ID'
      }
    },
    required: ['groupId']
  },
  querystring: {
    type: 'object',
    properties: {
      page: {
        type: 'string',
        description: 'Page number (default: 1)'
      },
      limit: {
        type: 'string',
        description: 'Messages per page (default: 50)'
      },
      before: {
        type: 'string',
        description: 'Get messages before this timestamp'
      }
    }
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
            messages: {
              type: 'array',
              items: groupMessageSchema
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                hasMore: { type: 'boolean' }
              }
            }
          }
        }
      },
      description: 'Group messages retrieved successfully'
    },
    403: {
      ...errorResponse,
      description: 'Not a member of this group'
    },
    404: {
      ...errorResponse,
      description: 'Group not found'
    }
  }
};


// =============================================
// INVITE USER TO GROUP SCHEMA
// =============================================
export const inviteUserToGroupSchema: FastifySchema = {
  description: 'Invite a user to join group (Admin/Owner only)',
  tags: ['Group Management'],
  params: {
    type: 'object',
    properties: {
      groupId: { type: 'string', description: 'Group ID' }
    },
    required: ['groupId']
  },
  body: {
    type: 'object',
    properties: {
      targetUserId: { type: 'string', description: 'User ID to invite' }
    },
    required: ['targetUserId']
  },
  headers: {
    type: 'object',
    properties: {
      'x-user-id': { type: 'string', description: 'Current user ID' }
    },
    required: ['x-user-id']
  },
  response: {
    200: {
      ...successResponse,
      properties: {
        ...successResponse.properties,
        data: {
          type: 'object',
          properties: {
            invitedUser: { type: 'string' },
            groupName: { type: 'string' }
          }
        }
      },
      description: 'User invited successfully'
    },
    403: {
      ...errorResponse,
      description: 'Not authorized to invite users'
    },
    404: {
      ...errorResponse,
      description: 'Group or user not found'
    }
  }
};

