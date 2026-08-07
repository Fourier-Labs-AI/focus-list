import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const todos = pgTable("todos", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  priority: text("priority", { enum: ["High", "Medium", "Low"] }).notNull(),
  status: text("status", { enum: ["todo", "done"] }).notNull().default("todo"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
});

export const comments = pgTable("comments", {
  id: text("id").primaryKey(),
  todoId: text("todo_id")
    .notNull()
    .references(() => todos.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});
