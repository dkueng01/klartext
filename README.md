This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Today workflow database setup

Run `migrations/20260911_today.sql` once in the Neon SQL Editor for the database
used by `NEXT_PUBLIC_NEON_DATA_API_URL`. It adds calendar-day planning, atomic
focus switching, completion timestamps, next steps, pinned notes, follow-up
dates, and note references. Existing deadlines and completion history are not
rewritten; historical completion times remain unknown. The migration retains
the existing row-level security policies. After running it, open **Data API →
Refresh schema cache** in Neon so the API exposes the new columns and function.

Run `npm test` (Node 22.18+) for day selection and storage tests, and `npm run build`
for a production build. `tests/workflow.sql` checks database transitions inside
a transaction that rolls back all fixture data and changes.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
