import { foreignKey, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const todos = pgTable("todos", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  priority: text("priority", { enum: ["High", "Medium", "Low"] }).notNull(),
  status: text("status", { enum: ["todo", "done"] }).notNull().default("todo"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const comments = pgTable(
  "comments",
  {
    id: text("id").primaryKey(),
    todoId: text("todo_id").notNull(),
    text: text("text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.todoId],
      foreignColumns: [todos.id],
      name: "comments_todo_id_fkey",
    }).onDelete("cascade"),
  ],
);
