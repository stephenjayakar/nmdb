import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import authCheck from './session';

export const setFavorite = mutation({
    args: {
        token: v.string(),
        messageID: v.string(),
        isFavorite: v.boolean(),
    },
    handler: async (ctx, args) => {
        if (!(await authCheck(ctx, args.token))) {
            return;
        }
        const favorites = await ctx.db.query("favorites").first();
        const favoritesList = favorites?.favoriteList ?? [];

        if (args.isFavorite && !favoritesList.includes(args.messageID)) {
            // Add to favorites
            if (favorites) {
                await ctx.db.patch(favorites._id, {
                    favoriteList: [...favoritesList, args.messageID]
                });
            } else {
                await ctx.db.insert("favorites", {
                    favoriteList: [args.messageID]
                });
            }
        } else if (!args.isFavorite && favoritesList.includes(args.messageID)) {
            // Remove from favorites
            if (favorites) {
                await ctx.db.patch(favorites._id, {
                    favoriteList: favoritesList.filter(id => id !== args.messageID)
                });
            }
        }
    },
})

export const getFavorites = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    if (!(await authCheck(ctx, args.token))) {
      return [];
    }
    const favorites = await ctx.db.query("favorites").first();
    return favorites?.favoriteList ?? [];
  }
});

export const getFavoriteMessages = query({
    args: {
      token: v.string(),
    },
    handler: async (ctx, args) => {
        if (!(await authCheck(ctx, args.token))) {
            return [];
        }
        const favorites = await ctx.db.query("favorites").first();
        const favoritesList = favorites?.favoriteList ?? [];
        const favoriteMessages = await Promise.all(
            favoritesList.map(async (messageID) => {
                return await ctx.db.query("messages").withIndex("by_sj_id", (q) =>
                    q.eq("id", messageID)).first();
            })
        );

        favoriteMessages.sort(((a, b) => a!.timestamp.localeCompare(b!.timestamp)));

        return favoriteMessages;
    }
})
