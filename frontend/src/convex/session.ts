import { query } from "./_generated/server";
import { v } from "convex/values";

// export const validateSession = query({
//   args: { token: v.string() },
//   handler: async (ctx, args) => {
//     await ctx.db.query("sessions").filter((q) => q.eq(q.field("token"), args.token)).first() != null
//   }});
