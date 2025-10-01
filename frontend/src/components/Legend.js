import React, { useState, useEffect } from 'react';
import '../styles/Legend.css';

function Legend({ onBack, onGoToCurrentWeek }) {
  // SharePoint spreadsheet URL
  const spreadsheetUrl = 'https://slac.sharepoint.com/:x:/r/sites/AOSD/AOSD_Management/Documents/Schedules/ACR%20Operations%20Shift%20Schedule%202024.xlsx?d=w8b1d9fc8720c41fda051c6e09ca9ed44&csf=1&web=1&e=Ugpkbf';
  
  // Name pools - all operators and all EOICs
  const allOperators = ['Bien', 'Bisi', 'Blanchard', 'Cassidy', 'Cheung', 'Cotter', 'Daligault', 'De Mario', 'Duran', 'Khashayar', 'Lopardo', 'Rafael', 'Rouland', 'Thapa', 'Casey', 'Lans', 'Legate', 'Marino', 'Barcklay'];
  const allEOICs = ['Ausherman', 'Brennan', 'Charlery', 'Duong', 'Garske', 'Lubana', 'Wang'];
  
  // Helper function to pick N unique random items from an array
  const pickUniqueRandom = (arr, count) => {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };
  
  // Pick random names on component mount
  const [displayNames, setDisplayNames] = useState({
    eoic: '',
    operator1: '',
    operator2: '',
    backup: '',
    comment: '',
    strikethrough: ''
  });
  
  useEffect(() => {
    // Pick 1 EOIC for the EOIC example (strict)
    const selectedEOIC = pickUniqueRandom(allEOICs, 1)[0];
    
    // Pick 2 operators for operator examples (strict)
    const selectedOperators = pickUniqueRandom(allOperators, 2);
    
    // Combine remaining names for flexible examples (backup, comment, strikethrough)
    const remainingEOICs = allEOICs.filter(name => name !== selectedEOIC);
    const remainingOperators = allOperators.filter(name => !selectedOperators.includes(name));
    const remainingNames = [...remainingOperators, ...remainingEOICs];
    
    // Pick 3 more unique names from remaining pool
    const flexibleNames = pickUniqueRandom(remainingNames, 3);
    
    setDisplayNames({
      eoic: selectedEOIC,
      operator1: selectedOperators[0],
      operator2: selectedOperators[1],
      backup: flexibleNames[0],
      comment: flexibleNames[1],
      strikethrough: flexibleNames[2]
    });
  }, []);

  return (
    <div className="legend-container">
      <div className="legend-top-nav">
        <button className="legend-nav-small" onClick={onBack}>
          Back to Schedule
        </button>
        <button className="legend-nav-small" onClick={onGoToCurrentWeek}>
          Go to Current Week
        </button>
      </div>
      
      <div className="legend-header">
        <h1>Schedule Guide</h1>
        <p className="legend-subtitle">Visual indicators reference</p>
      </div>

      <div className="legend-content">
        <section className="legend-section">
          <h2>Staff Assignments</h2>
          <p className="section-description">
            Color-coded backgrounds identify roles for each shift.
          </p>

          <div className="legend-item">
            <div className="legend-visual">
              <div className="example-cell eoic-cell">{displayNames.eoic}</div>
            </div>
            <div className="legend-description">
              <h3>On-shift EOIC</h3>
              <div className="color-label">Dark Green</div>
            </div>
          </div>

          <div className="legend-item">
            <div className="legend-visual">
              <div className="example-cell operator-cell">{displayNames.operator1}</div>
              <div className="example-cell operator-cell">{displayNames.operator2}</div>
            </div>
            <div className="legend-description">
              <h3>On-Shift Operators</h3>
              <div className="color-label">Light Green</div>
            </div>
          </div>

          <div className="legend-item">
            <div className="legend-visual">
              <div className="example-cell backup-cell">{displayNames.backup}</div>
            </div>
            <div className="legend-description">
              <h3>Back-up Operator/EOIC</h3>
              <div className="color-label">No Background</div>
            </div>
          </div>
        </section>

        <section className="legend-section">
          <h2>Cell Indicators</h2>
          <p className="section-description">
            Visual markers provide additional schedule information.
          </p>

          <div className="legend-item">
            <div className="legend-visual">
              <div className="example-cell comment-example">
                <span className="example-comment-dot"></span>{displayNames.comment}
              </div>
            </div>
            <div className="legend-description">
              <h3>Additional Notes</h3>
              <p>
                <strong>Blue Dot:</strong> Click or tap to view details.
              </p>
            </div>
          </div>

          <div className="legend-item">
            <div className="legend-visual">
              <div className="example-cell strikethrough-example">
                <span className="strikethrough-text">{displayNames.strikethrough}</span>
              </div>
            </div>
            <div className="legend-description">
              <h3>Absent</h3>
              <p>
                <strong>Strikethrough:</strong> Vacation, PTO, sick leave, or other leave.
              </p>
            </div>
          </div>

          <div className="legend-item">
            <div className="legend-visual">
              <div className="example-cell highlight-example"></div>
            </div>
            <div className="legend-description">
              <h3>Coverage Required</h3>
              <p>
                <strong>Yellow Highlight:</strong> Shift is currently unassigned and requires coverage.
              </p>
            </div>
          </div>
        </section>

        <section className="legend-section">
          <h2>Interactive Features</h2>

          <div className="legend-item-compact">
            <div className="legend-description">
              <h3>👆 Name Highlighting</h3>
              <p>
                <strong>Double-click</strong> (desktop) or <strong>long-press</strong> (mobile) a staff member's name
                to highlight all occurrences. Click "Clear" to remove.
              </p>
            </div>
          </div>

          <div className="legend-item-compact">
            <div className="legend-description">
              <h3>👈 👉 Week Navigation</h3>
              <p>
                Use <strong>navigation arrows</strong> or <strong>swipe gestures</strong> (mobile/tablet) to move
                between weeks. "Go to Current Week" returns to today's date.
              </p>
            </div>
          </div>
        </section>

        <section className="legend-section legend-footer">
          <h2>Data Source</h2>
          <p className="section-description">
            The data is automatically synchronized from the master spreadsheet maintained by supervisors and 
            refreshes every 15 minutes to ensure you are always viewing the most up-to-date information.
            If you require an immediate update, simply refresh the page. 
            If you notice any discrepancies, please verify the data directly in the master spreadsheet using the link below.
          </p>
          <div className="source-link-container">
            <a href={spreadsheetUrl} className="source-link" target="_blank" rel="noopener noreferrer">
              View Master Spreadsheet
            </a>
          </div>
          <p className="footer-note">
            Need to make changes? Contact your supervisor to update the master schedule.
          </p>
        </section>
      </div>

      <div className="legend-navigation">
        <button className="legend-nav-button back-button" onClick={onBack}>
          Back to Schedule
        </button>
        <button className="legend-nav-button current-week-button" onClick={onGoToCurrentWeek}>
          Go to Current Week
        </button>
      </div>
    </div>
  );
}

export default Legend;
