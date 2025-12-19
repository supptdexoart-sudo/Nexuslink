
// Augmentace namespace NodeJS pro správnou typovou kontrolu process.env v rámci celé aplikace
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    NODE_ENV: 'development' | 'production' | 'test';
    [key: string]: string | undefined;
  }
}
