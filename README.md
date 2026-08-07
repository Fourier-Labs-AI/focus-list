# Focus List

An internal todo workspace for capturing tasks, adding clarification and comments,
setting priorities, and moving completed work to done.

Todos and comments are persisted in the site's private Aurora PostgreSQL database.

## Features

- Create todos with descriptions and High, Medium, or Low priority
- Add comments and clarification to each todo
- Move todos between active and done
- Delete todos
- Persist todos and comments through the `/api/todos` API

## Local development

Requires Node.js `>=22.13.0`.

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

The database schema is defined in `db/schema.ts` with Drizzle ORM. The deployed
site reads its private Aurora connection string from the server-only
`DATABASE_URL` environment variable.
