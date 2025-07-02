#!/bin/bash

# Check if the PID file exists
if [ -f /var/www/python_acr_schedule/backend/uvicorn.pid ]; then
    PID=$(cat /var/www/python_acr_schedule/backend/uvicorn.pid)
    
    # Check if the process is still running
    if ps -p $PID > /dev/null; then
        echo "Stopping service with PID $PID"
        kill $PID
        
        # Wait for the process to terminate
        sleep 2
        
        # Check if it's still running and force kill if necessary
        if ps -p $PID > /dev/null; then
            echo "Process still running, force killing..."
            kill -9 $PID
        fi
        
        echo "Service stopped"
    else
        echo "Process with PID $PID is not running"
    fi
    
    # Remove the PID file
    rm /var/www/python_acr_schedule/backend/uvicorn.pid
else
    echo "PID file not found, service may not be running"
fi
