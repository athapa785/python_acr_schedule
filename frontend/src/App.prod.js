import React, { useState, useEffect } from 'react';
import RosterView from './components/RosterView';
import Pagination from './components/Pagination';
import Legend from './components/Legend';
import useSwipe from './hooks/useSwipe'; // Import the swipe hook
import './styles/App.css';

function App() {
  const [scheduleData, setScheduleData] = useState(null);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [todayWeekIndex, setTodayWeekIndex] = useState(0); // Track the week that contains today
  const [totalWeeks, setTotalWeeks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [selectedName, setSelectedName] = useState(null); // Add state for selected name
  const [showLegend, setShowLegend] = useState(false); // Add state for showing legend
  const [previousWeekIndex, setPreviousWeekIndex] = useState(0); // Track week index before viewing legend

  // We're simplifying the approach - we'll just pass the raw data to the RosterView component

  // Function to identify where different weeks start in the data
  const findWeekSeparators = (rows) => {
    const separators = [];
    
    // Look for rows that might indicate the start of a week
    // For example, rows with "Operations Shift Schedule" or date ranges
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

  // Function to find the current week based on today's date
  const findCurrentWeek = (rows, weekSeparators) => {
    const today = new Date();
    let currentWeekIndex = 0; // Default to first week if no match found
    
    // For each week section in the data
    for (let i = 0; i < weekSeparators.length; i++) {
      const weekStartRow = weekSeparators[i];
      const weekEndRow = i < weekSeparators.length - 1 ? 
                        weekSeparators[i + 1] : rows.length;
      
      // Get the rows for this week
      const weekRows = rows.slice(weekStartRow, weekEndRow);
      
      // Look for date cells in the first few rows of this week
      let foundDateInWeek = false;
      let weekStartDate = null;
      let weekEndDate = null;
      
      for (let j = 0; j < Math.min(10, weekRows.length); j++) {
        const row = weekRows[j];
        
        for (let k = 0; k < row.length; k++) {
          const cell = row[k];
          const cellValue = cell && (typeof cell === 'object' ? cell.value : cell);
          const cellStr = cellValue !== null && cellValue !== undefined ? String(cellValue) : '';
          
          // Check if this is a date in the format YYYY-MM-DDT00:00:00
          if (cellStr.match(/\d{4}-\d{2}-\d{2}T00:00:00/)) {
            const dateInCell = new Date(cellStr);
            
            // Track the earliest and latest dates in this week section
            if (weekStartDate === null || dateInCell < weekStartDate) {
              weekStartDate = dateInCell;
            }
            if (weekEndDate === null || dateInCell > weekEndDate) {
              weekEndDate = dateInCell;
            }
          }
        }
      }
      
      // If we found dates for this week, check if today falls within or is closest to this week
      if (weekStartDate && weekEndDate) {
        // Add one day to weekEndDate to include the full day
        weekEndDate.setDate(weekEndDate.getDate() + 1);
        
        // Check if today is within this week's range
        if (today >= weekStartDate && today < weekEndDate) {
          currentWeekIndex = i;
          break;
        }
        
        // If we're past the last date in this week and there are more weeks,
        // check if we should move to the next week
        if (today >= weekEndDate && i < weekSeparators.length - 1) {
          // Check the next week's start date if available
          continue; // Continue to check the next week
        }
        
        // If we're before the first date in this week and this isn't the first week,
        // we should be in the previous week
        if (today < weekStartDate && i > 0) {
          continue; // Continue to check other weeks
        }
        
        // If we haven't broken out of the loop yet, this might be the closest week
        currentWeekIndex = i;
      }
    }
    
    return currentWeekIndex;
  };

  // Fetch schedule data
  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      // Adjust the URL if your Django server is on a different host/port.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        // Use the correct URL path with the /acr_schedule prefix
        const response = await fetch("/acr_schedule/api/schedule/", {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('API Response received');
        
        if (data.sheets && data.sheets.length > 0) {
          console.log('First sheet found with', data.sheets[0].data?.length || 0, 'rows');
          setScheduleData(data.sheets[0]);
          
          // Process the data to identify different weeks
          const weekSeparators = findWeekSeparators(data.sheets[0].data || []);
          console.log('Found', weekSeparators.length, 'week separators');
          setTotalWeeks(weekSeparators.length);
          
          // Find the current week based on dates in the data
          const currentWeekIdx = findCurrentWeek(data.sheets[0].data || [], weekSeparators);
          console.log('Setting current week index to:', currentWeekIdx);
          setCurrentWeekIndex(currentWeekIdx);
          setTodayWeekIndex(currentWeekIdx); // Save the "today" week index
          
          // Update last refresh time
          setLastRefreshTime(new Date());
        } else {
          console.error('No sheets in data');
          setError("No sheets found in the schedule data");
        }
      } catch (fetchErr) {
        if (fetchErr.name === 'AbortError') {
          throw new Error('Request timed out. Please check your connection and try again.');
        }
        throw fetchErr;
      }
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
    
    // Set up automatic refresh every 15 minutest check for week changes
    const refreshInterval = setInterval(() => {
      console.log('Performing scheduled refresh');
      fetchSchedule();
    }, 60 * 15 * 1000); // Refresh every 5 minutes
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Navigate to the next week
  const goToNext = () => {
    if (currentWeekIndex < totalWeeks - 1) {
      setCurrentWeekIndex(currentWeekIndex + 1);
    }
  };

  // Navigate to the previous week
  const goToPrevious = () => {
    if (currentWeekIndex > 0) {
      setCurrentWeekIndex(currentWeekIndex - 1);
    }
  };

  // Jump back to the week that contains today
  const goToCurrentWeek = () => {
    setCurrentWeekIndex(todayWeekIndex);
  };

  // Show the legend page
  const showLegendPage = () => {
    setPreviousWeekIndex(currentWeekIndex);
    setShowLegend(true);
  };

  // Return to the schedule from legend
  const returnToSchedule = () => {
    setShowLegend(false);
    setCurrentWeekIndex(previousWeekIndex);
  };

  // Go to current week from legend (navigate and close legend)
  const goToCurrentWeekFromLegend = () => {
    setCurrentWeekIndex(todayWeekIndex);
    setShowLegend(false);
  };

  // Use the swipe hook to enable swipe navigation on touchscreen devices
  // Swipe left to go to next week, swipe right to go to previous week
  useSwipe(
    goToNext,    // onSwipeLeft
    goToPrevious // onSwipeRight
  );

  return (
    <div className="container" id="schedule-container">
      {loading && <div className="loading">Loading schedule data...</div>}
      {error && <div className="error">Error: {error}</div>}
      {(!loading && !error && scheduleData) ? (
        <>
          {showLegend ? (
            <Legend 
              onBack={returnToSchedule}
              onGoToCurrentWeek={goToCurrentWeekFromLegend}
            />
          ) : (
            <>
              <RosterView 
                sheet={scheduleData} 
                currentWeekIndex={currentWeekIndex}
                selectedName={selectedName}
                setSelectedName={setSelectedName}
                goToCurrentWeek={goToCurrentWeek}
                onShowLegend={showLegendPage}
                onNext={goToNext}
                onPrevious={goToPrevious}
                totalWeeks={totalWeeks}
              />
              {totalWeeks > 0 && (
                <Pagination 
                  currentPage={currentWeekIndex + 1} 
                  totalPages={totalWeeks} 
                  onNext={goToNext} 
                  onPrevious={goToPrevious} 
                />
              )}
            </>
          )}
        </>
      ) : !loading && !error && <p>No schedule data found.</p>}
    </div>
  );
}

export default App;