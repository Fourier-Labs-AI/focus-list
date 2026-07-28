import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { comments, todos } from "../../../db/schema";

type Priority = "High" | "Medium" | "Low";
type Status = "todo" | "done";

type TodoPayload = {
  id?: string;
  title?: string;
  description?: string;
  priority?: Priority;
  status?: Status;
  createdAt?: string;
  completedAt?: string;
  comments?: Array<{ id?: string; text?: string; createdAt?: string }>;
};

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  return Response.json({ error: message }, { status: 500 });
}

function validPriority(value: unknown): value is Priority {
  return value === "High" || value === "Medium" || value === "Low";
}

function validStatus(value: unknown): value is Status {
  return value === "todo" || value === "done";
}

export async function GET() {
  try {
    const db = getDb();
    const [todoRows, commentRows] = await Promise.all([
      db.select().from(todos).orderBy(desc(todos.createdAt), desc(todos.id)),
      db.select().from(comments).orderBy(asc(comments.createdAt), asc(comments.id)),
    ]);

    return Response.json({
      todos: todoRows.map((todo) => ({
        ...todo,
        createdAt: todo.createdAt.toISOString(),
        completedAt: todo.completedAt?.toISOString(),
        comments: commentRows
          .filter((comment) => comment.todoId === todo.id)
          .map((comment) => ({
            id: comment.id,
            text: comment.text,
            createdAt: comment.createdAt.toISOString(),
          })),
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as TodoPayload & {
      action?: "comment";
      todoId?: string;
      text?: string;
    };
    const db = getDb();

    if (payload.action === "comment") {
      const todoId = payload.todoId?.trim();
      const text = payload.text?.trim();
      if (!todoId || !text) {
        return Response.json({ error: "todoId and text are required" }, { status: 400 });
      }
      const comment = {
        id: payload.id?.trim() || crypto.randomUUID(),
        todoId,
        text,
        createdAt: payload.createdAt ? new Date(payload.createdAt) : new Date(),
      };
      await db.insert(comments).values(comment);
      return Response.json({
        comment: { ...comment, createdAt: comment.createdAt.toISOString() },
      }, { status: 201 });
    }

    const title = payload.title?.trim();
    if (!title || !validPriority(payload.priority) || !validStatus(payload.status ?? "todo")) {
      return Response.json({ error: "A title, valid priority, and valid status are required" }, { status: 400 });
    }

    const todo = {
      id: payload.id?.trim() || crypto.randomUUID(),
      title,
      description: payload.description?.trim() ?? "",
      priority: payload.priority,
      status: payload.status ?? "todo",
      createdAt: payload.createdAt ? new Date(payload.createdAt) : new Date(),
      completedAt: payload.completedAt ? new Date(payload.completedAt) : null,
    };

    await db.insert(todos).values(todo).onConflictDoNothing();
    const importedComments = (payload.comments ?? [])
      .filter((comment) => comment.text?.trim())
      .map((comment) => ({
        id: comment.id?.trim() || crypto.randomUUID(),
        todoId: todo.id,
        text: comment.text!.trim(),
        createdAt: comment.createdAt ? new Date(comment.createdAt) : new Date(),
      }));
    if (importedComments.length) {
      await db.insert(comments).values(importedComments).onConflictDoNothing();
    }

    return Response.json({ todo }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = (await request.json()) as { id?: string; status?: Status };
    if (!payload.id || !validStatus(payload.status)) {
      return Response.json({ error: "id and valid status are required" }, { status: 400 });
    }
    const completedAt = payload.status === "done" ? new Date() : null;
    await getDb().update(todos).set({ status: payload.status, completedAt }).where(eq(todos.id, payload.id));
    return Response.json({ status: payload.status, completedAt: completedAt?.toISOString() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return Response.json({ error: "id is required" }, { status: 400 });
    await getDb().delete(todos).where(eq(todos.id, id));
    return Response.json({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
