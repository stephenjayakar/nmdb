import { query } from "./_generated/server";
import { v } from "convex/values";

export const fasterSearch = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    let messages = [];
    if (args.searchTerm == "") {
      messages = await ctx.db.query("messages").collect();
    } else {
      messages = await ctx.db
      .query("messages")
      .withSearchIndex("search_message", (q) =>
        q.search("message", args.searchTerm)
      )
      .collect();
    }
    return messages.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  },
});
