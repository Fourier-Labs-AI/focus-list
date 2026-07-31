CREATE TABLE public.todos (
  id text NOT NULL,
  title text NOT NULL,
  description text DEFAULT ''::text NOT NULL,
  priority text NOT NULL,
  status text DEFAULT 'todo'::text NOT NULL,
  created_at timestamp with time zone NOT NULL,
  completed_at timestamp with time zone,
  CONSTRAINT todos_pkey PRIMARY KEY (id)
);

CREATE TABLE public.notes (
  id text NOT NULL,
  title text NOT NULL,
  content text DEFAULT ''::text NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT notes_pkey PRIMARY KEY (id)
);

CREATE TABLE public.comments (
  id text NOT NULL,
  todo_id text NOT NULL,
  text text NOT NULL,
  created_at timestamp with time zone NOT NULL,
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_todo_id_fkey FOREIGN KEY (todo_id)
    REFERENCES public.todos (id) ON DELETE CASCADE
);
