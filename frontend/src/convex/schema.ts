import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  messages: defineTable({
    id: v.string(),
    message: v.string(),
    sender: v.string(),
    timestamp: v.string(),
  }).searchIndex("search_message", {
    searchField: "message",
  }),
});
