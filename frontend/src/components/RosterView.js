import React, { useState, useEffect } from 'react';
import '../styles/RosterView.css';
import DayHeader from './DayHeader';

function RosterView({ sheet, currentWeekIndex = 0, selectedName, setSelectedName, goToCurrentWeek }) {
  // Display columns for the full week (Monday through Sunday), excluding the first column
  const displayColCount = 8; // 7 days plus one less to skip the first column
  const [visibleComment, setVisibleComment] = useState(null);
  // Ref to store long-press timer id
  const longPressTimeout = React.useRef(null);

  // For this specific Excel format, we'll create a custom grouping function
  // Group rows by shift type (Owl, Day, Swing)
  const groupByShift = (rows) => {
    console.log('Grouping data, total rows:', rows.length);
    
    if (rows.length === 0) {
      return [];
    }
    
    // First, find the header rows (days of week, dates)
    let headerStartRow = -1;
    let daysOfWeekRow = -1;
    
    // Look for the row with days of the week (Mon, Tues, Wed, etc.)
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      const row = rows[i];
      let dayCount = 0;
      
      for (let j = 0; j < row.length; j++) {
        const cell = row[j];
        const cellValue = cell && (typeof cell === 'object' ? cell.value : cell);
        const cellStr = cellValue !== null && cellValue !== undefined ? String(cellValue) : '';
        
        // Check for days of week
        if (['Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun'].includes(cellStr)) {
          dayCount++;
        }
      }
      
      if (dayCount >= 3) { // If we found at least 3 days of the week
        daysOfWeekRow = i;
        console.log('Found days of week row at index', i);
        break;
      }
    }
    
    if (daysOfWeekRow === -1) {
      console.log('Could not find days of week row');
      // Just return all non-empty rows as one block
      const nonEmptyRows = rows.filter(row => row.some(cell => {
        const cellValue = cell && (typeof cell === 'object' ? cell.value : cell);
        return cellValue !== null && cellValue !== undefined && cellValue !== '';
      }));
      
      if (nonEmptyRows.length > 0) {
        return [nonEmptyRows];
      }
      return [];
    }
    
    // Now find the row with "Meal Periods" which is typically the start of the schedule data
    // We'll still use this to identify the structure, but we won't display it
    let mealPeriodRowIndex = -1;
    for (let i = daysOfWeekRow; i < Math.min(daysOfWeekRow + 5, rows.length); i++) {
      const row = rows[i];
      for (let j = 0; j < row.length; j++) {
        const cell = row[j];
        const cellValue = cell && (typeof cell === 'object' ? cell.value : cell);
        const cellStr = cellValue !== null && cellValue !== undefined ? String(cellValue) : '';
        
        if (cellStr === 'Meal Periods') {
          console.log('Found Meal Periods row at index', i);
          mealPeriodRowIndex = i;
          break;
        }
      }
      if (mealPeriodRowIndex !== -1) break;
    }
    
    // If we found days of week but not meal periods, just use the days of week row + 1
    if (mealPeriodRowIndex === -1) {
      mealPeriodRowIndex = daysOfWeekRow + 1;
      console.log('Using row after days of week as start of data:', mealPeriodRowIndex);
    }
    
    // The header rows include ONLY the days of week row and the dates row (2 rows total)
    // This ensures rows 3 and 4 will be in content rows, not header rows
    const headerRows = rows.slice(Math.max(0, daysOfWeekRow), daysOfWeekRow + 2);
    console.log('Header rows:', headerRows.length);
    
    // Now look for shift blocks after the header rows
    // For this schedule, we'll look for specific shift names (Owl, Day, Swing)
    // and group them into separate cards
    const blocks = [];
    let currentBlock = [];
    let blockStarted = false;
    let currentShift = 'Schedule';
    
    // Define shift types to look for
    const shiftTypes = ['Owl Shift', 'Day Shift', 'Swing Shift'];
    
    // Start processing content rows from after the header rows, not from mealPeriodRowIndex + 1
    // This ensures no overlap between header rows and content rows
    for (let i = daysOfWeekRow + 2; i < rows.length; i++) {
      const row = rows[i];
      
      // Check if this row has a time pattern or content in the first column
      let hasTimePattern = false;
      let hasFirstColumnContent = false;
      let potentialShiftName = '';
      
      // Check first column for content that might be a shift name
      const firstCell = row[0] && (typeof row[0] === 'object' ? row[0].value : row[0]);
      if (firstCell && String(firstCell).trim() !== '') {
        hasFirstColumnContent = true;
        potentialShiftName = String(firstCell);
      }
      
      // Check if any cell has a time pattern
      for (let j = 0; j < row.length; j++) {
        const cell = row[j];
        const cellValue = cell && (typeof cell === 'object' ? cell.value : cell);
        const cellStr = cellValue !== null && cellValue !== undefined ? String(cellValue) : '';
        
        // Check for time patterns like "XX:XX - XX:XX"
        if (cellStr.match(/\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/)) {
          hasTimePattern = true;
          break;
        }
      }
      
      // If this row contains one of our shift types, start a new shift block
      const isShiftType = shiftTypes.some(type => potentialShiftName.includes(type));
      if (hasFirstColumnContent && (isShiftType || (!hasTimePattern && potentialShiftName.length > 3))) {
        // This could be a new shift header
        if (blockStarted && currentBlock.length > 0) {
          // End the previous block
          blocks.push({
            shiftName: currentShift,
            headerRows: headerRows,
            contentRows: currentBlock
          });
        }
        
        // Start a new block
        currentShift = potentialShiftName;
        currentBlock = [];
        blockStarted = true;
        console.log('Found potential shift:', currentShift);
      } 
      // If this row has a time pattern or other content, add it to the current block
      else if ((hasTimePattern || hasFirstColumnContent) && blockStarted) {
        currentBlock.push(row);
      }
      // Empty rows or rows without relevant content are ignored
    }
    
    // Add the last block if it exists
    if (blockStarted && currentBlock.length > 0) {
      blocks.push({
        shiftName: currentShift,
        headerRows: headerRows,
        contentRows: currentBlock
      });
    }
    
    // If we didn't find any blocks but have header rows, create a default block
    if (blocks.length === 0 && headerRows.length > 0) {
      // Find all non-empty rows after the header rows (not mealPeriodRowIndex + 1)
      // This ensures no overlap between header rows and content rows
      const contentRows = rows.slice(daysOfWeekRow + 2).filter(row => {
        return row.some(cell => {
          const cellValue = cell && (typeof cell === 'object' ? cell.value : cell);
          return cellValue !== null && cellValue !== undefined && cellValue !== '';
        });
      });
      
      if (contentRows.length > 0) {
        blocks.push({
          shiftName: 'Schedule',
          headerRows: headerRows,
          contentRows: contentRows
        });
      }
    }
    
    console.log('Found', blocks.length, 'shift blocks');
    return blocks;
  };

  if (!sheet) {
    console.error('No sheet data provided to RosterView');
    return <div>No data available for this week</div>;
  }
  
  console.log('RosterView received sheet:', sheet);
  
  // We're now directly using the sheet.data from the API
  const allRows = sheet.data || [];
  console.log('Total rows in sheet:', allRows.length);
  
  // Find the title row (usually contains "Operations Shift Schedule")
  let titleRow = null;
  let weekHeader = 'Weekly Operations Shift Schedule';
  
  for (let i = 0; i < Math.min(10, allRows.length); i++) {
    const row = allRows[i];
    for (let j = 0; j < row.length; j++) {
      const cell = row[j];
      const cellValue = cell && (typeof cell === 'object' ? cell.value : cell);
      if (cellValue && String(cellValue).includes('Operations Shift Schedule')) {
        titleRow = row;
        weekHeader = String(cellValue);
        console.log('Found title row at index', i, ':', weekHeader);
        break;
      }
    }
    if (titleRow) break;
  }
  
  // Find date range if available and format it as MM-DD-YYYY
  // This is no longer used as we extract the date range from the current week's data
  let oldDateRange = '';
  if (titleRow && allRows.length > allRows.indexOf(titleRow) + 1) {
    const nextRow = allRows[allRows.indexOf(titleRow) + 1];
    for (let j = 0; j < nextRow.length; j++) {
      const cell = nextRow[j];
      const cellValue = cell && (typeof cell === 'object' ? cell.value : cell);
      if (cellValue && String(cellValue).includes('through')) {
        const startDate = nextRow[j-1] && (typeof nextRow[j-1] === 'object' ? nextRow[j-1].value : nextRow[j-1]);
        const endDate = nextRow[j+1] && (typeof nextRow[j+1] === 'object' ? nextRow[j+1].value : nextRow[j+1]);
        if (startDate && endDate) {
          // Format dates as MM-DD-YYYY, removing the T00:00:00 part
          const formatDate = (dateStr) => {
            if (!dateStr) return '';
            const dateOnly = String(dateStr).split('T')[0]; // Remove the T00:00:00 part
            const parts = dateOnly.split('-');
            if (parts.length === 3) {
              return `${parts[1]}-${parts[2]}-${parts[0]}`; // MM-DD-YYYY
            }
            return dateStr;
          };
          
          oldDateRange = `${formatDate(startDate)} through ${formatDate(endDate)}`;
          console.log('Found date range:', oldDateRange);
        }
        break;
      }
    }
  }
  
  // Format dates as MM-DD, removing the year and T00:00:00 part
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const dateOnly = String(dateStr).split('T')[0]; // Remove the T00:00:00 part
    const parts = dateOnly.split('-');
    if (parts.length === 3) {
      return `${parts[1]}-${parts[2]}`; // MM-DD format
    }
    return dateStr;
  };
  
  // Find week separators to split the data into weeks
  const findWeekSeparators = (rows) => {
    const separators = [];
    
    // Look for rows that might indicate the start of a week
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      for (let j = 0; j < row.length; j++) {
        const cell = row[j];
        const cellValue = cell && (typeof cell === 'object' ? cell.value : cell);
        if (cellValue && String(cellValue).includes('Operations Shift Schedule')) {
          separators.push(i);
          break;
        }
      }
    }
    
    // If no separators found, treat the whole sheet as one week
    if (separators.length === 0) {
      separators.push(0);
    }
    
    return separators;
  };
  
  // Extract date range for the current week
  const extractDateRange = (rows) => {
    // Look for date cells in the first few rows
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      const row = rows[i];
      const dates = [];
      
      for (let j = 0; j < row.length; j++) {
        const cell = row[j];
        const cellValue = cell && (typeof cell === 'object' ? cell.value : cell);
        const cellStr = cellValue !== null && cellValue !== undefined ? String(cellValue) : '';
        
        // Check if this is a date in the format YYYY-MM-DDT00:00:00
        if (cellStr.match(/\d{4}-\d{2}-\d{2}T00:00:00/)) {
          dates.push(cellStr);
        }
      }
      
      // If we found at least 2 dates, use them for the range
      if (dates.length >= 2) {
        // Sort dates to ensure we get the correct start and end dates
        dates.sort((a, b) => new Date(a) - new Date(b));
        const startDate = formatDate(dates[0]);
        const endDate = formatDate(dates[dates.length - 1]);
        return `${startDate} through ${endDate}`;
      }
    }
    
    return '';
  };
  
  // Get the week separators
  const weekSeparators = findWeekSeparators(allRows);
  
  // Determine the start and end rows for the current week
  const weekStartRow = weekSeparators[currentWeekIndex] || 0;
  const weekEndRow = weekSeparators[currentWeekIndex + 1] || allRows.length;
  
  // Get only the rows for the current week
  const currentWeekRows = allRows.slice(weekStartRow, weekEndRow);
  
  // Extract date range for the current week
  const weekDateRange = extractDateRange(currentWeekRows);
  
  // Process the current week's rows and create separate blocks for each shift type
  let allShiftBlocks = groupByShift(currentWeekRows);
  
  // Split blocks by shift type (Owl, Day, Swing)
  const shiftTypes = ['Owl Shift', 'Day Shift', 'Swing Shift'];
  const shiftBlocks = [];
  
  // If we have at least one block, try to split it by shift types
  if (allShiftBlocks.length > 0) {
    const mainBlock = allShiftBlocks[0];
    const headerRows = mainBlock.headerRows;
    
    // Find shift type boundaries in the content rows
    const shiftBoundaries = [];
    mainBlock.contentRows.forEach((row, index) => {
      // Check if this row contains a shift type name
      const hasShiftType = row.some(cell => {
        const cellValue = cell && (typeof cell === 'object' ? cell.value : cell);
        return cellValue && shiftTypes.some(type => String(cellValue).includes(type));
      });
      
      if (hasShiftType) {
        shiftBoundaries.push(index);
      }
    });
    
    // Add the end boundary
    shiftBoundaries.push(mainBlock.contentRows.length);
    
    // Create separate blocks for each shift type
    if (shiftBoundaries.length > 1) {
      for (let i = 0; i < shiftBoundaries.length - 1; i++) {
        const startIdx = shiftBoundaries[i];
        const endIdx = shiftBoundaries[i + 1];
        const shiftRows = mainBlock.contentRows.slice(startIdx, endIdx);
        
        // Only create a block if there are rows
        if (shiftRows.length > 0) {
          shiftBlocks.push({
            headerRows: headerRows,
            contentRows: shiftRows,
            shiftName: getShiftName(shiftRows[0])
          });
        }
      }
    } else {
      // If we couldn't find shift boundaries, just use the original block
      shiftBlocks.push(mainBlock);
    }
  }
  
  // Helper function to extract shift name from a row
  function getShiftName(row) {
    for (const cell of row) {
      const cellValue = cell && (typeof cell === 'object' ? cell.value : cell);
      if (cellValue) {
        const strValue = String(cellValue);
        for (const type of shiftTypes) {
          if (strValue.includes(type)) {
            return type;
          }
        }
      }
    }
    return 'Schedule';
  }

  // Handle name selection to highlight all instances of a name
  const handleNameSelection = (name) => {
    if (selectedName === name) {
      // If clicking the same name again, deselect it
      setSelectedName(null);
    } else {
      // Select the new name
      setSelectedName(name);
    }
  };

  // Check if a cell value is a name (not a date, shift type, or empty)
  const isNameCell = (cellValue) => {
    if (!cellValue) return false;
    const strValue = String(cellValue).trim();
    
    // Skip empty cells, dates, and shift type headers
    if (strValue === '' || 
        strValue.match(/\d{4}-\d{2}-\d{2}/) || 
        shiftTypes.some(type => strValue.includes(type))) {
      return false;
    }
    
    // Assume it's a name if it's not a date or shift type and has more than 2 characters
    return strValue.length > 2;
  };

  const handleCellClick = (blockIndex, rowIndex, cellIndex, comment) => {
    // Handle comment tooltip display
    if (comment) {
      // If clicking the same cell that already has a visible comment, close it
      if (visibleComment && 
          visibleComment.blockIndex === blockIndex && 
          visibleComment.rowIndex === rowIndex && 
          visibleComment.cellIndex === cellIndex) {
        // Close the tooltip if clicking the same cell
        setVisibleComment(null);
      } else {
        // First clear any existing tooltip
        setVisibleComment(null);
        
        // Then set the new tooltip after a very brief delay to ensure React has time to clear the previous one
        setTimeout(() => {
          setVisibleComment({
            blockIndex,
            rowIndex,
            cellIndex,
            comment
          });
        }, 10);
      }
    }
  };
  
  // Function to close the comment tooltip when clicking elsewhere
  const handleOutsideClick = (e) => {
    // Close tooltip if we clicked outside a comment indicator, outside the tooltip, and outside the cell with comment
    if (visibleComment && 
        !e.target.closest('.comment-indicator') && 
        !e.target.closest('.comment-tooltip') &&
        !e.target.closest('.cell-with-comment')) {
      setVisibleComment(null);
    }
  };

  // Add the event listener for outside clicks when the component mounts
  React.useEffect(() => {
    document.addEventListener('click', handleOutsideClick);
    
    // Return cleanup function
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [visibleComment]);
  
  // Clear visible comments when the week changes (either by button navigation or swipe)
  React.useEffect(() => {
    // Clear any visible comment when the currentWeekIndex changes
    setVisibleComment(null);
  }, [currentWeekIndex]);
  

  // We no longer clear selectedName on week change to allow highlighting to persist

  return (
    <div className="roster-view">
      <div className="week-header">
        <h2>{weekHeader}</h2>
        {weekDateRange && <div className="date-range" data-component-name="RosterView">{weekDateRange}</div>}
      </div>
      {/* Add the fixed day header at the top */}
      {shiftBlocks.length > 0 && shiftBlocks[0].headerRows && (
        <DayHeader headerRows={shiftBlocks[0].headerRows} />
      )}
      
      {/* Display selected name indicator if a name is selected */}
      {selectedName && (
        <div className="selected-name-indicator">
          <span className="selected-name-text">Highlighting: {selectedName}</span>
          <button className="clear-selection-button" onClick={() => setSelectedName(null)}>Clear</button>
        </div>
      )}
      {shiftBlocks.length > 0 ? (
        // We have shift blocks to display
        shiftBlocks.map((block, blockIndex) => {
          return (
            <div key={blockIndex} className="shift-block shift-card">
              {block.shiftName && <h3 className="shift-title">{block.shiftName}</h3>}
              <div className="shift-content">
                
                {/* Display the content rows with dividers between shifts */}
                {block.contentRows.map((row, rowIndex) => {
                  // Add a divider before rows that might be shift boundaries
                  const isShiftBoundary = rowIndex > 0 && row[0] && 
                    (typeof row[0] === 'object' ? row[0].value : row[0]) && 
                    String(typeof row[0] === 'object' ? row[0].value : row[0]).trim() !== '';
                  
                  return (
                    <React.Fragment key={rowIndex}>
                      {isShiftBoundary && <hr className="shift-divider" />}
                      <div className="shift-row">
                        {row.slice(1, displayColCount + 1).map((cell, cellIndex) => {
                          let cellValue = '';
                          let comment = '';
                          if (cell && typeof cell === 'object' && 'value' in cell) {
                            cellValue = cell.value !== undefined ? String(cell.value) : '';
                            comment = cell.comment || '';
                          } else {
                            cellValue = cell !== undefined ? String(cell) : '';
                            comment = '';
                          }
                          
                          // Apply strike-through style if the cell has the "strike" flag
                          let textStyle = {};
                          if (cell && typeof cell === 'object' && cell.strike) {
                            textStyle = { textDecoration: 'line-through' };
                          }
                          
                          // Format dates as MM-DD (removing the year and time)
                          if (cellValue && cellValue.match(/\d{4}-\d{2}-\d{2}T00:00:00/)) {
                            const dateParts = cellValue.split('T')[0].split('-');
                            if (dateParts.length === 3) {
                              cellValue = `${dateParts[1]}-${dateParts[2]}`; // MM-DD format
                            }
                          }
                          
                          // Check if this is a shift name (Owl Shift, Day Shift, Swing Shift)
                          const isShiftName = ['Owl Shift', 'Day Shift', 'Swing Shift'].includes(cellValue);
                          
                          // Check if this cell contains the selected name
                          const isSelectedName = selectedName && 
                                                 cellValue && 
                                                 String(cellValue).trim() === selectedName;
                          
                          // Check if this is a name cell that can be selected
                          const isName = isNameCell(cellValue);
                          
                          return (
                            <div 
                              key={cellIndex} 
                              className={`cell 
                                ${isShiftName ? 'shift-name-cell' : ''} 
                                ${comment ? 'cell-with-comment' : ''}
                                ${isSelectedName ? 'selected-name' : ''}
                              `}
                              onClick={() => handleCellClick(blockIndex, rowIndex, cellIndex, comment)}
                              {...(isName ? {
                                onDoubleClick: () => handleNameSelection(cellValue),
                                onTouchStart: () => {
                                  longPressTimeout.current = setTimeout(() => handleNameSelection(cellValue), 600);
                                },
                                onTouchEnd: () => {
                                  if (longPressTimeout.current) {
                                    clearTimeout(longPressTimeout.current);
                                    longPressTimeout.current = null;
                                  }
                                }
                              } : {})}
                              title={isName ? 'Double-click or long-press to highlight this name' : ''}
                            >
                              <span className="cell-content" style={textStyle}>{cellValue}</span>
                              {comment && <span className="comment-indicator" title="Click to view comment"></span>}
                              {visibleComment &&
                               visibleComment.blockIndex === blockIndex &&
                               visibleComment.rowIndex === rowIndex &&
                               visibleComment.cellIndex === cellIndex && (
                                <div className="comment-tooltip">
                                  {visibleComment.comment}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          );
        })
      ) : (
        <div>
          <div>No shift data available for this week</div>
          <div className="debug-info">
            <p>Debug Info:</p>
            <p>Week Header: {weekHeader}</p>
            <p>Available Rows: {allRows.length}</p>
            <p>Shift Blocks Found: {shiftBlocks.length}</p>
          </div>
        </div>
      )}
      <div className="current-week-nav">
        <button 
          className="current-week-button" 
          onClick={goToCurrentWeek}
        >
          Go to Current Week
        </button>
      </div>
    </div>
  );
}

export default RosterView;