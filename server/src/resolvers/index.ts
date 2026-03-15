import { memberResolvers } from "./member.js";
import { sessionResolvers } from "./session.js";
import { vacationResolvers } from "./vacation.js";
import { feeResolvers } from "./fee.js";
import { adminResolvers } from "./admin.js";

// 딥 머지 유틸
function mergeResolvers(...resolversList: Record<string, unknown>[]) {
  const merged: Record<string, Record<string, unknown>> = {};

  for (const resolvers of resolversList) {
    for (const [type, fields] of Object.entries(resolvers)) {
      if (!merged[type]) merged[type] = {};
      Object.assign(merged[type], fields);
    }
  }

  return merged;
}

export const resolvers = mergeResolvers(
  memberResolvers,
  sessionResolvers,
  vacationResolvers,
  feeResolvers,
  adminResolvers,
);
