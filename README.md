# ACR Schedule Viewer

A full-stack web application for viewing and managing ACR operations shift schedules. This application parses Excel schedule files and displays them in a user-friendly web interface with weekly navigation.

## Features

- **Excel Schedule Parsing**: Automatically parses Excel files with shift schedules
- **Week-based Navigation**: Navigate between different weeks of the schedule
- **Responsive UI**: Clean interface that works on desktop and mobile devices
- **Auto-detection**: Automatically detects and displays the current week's schedule
- **Cell Formatting Support**: Preserves Excel formatting like comments and strikethrough text
- **Hourly Refresh**: Automatically refreshes data to ensure schedules are up-to-date

## Tech Stack

### Backend
- Django (Python web framework)
- Django REST Framework (API development)
- OpenPyXL (Excel file parsing)
- SQLite (Database)

### Frontend
- React (JavaScript UI library)
- CSS3 (Styling)

## Project Structure

```
python_acr_schedule/
├── backend/                 # Django backend
│   ├── manage.py            # Django management script
│   ├── requirements.txt     # Python dependencies
│   ├── schedule/            # Main Django app
│   │   ├── utils/           # Utility functions
│   │   │   └── parse_excel.py  # Excel parsing logic
│   │   ├── views.py         # API endpoints
│   │   └── urls.py          # URL routing
│   └── schedule.xlsx        # Sample schedule file
│
└── frontend/                # React frontend
    ├── package.json         # Node.js dependencies
    ├── public/              # Static assets
    └── src/                 # React source code
        ├── App.js           # Main application component
        ├── components/      # React components
        │   ├── RosterView.js  # Schedule display component
        │   └── Pagination.js  # Week navigation component
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

### Option 3: Platform as a Service (PaaS)
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
