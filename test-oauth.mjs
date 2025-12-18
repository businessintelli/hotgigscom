import "dotenv/config";

// Test OAuth configuration
console.log("=== OAuth Configuration Test ===\n");

console.log("Environment Variables:");
console.log("- OAUTH_SERVER_URL:", process.env.OAUTH_SERVER_URL || "❌ NOT SET");
console.log("- VITE_APP_ID:", process.env.VITE_APP_ID || "❌ NOT SET");
console.log("- JWT_SECRET:", process.env.JWT_SECRET ? "✅ SET" : "❌ NOT SET");
console.log("- VITE_OAUTH_PORTAL_URL:", process.env.VITE_OAUTH_PORTAL_URL || "❌ NOT SET");

console.log("\n=== OAuth Flow URLs ===\n");

const appId = process.env.VITE_APP_ID;
const oauthPortalUrl = process.env.VITE_OAUTH_PORTAL_URL;
const callbackUrl = "https://3000-i66joyn0rshpan8poxxj3-061f6895.manusvm.computer/api/oauth/callback";

if (appId && oauthPortalUrl) {
  const state = Buffer.from(callbackUrl).toString('base64');
  const loginUrl = `${oauthPortalUrl}/app-auth?appId=${appId}&redirectUri=${encodeURIComponent(callbackUrl)}&state=${state}&type=signIn`;
  
  console.log("Login URL that should be generated:");
  console.log(loginUrl);
  console.log("\nCallback URL:");
  console.log(callbackUrl);
  console.log("\nState (base64 encoded callback URL):");
  console.log(state);
} else {
  console.log("❌ Cannot generate URLs - missing environment variables");
}

console.log("\n=== Recommendations ===\n");

if (!process.env.OAUTH_SERVER_URL) {
  console.log("⚠️  OAUTH_SERVER_URL is not set. OAuth will not work.");
}

if (!process.env.VITE_APP_ID) {
  console.log("⚠️  VITE_APP_ID is not set. OAuth will not work.");
}

if (!process.env.JWT_SECRET) {
  console.log("⚠️  JWT_SECRET is not set. Session tokens cannot be created.");
}

console.log("\n✅ Test complete");
