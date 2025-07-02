from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import os
from .utils.parse_excel import parse_excel_file

class ScheduleAPIView(APIView):
    def get(self, request, format=None):
        """Return the parsed Excel schedule as JSON.

        The path can be overridden with the `SCHEDULE_FILE_PATH` environment
        variable (use an absolute path).  Defaults to `<BASE_DIR>/schedule.xlsx`.
        """
        try:
            # Determine the Excel file path – configurable via env var

            
            default_path = os.path.join(settings.BASE_DIR, 'schedule.xlsx')
            file_path = os.getenv('SCHEDULE_FILE_PATH', default_path)

            if not os.path.exists(file_path):
                return Response({"error": f"Schedule file not found at {file_path}"}, status=status.HTTP_404_NOT_FOUND)
            
            with open(file_path, 'rb') as f:
                file_data = f.read()
            
            sheets_data = parse_excel_file(file_data)
            return Response({"sheets": sheets_data}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)