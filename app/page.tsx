"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Status = "todo" | "done";
type Priority = "High" | "Medium" | "Low";

type Comment = {
  id: string;
  text: string;
  createdAt: string;
};

type Todo = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  createdAt: string;
  completedAt?: string;
  comments: Comment[];
};

const STORAGE_KEY = "focus-todos-v1";

const starterTodos: Todo[] = [
  {
    id: "sample-1",
    title: "Review Q3 planning doc",
    description: "Leave feedback on scope and call out any open dependencies.",
    priority: "High",
    status: "todo",
    createdAt: "2026-07-21T08:30:00.000Z",
    comments: [
      {
        id: "comment-1",
        text: "Clarify whether the analytics work is part of this milestone.",
        createdAt: "2026-07-21T09:15:00.000Z",
      },
    ],
  },
  {
    id: "sample-2",
    title: "Send launch notes to support",
    description: "Summarize the customer-facing changes and known limitations.",
    priority: "Medium",
    status: "todo",
    createdAt: "2026-07-20T13:00:00.000Z",
    comments: [],
  },
  {
    id: "sample-3",
    title: "Archive old research links",
    description: "Move the useful references into the shared research folder.",
    priority: "Low",
    status: "done",
    createdAt: "2026-07-18T10:00:00.000Z",
    completedAt: "2026-07-20T16:30:00.000Z",
    comments: [],
  },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

async function apiRequest(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error || "Could not save your change");
  }
  return response;
}

function TodoCard({
  todo,
  onToggle,
  onAddComment,
  onDelete,
}: {
  todo: Todo;
  onToggle: (id: string) => void;
  onAddComment: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");

  function submitComment(event: FormEvent) {
    event.preventDefault();
    if (!comment.trim()) return;
    onAddComment(todo.id, comment.trim());
    setComment("");
    setOpen(true);
  }

  return (
    <article className={`todo-card ${todo.status === "done" ? "is-done" : ""}`}>
      <div className="card-topline">
        <span className={`priority priority-${todo.priority.toLowerCase()}`}>
          {todo.priority}
        </span>
        <span className="date-label">
          {todo.status === "done" && todo.completedAt ? "Done " : "Added "}
          {formatDate(todo.completedAt ?? todo.createdAt)}
        </span>
      </div>

      <div className="card-content">
        <button
          className="check-button"
          type="button"
          aria-label={todo.status === "done" ? `Move ${todo.title} to open` : `Mark ${todo.title} done`}
          aria-pressed={todo.status === "done"}
          onClick={() => onToggle(todo.id)}
        >
          <span aria-hidden="true">{todo.status === "done" ? "✓" : ""}</span>
        </button>
        <div>
          <h3>{todo.title}</h3>
          {todo.description && <p>{todo.description}</p>}
        </div>
      </div>

      <div className="card-actions">
        <button className="comment-toggle" type="button" onClick={() => setOpen(!open)}>
          <span aria-hidden="true">◌</span>
          {todo.comments.length === 0
            ? "Add clarification"
            : `${todo.comments.length} ${todo.comments.length === 1 ? "note" : "notes"}`}
        </button>
        <button className="delete-button" type="button" onClick={() => onDelete(todo.id)}>
          Delete
        </button>
      </div>

      {open && (
        <div className="comments-panel">
          {todo.comments.map((item) => (
            <div className="comment" key={item.id}>
              <span className="avatar" aria-hidden="true">You</span>
              <div>
                <p>{item.text}</p>
                <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
              </div>
            </div>
          ))}
          <form className="comment-form" onSubmit={submitComment}>
            <label className="sr-only" htmlFor={`comment-${todo.id}`}>Add a clarification</label>
            <input
              id={`comment-${todo.id}`}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Add a note or clarification…"
            />
            <button type="submit" disabled={!comment.trim()}>Add</button>
          </form>
        </div>
      )}
    </article>
  );
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<"all" | Status>("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");

  useEffect(() => {
    async function loadTodos() {
      let localTodos: Todo[] | null = null;
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) localTodos = JSON.parse(saved) as Todo[];
      } catch {
        // Ignore malformed legacy browser data.
      }

      try {
        const response = await apiRequest("/api/todos");
        const payload = (await response.json()) as { todos: Todo[] };

        if (payload.todos.length) {
          setTodos(payload.todos);
        } else {
          const todosToMigrate = localTodos ?? starterTodos;
          await Promise.all(
            todosToMigrate.map((todo) =>
              apiRequest("/api/todos", { method: "POST", body: JSON.stringify(todo) }),
            ),
          );
          setTodos(todosToMigrate);
        }
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        setTodos(localTodos ?? starterTodos);
        setError("Your saved list is temporarily unavailable. Changes may not persist until you reconnect.");
      } finally {
        setReady(true);
      }
    }

    void loadTodos();
  }, []);

  const counts = useMemo(
    () => ({
      all: todos.length,
      todo: todos.filter((todo) => todo.status === "todo").length,
      done: todos.filter((todo) => todo.status === "done").length,
    }),
    [todos],
  );

  const visibleTodos = useMemo(() => {
    const term = search.trim().toLowerCase();
    return todos.filter((todo) => {
      const matchesView = view === "all" || todo.status === view;
      const matchesSearch = !term || `${todo.title} ${todo.description}`.toLowerCase().includes(term);
      return matchesView && matchesSearch;
    });
  }, [search, todos, view]);

  async function addTodo(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    const todo: Todo = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      priority,
      status: "todo",
      createdAt: new Date().toISOString(),
      comments: [],
    };
    setError("");
    setTodos((current) => [todo, ...current]);
    setTitle("");
    setDescription("");
    setPriority("Medium");
    setShowForm(false);
    setView("todo");
    try {
      await apiRequest("/api/todos", { method: "POST", body: JSON.stringify(todo) });
    } catch {
      setTodos((current) => current.filter((item) => item.id !== todo.id));
      setError("That todo could not be saved. Please try again.");
    }
  }

  async function toggleTodo(id: string) {
    const previous = todos;
    const currentTodo = todos.find((todo) => todo.id === id);
    if (!currentTodo) return;
    const nextStatus: Status = currentTodo.status === "done" ? "todo" : "done";
    setError("");
    setTodos((current) =>
      current.map((todo) =>
        todo.id === id
          ? {
              ...todo,
              status: nextStatus,
              completedAt: nextStatus === "done" ? new Date().toISOString() : undefined,
            }
          : todo,
      ),
    );
    try {
      const response = await apiRequest("/api/todos", {
        method: "PATCH",
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const payload = (await response.json()) as { completedAt?: string };
      setTodos((current) => current.map((todo) => todo.id === id ? { ...todo, completedAt: payload.completedAt } : todo));
    } catch {
      setTodos(previous);
      setError("That status change could not be saved. Please try again.");
    }
  }

  async function addComment(id: string, text: string) {
    const comment = { id: crypto.randomUUID(), text, createdAt: new Date().toISOString() };
    setError("");
    setTodos((current) =>
      current.map((todo) =>
        todo.id === id
          ? {
              ...todo,
              comments: [...todo.comments, comment],
            }
          : todo,
      ),
    );
    try {
      await apiRequest("/api/todos", {
        method: "POST",
        body: JSON.stringify({ action: "comment", todoId: id, ...comment }),
      });
    } catch {
      setTodos((current) => current.map((todo) => todo.id === id ? { ...todo, comments: todo.comments.filter((item) => item.id !== comment.id) } : todo));
      setError("That clarification could not be saved. Please try again.");
    }
  }

  async function deleteTodo(id: string) {
    const previous = todos;
    setError("");
    setTodos((current) => current.filter((todo) => todo.id !== id));
    try {
      await apiRequest(`/api/todos?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch {
      setTodos(previous);
      setError("That todo could not be deleted. Please try again.");
    }
  }

  return (
    <main>
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true"><span /></div>
          <span>Focus List</span>
        </div>
        <div className="today-label"><span className={`sync-dot ${ready && !error ? "is-synced" : ""}`} />{ready ? (error ? "Connection issue" : "Saved securely") : "Loading your list"}</div>
      </header>

      <section className="workspace">
        {error && <div className="error-banner" role="status">{error}</div>}
        <div className="hero-row">
          <div>
            <p className="eyebrow">Today&apos;s focus</p>
            <h1>Keep work moving.</h1>
            <p className="intro">Capture what matters, clarify the details, and close the loop.</p>
          </div>
          <button className="primary-button" type="button" onClick={() => setShowForm(true)}>
            <span aria-hidden="true">+</span> New todo
          </button>
        </div>

        {showForm && (
          <form className="new-todo-form" onSubmit={addTodo}>
            <div className="form-heading">
              <div>
                <p className="eyebrow">New item</p>
                <h2>What needs to happen?</h2>
              </div>
              <button className="close-button" type="button" onClick={() => setShowForm(false)} aria-label="Close form">×</button>
            </div>
            <label>
              Todo
              <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Finalize the launch checklist" />
            </label>
            <label>
              Details <span>Optional</span>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add context, links, or a clear outcome…" rows={3} />
            </label>
            <fieldset>
              <legend>Priority</legend>
              <div className="priority-options">
                {(["High", "Medium", "Low"] as Priority[]).map((option) => (
                  <label key={option} className={priority === option ? "selected" : ""}>
                    <input type="radio" name="priority" value={option} checked={priority === option} onChange={() => setPriority(option)} />
                    {option}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="form-actions">
              <button className="secondary-button" type="button" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="primary-button" type="submit" disabled={!title.trim()}>Add todo</button>
            </div>
          </form>
        )}

        <div className="controls">
          <nav className="view-tabs" aria-label="Todo views">
            {(["all", "todo", "done"] as const).map((option) => (
              <button key={option} type="button" className={view === option ? "active" : ""} onClick={() => setView(option)}>
                {option === "all" ? "All" : option === "todo" ? "Open" : "Done"}
                <span>{counts[option]}</span>
              </button>
            ))}
          </nav>
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <span className="sr-only">Search todos</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search todos" />
          </label>
        </div>

        <section className="todo-list" aria-live="polite">
          {visibleTodos.length > 0 ? (
            visibleTodos.map((todo) => (
              <TodoCard key={todo.id} todo={todo} onToggle={toggleTodo} onAddComment={addComment} onDelete={deleteTodo} />
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-check" aria-hidden="true">✓</div>
              <h2>{search ? "Nothing matches that search" : view === "done" ? "Nothing finished yet" : "You’re all clear"}</h2>
              <p>{search ? "Try a different keyword." : "Add a new todo when something comes up."}</p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
