import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  analytics: defineTable({
    emoji_frequency: v.array(v.array(v.union(v.float64(), v.string()))),
    message_count_by_hour: v.record(v.string(), v.float64()),
    message_frequency_per_day_per_person: v.record(
      v.string(),
      v.object({
        nadia: v.optional(v.float64()),
        stephen: v.optional(v.float64()),
      })
    ),
    messages_per_day: v.float64(),
    num_days: v.float64(),
    num_messages: v.object({
      nadia: v.float64(),
      stephen: v.float64(),
      total: v.float64(),
    }),
    num_words_total: v.float64(),
    word_frequency: v.array(v.array(v.union(v.float64(), v.string()))),
  }),
  messages: defineTable({
    id: v.string(),
    message: v.string(),
    sender: v.string(),
    timestamp: v.string(),
  })
    .searchIndex("search_message", {
      searchField: "message",
    })
    .index("by_timestamp", ["timestamp"]),
  sessions: defineTable({
    token: v.string(),
  }),
});
