declare module "cloudflare:test" {
  interface ProvidedEnv {
    MAX_WORD_LENGTH: number;
    DB: D1Database;
    TEST_MIGRATIONS: import("cloudflare:test").D1Migration[];
  }
}

declare module "cloudflare:workers" {
  interface ProvidedEnv {
    MAX_WORD_LENGTH: number;
    DB: D1Database;
  }
}
