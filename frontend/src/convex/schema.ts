import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  analytics: defineTable(v.any()),
  messages: defineTable({
    id: v.string(),
    message: v.string(),
    sender: v.string(),
    timestamp: v.string(),
  })
    .searchIndex("search_message", {
      searchField: "message",
    })
    .index("by_timestamp", ["timestamp"])
    .index("by_sj_id", ["id"]),
  sessions: defineTable({
    token: v.string(),
  }),
  favorites: defineTable({
    favoriteList: v.array(v.string())
  })
});
