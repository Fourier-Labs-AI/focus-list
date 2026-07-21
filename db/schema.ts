import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const todos = sqliteTable("todos", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  priority: text("priority", { enum: ["High", "Medium", "Low"] }).notNull(),
  status: text("status", { enum: ["todo", "done"] }).notNull().default("todo"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  completedAt: integer("completed_at", { mode: "timestamp_ms" }),
});

export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  todoId: text("todo_id")
    .notNull()
    .references(() => todos.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});
