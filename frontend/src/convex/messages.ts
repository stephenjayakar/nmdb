import { query } from "./_generated/server";
import { v } from "convex/values";

const N = 1024;

export const fasterSearch = query({
  args: {
    token: v.string(),
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    // TODO: maybe move authentication somewhere else.
    const tokenExists =
      (await ctx.db
        .query("sessions")
        .filter((q) => q.eq(q.field("token"), args.token))
        .first()) != null;
    if (!tokenExists) {
      return [];
    }

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

export const getMessagesAroundDate = query({
  args: {
    token: v.string(),
    timestamp: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenExists =
      (await ctx.db
        .query("sessions")
        .filter((q) => q.eq(q.field("token"), args.token))
        .first()) != null;
    if (!tokenExists) {
      return [];
    }
    if (args.timestamp === "") {
      return [];
    }
    const dateString = args.timestamp;
    const timestamp = Date.parse(dateString.replace(" ", "T") + "Z");
    const lowerBoundDate = new Date(timestamp);
    const upperBoundDate = new Date(timestamp);

    lowerBoundDate.setDate(lowerBoundDate.getDate() - 5);
    upperBoundDate.setDate(upperBoundDate.getDate() + 5);

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_timestamp", (q) =>
        q
          .gte("timestamp", lowerBoundDate.toISOString())
          .lt("timestamp", upperBoundDate.toISOString())
      )
      .take(1024);
    return sortMessages(messages);
  },
});

const sortMessages = (messages: any[]) =>
  messages.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
