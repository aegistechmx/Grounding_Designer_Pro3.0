/**
 * Environment Variable Validation
 * Validates required environment variables at startup
 */

const requiredEnvVars = [
  'JWT_SECRET',
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD'
];

const optionalEnvVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
  'S3_BUCKET',
  'S3_REGION',
  'ALLOWED_ORIGINS',
  'FRONTEND_URL'
];

/**
 * Validate environment variable format
 */
function validateFormat(envVar, value) {
  switch (envVar) {
    case 'DB_PORT':
      const port = parseInt(value, 10);
      if (isNaN(port) || port < 1 || port > 65535) {
        throw new Error(`${envVar} must be a valid port number (1-65535)`);
      }
      break;
    case 'JWT_SECRET':
      if (value && value.length < 16) {
        throw new Error(`${envVar} must be at least 16 characters long`);
      }
      break;
    case 'S3_REGION':
      if (value && !/^[a-z]{2}-[a-z]+-\d+$/.test(value)) {
        throw new Error(`${envVar} must be a valid AWS region (e.g., us-east-1)`);
      }
      break;
  }
}

/**
 * Validate required environment variables
 */
function validateEnv() {
  const missing = [];
  const invalid = [];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    } else {
      try {
        validateFormat(envVar, process.env[envVar]);
      } catch (error) {
        invalid.push(`${envVar}: ${error.message}`);
      }
    }
  }
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please set these in your .env file or environment configuration.`
    );
  }
  
  if (invalid.length > 0) {
    throw new Error(
      `Invalid environment variable format:\n${invalid.join('\n')}`
    );
  }
  
  console.log('✓ All required environment variables are set and valid');
  
  // Log optional variables that are missing (just a warning)
  const missingOptional = [];
  for (const envVar of optionalEnvVars) {
    if (!process.env[envVar]) {
      missingOptional.push(envVar);
    }
  }
  
  if (missingOptional.length > 0) {
    console.warn(`⚠ Optional environment variables not set: ${missingOptional.join(', ')}`);
  }
}

module.exports = { validateEnv };
