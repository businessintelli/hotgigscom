export const ENV = {
  // App Configuration
  appId: process.env.VITE_APP_ID ?? "",
  appTitle: process.env.VITE_APP_TITLE ?? "",
  appLogo: process.env.VITE_APP_LOGO ?? "",
  
  // Authentication & Security
  cookieSecret: process.env.JWT_SECRET ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  oauthPortalUrl: process.env.VITE_OAUTH_PORTAL_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  ownerName: process.env.OWNER_NAME ?? "",
  
  // Database
  databaseUrl: process.env.DATABASE_URL ?? "",
  
  // Environment
  isProduction: process.env.NODE_ENV === "production",
  nodeEnv: process.env.NODE_ENV ?? "development",
  
  // Manus Forge API
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  frontendForgeApiKey: process.env.VITE_FRONTEND_FORGE_API_KEY ?? "",
  frontendForgeApiUrl: process.env.VITE_FRONTEND_FORGE_API_URL ?? "",
  
  // AI/LLM APIs
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  
  // Email Services
  sendGridApiKey: process.env.SENDGRID_API_KEY ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  
  // Video Conferencing
  zoomClientId: process.env.ZOOM_CLIENT_ID ?? "",
  zoomClientSecret: process.env.ZOOM_CLIENT_SECRET ?? "",
  zoomAccountId: process.env.ZOOM_ACCOUNT_ID ?? "",
  teamsClientId: process.env.TEAMS_CLIENT_ID ?? "",
  teamsClientSecret: process.env.TEAMS_CLIENT_SECRET ?? "",
  teamsTenantId: process.env.TEAMS_TENANT_ID ?? "",
  videoProvider: process.env.VIDEO_PROVIDER ?? "none",
  
  // Analytics
  analyticsWebsiteId: process.env.VITE_ANALYTICS_WEBSITE_ID ?? "",
  analyticsEndpoint: process.env.VITE_ANALYTICS_ENDPOINT ?? "",
  
  // Storage
  s3BucketName: process.env.S3_BUCKET_NAME ?? "",
  s3Region: process.env.S3_REGION ?? "",
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  
  // Payment
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripePublishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  
  // SMS/Communication
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? "",
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER ?? "",
};
