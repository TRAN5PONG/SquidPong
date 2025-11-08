/**
 * Environment Variables Validator for User Service
 * Validates that all required environment variables are present
 */

interface RequiredEnvVars {
  USER_SERVICE_PORT: string;
  USER_SERVICE_HOST: string;
  SECRET_TOKEN: string;
  BACKEND_URL: string;
  DATABASE_URL: string;
  CHAT_SERVICE_URL?: string; // Optional, has default
  NOTIFY_SERVICE_URL?: string; // Optional, has default
  RABBITMQ_URL?: string; // Optional, has default
}

const REQUIRED_ENV_VARS: (keyof RequiredEnvVars)[] = [
  'USER_SERVICE_PORT',
  'USER_SERVICE_HOST',
  'SECRET_TOKEN',
  'BACKEND_URL',
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
    console.error('\n❌ USER SERVICE - Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n💡 Please check your .env file and ensure all required variables are set.\n');
    process.exit(1);
  }

  console.log('✅ USER SERVICE - All required environment variables are present');
}
