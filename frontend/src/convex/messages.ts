import { query } from "./_generated/server";
import { v } from "convex/values";
import authCheck from './session';

const N = 40;


export const timelineBounds = query({
  args: {
    token: v.string()
  },
  handler: async (ctx, args) => {
    if (!await authCheck(ctx, args.token)) {
      return [];
    }

    const firstMessage = await ctx.db
          .query("messages")
          .withIndex("by_timestamp")
          .order("asc")
          .first();
    const lastMessage = await ctx.db
          .query("messages")
          .withIndex("by_timestamp")
          .order("desc")
          .first();

    return [firstMessage!.timestamp, lastMessage!.timestamp]
  }
})

export const fasterSearch = query({
  args: {
    token: v.string(),
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    if (!await authCheck(ctx, args.token)) {
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
    return messages;
  },
});

export const getMessagesAroundDate = query({
  args: {
    token: v.string(),
    timestamp: v.string(),
    direction: v.string(),
  },
  handler: async (ctx, args) => {
    if (!await authCheck(ctx, args.token)) {
      return [];
    }

    let query = ctx.db.query("messages");

    let messages;
    if (args.direction === 'before') {
      messages = await query.withIndex("by_timestamp", (q) => q.lt("timestamp", args.timestamp)).order('desc').take(N)!;
      messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } else {
      messages = await query.withIndex("by_timestamp", (q) => q.gt("timestamp", args.timestamp)).order('asc').take(N)!;
    }

    return messages;
  }
});


export const getInitialMessages = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    if (!await authCheck(ctx, args.token)) {
      return [];
    }

    const messages = await ctx.db.query("messages").withIndex("by_timestamp").order('asc').take(N)!;
    return messages;
  }
});

export const reloadMessages = query({
  args: {
    token: v.string(),
    timestamp: v.string(),
  },
  handler: async (ctx, args) => {
    if (!await authCheck(ctx, args.token)) {
      return [];
    }
    const messages = await ctx.db.query("messages")
          .withIndex("by_timestamp", (q) => q.gte("timestamp", args.timestamp))
          .order('asc').take(N)!;
    return messages;
  }});

export const getAnalytics = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    if (!await authCheck(ctx, args.token)) {
      return [];
    }
    return await ctx.db.query("analytics").first();
  }});

const sortMessages = (messages: any[]) =>
  messages.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
