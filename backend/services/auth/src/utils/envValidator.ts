/**
 * Environment Variables Validator for Auth Service
 * Validates that all required environment variables are present
 */

interface RequiredEnvVars {
  AUTH_SERVICE_PORT: string;
  AUTH_SERVICE_HOST: string;
  SECRET_TOKEN: string;
  INTRA_CLIENT_ID: string;
  INTRA_CLIENT_SECRET: string;
  BACKEND_URL: string;
  FRONTEND_URL: string;
  JWT_SECRET_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  DATABASE_URL: string;
  RABBITMQ_URL?: string; // Optional, has default
}

const REQUIRED_ENV_VARS: (keyof RequiredEnvVars)[] = [
  'AUTH_SERVICE_PORT',
  'AUTH_SERVICE_HOST',
  'SECRET_TOKEN',
  'INTRA_CLIENT_ID',
  'INTRA_CLIENT_SECRET',
  'BACKEND_URL',
  'FRONTEND_URL',
  'JWT_SECRET_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'DATABASE_URL',
];

export function validateEnvironmentVariables(): void {
  const missingVars: string[] = [];

  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }

  if (missingVars.length > 0) {
    console.error('\n❌ AUTH SERVICE - Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n💡 Please check your .env file and ensure all required variables are set.\n');
    process.exit(1);
  }

  console.log('✅ AUTH SERVICE - All required environment variables are present');
}
