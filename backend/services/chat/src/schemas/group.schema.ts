import { FastifySchema } from "fastify";



export const addGroupMemberSchema: FastifySchema = {
  params: {
    type: "object",
    properties: {
      groupId: { type: "integer" }  // groupId must be a number
    },
    required: ["groupId"],
  },
  body: {
    type: "object",
    properties: {
      newMemberId: { type: "number" }, // now a number
    },
    required: ["newMemberId"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        member: { type: "object" }, // expand if needed
      },
    },
    400: {
      type: "object",
      properties: {
        error: { type: "string" },
      },
    },
  },
};
