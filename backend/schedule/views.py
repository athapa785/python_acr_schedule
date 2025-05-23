from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import os
from .utils.parse_excel import parse_excel_file

class ScheduleAPIView(APIView):
    def get(self, request, format=None):
        try:
            # Using the correct path to the Excel file
            print(f"BASE_DIR: {settings.BASE_DIR}")
            print(f"BASE_DIR.parent: {settings.BASE_DIR.parent}")
            
            # Try different possible file paths
            possible_paths = [
                os.path.join(settings.BASE_DIR, 'schedule.xlsx'),
                os.path.join(settings.BASE_DIR.parent, 'schedule.xlsx'),
                os.path.join(settings.BASE_DIR.parent, 'backend', 'schedule.xlsx'),
                # Add more paths to check
                os.path.join(os.path.dirname(settings.BASE_DIR), 'schedule.xlsx'),
                os.path.join(os.path.dirname(os.path.dirname(settings.BASE_DIR)), 'schedule.xlsx')
            ]
            
            file_path = None
            for path in possible_paths:
                print(f"Checking path: {path}, exists: {os.path.exists(path)}")
                if os.path.exists(path):
                    file_path = path
                    break
            
            if file_path is None:
                return Response({"error": "Schedule file not found. Checked paths: " + str(possible_paths)}, status=status.HTTP_404_NOT_FOUND)
            
            with open(file_path, 'rb') as f:
                file_data = f.read()
            
            sheets_data = parse_excel_file(file_data)
            return Response({"sheets": sheets_data}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)