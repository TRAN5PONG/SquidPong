#!/bin/sh

# Database cleanup script for SquidPong services
# This script removes/resets databases for specified services

SERVICES_DIR="/home/xylar-99/Desktop/SquidPong/backend/services"

# Default services if none specified
DEFAULT_SERVICES="auth user chat notify"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to remove database for a service
remove_service_db() {
    local service=$1
    local service_path="$SERVICES_DIR/$service"
    
    if [ ! -d "$service_path" ]; then
        print_error "Service '$service' not found at $service_path"
        return 1
    fi
    
    print_status "Processing service: $service"
    
    # Check if prisma directory exists
    if [ ! -d "$service_path/prisma" ]; then
        print_warning "No prisma directory found for service '$service'"
        return 0
    fi
    
    # Find and remove SQLite database files
    find "$service_path" -name "*.db" -type f | while read -r db_file; do
        print_status "Removing database file: $db_file"
        rm -f "$db_file"
        if [ $? -eq 0 ]; then
            print_success "Removed: $db_file"
        else
            print_error "Failed to remove: $db_file"
        fi
    done
    
    # Remove SQLite journal and WAL files
    find "$service_path" -name "*.db-journal" -o -name "*.db-wal" -o -name "*.db-shm" | while read -r journal_file; do
        print_status "Removing journal file: $journal_file"
        rm -f "$journal_file"
        if [ $? -eq 0 ]; then
            print_success "Removed: $journal_file"
        else
            print_error "Failed to remove: $journal_file"
        fi
    done
    
    # Remove migrations (optional - uncomment if you want to reset migrations too)
    # if [ -d "$service_path/prisma/migrations" ]; then
    #     print_status "Removing migrations for service: $service"
    #     rm -rf "$service_path/prisma/migrations"
    #     print_success "Removed migrations for: $service"
    # fi
    
    print_success "Database cleanup completed for service: $service"
}

# Function to reset database (remove + regenerate)
reset_service_db() {
    local service=$1
    local service_path="$SERVICES_DIR/$service"
    
    # Remove database first
    remove_service_db "$service"
    
    # Regenerate database with Prisma
    if [ -d "$service_path" ] && [ -f "$service_path/package.json" ]; then
        print_status "Regenerating database for service: $service"
        cd "$service_path"
        
        # Generate Prisma client
        if command -v npx >/dev/null 2>&1; then
            npx prisma generate
            if [ $? -eq 0 ]; then
                print_success "Generated Prisma client for: $service"
            else
                print_error "Failed to generate Prisma client for: $service"
            fi
            
            # Push database schema
            npx prisma db push
            if [ $? -eq 0 ]; then
                print_success "Pushed database schema for: $service"
            else
                print_error "Failed to push database schema for: $service"
            fi
        else
            print_warning "npx not found. Please install Node.js and run 'npx prisma generate && npx prisma db push' manually in $service_path"
        fi
        
        cd - > /dev/null
    fi
}

# Main script logic
main() {
    print_status "SquidPong Database Cleanup Script"
    echo "=================================="
    
    # Parse command line arguments
    OPERATION="remove" # default operation
    SERVICES=""
    
    while [ $# -gt 0 ]; do
        case $1 in
            --reset)
                OPERATION="reset"
                shift
                ;;
            --services)
                SERVICES="$2"
                shift 2
                ;;
            --help|-h)
                echo "Usage: $0 [OPTIONS] [SERVICES...]"
                echo ""
                echo "OPTIONS:"
                echo "  --reset         Remove and regenerate databases (default: just remove)"
                echo "  --services LIST Specify services separated by spaces (default: auth user chat)"
                echo "  --help, -h      Show this help message"
                echo ""
                echo "EXAMPLES:"
                echo "  $0                           # Remove databases for auth, user, chat"
                echo "  $0 --services \"auth user\"     # Remove databases for auth and user only"
                echo "  $0 --reset                   # Remove and regenerate databases for default services"
                echo "  $0 --reset --services \"chat\" # Remove and regenerate database for chat only"
                echo ""
                echo "AVAILABLE SERVICES:"
                ls "$SERVICES_DIR" 2>/dev/null | grep -v "gateway" | tr '\n' ' '
                echo ""
                exit 0
                ;;
            *)
                if [ -z "$SERVICES" ]; then
                    SERVICES="$*"
                fi
                break
                ;;
        esac
    done
    
    # Use default services if none specified
    if [ -z "$SERVICES" ]; then
        SERVICES="$DEFAULT_SERVICES"
    fi
    
    print_status "Operation: $OPERATION"
    print_status "Services: $SERVICES"
    echo ""
    
    # Confirm operation
    echo "This will $OPERATION databases for the following services: $SERVICES"
    echo "Are you sure you want to continue? (y/N)"
    read -r confirmation
    
    if [ "$confirmation" != "y" ] && [ "$confirmation" != "Y" ]; then
        print_warning "Operation cancelled by user"
        exit 0
    fi
    
    # Process each service
    for service in $SERVICES; do
        echo ""
        if [ "$OPERATION" = "reset" ]; then
            reset_service_db "$service"
        else
            remove_service_db "$service"
        fi
    done
    
    echo ""
    print_success "Database cleanup operation completed!"
    
    if [ "$OPERATION" = "remove" ]; then
        echo ""
        print_status "To regenerate the databases, you can:"
        print_status "1. Run this script with --reset flag"
        print_status "2. Or manually run 'npx prisma generate && npx prisma db push' in each service directory"
    fi
}

# Run main function with all arguments
main "$@"
