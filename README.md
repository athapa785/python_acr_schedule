# ACR Schedule Viewer

A full-stack web application for viewing and managing ACR operations shift schedules. This application parses Excel schedule files and displays them in a user-friendly web interface with weekly navigation.

## Features

- **Excel Schedule Parsing**: Automatically parses Excel files with shift schedules
- **Week-based Navigation**: Navigate between different weeks of the schedule
- **Responsive UI**: Clean interface that works on desktop and mobile devices
- **Auto-detection**: Automatically detects and displays the current week's schedule
- **Cell Formatting Support**: Preserves Excel formatting like comments and strikethrough text
- **Regular Refresh**: Automatically refreshes data every 5 minutes to ensure schedules are up-to-date
- **Comment Display**: View cell comments by clicking on cells with comment indicators
- **Current Week Navigation**: Easily return to the current week from any page
- **Equal-width Columns**: Consistent column widths with text wrapping for better readability

## Tech Stack

### Backend
- Django 3.2.19 (Python web framework)
- Django REST Framework (API development)
- OpenPyXL (Excel file parsing)
- Uvicorn (ASGI server)

### Frontend
- React 18 (JavaScript UI library)
- CSS3 (Styling)

### Deployment
- Apache (Web server with proxy configuration)
- Uvicorn (ASGI server for Django)

## Project Structure

```
python_acr_schedule/
├── backend/                 # Django backend
│   ├── manage.py            # Django management script
│   ├── requirements.txt     # Python dependencies
│   ├── start_service.sh     # Script to start the backend service
│   ├── stop_service.sh      # Script to stop the backend service
│   ├── schedule/            # Main Django app
│   │   ├── utils/           # Utility functions
│   │   │   └── parse_excel.py  # Excel parsing logic
│   │   ├── views.py         # API endpoints
│   │   └── urls.py          # URL routing
│   └── backend/             # Django project settings
│       └── settings.py      # Django configuration
│
└── frontend/                # React frontend
    ├── package.json         # Node.js dependencies
    ├── public/              # Static assets
    └── src/                 # React source code
        ├── App.js           # Main application component
        ├── components/      # React components
        │   └── RosterView.js  # Schedule display component
        └── styles/          # CSS stylesheets
```

## Installation

### Prerequisites
- Python 3.x
- Node.js and npm

### Backend Setup
1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create and activate a virtual environment (optional but recommended):
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Run migrations:
   ```
   python manage.py migrate
   ```

5. Start the Django development server:
   ```
   python manage.py runserver
   ```
   The backend will be available at http://localhost:8000

### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the React development server:
   ```
   npm start
   ```
   The frontend will be available at http://localhost:3000

## Production Deployment

### Build the Frontend
1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Build the React application:
   ```
   npm run build
   ```

3. Collect static files for Django:
   ```
   cd ../backend
   python manage.py collectstatic --noinput
   ```

### Deploy with Apache
1. Configure Apache to proxy requests to the Django application:
   ```
   # Example Apache configuration
   <Location /acr_schedule>
       ProxyPass http://localhost:8004
       ProxyPassReverse http://localhost:8004
   </Location>
   ```

2. Start the Django application with Uvicorn:
   ```
   cd backend
   ./start_service.sh
   ```

3. To stop the service:
   ```
   ./stop_service.sh
   ```

## Environment Configuration

The application requires the following environment variables:

- `SCHEDULE_FILE_PATH`: Absolute path to the Excel schedule file (set in start_service.sh)

## Recent Improvements

- Fixed issue with duplicate comments appearing in the schedule view
- Added equal-width columns with text wrapping for better readability
- Added "Go to Current Week" navigation buttons at the top and bottom of the schedule
- Reduced refresh interval from 1 hour to 5 minutes for more up-to-date information
- Improved current week detection algorithm to better handle week transitions

## Usage

1. Place your Excel schedule file in the backend directory, named `schedule.xlsx`
2. Start both the backend and frontend servers as described above
3. Open your browser to http://localhost:3000
4. The application will display the current week's schedule by default
5. Use the pagination controls to navigate between different weeks

## Development

### Adding New Features
1. Backend changes should be made in the Django application
2. Frontend changes should be made in the React application
3. Run both servers during development for testing

### Customizing for Different Excel Formats
The Excel parsing logic in `parse_excel.py` can be modified to support different Excel schedule formats.

## Production Deployment

### Environment Setup
1. Copy the `.env.example` file to `.env` in the backend directory:
   ```
   cp backend/.env.example backend/.env
   ```

2. Edit the `.env` file if needed:
   - You can use the default settings for local deployment
   - For custom domains, update the `ALLOWED_HOSTS` variable

### Option 1: Traditional Server Deployment
1. Build the React frontend:
   ```
   cd frontend
   npm install
   npm run build
   ```

2. Collect static files:
   ```
   cd backend
   python manage.py collectstatic --noinput
   ```

3. Run the deployment script:
   ```
   cd backend
   ./deploy.sh
   ```

### Option 2: Docker Deployment
1. Build and run using Docker Compose:
   ```
   docker-compose up --build
   ```
   The application will be available at http://localhost:8000

2. For production, modify the `docker-compose.yml` file with your specific environment variables.

### Option 3: Apache with Django as API-only
1. Build the React frontend:
   ```
   cd frontend
   npm install
   npm run build
   ```

2. Configure Django to serve API only:
   - This is already set up in the latest version
   - Django will only handle API requests at `/api/schedule/`

3. Configure Apache:
   - Use the provided `apache_config_example.conf` as a template
   - Update paths and domain names to match your environment
   - Apache will serve the React static files directly
   - API requests will be proxied to Django

4. Run Django with Gunicorn:
   ```
   cd backend
   gunicorn --bind 127.0.0.1:8000 backend.wsgi:application
   ```

5. Enable required Apache modules:
   ```
   sudo a2enmod proxy proxy_http rewrite headers
   sudo systemctl restart apache2
   ```

### Option 4: Platform as a Service (PaaS)
1. For Heroku deployment:
   - Create a new Heroku app
   - Set environment variables in Heroku dashboard
   - Push the code to Heroku:
     ```
     git push heroku main
     ```

2. For other PaaS providers:
   - Follow their specific deployment instructions
   - Use the provided `Procfile` and `runtime.txt`

### Deployment Notes
- The application is configured for simplified deployment with minimal configuration
- Debug mode is enabled by default for easier troubleshooting
- CORS is configured to allow all origins for easier integration
- For a more secure setup, you can re-enable security features in the settings.py file
