import { query } from "./_generated/server";
import { v } from "convex/values";

const N = 1024;

export const fasterSearch = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    let messages = [];
    if (args.searchTerm == "") {
      messages = await ctx.db.query("messages").take(N);
    } else {
      messages = await ctx.db
        .query("messages")
        .withSearchIndex("search_message", (q) =>
          q.search("message", args.searchTerm)
        )
        .take(N);
    }
    return sortMessages(messages);
  },
});

// export const getMessagesAroundDate = query({
//   args: {
//     timestamp: v.string(),
//   },
//   handler: async (ctx, args) => {
//     const messages = await ctx.db
//       .query("messages")
//       .withIndex("by_timestamp", (q) =>
//         q
//           .gt("timestamp", args.timestamp)
//           .lt("timestamp", args.timestamp)
//       )
//       .take(N);
//     return messages;
//   },
// });

const sortMessages = (messages: any[]) =>
  messages.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
