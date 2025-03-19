#!/bin/bash

# Maintenance script for Sales Tracking Application
# Save this as /root/maintenance.sh and make it executable with: chmod +x /root/maintenance.sh

LOG_FILE="/var/log/app-maintenance.log"
EMAIL="your-email@example.com"
APP_DIR="/var/www/SALES-TRACKING-WEBSITE"
APP_NAME="sales-tracker"

# Initialize log
echo "========================================" >> $LOG_FILE
echo "Maintenance check started at $(date)" >> $LOG_FILE
echo "========================================" >> $LOG_FILE

# Function to send email alerts
send_alert() {
    local subject="$1"
    local message="$2"
    echo "$message" | mail -s "$subject" $EMAIL
    echo "Alert sent: $subject" >> $LOG_FILE
}

# Check disk space
check_disk_space() {
    echo "Checking disk space..." >> $LOG_FILE
    DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    echo "Current disk usage: ${DISK_USAGE}%" >> $LOG_FILE
    
    if [ $DISK_USAGE -gt 85 ]; then
        send_alert "HIGH DISK USAGE ALERT" "Disk usage is at ${DISK_USAGE}% on your server."
    fi
}

# Check memory usage
check_memory() {
    echo "Checking memory usage..." >> $LOG_FILE
    FREE_MEM=$(free -m | awk 'NR==2 {print $4}')
    echo "Free memory: ${FREE_MEM}MB" >> $LOG_FILE
    
    if [ $FREE_MEM -lt 100 ]; then
        send_alert "LOW MEMORY ALERT" "Server memory is low with only ${FREE_MEM}MB free."
    fi
}

# Check if application is running
check_app_status() {
    echo "Checking application status..." >> $LOG_FILE
    
    # Check if PM2 process exists
    PM2_STATUS=$(pm2 list | grep $APP_NAME | awk '{print $10}')
    echo "PM2 process status: $PM2_STATUS" >> $LOG_FILE
    
    if [ "$PM2_STATUS" != "online" ]; then
        echo "Application is not running, attempting to restart..." >> $LOG_FILE
        pm2 restart $APP_NAME
        sleep 5
        
        # Check again
        NEW_STATUS=$(pm2 list | grep $APP_NAME | awk '{print $10}')
        if [ "$NEW_STATUS" != "online" ]; then
            send_alert "APPLICATION DOWN ALERT" "The application is down and could not be restarted automatically."
        else
            echo "Application restarted successfully" >> $LOG_FILE
        fi
    fi
    
    # Check if port is listening
    PORT_CHECK=$(netstat -tuln | grep 5001)
    if [ -z "$PORT_CHECK" ]; then
        send_alert "PORT NOT LISTENING ALERT" "Application port 5001 is not listening."
    else
        echo "Port 5001 is listening" >> $LOG_FILE
    fi
}

# Check for system updates
check_updates() {
    echo "Checking for system updates..." >> $LOG_FILE
    apt update &>/dev/null
    UPDATES=$(apt list --upgradable 2>/dev/null | wc -l)
    SECURITY_UPDATES=$(apt list --upgradable 2>/dev/null | grep -i security | wc -l)
    
    echo "Available updates: $UPDATES" >> $LOG_FILE
    echo "Security updates: $SECURITY_UPDATES" >> $LOG_FILE
    
    if [ $SECURITY_UPDATES -gt 0 ]; then
        send_alert "SECURITY UPDATES AVAILABLE" "$SECURITY_UPDATES security updates are available for your server."
    fi
}

# Check SSL certificate expiration
check_ssl() {
    echo "Checking SSL certificate..." >> $LOG_FILE
    # Replace with your domain if you have one
    DOMAIN="209.38.123.231"
    
    if command -v openssl &>/dev/null && command -v curl &>/dev/null; then
        CERT_INFO=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null)
        
        if [ ! -z "$CERT_INFO" ]; then
            # Extract expiration date
            EXPIRY_DATE=$(echo "$CERT_INFO" | sed -n 's/notAfter=//p')
            EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
            CURRENT_EPOCH=$(date +%s)
            DAYS_LEFT=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))
            
            echo "SSL certificate expires in $DAYS_LEFT days" >> $LOG_FILE
            
            if [ $DAYS_LEFT -lt 15 ]; then
                send_alert "SSL CERTIFICATE EXPIRY ALERT" "Your SSL certificate will expire in $DAYS_LEFT days."
            fi
        else
            echo "Could not get SSL certificate information" >> $LOG_FILE
        fi
    else
        echo "OpenSSL or curl not available for SSL check" >> $LOG_FILE
    fi
}

# Backup application code
backup_app() {
    echo "Backing up application code..." >> $LOG_FILE
    BACKUP_DIR="/root/backups"
    TIMESTAMP=$(date +%Y%m%d%H%M%S)
    
    # Create backup directory if it doesn't exist
    mkdir -p $BACKUP_DIR
    
    # Create backup
    tar -czf $BACKUP_DIR/app_backup_$TIMESTAMP.tar.gz $APP_DIR
    
    # Keep only the last 5 backups
    ls -t $BACKUP_DIR/app_backup_*.tar.gz | tail -n +6 | xargs -r rm
    
    echo "Backup completed: $BACKUP_DIR/app_backup_$TIMESTAMP.tar.gz" >> $LOG_FILE
}

# Run all checks
check_disk_space
check_memory
check_app_status
check_updates
check_ssl
backup_app

# Log completion
echo "Maintenance check completed at $(date)" >> $LOG_FILE
echo "========================================" >> $LOG_FILE