#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "================================================"
echo "  Checking Docker Services Status"
echo "================================================"
echo ""

# Get all services from docker-compose
SERVICES=(
    "nginx"
    "redis"
    "rabbitmq"
    "frontend"
    "gateway"
    "auth"
    "user"
    "notify"
    "chat"
    "game"
)

ALL_RUNNING=true

# Check each service
for service in "${SERVICES[@]}"; do
    # Check if container exists and is running
    status=$(docker inspect -f '{{.State.Running}}' "$service" 2>/dev/null)
    
    if [ "$status" == "true" ]; then
        # Get health status if available
        health=$(docker inspect -f '{{.State.Health.Status}}' "$service" 2>/dev/null)
        
        if [ "$health" == "healthy" ]; then
            echo -e "${GREEN}✓${NC} $service - Running (Healthy)"
        elif [ "$health" == "unhealthy" ]; then
            echo -e "${RED}✗${NC} $service - Running (Unhealthy)"
            ALL_RUNNING=false
        elif [ "$health" == "starting" ]; then
            echo -e "${YELLOW}⟳${NC} $service - Running (Starting...)"
        else
            echo -e "${GREEN}✓${NC} $service - Running"
        fi
    elif [ "$status" == "false" ]; then
        echo -e "${RED}✗${NC} $service - Stopped"
        ALL_RUNNING=false
    else
        echo -e "${RED}✗${NC} $service - Not Found"
        ALL_RUNNING=false
    fi
done

echo ""
echo "================================================"

if [ "$ALL_RUNNING" = true ]; then
    echo -e "${GREEN}All services are running successfully!${NC}"
    echo ""
    echo "Access your application at:"
    echo "  https://10.13.249.173"
    echo ""
    exit 0
else
    echo -e "${RED}Some services are not running properly!${NC}"
    echo ""
    echo "Run 'docker compose logs [service-name]' to check errors"
    echo ""
    exit 1
fi
