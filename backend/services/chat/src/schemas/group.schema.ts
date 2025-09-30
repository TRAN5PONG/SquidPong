import { FastifySchema } from "fastify";

// =============== GROUP MANAGEMENT SCHEMAS ===============

export const createGroupSchema: FastifySchema = {
  tags: ['Chat - Group Management'],
  summary: 'Create a new group',
  description: 'Create a new chat group with specified settings',
  headers: {
    type: "object",
    properties: {
      'x-user-id': { type: "string", description: "Current user ID" }
    },
    required: ["x-user-id"]
  },
  body: {
    type: "object",
    properties: {
      name: { type: "string", minLength: 1, maxLength: 100, description: "Group name" },
      description: { type: "string", maxLength: 500, description: "Group description" },
      type: { 
        type: "string", 
        enum: ["public", "private"], 
        default: "public",
        description: "Group type" 
      },
      avatar: { type: "string", format: "uri", description: "Group avatar URL" },
      maxMembers: { 
        type: "number", 
        minimum: 2, 
        maximum: 1000, 
        default: 100,
        description: "Maximum number of members" 
      }
    },
    required: ["name"],
    additionalProperties: false
  },
  response: {
    201: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {
          type: "object",
          properties: {
            groupId: { type: "number" },
            name: { type: "string" },
            type: { type: "string" },
            createdBy: { type: "string" }
          }
        }
      }
    },
    400: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    }
  }
};

export const updateGroupInfoSchema: FastifySchema = {
  tags: ['Chat - Group Management'],
  summary: 'Update group information',
  description: 'Update group name, description, avatar, or settings',
  headers: {
    type: "object",
    properties: {
      'x-user-id': { type: "string", description: "Current user ID" }
    },
    required: ["x-user-id"]
  },
  params: {
    type: "object",
    properties: {
      groupId: { type: "string", pattern: "^[0-9]+$", description: "Group ID" }
    },
    required: ["groupId"]
  },
  body: {
    type: "object",
    properties: {
      name: { type: "string", minLength: 1, maxLength: 100 },
      description: { type: "string", maxLength: 500 },
      avatar: { type: "string", format: "uri" },
      type: { type: "string", enum: ["public", "private"] },
      maxMembers: { type: "number", minimum: 2, maximum: 1000 }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" }
      }
    },
    400: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    },
    403: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    },
    404: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    }
  }
};

export const removeGroupSchema: FastifySchema = {
  tags: ['Chat - Group Management'],
  summary: 'Delete a group',
  description: 'Delete a group (only group creator can delete)',
  headers: {
    type: "object",
    properties: {
      'x-user-id': { type: "string", description: "Current user ID" }
    },
    required: ["x-user-id"]
  },
  params: {
    type: "object",
    properties: {
      groupId: { type: "string", pattern: "^[0-9]+$", description: "Group ID" }
    },
    required: ["groupId"]
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" }
      }
    },
    403: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    },
    404: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    }
  }
};

export const getGroupByIdSchema: FastifySchema = {
  tags: ['Chat - Group Management'],
  summary: 'Get group details',
  description: 'Get detailed information about a specific group',
  headers: {
    type: "object",
    properties: {
      'x-user-id': { type: "string", description: "Current user ID" }
    },
    required: ["x-user-id"]
  },
  params: {
    type: "object",
    properties: {
      groupId: { type: "string", pattern: "^[0-9]+$", description: "Group ID" }
    },
    required: ["groupId"]
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {
          type: "object",
          properties: {
            id: { type: "number" },
            name: { type: "string" },
            description: { type: "string" },
            type: { type: "string" },
            avatar: { type: "string" },
            maxMembers: { type: "number" },
            memberCount: { type: "number" },
            createdBy: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            members: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  userId: { type: "string" },
                  role: { type: "string" },
                  joinedAt: { type: "string", format: "date-time" }
                }
              }
            }
          }
        }
      }
    },
    403: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    },
    404: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    }
  }
};

export const getGroupsSchema: FastifySchema = {
  tags: ['Chat - Group Management'],
  summary: 'List/search groups',
  description: 'Get list of groups with optional search and filtering',
  headers: {
    type: "object",
    properties: {
      'x-user-id': { type: "string", description: "Current user ID" }
    },
    required: ["x-user-id"]
  },
  querystring: {
    type: "object",
    properties: {
      search: { type: "string", maxLength: 100, description: "Search term for group name" },
      type: { type: "string", enum: ["public", "private"], description: "Filter by group type" },
      page: { type: "string", pattern: "^[0-9]+$", default: "1", description: "Page number" },
      limit: { type: "string", pattern: "^[0-9]+$", default: "20", description: "Items per page" },
      myGroups: { type: "string", enum: ["true", "false"], description: "Show only user's groups" }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {
          type: "object",
          properties: {
            groups: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "number" },
                  name: { type: "string" },
                  description: { type: "string" },
                  type: { type: "string" },
                  avatar: { type: "string" },
                  memberCount: { type: "number" },
                  maxMembers: { type: "number" },
                  createdAt: { type: "string", format: "date-time" }
                }
              }
            },
            pagination: {
              type: "object",
              properties: {
                page: { type: "number" },
                limit: { type: "number" },
                total: { type: "number" },
                totalPages: { type: "number" }
              }
            }
          }
        }
      }
    },
    400: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    }
  }
};

// =============== GROUP MEMBER MANAGEMENT SCHEMAS ===============

export const updateMemberSchema: FastifySchema = {
  tags: ['Chat - Group Members'],
  summary: 'Update member role or status',
  description: 'Update a group member role (admin, member) or status',
  headers: {
    type: "object",
    properties: {
      'x-user-id': { type: "string", description: "Current user ID" }
    },
    required: ["x-user-id"]
  },
  params: {
    type: "object",
    properties: {
      groupId: { type: "string", pattern: "^[0-9]+$", description: "Group ID" }
    },
    required: ["groupId"]
  },
  body: {
    type: "object",
    properties: {
      memberId: { type: "string", description: "Member user ID to update" },
      role: { type: "string", enum: ["admin", "member"], description: "New role for member" },
      status: { type: "string", enum: ["active", "muted", "banned"], description: "New status for member" }
    },
    required: ["memberId"],
    additionalProperties: false
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" }
      }
    },
    400: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    },
    403: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    },
    404: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    }
  }
};

export const removeGroupMemberSchema: FastifySchema = {
  tags: ['Chat - Group Members'],
  summary: 'Remove member from group',
  description: 'Remove a member from the group (admin only)',
  headers: {
    type: "object",
    properties: {
      'x-user-id': { type: "string", description: "Current user ID" }
    },
    required: ["x-user-id"]
  },
  params: {
    type: "object",
    properties: {
      groupId: { type: "string", pattern: "^[0-9]+$", description: "Group ID" }
    },
    required: ["groupId"]
  },
  body: {
    type: "object",
    properties: {
      memberId: { type: "string", description: "Member user ID to remove" }
    },
    required: ["memberId"],
    additionalProperties: false
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" }
      }
    },
    400: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    },
    403: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    },
    404: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    }
  }
};

export const leaveGroupSchema: FastifySchema = {
  tags: ['Chat - Group Members'],
  summary: 'Leave group',
  description: 'Leave a group voluntarily',
  headers: {
    type: "object",
    properties: {
      'x-user-id': { type: "string", description: "Current user ID" }
    },
    required: ["x-user-id"]
  },
  params: {
    type: "object",
    properties: {
      groupId: { type: "string", pattern: "^[0-9]+$", description: "Group ID" }
    },
    required: ["groupId"]
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" }
      }
    },
    400: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    },
    404: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    }
  }
};

export const listGroupMembersSchema: FastifySchema = {
  tags: ['Chat - Group Members'],
  summary: 'List group members',
  description: 'Get list of all members in a group',
  headers: {
    type: "object",
    properties: {
      'x-user-id': { type: "string", description: "Current user ID" }
    },
    required: ["x-user-id"]
  },
  params: {
    type: "object",
    properties: {
      groupId: { type: "string", pattern: "^[0-9]+$", description: "Group ID" }
    },
    required: ["groupId"]
  },
  querystring: {
    type: "object",
    properties: {
      role: { type: "string", enum: ["admin", "member"], description: "Filter by role" },
      status: { type: "string", enum: ["active", "muted", "banned"], description: "Filter by status" },
      page: { type: "string", pattern: "^[0-9]+$", default: "1" },
      limit: { type: "string", pattern: "^[0-9]+$", default: "50" }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {
          type: "object",
          properties: {
            members: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  userId: { type: "string" },
                  username: { type: "string" },
                  firstName: { type: "string" },
                  lastName: { type: "string" },
                  avatar: { type: "string" },
                  role: { type: "string" },
                  status: { type: "string" },
                  joinedAt: { type: "string", format: "date-time" }
                }
              }
            },
            pagination: {
              type: "object",
              properties: {
                page: { type: "number" },
                limit: { type: "number" },
                total: { type: "number" },
                totalPages: { type: "number" }
              }
            }
          }
        }
      }
    },
    403: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    },
    404: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    }
  }
};

// =============== JOIN REQUEST SCHEMAS ===============

export const requestJoinGroupSchema: FastifySchema = {
  tags: ['Chat - Join Requests'],
  summary: 'Request to join private group',
  description: 'Send a request to join a private group',
  headers: {
    type: "object",
    properties: {
      'x-user-id': { type: "string", description: "Current user ID" }
    },
    required: ["x-user-id"]
  },
  params: {
    type: "object",
    properties: {
      groupId: { type: "string", pattern: "^[0-9]+$", description: "Group ID" }
    },
    required: ["groupId"]
  },
  body: {
    type: "object",
    properties: {
      message: { type: "string", maxLength: 500, description: "Optional message with join request" }
    },
    additionalProperties: false
  },
  response: {
    201: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" }
      }
    },
    400: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    },
    404: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    },
    409: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    }
  }
};

export const getJoinRequestsSchema: FastifySchema = {
  tags: ['Chat - Join Requests'],
  summary: 'Get pending join requests',
  description: 'Get all pending join requests for a group (admin only)',
  headers: {
    type: "object",
    properties: {
      'x-user-id': { type: "string", description: "Current user ID" }
    },
    required: ["x-user-id"]
  },
  params: {
    type: "object",
    properties: {
      groupId: { type: "string", pattern: "^[0-9]+$", description: "Group ID" }
    },
    required: ["groupId"]
  },
  querystring: {
    type: "object",
    properties: {
      status: { type: "string", enum: ["pending", "approved", "rejected"], default: "pending" },
      page: { type: "string", pattern: "^[0-9]+$", default: "1" },
      limit: { type: "string", pattern: "^[0-9]+$", default: "20" }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {
          type: "object",
          properties: {
            requests: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "number" },
                  userId: { type: "string" },
                  username: { type: "string" },
                  firstName: { type: "string" },
                  lastName: { type: "string" },
                  avatar: { type: "string" },
                  message: { type: "string" },
                  status: { type: "string" },
                  requestedAt: { type: "string", format: "date-time" }
                }
              }
            },
            pagination: {
              type: "object",
              properties: {
                page: { type: "number" },
                limit: { type: "number" },
                total: { type: "number" },
                totalPages: { type: "number" }
              }
            }
          }
        }
      }
    },
    403: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    },
    404: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    }
  }
};

export const approveJoinRequestSchema: FastifySchema = {
  tags: ['Chat - Join Requests'],
  summary: 'Approve join request',
  description: 'Approve a pending join request (admin only)',
  headers: {
    type: "object",
    properties: {
      'x-user-id': { type: "string", description: "Current user ID" }
    },
    required: ["x-user-id"]
  },
  params: {
    type: "object",
    properties: {
      groupId: { type: "string", pattern: "^[0-9]+$", description: "Group ID" }
    },
    required: ["groupId"]
  },
  body: {
    type: "object",
    properties: {
      requestId: { type: "number", description: "Join request ID to approve" }
    },
    required: ["requestId"],
    additionalProperties: false
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" }
      }
    },
    400: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    },
    403: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    },
    404: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    }
  }
};

export const rejectJoinRequestSchema: FastifySchema = {
  tags: ['Chat - Join Requests'],
  summary: 'Reject join request',
  description: 'Reject a pending join request (admin only)',
  headers: {
    type: "object",
    properties: {
      'x-user-id': { type: "string", description: "Current user ID" }
    },
    required: ["x-user-id"]
  },
  params: {
    type: "object",
    properties: {
      groupId: { type: "string", pattern: "^[0-9]+$", description: "Group ID" }
    },
    required: ["groupId"]
  },
  body: {
    type: "object",
    properties: {
      requestId: { type: "number", description: "Join request ID to reject" },
      reason: { type: "string", maxLength: 500, description: "Optional reason for rejection" }
    },
    required: ["requestId"],
    additionalProperties: false
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" }
      }
    },
    400: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    },
    403: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    },
    404: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    }
  }
};

// =============== GROUP MESSAGES SCHEMA ===============

export const getGroupMessagesSchema: FastifySchema = {
  tags: ['Chat - Group Messages'],
  summary: 'Get group messages',
  description: 'Retrieve paginated messages from a group chat',
  headers: {
    type: "object",
    properties: {
      'x-user-id': { type: "string", description: "Current user ID" }
    },
    required: ["x-user-id"]
  },
  params: {
    type: "object",
    properties: {
      groupId: { type: "string", pattern: "^[0-9]+$", description: "Group ID" }
    },
    required: ["groupId"]
  },
  querystring: {
    type: "object",
    properties: {
      page: { type: "string", pattern: "^[0-9]+$", default: "1" },
      limit: { type: "string", pattern: "^[0-9]+$", default: "50" },
      before: { type: "string", format: "date-time", description: "Get messages before this timestamp" },
      after: { type: "string", format: "date-time", description: "Get messages after this timestamp" },
      search: { type: "string", maxLength: 100, description: "Search in message content" }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {
          type: "object",
          properties: {
            messages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "number" },
                  content: { type: "string" },
                  senderId: { type: "string" },
                  senderUsername: { type: "string" },
                  senderAvatar: { type: "string" },
                  type: { type: "string", enum: ["text", "image", "file", "system"] },
                  attachments: { type: "array", items: { type: "string" } },
                  replyTo: { type: "number" },
                  editedAt: { type: "string", format: "date-time" },
                  createdAt: { type: "string", format: "date-time" },
                  reactions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        emoji: { type: "string" },
                        count: { type: "number" },
                        users: { type: "array", items: { type: "string" } }
                      }
                    }
                  }
                }
              }
            },
            pagination: {
              type: "object",
              properties: {
                page: { type: "number" },
                limit: { type: "number" },
                total: { type: "number" },
                totalPages: { type: "number" },
                hasMore: { type: "boolean" }
              }
            }
          }
        }
      }
    },
    403: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    },
    404: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        error: { type: "string" },
        message: { type: "string" }
      }
    }
  }
};
