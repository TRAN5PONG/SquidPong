/**
 * Environment Variables Validator for Gateway Service
 * Validates that all required environment variables are present
 */

interface RequiredEnvVars {
  GATEWAY_PORT: string;
  GATEWAY_HOST: string;
  GATEWAY_JWT_SECRET: string;
  FRONTEND_URL: string;
  SECRET_TOKEN: string;
    BACKEND_URL: string;
  RABBITMQ_URL?: string; // Optional, has default
}

const REQUIRED_ENV_VARS: (keyof RequiredEnvVars)[] = [
  'GATEWAY_PORT',
  'GATEWAY_HOST',
  'GATEWAY_JWT_SECRET',
  'FRONTEND_URL',
  'BACKEND_URL',
  'SECRET_TOKEN',
];

export function validateEnvironmentVariables(): void {
  const missingVars: string[] = [];

  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }

  if (missingVars.length > 0) {
    console.error('\n❌ GATEWAY SERVICE - Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n💡 Please check your .env file and ensure all required variables are set.\n');
    process.exit(1);
  }

  console.log('✅ GATEWAY SERVICE - All required environment variables are present');
}
