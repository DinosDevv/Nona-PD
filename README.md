# Nona Project Dashboard

Internal project/to-do dashboard for the Nona team.

**Stack:** React + TypeScript (Vite), Supabase (auth + Postgres), React Router, vanilla CSS.

## Setup

```bash
npm install
cp .env.example .env   # then fill in your Supabase URL + anon key
npm run dev
```

## Structure

```
src/
  components/   shared UI (Layout, …)
  pages/        route-level components
  lib/          supabase client, helpers
  types/        generated Supabase DB types
```

## Routes

| Path                              | Page          |
| --------------------------------- | ------------- |
| `/login`                          | Login         |
| `/dashboard`                      | Project list  |
| `/dashboard/project/:projectId`   | Project page  |
