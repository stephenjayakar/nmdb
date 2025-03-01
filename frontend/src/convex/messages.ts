import { query } from "./_generated/server";
import { v } from "convex/values";

const N = 1024;

const authCheck = async (ctx: any, token: string) => {
    const tokenExists =
      (await ctx.db
        .query("sessions")
       .filter((q: any) => q.eq(q.field("token"), token))
        .first()) != null;
    if (!tokenExists) {
      return [];
    }
};

export const timelineBounds = query({
  args: {
    token: v.string()
  },
  handler: async (ctx, args) => {
    if (!authCheck(ctx, args.token)) {
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
    if (!authCheck(ctx, args.token)) {
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
    direction: v.string(),
  },
  handler: async (ctx, args) => {
    if (!authCheck(ctx, args.token)) {
      return [];
    }

    const limit = 20;
    let query = ctx.db.query("messages");

    let messages;
    if (args.direction === 'before') {
      messages = await query.withIndex("by_timestamp", (q) => q.lt("timestamp", args.timestamp)).order('desc').take(limit)!;
      messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } else {
      messages = await query.withIndex("by_timestamp", (q) => q.gt("timestamp", args.timestamp)).order('asc').take(limit)!;
    }

    return messages;
  }
});


export const getInitialMessages = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    if (!authCheck(ctx, args.token)) {
      return [];
    }

    const limit = 20;
    const messages = await ctx.db.query("messages").withIndex("by_timestamp").order('asc').take(limit)!;
    return messages;
  }
});

export const reloadMessages = query({
  args: {
    token: v.string(),
    timestamp: v.string(),
  },
  handler: async (ctx, args) => {
    if (!authCheck(ctx, args.token)) {
      return [];
    }
    const limit = 20;
    const messages = await ctx.db.query("messages")
          .withIndex("by_timestamp", (q) => q.gte("timestamp", args.timestamp))
          .order('asc').take(limit)!;
    return messages;
  }});

const sortMessages = (messages: any[]) =>
  messages.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
