import React from 'react';
import '../styles/DayHeader.css';

function DayHeader({ headerRows }) {
  // Format dates as MM-DD (removing the year and time)
  const formatDate = (cellValue) => {
    if (cellValue && cellValue.match(/\d{4}-\d{2}-\d{2}T00:00:00/)) {
      const dateParts = cellValue.split('T')[0].split('-');
      if (dateParts.length === 3) {
        return `${dateParts[1]}-${dateParts[2]}`; // MM-DD format
      }
    }
    return cellValue;
  };

  // Check if a date is today
  const isToday = (dateStr) => {
    if (!dateStr || !dateStr.match(/\d{4}-\d{2}-\d{2}T00:00:00/)) return false;
    
    const today = new Date();
    const cellDate = new Date(dateStr);
    
    return today.getDate() === cellDate.getDate() &&
           today.getMonth() === cellDate.getMonth() &&
           today.getFullYear() === cellDate.getFullYear();
  };

  // Display columns for the full week (Monday through Sunday), excluding the first column
  const displayColCount = 8; // 7 days plus one less to skip the first column

  return (
    <div className="day-header">
      <div className="day-header-content">
        {headerRows && headerRows.map((row, headerRowIndex) => (
          <div key={`header-${headerRowIndex}`} className="header-row">
            {row.slice(1, displayColCount + 1).map((cell, cellIndex) => {
              let cellValue = '';
              if (cell && typeof cell === 'object' && 'value' in cell) {
                cellValue = cell.value !== undefined ? String(cell.value) : '';
              } else {
                cellValue = cell !== undefined ? String(cell) : '';
              }
              
              // Check if this cell contains a date and if it's today
              const isDateCell = cellValue && cellValue.match(/\d{4}-\d{2}-\d{2}T00:00:00/);
              const isTodayCell = isDateCell && isToday(cellValue);
              
              // Format the date if needed
              if (isDateCell) {
                cellValue = formatDate(cellValue);
              }
              
              return (
                <div 
                  key={cellIndex} 
                  className={`day-cell ${isTodayCell ? 'today' : ''}`}
                >
                  <span className="day-cell-content">{cellValue}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default DayHeader;
