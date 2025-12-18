#!/bin/bash

###############################################################################
# HotGigs Platform - Environment Backup Script
# 
# Creates a backup of environment variables and configuration
# Usage: ./scripts/backup-environment.sh [description]
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running from project root
if [ ! -f "package.json" ]; then
    log_error "This script must be run from the project root directory"
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    log_error ".env file not found"
    exit 1
fi

# Create backups directory
BACKUP_DIR="backups/environment"
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/env_backup_${TIMESTAMP}.json"
METADATA_FILE="$BACKUP_DIR/env_backup_${TIMESTAMP}.meta.json"

# Get description from argument or prompt
DESCRIPTION="${1:-Manual environment backup via script}"

log_info "╔════════════════════════════════════════════════════╗"
log_info "║       HotGigs Environment Backup                   ║"
log_info "╚════════════════════════════════════════════════════╝"
echo ""
log_info "Backup file: $BACKUP_FILE"
log_info "Description: $DESCRIPTION"
echo ""

# List of sensitive keys that should be noted (but not exposed in logs)
SENSITIVE_KEYS=(
    "DATABASE_URL"
    "JWT_SECRET"
    "SENDGRID_API_KEY"
    "RESEND_API_KEY"
    "OPENAI_API_KEY"
    "BUILT_IN_FORGE_API_KEY"
    "VITE_FRONTEND_FORGE_API_KEY"
    "BACKUP_ENCRYPTION_KEY"
)

# Create JSON backup
log_info "Creating environment backup..."

# Start JSON structure
echo "{" > "$BACKUP_FILE"
echo "  \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"," >> "$BACKUP_FILE"
echo "  \"description\": \"$DESCRIPTION\"," >> "$BACKUP_FILE"
echo "  \"created_by\": \"${USER:-unknown}\"," >> "$BACKUP_FILE"
echo "  \"hostname\": \"$(hostname)\"," >> "$BACKUP_FILE"
echo "  \"environment\": {" >> "$BACKUP_FILE"

# Read .env file and convert to JSON
FIRST=true
while IFS='=' read -r key value; do
    # Skip comments and empty lines
    if [[ $key =~ ^#.*$ ]] || [ -z "$key" ]; then
        continue
    fi
    
    # Remove quotes from value if present
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    
    # Escape special characters for JSON
    value=$(echo "$value" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g')
    
    # Add comma if not first entry
    if [ "$FIRST" = false ]; then
        echo "," >> "$BACKUP_FILE"
    fi
    FIRST=false
    
    # Write key-value pair
    echo -n "    \"$key\": \"$value\"" >> "$BACKUP_FILE"
done < .env

# Close JSON structure
echo "" >> "$BACKUP_FILE"
echo "  }," >> "$BACKUP_FILE"
echo "  \"sensitive_keys\": [" >> "$BACKUP_FILE"

# Add sensitive keys list
FIRST=true
for key in "${SENSITIVE_KEYS[@]}"; do
    if [ "$FIRST" = false ]; then
        echo "," >> "$BACKUP_FILE"
    fi
    FIRST=false
    echo -n "    \"$key\"" >> "$BACKUP_FILE"
done

echo "" >> "$BACKUP_FILE"
echo "  ]" >> "$BACKUP_FILE"
echo "}" >> "$BACKUP_FILE"

# Get file size
BACKUP_SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null)

# Count environment variables
VAR_COUNT=$(grep -c ":" "$BACKUP_FILE" | awk '{print $1-6}') # Subtract metadata fields

# Create metadata file
cat > "$METADATA_FILE" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "filename": "$(basename $BACKUP_FILE)",
  "size_bytes": $BACKUP_SIZE,
  "description": "$DESCRIPTION",
  "created_by": "${USER:-unknown}",
  "hostname": "$(hostname)",
  "variable_count": $VAR_COUNT,
  "sensitive_count": ${#SENSITIVE_KEYS[@]}
}
EOF

log_success "Environment backup created successfully!"
echo ""
log_info "Backup Details:"
log_info "  File: $BACKUP_FILE"
log_info "  Variables: $VAR_COUNT"
log_info "  Sensitive keys: ${#SENSITIVE_KEYS[@]}"
log_info "  Metadata: $METADATA_FILE"
echo ""

log_warning "⚠️  Security Notice:"
log_warning "  This backup contains sensitive information!"
log_warning "  Store it securely and never commit to version control."
echo ""

# List recent backups
log_info "Recent environment backups:"
ls -lht "$BACKUP_DIR" | head -n 6
echo ""

log_success "╔════════════════════════════════════════════════════╗"
log_success "║       Backup completed successfully!               ║"
log_success "╚════════════════════════════════════════════════════╝"
