#!/bin/bash

# Server Setup Script for MLH TTU Application
# This script sets up a fresh server for the MLH TTU application

set -e

# Configuration
APP_NAME="mlh-ttu-app"
APP_USER="mlhapp"
APP_DIR="/home/$APP_USER/$APP_NAME"
DOMAIN=${1:-"yourdomain.com"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    error "This script must be run as root (use sudo)"
fi

log "Starting server setup for MLH TTU Application"
log "Domain: $DOMAIN"

# Update system packages
log "Updating system packages..."
apt update && apt upgrade -y
success "System packages updated"

# Install essential packages
log "Installing essential packages..."
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
success "Essential packages installed"

# Install Node.js
log "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
success "Node.js installed: $(node --version)"

# Install PostgreSQL
log "Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
success "PostgreSQL installed and started"

# Install Nginx
log "Installing Nginx..."
apt install -y nginx
systemctl start nginx
systemctl enable nginx
success "Nginx installed and started"

# Install PM2 globally
log "Installing PM2..."
npm install -g pm2
success "PM2 installed: $(pm2 --version)"

# Install additional tools
log "Installing additional tools..."
apt install -y htop iotop nethogs fail2ban ufw certbot python3-certbot-nginx
success "Additional tools installed"

# Create application user
log "Creating application user: $APP_USER"
if id "$APP_USER" &>/dev/null; then
    warning "User $APP_USER already exists"
else
    useradd -m -s /bin/bash "$APP_USER"
    usermod -aG sudo "$APP_USER"
    success "User $APP_USER created"
fi

# Create application directories
log "Creating application directories..."
sudo -u "$APP_USER" mkdir -p "$APP_DIR"
sudo -u "$APP_USER" mkdir -p "$APP_DIR/logs"
sudo -u "$APP_USER" mkdir -p "$APP_DIR/uploads"
sudo -u "$APP_USER" mkdir -p "$APP_DIR/backups"
sudo -u "$APP_USER" mkdir -p "$APP_DIR/scripts"

# Set proper permissions
chmod 755 "$APP_DIR"
chmod 755 "$APP_DIR/uploads"
chmod 755 "$APP_DIR/logs"
chmod 755 "$APP_DIR/backups"
success "Application directories created"

# Configure PostgreSQL
log "Configuring PostgreSQL..."

# Create database user and database
sudo -u postgres psql -c "CREATE USER mlhuser WITH PASSWORD 'change_this_password';" 2>/dev/null || warning "Database user might already exist"
sudo -u postgres psql -c "CREATE DATABASE mlh_ttu_production OWNER mlhuser;" 2>/dev/null || warning "Database might already exist"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE mlh_ttu_production TO mlhuser;" 2>/dev/null || true

# Update PostgreSQL configuration
PG_VERSION=$(sudo -u postgres psql -t -c "SELECT version();" | grep -oP '\d+\.\d+' | head -1)
PG_CONFIG_DIR="/etc/postgresql/$PG_VERSION/main"

if [ -f "$PG_CONFIG_DIR/postgresql.conf" ]; then
    # Backup original config
    cp "$PG_CONFIG_DIR/postgresql.conf" "$PG_CONFIG_DIR/postgresql.conf.backup"
    
    # Update configuration
    sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" "$PG_CONFIG_DIR/postgresql.conf"
    sed -i "s/#max_connections = 100/max_connections = 100/" "$PG_CONFIG_DIR/postgresql.conf"
    
    # Restart PostgreSQL
    systemctl restart postgresql
    success "PostgreSQL configured"
else
    warning "PostgreSQL configuration file not found"
fi

# Configure firewall
log "Configuring firewall..."
ufw --force enable
ufw allow ssh
ufw allow 'Nginx Full'
ufw allow from 127.0.0.1 to any port 5432
success "Firewall configured"

# Configure Fail2Ban
log "Configuring Fail2Ban..."
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
action = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]
logpath = /var/log/nginx/error.log
findtime = 600
bantime = 7200
maxretry = 10
EOF

systemctl restart fail2ban
success "Fail2Ban configured"

# Create basic Nginx configuration
log "Creating basic Nginx configuration..."
cat > /etc/nginx/sites-available/$APP_NAME << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Temporary configuration - will be updated after SSL setup
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /api/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Increase timeout for file uploads
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    location /auth/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Client max body size for file uploads
    client_max_body_size 10M;
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t
systemctl reload nginx
success "Nginx configured"

# Create environment file template
log "Creating environment file template..."
sudo -u "$APP_USER" cat > "$APP_DIR/.env.template" << 'EOF'
# Database
DATABASE_URL="postgresql://mlhuser:change_this_password@localhost:5432/mlh_ttu_production?schema=public"

# Authentication (Generate secure secrets)
SESSION_SECRET="your-super-secure-session-secret-32-chars-minimum"
JWT_SECRET="your-super-secure-jwt-secret-32-chars-minimum"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
MICROSOFT_CLIENT_ID="your-microsoft-oauth-client-id"
MICROSOFT_CLIENT_SECRET="your-microsoft-oauth-client-secret"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-specific-password"
FROM_EMAIL="noreply@yourdomain.com"

# Application URLs
CLIENT_URL="https://yourdomain.com"
SERVER_URL="https://api.yourdomain.com"

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR="/home/mlhapp/mlh-ttu-app/uploads"

# Environment
NODE_ENV="production"

# Security
CORS_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL="info"
LOG_FILE="/home/mlhapp/mlh-ttu-app/logs/app.log"

# Monitoring
HEALTH_CHECK_INTERVAL=30000
METRICS_ENABLED=true
METRICS_TOKEN="your-secure-metrics-token"
EOF

success "Environment template created"

# Create PM2 ecosystem template
log "Creating PM2 ecosystem template..."
sudo -u "$APP_USER" cat > "$APP_DIR/ecosystem.config.js" << 'EOF'
module.exports = {
  apps: [{
    name: 'mlh-ttu-backend',
    script: './server/dist/index.js',
    cwd: '/home/mlhapp/mlh-ttu-app',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    error_file: '/home/mlhapp/mlh-ttu-app/logs/error.log',
    out_file: '/home/mlhapp/mlh-ttu-app/logs/out.log',
    log_file: '/home/mlhapp/mlh-ttu-app/logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }, {
    name: 'mlh-ttu-frontend',
    script: 'serve',
    args: '-s client/dist -l 3000',
    cwd: '/home/mlhapp/mlh-ttu-app',
    instances: 1,
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/home/mlhapp/mlh-ttu-app/logs/frontend-error.log',
    out_file: '/home/mlhapp/mlh-ttu-app/logs/frontend-out.log'
  }]
};
EOF

# Install serve globally for frontend
npm install -g serve
success "PM2 ecosystem template created"

# Create logrotate configuration
log "Setting up log rotation..."
cat > /etc/logrotate.d/$APP_NAME << EOF
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 $APP_USER $APP_USER
    postrotate
        sudo -u $APP_USER pm2 reload all
    endscript
}
EOF

success "Log rotation configured"

# Create monitoring script
log "Creating monitoring script..."
sudo -u "$APP_USER" cat > "$APP_DIR/scripts/monitor.sh" << 'EOF'
#!/bin/bash

# System monitoring script
LOG_FILE="/home/mlhapp/mlh-ttu-app/logs/system-monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Check disk usage
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "$DATE - WARNING: Disk usage is ${DISK_USAGE}%" >> $LOG_FILE
fi

# Check memory usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.2f", $3/$2 * 100.0)}')
if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
    echo "$DATE - WARNING: Memory usage is ${MEMORY_USAGE}%" >> $LOG_FILE
fi

# Check if PM2 processes are running
PM2_STATUS=$(pm2 jlist | jq '.[].pm2_env.status' | grep -c "online" || echo "0")
if [ $PM2_STATUS -lt 2 ]; then
    echo "$DATE - ERROR: Some PM2 processes are not running" >> $LOG_FILE
    pm2 restart all
fi

# Check database connectivity
if ! pg_isready -h localhost -p 5432 -U mlhuser -d mlh_ttu_production > /dev/null 2>&1; then
    echo "$DATE - ERROR: Database is not accessible" >> $LOG_FILE
fi
EOF

chmod +x "$APP_DIR/scripts/monitor.sh"
success "Monitoring script created"

# Create backup scripts
log "Creating backup scripts..."

# Database backup script
sudo -u "$APP_USER" cat > "$APP_DIR/scripts/backup-db.sh" << 'EOF'
#!/bin/bash

BACKUP_DIR="/home/mlhapp/mlh-ttu-app/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="mlh_ttu_production"
DB_USER="mlhuser"

# Create backup
pg_dump -h localhost -U $DB_USER -d $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Keep only last 7 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Database backup completed: db_backup_$DATE.sql.gz"
EOF

chmod +x "$APP_DIR/scripts/backup-db.sh"

# File backup script
sudo -u "$APP_USER" cat > "$APP_DIR/scripts/backup-files.sh" << 'EOF'
#!/bin/bash

BACKUP_DIR="/home/mlhapp/mlh-ttu-app/backups"
DATE=$(date +%Y%m%d_%H%M%S)
UPLOAD_DIR="/home/mlhapp/mlh-ttu-app/uploads"

# Create backup of uploaded files
if [ -d "$UPLOAD_DIR" ] && [ "$(ls -A $UPLOAD_DIR)" ]; then
    tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz -C $UPLOAD_DIR .
    echo "File backup completed: files_backup_$DATE.tar.gz"
else
    echo "No files to backup"
fi

# Keep only last 7 days of file backups
find $BACKUP_DIR -name "files_backup_*.tar.gz" -mtime +7 -delete
EOF

chmod +x "$APP_DIR/scripts/backup-files.sh"
success "Backup scripts created"

# Set up cron jobs for the application user
log "Setting up cron jobs..."
sudo -u "$APP_USER" crontab -l > /tmp/crontab.tmp 2>/dev/null || true
echo "*/5 * * * * $APP_DIR/scripts/monitor.sh" >> /tmp/crontab.tmp
echo "0 2 * * * $APP_DIR/scripts/backup-db.sh" >> /tmp/crontab.tmp
echo "0 3 * * * $APP_DIR/scripts/backup-files.sh" >> /tmp/crontab.tmp
sudo -u "$APP_USER" crontab /tmp/crontab.tmp
rm /tmp/crontab.tmp
success "Cron jobs configured"

# Final system hardening
log "Applying final system hardening..."

# Disable root login
passwd -l root

# Update SSH configuration
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/#X11Forwarding yes/X11Forwarding no/' /etc/ssh/sshd_config
sed -i 's/#MaxAuthTries 6/MaxAuthTries 3/' /etc/ssh/sshd_config

systemctl restart ssh
success "System hardening applied"

# Setup automatic security updates
log "Setting up automatic security updates..."
apt install -y unattended-upgrades
echo 'Unattended-Upgrade::Automatic-Reboot "false";' >> /etc/apt/apt.conf.d/50unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
success "Automatic security updates configured"

success "Server setup completed successfully!"

echo ""
echo "=== Server Setup Summary ==="
echo "Domain: $DOMAIN"
echo "Application user: $APP_USER"
echo "Application directory: $APP_DIR"
echo "Database: mlh_ttu_production"
echo "Database user: mlhuser"
echo ""
echo "=== Next Steps ==="
echo "1. Update the database password in PostgreSQL"
echo "2. Copy your application code to $APP_DIR"
echo "3. Copy .env.template to .env and update with your values"
echo "4. Run the deployment script"
echo "5. Set up SSL certificate with: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo "=== Important Files ==="
echo "Environment template: $APP_DIR/.env.template"
echo "PM2 config: $APP_DIR/ecosystem.config.js"
echo "Nginx config: /etc/nginx/sites-available/$APP_NAME"
echo "Monitoring script: $APP_DIR/scripts/monitor.sh"
echo "Backup scripts: $APP_DIR/scripts/backup-*.sh"
echo ""

warning "Remember to:"
warning "1. Change the default database password"
warning "2. Configure your environment variables"
warning "3. Set up your OAuth applications"
warning "4. Configure your email settings"
warning "5. Set up SSL certificates"

log "Server setup script completed"