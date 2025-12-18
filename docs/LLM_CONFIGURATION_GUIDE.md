# LLM Configuration Management Guide

## Overview

The HotGigs platform now includes a centralized LLM (Large Language Model) Configuration Management system that allows application administrators to configure, switch, and manage AI providers from a single interface in the Admin dashboard.

## Features

### ✅ What You Can Do from the UI

1. **View All Providers**: See status, configuration, and usage statistics for all LLM providers
2. **Configure Providers**: Set API keys, model names, and advanced parameters
3. **Switch Providers**: Activate any configured provider with one click
4. **Test Connections**: Verify provider connectivity before activation
5. **Monitor Usage**: Track requests, tokens, costs, and success rates
6. **View Logs**: Access detailed usage logs for debugging and analytics

### 🔒 Admin Access Only

- Only users with `role = 'admin'` can access LLM Settings
- Application admin: **info@hotgigs.com**
- Access via: **Admin Dashboard → LLM Settings**

## Supported Providers

### 1. 🔷 Manus Forge (Default)
- **Built-in provider** on Manus platform
- **No configuration needed** - automatically available
- **Best for**: Production use on Manus platform
- **Priority**: 100 (highest)

### 2. 💎 Google Gemini
- **Cost-efficient** and fast
- **Requires**: Google AI Studio API key
- **Recommended model**: `gemini-1.5-flash`
- **Best for**: High-volume, cost-sensitive workloads
- **Priority**: 90
- **Get API Key**: https://aistudio.google.com/app/apikey

### 3. 🤖 OpenAI GPT
- **Industry standard** AI provider
- **Requires**: OpenAI Platform API key
- **Recommended models**: `gpt-3.5-turbo`, `gpt-4`
- **Best for**: Advanced reasoning, complex tasks
- **Priority**: 80
- **Get API Key**: https://platform.openai.com/api-keys

### 4. 🏠 Ollama (Self-hosted)
- **Run locally** or on your infrastructure
- **Requires**: Ollama server URL
- **Recommended model**: `deepseek-vl2`
- **Best for**: Privacy-sensitive data, unlimited usage
- **Priority**: 70
- **Setup**: https://ollama.ai

## How It Works

### Priority System

Providers are prioritized by:
1. **Database Active Provider** (highest priority)
2. **Manus Forge** (if available)
3. **Google Gemini** (if API key configured)
4. **OpenAI** (if API key configured)
5. **Ollama** (if API URL configured)

### Configuration Flow

```
User configures provider in UI
    ↓
Configuration saved to database
    ↓
Admin activates provider
    ↓
All AI operations use active provider
    ↓
Usage tracked in database
```

### Fallback Mechanism

If database configuration is unavailable, the system falls back to environment variables:
- `BUILT_IN_FORGE_API_KEY` → Manus Forge
- `GOOGLE_GEMINI_API_KEY` → Google Gemini
- `OPENAI_API_KEY` → OpenAI
- `OLLAMA_API_URL` → Ollama

## Configuration Guide

### Step 1: Access LLM Settings

1. Log in as admin (info@hotgigs.com)
2. Navigate to **Admin Dashboard**
3. Click **LLM Settings** in the sidebar

### Step 2: Configure a Provider

#### For Google Gemini:
1. Visit https://aistudio.google.com/app/apikey
2. Create a new API key
3. In LLM Settings, click **Configure** on the Gemini card
4. Paste your API key
5. (Optional) Change model name (default: `gemini-1.5-flash`)
6. Click **Save Configuration**

#### For OpenAI:
1. Visit https://platform.openai.com/api-keys
2. Create a new API key
3. In LLM Settings, click **Configure** on the OpenAI card
4. Paste your API key
5. (Optional) Change model name (default: `gpt-3.5-turbo`)
6. Click **Save Configuration**

#### For Ollama:
1. Install Ollama: https://ollama.ai
2. Start Ollama server: `ollama serve`
3. Pull a model: `ollama pull deepseek-vl2`
4. In LLM Settings, click **Configure** on the Ollama card
5. Enter API URL (default: `http://localhost:11434`)
6. Enter model name (default: `deepseek-vl2`)
7. Click **Save Configuration**

### Step 3: Test Connection

1. After configuring, click **Test Connection**
2. Wait for test result (shows response time and status)
3. If successful, status changes to "Healthy"
4. If failed, check error message and reconfigure

### Step 4: Activate Provider

1. Once configured and tested, click **Activate**
2. Provider becomes active immediately
3. All AI operations now use this provider
4. Previous provider is automatically deactivated

## Advanced Configuration

### Parameters You Can Configure

| Parameter | Description | Default | Range |
|-----------|-------------|---------|-------|
| **API Key** | Authentication key for cloud providers | - | - |
| **API URL** | Endpoint URL (Ollama only) | - | Valid URL |
| **Model Name** | Specific model to use | Provider default | Any supported model |
| **Max Tokens** | Maximum tokens per request | 4096 | 1 - 100,000 |
| **Temperature** | Response randomness | 0.7 | 0.0 - 2.0 |
| **Timeout** | Request timeout in seconds | 30 | 5 - 300 |
| **Notes** | Admin notes about configuration | - | Text |

### Usage Statistics

The dashboard shows:
- **Total Requests**: Number of API calls made
- **Total Tokens**: Tokens consumed across all requests
- **Success Rate**: Percentage of successful requests
- **Avg Response Time**: Average API response time in milliseconds

### Usage Logs

Access detailed logs showing:
- Provider and model used
- Feature that triggered the request
- Token usage (prompt, completion, total)
- Response time and success status
- Error messages (if any)
- Estimated cost

## Database Schema

### Tables Created

#### `llm_configurations`
Stores provider configurations:
- Provider details (name, priority, status)
- API credentials (encrypted in production)
- Model settings (name, max_tokens, temperature)
- Usage tracking (total requests, tokens, last used)
- Health status (healthy, error, rate_limited)

#### `llm_usage_logs`
Tracks every LLM API call:
- Provider and model
- Feature and user
- Token usage
- Performance metrics
- Cost estimation

## Manual Environment File Updates

### When Database Configuration is Not Available

If you need to configure providers via environment variables (e.g., during initial setup or database issues):

#### 1. For Manus Forge (Automatic)
```bash
# Already configured by Manus platform
BUILT_IN_FORGE_API_KEY=<auto-injected>
BUILT_IN_FORGE_API_URL=<auto-injected>
```

#### 2. For Google Gemini
```bash
# Add to .env file or environment variables
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
```

#### 3. For OpenAI
```bash
# Add to .env file or environment variables
OPENAI_API_KEY=your_openai_api_key_here
```

#### 4. For Ollama
```bash
# Add to .env file or environment variables
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=deepseek-vl2  # Optional, defaults to deepseek-vl2
```

### Environment Variable Priority

Environment variables are used as **fallback** when:
1. Database configuration is not available
2. No provider is activated in the database
3. Database connection fails

**Recommendation**: Use the UI configuration whenever possible for easier management and monitoring.

## Troubleshooting

### Provider Shows "Error" Status

**Possible causes:**
- Invalid API key
- Network connectivity issues
- Rate limit exceeded
- Model not available

**Solutions:**
1. Click **Test Connection** to see detailed error
2. Verify API key is correct
3. Check provider's status page
4. Try a different model
5. Wait if rate limited

### "No LLM provider configured" Error

**Cause:** No provider is activated and no environment variables are set.

**Solution:**
1. Go to Admin → LLM Settings
2. Configure at least one provider
3. Click **Activate** on the configured provider

### API Key Not Working After Configuration

**Possible issues:**
- API key was not saved (check if field shows masked value)
- Provider requires additional setup (billing, permissions)
- API key has expired or been revoked

**Solution:**
1. Reconfigure with a fresh API key
2. Verify billing is enabled on provider's platform
3. Check API key permissions

### Connection Test Fails But Provider Works

**Cause:** Test uses a simple prompt that may not reflect actual usage.

**Solution:**
- If test fails but actual operations work, you can still activate
- Check usage logs to verify real-world performance

## Security Considerations

### API Key Storage

- API keys are stored in the database
- **Production recommendation**: Encrypt sensitive fields at rest
- Keys are masked in UI responses (only last 4 characters shown)
- Only admins can view/edit configurations

### Access Control

- LLM Settings page requires `role = 'admin'`
- tRPC endpoints protected with `adminProcedure`
- Non-admin users see "Access Denied" message

### Best Practices

1. **Rotate API keys regularly**
2. **Monitor usage logs** for suspicious activity
3. **Set up rate limits** on provider platforms
4. **Use separate keys** for development and production
5. **Enable billing alerts** on cloud providers

## Cost Management

### Estimating Costs

Different providers have different pricing models:

| Provider | Pricing Model | Typical Cost |
|----------|---------------|--------------|
| Manus Forge | Included in platform | Free |
| Google Gemini | Per token | $0.075 / 1M tokens (Flash) |
| OpenAI | Per token | $0.50 / 1M tokens (GPT-3.5) |
| Ollama | Self-hosted | Infrastructure cost only |

### Monitoring Costs

1. Check **Usage Statistics** in LLM Settings
2. Review **Usage Logs** for detailed breakdown
3. Set up billing alerts on provider platforms
4. Consider switching to Ollama for high-volume use

## Migration Guide

### From Environment Variables to Database Configuration

1. **Identify current provider** (check logs or environment)
2. **Configure in UI** with same credentials
3. **Test connection** to verify
4. **Activate provider** in UI
5. **(Optional) Remove environment variables** for cleaner setup

### Switching Providers

1. **Configure new provider** in UI
2. **Test connection** to ensure it works
3. **Click Activate** on new provider
4. Previous provider automatically deactivated
5. **Monitor usage logs** to verify switch

## API Reference

### tRPC Endpoints

All endpoints require admin authentication.

#### `llmConfig.getAllConfigurations`
Get all provider configurations.

#### `llmConfig.getConfiguration`
Get configuration for specific provider.
- Input: `{ provider: "manus" | "gemini" | "openai" | "ollama" }`

#### `llmConfig.getActiveProvider`
Get currently active provider.

#### `llmConfig.updateConfiguration`
Update provider configuration.
- Input: `{ provider, api_key?, api_url?, model_name?, max_tokens?, temperature?, timeout_seconds?, notes? }`

#### `llmConfig.activateProvider`
Activate a provider (deactivates others).
- Input: `{ provider }`

#### `llmConfig.testConnection`
Test connection to a provider.
- Input: `{ provider, api_key?, api_url?, model_name? }`

#### `llmConfig.getUsageStats`
Get usage statistics.
- Input: `{ provider?, startDate?, endDate? }`

#### `llmConfig.getUsageLogs`
Get usage logs with pagination.
- Input: `{ provider?, feature?, success?, limit?, offset? }`

## Support

For issues or questions:
1. Check this documentation
2. Review usage logs in Admin dashboard
3. Test connection to verify provider status
4. Submit feedback at https://help.manus.im

---

**Last Updated**: December 2024
**Version**: 1.0
