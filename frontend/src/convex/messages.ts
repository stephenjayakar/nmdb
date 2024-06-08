import { query } from "./_generated/server";
import { v } from "convex/values";

export const fasterSearch = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    if (args.searchTerm == '') {
      return await ctx.db
          .query("messages")
          .collect()
    }
    return await ctx.db
          .query("messages")
          .withSearchIndex("search_message", (q) =>
            q.search("message", args.searchTerm),
          )
          .collect()
  },
});
