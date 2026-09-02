import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.join(process.cwd(), '.env'),
});

export default {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  base_url: process.env.BASE_URL,
  client_url: process.env.CLIENT_URL,
  admin_url: process.env.ADMIN_URL,
  // Extra comma-separated origins allowed to talk to the API with credentials.
  extra_cors_origins: process.env.EXTRA_CORS_ORIGINS,
  // Relying-Party identifier for WebAuthn (the registrable domain, no scheme/port).
  webauthn_rp_id: process.env.WEBAUTHN_RP_ID,
  webauthn_rp_name: process.env.WEBAUTHN_RP_NAME,
  database_url: process.env.MONGO_URL,
  database_password: process.env.DB_PASSWORD,
  activation_secret: process.env.ACTIVATION_SECRET,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  google_api_key: process.env.GOOGLE_API_KEY,
  smart_link_public_domain: process.env.SMART_LINK_PUBLIC_DOMAIN,

  pdl: {
    base_url: process.env.PDL_API,
    email: process.env.COSMOS_EMAIL,
    password: process.env.COSMOS_PASSWORD,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    refresh_secret: process.env.JWT_REFRESH_SECRET,
    expires_in: process.env.JWT_EXPIRES_IN,
    refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
  },
  smtp: {
    smtp_host: process.env.SMTP_HOST,
    smtp_port: process.env.SMTP_PORT,
    smtp_service: process.env.SMTP_SERVICE,
    smtp_mail: process.env.SMTP_MAIL,
    smtp_password: process.env.SMTP_PASSWORD,
    NAME: process.env.SERVICE_NAME,
  },
  resetlink: process.env.RESET_PASS_UI_LINK,

  sendgrid: {
    from_email: process.env.FORM_EMAIL,
    api_key: process.env.SEND_GRIDAPI_KEY,
  },
  r2: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    region: process.env.R2_REGION,
    bucketName: process.env.R2_BUCKET_NAME,
    endpoint: process.env.R2_ENDPOINT,
    publicUrl: process.env.R2_PUBLIC_URL,
  },
  be_music_aws: {
    accessKeyId: process.env.BEMUSIX_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.BEMUSIX_AWS_SECRET_ACCESS_KEY,
    region: process.env.BEMUSIX_AWS_REGION,
    bucketName: process.env.BEMUSIX_S3_BUCKET_NAME,
  },
  acr: {
    accessKey: process.env.ACR_ACCESS_KEY,
    secretKey: process.env.ACR_SECRET_KEY,
    host: process.env.ACR_HOST,
  },
  vevo: {
    accessKey: process.env.VEVO_S3_ACCESS_KEY_ID,
    secretKey: process.env.VEVO_S3_ACCESS_KEY_SECRET,
    bucket: process.env.VEVO_S3_BUCKET_NAME,
    region: process.env.VEVO_S3_REGION,
  },
  transfer_s3: {
    accessKey: process.env.TRANSFER_S3_ACCESS_KEY_ID,
    secretKey: process.env.TRANSFER_S3_ACCESS_KEY_SECRET,
    bucket: process.env.TRANSFER_S3_BUCKET_NAME,
    region: process.env.TRANSFER_S3_REGION,
  },
  brevo: {
    NAME: process.env.BREVO_NAME,
    SENDER_EMAIL: process.env.SENDER_EMAIL,
    BREVO_API_KEY: process.env.BREVO_API_KEY,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
  settings: {
    encryptionKey: process.env.SETTINGS_ENCRYPTION_KEY,
  },
  revelator: {
    baseUrl: process.env.REVELATOR_BASE_URL || 'https://backstage.ptunestudio.com',
    uploadTempDir: process.env.REVELATOR_UPLOAD_TEMP_DIR,
    analyticsTempDir: process.env.REVELATOR_ANALYTICS_TEMP_DIR,
    analyticsCron: process.env.REVELATOR_ANALYTICS_CRON || '0 3 * * *',
  },
};
