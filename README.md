# Focus List

An internal todo workspace for capturing tasks, adding clarification and comments,
setting priorities, and moving completed work to done.

Todos and comments are persisted in Aurora PostgreSQL.

## Features

- Create todos with descriptions and High, Medium, or Low priority
- Add comments and clarification to each todo
- Move todos between active and done
- Delete todos
- Persist todos and comments through the `/api/todos` API

## Local development

Requires Node.js `>=22.13.0` and a PostgreSQL connection string in
`DATABASE_URL`.

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm run build
npm test
npm run lint
```

## Storage

The PostgreSQL schema is defined with Drizzle ORM in `db/schema.ts` and
`examples/d1/db/schema.ts`. Harbour applies the ordered SQL bundle in
`.harbour/aurora` during deployment.
