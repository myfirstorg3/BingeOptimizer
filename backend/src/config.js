import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  DB_TYPE: process.env.DB_TYPE || 'postgres', // postgres, mysql, sqlite
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || 5432,
  DB_NAME: process.env.DB_NAME || 'blastoise',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_URL: process.env.DATABASE_URL,
  
  // Redis
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: process.env.REDIS_PORT || 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  
  // OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/auth/google/callback',
  
  FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET,
  FACEBOOK_CALLBACK_URL: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:5000/auth/facebook/callback',
  
  // Gemini API
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  
  // Local LLM Service
  LOCAL_LLM_URL: process.env.LOCAL_LLM_URL || 'http://localhost:8000',
  
  // External APIs
  OMDB_API_KEY: process.env.OMDB_API_KEY,
  TMDB_API_KEY: process.env.TMDB_API_KEY,
  
  // Frontend URLs
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // File storage
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  
  // OTP
  OTP_LENGTH: 6,
  OTP_EXPIRY: 10 * 60 * 1000, // 10 minutes
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
};

export default config;
