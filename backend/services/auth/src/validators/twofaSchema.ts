// twofa.schema.ts
export const TwoFAMethods = ["authenticator", "email"] as const;
export const TwoFAMethodsEnum = { AUTHENTICATOR: "authenticator", EMAIL: "email" };


export const twofaSetupSchema = {
  description: "Setup 2FA for Authenticator App or Email",
  tags: ["2FA"],
  params: {
    type: "object",
    properties: {
      method: { type: "string", enum: TwoFAMethods },
    },
    required: ["method"],
  },
  headers: {
    type: "object",
    properties: {
      "x-user-id": { type: "string", description: "User ID injected by gateway" },
    },
    required: ["x-user-id"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: {
          anyOf: [
            {
              type: "object",
              properties: {
                twoFAQRCode: { type: "string" },
                twoFAKey: { type: "string" },
              },
              required: ["twoFAQRCode", "twoFAKey"],
            },
            { type: "null" }
          ],
        },
      },
      required: ["success", "message", "data"],
    },
  },
};



export const twofaVerifySchema = {
  description: "Verify 2FA code for Authenticator App or Email",
  tags: ["2FA"],
  params: {
    type: "object",
    properties: {
      method: { type: "string", enum: TwoFAMethods },
    },
    required: ["method"],
  },
  headers: {
    type: "object",
    properties: {
      "x-user-id": { type: "string", description: "User ID injected by gateway" },
    },
    required: ["x-user-id"],
  },
  body: {
    type: "object",
    properties: {
      code: { type: "string", description: "2FA code from Authenticator App or Email" },
    },
    required: ["code"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: { type: "null" },
      },
      required: ["success", "message", "data"],
    },
  },
};

export const twofaEnableSchema = {
  description: "Enable 2FA after verification",
  tags: ["2FA"],
  params: {
    type: "object",
    properties: {
      method: { type: "string", enum: TwoFAMethods },
    },
    required: ["method"],
  },
  headers: {
    type: "object",
    properties: {
      "x-user-id": { type: "string", description: "User ID injected by gateway" },
    },
    required: ["x-user-id"],
  },
  body: {
    type: "object",
    properties: {
      code: { type: "string", description: "2FA code from Authenticator App or Email" },
    },
    required: ["code"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: { type: "null" },
      },
      required: ["success", "message", "data"],
    },
  },
};

export const twofaDisableSchema = {
  description: "Disable 2FA for the user",
  tags: ["2FA"],
  headers: {
    type: "object",
    properties: {
      "x-user-id": { type: "string", description: "User ID injected by gateway" },
    },
    required: ["x-user-id"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: { type: "null" },
      },
      required: ["success", "message", "data"],
    },
  },
};

export const twofaStatusSchema = {
  description: "Get current 2FA status",
  tags: ["2FA"],
  headers: {
    type: "object",
    properties: {
      "x-user-id": { type: "string", description: "User ID injected by gateway" },
    },
    required: ["x-user-id"],
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
            twoFAMethod: { type: "string", enum: ["NONE", "AUTHENTICATOR", "EMAIL"] },
          },
          required: ["twoFAMethod"],
        },
      },
      required: ["success", "message", "data"],
    },
  },
};
