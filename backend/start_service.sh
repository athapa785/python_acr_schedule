#!/bin/bash

# Change to the backend directory
cd /var/www/python_acr_schedule/backend

# Set the environment variables
export DJANGO_FORCE_SCRIPT_NAME=/acr_schedule
# Set the path to your Excel file (modify this path as needed)
export SCHEDULE_FILE_PATH=/home/aasaad/acr_schedule/ACR\ Schedule\ Copy.xlsx 

# Start uvicorn in the background
nohup ./venv/bin/uvicorn --port=8004 --timeout-graceful-shutdown 5 'backend.asgi:application' > /var/www/python_acr_schedule/backend/uvicorn.log 2>&1 &

# Save the PID to a file for later stopping
echo $! > /var/www/python_acr_schedule/backend/uvicorn.pid

echo "Service started with PID $(cat /var/www/python_acr_schedule/backend/uvicorn.pid)"
