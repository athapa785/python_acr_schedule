import openpyxl
from io import BytesIO

def parse_excel_file(file_data):
    # Load workbook from bytes using openpyxl
    wb = openpyxl.load_workbook(filename=BytesIO(file_data), data_only=True)
    
    sheets_data = []
    for sheet_name in wb.sheetnames:
        sheet = wb[sheet_name]
        data = []
        for row in sheet.iter_rows(values_only=False):
            row_data = []
            for cell in row:
                if cell is None:
                    row_data.append("")
                    continue
                    
                cell_value = cell.value if hasattr(cell, 'value') else ""
                comment_text = cell.comment.text if hasattr(cell, 'comment') and cell.comment else ""
                
                if comment_text:
                    row_data.append({
                        "value": cell_value if cell_value is not None else "",
                        "comment": comment_text
                    })
                else:
                    row_data.append(cell_value if cell_value is not None else "")
            data.append(row_data)
        sheets_data.append({
            "name": sheet_name,
            "data": data
        })
    return sheets_data