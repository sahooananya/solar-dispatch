import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.spec.ts'],
    environment: 'node',
    globals: false,
    testTimeout: 20000,
    hookTimeout: 30000,
    fileParallelism: false,
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    env: {
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/solardispatch_test?schema=public',
      JWT_SECRET: 'test-secret-for-vitest-suite-do-not-use-in-production',
      JWT_EXPIRES_IN: '1h',
      PORT: '0',
      NODE_ENV: 'test',
      CLIENT_URL: '*',
      LOG_LEVEL: 'silent',
    },
    setupFiles: ['./tests/setup.ts'],
  },
});
