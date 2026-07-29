// Runs once per worker before any test file is imported.
// The Prisma client picks up DATABASE_URL from process.env, which vitest sets
// via test.env in vitest.config.ts. Nothing else is required here.
