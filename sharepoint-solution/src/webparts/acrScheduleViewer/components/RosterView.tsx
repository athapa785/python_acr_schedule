import * as React from 'react';
import styles from './RosterView.module.scss';

export interface IRosterViewProps {
  sheet: any;
  currentWeekIndex: number;
}

export interface IRosterViewState {
  visibleComment: any;
}

export default class RosterView extends React.Component<IRosterViewProps, IRosterViewState> {
  constructor(props: IRosterViewProps) {
    super(props);
    this.state = {
      visibleComment: null
    };
  }

  // Group rows by shift type (Owl, Day, Swing)
  private groupByShift = (rows: any[]): any[] => {
    if (!rows || rows.length === 0) {
      return [];
    }
    
    // First, find the header rows (days of week, dates)
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
        break;
      }
    }
    
    if (daysOfWeekRow === -1) {
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
    let mealPeriodRowIndex = -1;
    for (let i = daysOfWeekRow; i < Math.min(daysOfWeekRow + 5, rows.length); i++) {
      const row = rows[i];
      for (let j = 0; j < row.length; j++) {
        const cell = row[j];
        const cellValue = cell && (typeof cell === 'object' ? cell.value : cell);
        const cellStr = cellValue !== null && cellValue !== undefined ? String(cellValue) : '';
        
        if (cellStr === 'Meal Periods') {
          mealPeriodRowIndex = i;
          break;
        }
      }
      if (mealPeriodRowIndex !== -1) break;
    }
    
    // If we found days of week but not meal periods, just use the days of week row + 1
    if (mealPeriodRowIndex === -1) {
      mealPeriodRowIndex = daysOfWeekRow + 1;
    }
    
    // The header rows include the days of week row and the meal periods row
    const headerRows = rows.slice(Math.max(0, daysOfWeekRow), mealPeriodRowIndex + 1);
    
    // Now look for shift blocks after the meal periods row
    const blocks = [];
    let currentBlock = [];
    let blockStarted = false;
    let currentShift = 'Schedule';
    
    // Define shift types to look for
    const shiftTypes = ['Owl Shift', 'Day Shift', 'Swing Shift'];
    
    for (let i = mealPeriodRowIndex + 1; i < rows.length; i++) {
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
      // Find all non-empty rows after the header
      const contentRows = rows.slice(mealPeriodRowIndex + 1).filter(row => {
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
    
    return blocks;
  };

  // Find the week separators in the data
  private findWeekSeparators = (rows: any[]): number[] => {
    const separators: number[] = [];
    
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

  // Show a comment when hovering over a cell
  private showComment = (comment: string, event: React.MouseEvent): void => {
    if (!comment) return;
    
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    this.setState({
      visibleComment: {
        text: comment,
        x: rect.left + window.scrollX,
        y: rect.bottom + window.scrollY
      }
    });
  };

  // Hide the comment tooltip
  private hideComment = (): void => {
    this.setState({ visibleComment: null });
  };

  // Render a cell with appropriate formatting
  private renderCell = (cell: any, rowIndex: number, colIndex: number): JSX.Element => {
    // Handle different cell formats
    if (cell && typeof cell === 'object' && (cell.comment || cell.strike)) {
      const cellStyle: React.CSSProperties = {};
      
      // Apply strikethrough if needed
      if (cell.strike) {
        cellStyle.textDecoration = 'line-through';
      }
      
      return (
        <td 
          key={`cell-${rowIndex}-${colIndex}`}
          style={cellStyle}
          onMouseEnter={cell.comment ? (e) => this.showComment(cell.comment, e) : undefined}
          onMouseLeave={cell.comment ? this.hideComment : undefined}
          className={cell.comment ? styles.hasComment : ''}
        >
          {cell.value}
        </td>
      );
    }
    
    // Regular cell
    return (
      <td key={`cell-${rowIndex}-${colIndex}`}>
        {cell}
      </td>
    );
  };

  public render(): React.ReactElement<IRosterViewProps> {
    const { sheet, currentWeekIndex } = this.props;
    const { visibleComment } = this.state;
    
    if (!sheet || !sheet.data) {
      return <div>No data available for this week</div>;
    }
    
    const allRows = sheet.data;
    
    // Find the title row (usually contains "Operations Shift Schedule")
    let weekHeader = 'Weekly Operations Shift Schedule';
    
    for (let i = 0; i < Math.min(10, allRows.length); i++) {
      const row = allRows[i];
      for (let j = 0; j < row.length; j++) {
        const cell = row[j];
        const cellValue = cell && (typeof cell === 'object' ? cell.value : cell);
        const cellStr = cellValue !== null && cellValue !== undefined ? String(cellValue) : '';
        
        if (cellStr.includes('Operations Shift Schedule')) {
          weekHeader = cellStr;
          break;
        }
      }
    }
    
    // Find week separators
    const weekSeparators = this.findWeekSeparators(allRows);
    
    // Get the rows for the current week
    const startRow = weekSeparators[currentWeekIndex] || 0;
    const endRow = currentWeekIndex < weekSeparators.length - 1 ? 
                  weekSeparators[currentWeekIndex + 1] : allRows.length;
    
    const weekRows = allRows.slice(startRow, endRow);
    
    // Group the rows by shift
    const shiftBlocks = this.groupByShift(weekRows);
    
    return (
      <div className={styles.rosterView}>
        <h3 className={styles.weekHeader}>{weekHeader}</h3>
        
        {shiftBlocks.map((block, blockIndex) => (
          <div key={`block-${blockIndex}`} className={styles.shiftBlock}>
            <h4 className={styles.shiftName}>{block.shiftName}</h4>
            
            <div className={styles.tableWrapper}>
              <table className={styles.scheduleTable}>
                <thead>
                  {block.headerRows.map((row: any[], rowIndex: number) => (
                    <tr key={`header-${rowIndex}`}>
                      {row.map((cell, colIndex) => this.renderCell(cell, rowIndex, colIndex))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {block.contentRows.map((row: any[], rowIndex: number) => (
                    <tr key={`content-${rowIndex}`}>
                      {row.map((cell, colIndex) => this.renderCell(cell, rowIndex, colIndex))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        
        {shiftBlocks.length === 0 && (
          <div className={styles.noData}>No schedule data found for this week.</div>
        )}
        
        {/* Comment tooltip */}
        {visibleComment && (
          <div 
            className={styles.commentTooltip}
            style={{ 
              left: `${visibleComment.x}px`, 
              top: `${visibleComment.y}px` 
            }}
          >
            {visibleComment.text}
          </div>
        )}
      </div>
    );
  }
}
