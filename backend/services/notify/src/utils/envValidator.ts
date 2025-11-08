/**
 * Environment Variables Validator for Notify Service
 * Validates that all required environment variables are present
 */

interface RequiredEnvVars {
  NOTIFY_SERVICE_PORT: string;
  NOTIFY_SERVICE_HOST: string;
  SECRET_TOKEN: string;
  DATABASE_URL: string;
  NOTIFY_EMAIL_USER: string;
  NOTIFY_EMAIL_PASS: string;
  RABBITMQ_URL?: string; // Optional, has default
}

const REQUIRED_ENV_VARS: (keyof RequiredEnvVars)[] = [
  'NOTIFY_SERVICE_PORT',
  'NOTIFY_SERVICE_HOST',
  'SECRET_TOKEN',
  'DATABASE_URL',
  'NOTIFY_EMAIL_USER',
  'NOTIFY_EMAIL_PASS',
];

export function validateEnvironmentVariables(): void {
  const missingVars: string[] = [];

  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }

  if (missingVars.length > 0) {
    console.error('\n❌ NOTIFY SERVICE - Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n💡 Please check your .env file and ensure all required variables are set.\n');
    process.exit(1);
  }

  console.log('✅ NOTIFY SERVICE - All required environment variables are present');
}
