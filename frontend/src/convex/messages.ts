import { query } from "./_generated/server";
import { v } from "convex/values";

export const search = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    const messages = await ctx.db.query("messages").collect();
    return messages.filter((m) => m.message.includes(args.searchTerm));
  },
});
