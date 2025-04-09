import React, { useState, useEffect } from 'react';
import RosterView from './components/RosterView';
import Pagination from './components/Pagination';
import './styles/App.css';

function App() {
  const [scheduleData, setScheduleData] = useState(null);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [totalWeeks, setTotalWeeks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // We're simplifying the approach - we'll just pass the raw data to the RosterView component

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        setError(null);
        // Adjust the URL if your Django server is on a different host/port.
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        try {
          const response = await fetch("http://localhost:8000/api/schedule/", {
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
            setCurrentWeekIndex(0);
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

    fetchSchedule();
  }, []);

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

  return (
    <div className="container">
      <h1>Weekly Operations Shift Schedule</h1>
      {loading && <div className="loading">Loading schedule data...</div>}
      {error && <div className="error">Error: {error}</div>}
      {(!loading && !error && scheduleData) ? (
        <>
          <RosterView 
            sheet={scheduleData} 
            currentWeekIndex={currentWeekIndex} 
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
      ) : !loading && !error && <p>No schedule data found.</p>}
    </div>
  );
}

export default App;