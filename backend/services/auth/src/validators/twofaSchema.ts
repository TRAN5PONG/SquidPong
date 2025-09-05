export const twofaSetupSchema = {
  tags: ['Two-Factor Authentication'],
  summary: 'Setup 2FA authenticator',
  description: 'Generate QR code and secret key for 2FA setup',
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            QRCode: {
              type: 'string',
              description: 'Base64 encoded QR code image'
            },
            key: {
              type: 'string',
              description: 'Secret key for manual entry'
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

export const twofaStatusSchema = {
  tags: ['Two-Factor Authentication'],
  summary: 'Get 2FA status',
  description: 'Check if 2FA is enabled for the current user',
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

export const twofaVerifySchema = {
  tags: ['Two-Factor Authentication'],
  summary: 'Verify 2FA code',
  description: 'Verify 2FA authentication code during login',
  body: {
    type: 'object',
    properties: {
      token: {
        type: 'string',
        description: 'Temporary login token'
      },
      code: {
        type: 'string',
        pattern: '^[0-9]{6}$',
        description: '6-digit 2FA code from authenticator app'
      }
    },
    required: ['token', 'code']
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

export const twofaDisableSchema = {
  tags: ['Two-Factor Authentication'],
  summary: 'Disable 2FA',
  description: 'Disable two-factor authentication for the current user',
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

export const twofaEnableSchema = {
  tags: ['Two-Factor Authentication'],
  summary: 'Enable 2FA',
  description: 'Enable two-factor authentication by verifying setup code',
  body: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        pattern: '^[0-9]{6}$',
        description: '6-digit verification code from authenticator app'
      }
    },
    required: ['code']
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