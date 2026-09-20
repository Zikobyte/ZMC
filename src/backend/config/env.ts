import crypto from 'crypto';
import 'dotenv/config';

// Safely load local .env if available
try {
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile();
  }
} catch {
  // .env file not found or already loaded
}

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';
export const PORT = 3000;

function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();

  if (secret) {
    if (IS_PRODUCTION && secret.length < 32) {
      console.warn(
        '⚠️ [SECURITY WARNING] The configured JWT_SECRET is shorter than 32 characters. ' +
        'For hospital intranet production deployment, a secret of at least 256 bits (32+ characters) is strongly recommended.'
      );
    }
    return secret;
  }

  // Strict mode: if explicitly enabled, reject startup when JWT_SECRET is missing
  if (IS_PRODUCTION && process.env.STRICT_JWT_SECRET === 'true') {
    const errorMsg =
      'FATAL SECURITY ERROR: JWT_SECRET environment variable is missing in strict production mode.\n' +
      'Hospital production intranet deployment requires an explicit, unpredictable JWT secret.\n' +
      'Please configure JWT_SECRET in your production environment variables before launching Zikobyte EMS.';
    console.error(`\n======================================================\n${errorMsg}\n======================================================\n`);
    throw new Error(errorMsg);
  }

  // Production without explicit secret: Generate a cryptographically secure 256-bit secret at runtime
  // This satisfies non-hardcoded security while preventing container crash / exit(1) during deployment rollouts.
  if (IS_PRODUCTION) {
    const runtimeSecret = crypto.randomBytes(32).toString('hex');
    console.warn(
      '\n⚠️ [SECURITY WARNING - PRODUCTION DEPLOYMENT]\n' +
      'JWT_SECRET environment variable is not defined in this production container instance.\n' +
      'Generated a dynamic, cryptographically secure random 256-bit secret for this runtime instance.\n' +
      'Note: To preserve active user sessions across container restarts or multi-instance load balancers,\n' +
      'configure a persistent JWT_SECRET in your environment settings or .env file.\n'
    );
    return runtimeSecret;
  }

  // Development mode: explicitly warn so we never silently fall back to a hardcoded secret
  console.warn(
    '\n⚠️ [SECURITY NOTICE - DEVELOPMENT MODE ONLY]\n' +
    'JWT_SECRET environment variable is not defined.\n' +
    'Using a development-only key for local testing. Set JWT_SECRET in your environment or .env for production deployment.\n'
  );

  return 'zmc_dev_only_insecure_jwt_secret_do_not_use_in_production_2026';
}

export const JWT_SECRET = resolveJwtSecret();

