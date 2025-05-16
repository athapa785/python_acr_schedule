import * as React from 'react';
import styles from './AcrScheduleViewer.module.scss';
import { IAcrScheduleViewerProps } from './IAcrScheduleViewerProps';
import { MSGraphClient } from '@microsoft/sp-http';
import * as XLSX from 'xlsx';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import RosterView from './RosterView';
import Pagination from './Pagination';

export interface IAcrScheduleViewerState {
  scheduleData: any;
  loading: boolean;
  error: string | null;
  currentWeekIndex: number;
  totalWeeks: number;
  lastRefreshTime: Date;
}

export default class AcrScheduleViewer extends React.Component<IAcrScheduleViewerProps, IAcrScheduleViewerState> {
  private refreshTimer: NodeJS.Timeout | null = null;

  constructor(props: IAcrScheduleViewerProps) {
    super(props);
    this.state = {
      scheduleData: null,
      loading: true,
      error: null,
      currentWeekIndex: 0,
      totalWeeks: 0,
      lastRefreshTime: new Date()
    };
  }

  public componentDidMount(): void {
    this.fetchExcelFile();
    
    // Set up refresh interval
    if (this.props.refreshInterval > 0) {
      this.refreshTimer = setInterval(
        () => this.fetchExcelFile(),
        this.props.refreshInterval * 60 * 1000 // Convert minutes to milliseconds
      );
    }
  }

  public componentWillUnmount(): void {
    // Clear the refresh timer when component unmounts
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  public componentDidUpdate(prevProps: IAcrScheduleViewerProps): void {
    // If the Excel file URL or refresh interval changes, update accordingly
    if (prevProps.excelFileUrl !== this.props.excelFileUrl) {
      this.fetchExcelFile();
    }
    
    if (prevProps.refreshInterval !== this.props.refreshInterval) {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
      }
      
      if (this.props.refreshInterval > 0) {
        this.refreshTimer = setInterval(
          () => this.fetchExcelFile(),
          this.props.refreshInterval * 60 * 1000
        );
      }
    }
  }

  private fetchExcelFile = async (): Promise<void> => {
    if (!this.props.excelFileUrl) {
      this.setState({
        loading: false,
        error: "Please configure the Excel file URL in the web part properties."
      });
      return;
    }

    try {
      this.setState({ loading: true, error: null });

      // Get the Excel file using Microsoft Graph API
      this.props.context.msGraphClientFactory
        .getClient()
        .then((client: MSGraphClient) => {
          // If the URL is a full URL, extract the site and item information
          // For simplicity, we'll assume the URL is in the format: https://tenant.sharepoint.com/sites/sitename/Shared%20Documents/filename.xlsx
          // In a production app, you would parse this more robustly
          
          // For demo purposes, we'll use the direct file approach
          client
            .api(this.props.excelFileUrl)
            .get((error: any, response: ArrayBuffer, rawResponse?: any) => {
              if (error) {
                console.error("Error fetching Excel file:", error);
                this.setState({
                  loading: false,
                  error: `Error fetching Excel file: ${error.message}`
                });
                return;
              }

              try {
                // Parse the Excel file using SheetJS
                const data = new Uint8Array(response);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // Process the first sheet
                if (workbook.SheetNames.length > 0) {
                  const firstSheetName = workbook.SheetNames[0];
                  const worksheet = workbook.Sheets[firstSheetName];
                  
                  // Convert to JSON
                  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
                  
                  // Process the data to include cell formatting
                  const processedData = this.processExcelData(worksheet, jsonData);
                  
                  // Find week separators and current week
                  const weekSeparators = this.findWeekSeparators(processedData);
                  const currentWeekIdx = this.findCurrentWeek(processedData, weekSeparators);
                  
                  this.setState({
                    scheduleData: {
                      name: firstSheetName,
                      data: processedData
                    },
                    loading: false,
                    currentWeekIndex: currentWeekIdx,
                    totalWeeks: weekSeparators.length,
                    lastRefreshTime: new Date()
                  });
                } else {
                  this.setState({
                    loading: false,
                    error: "No sheets found in the Excel file."
                  });
                }
              } catch (parseError) {
                console.error("Error parsing Excel data:", parseError);
                this.setState({
                  loading: false,
                  error: `Error parsing Excel data: ${parseError.message}`
                });
              }
            });
        })
        .catch((error: any) => {
          console.error("Error getting Graph client:", error);
          this.setState({
            loading: false,
            error: `Error accessing Microsoft Graph: ${error.message}`
          });
        });
    } catch (err) {
      console.error("Unexpected error:", err);
      this.setState({
        loading: false,
        error: `An unexpected error occurred: ${err.message}`
      });
    }
  }

  // Process Excel data to include cell formatting (comments, strikethrough)
  private processExcelData = (worksheet: XLSX.WorkSheet, jsonData: any[]): any[] => {
    const processedData: any[] = [];
    
    // Get the range of cells in the worksheet
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    
    for (let r = range.s.r; r <= range.e.r; r++) {
      const row: any[] = [];
      
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cellAddress = XLSX.utils.encode_cell({ r, c });
        const cell = worksheet[cellAddress];
        
        if (!cell) {
          row.push("");
          continue;
        }
        
        const cellValue = cell.v !== undefined ? cell.v : "";
        
        // Check for cell formatting (we don't have direct access to comments or strikethrough in SheetJS)
        // In a real implementation, you might need to use additional properties or custom logic
        
        // For now, we'll just use the cell value
        row.push(cellValue);
      }
      
      processedData.push(row);
    }
    
    return processedData;
  }

  // Function to identify where different weeks start in the data
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
  }

  // Function to find the current week based on today's date
  private findCurrentWeek = (rows: any[], weekSeparators: number[]): number => {
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
      for (let j = 0; j < Math.min(10, weekRows.length); j++) {
        const row = weekRows[j];
        
        for (let k = 0; k < row.length; k++) {
          const cell = row[k];
          const cellValue = cell && (typeof cell === 'object' ? cell.value : cell);
          const cellStr = cellValue !== null && cellValue !== undefined ? String(cellValue) : '';
          
          // Check if this is a date
          if (cellStr.match(/\d{4}-\d{2}-\d{2}/)) {
            try {
              const dateInCell = new Date(cellStr);
              
              // If this date is in the current week (within 3 days before or after today)
              const diffTime = Math.abs(dateInCell.getTime() - today.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              if (diffDays <= 3) {
                currentWeekIndex = i;
                foundDateInWeek = true;
                break;
              }
            } catch (e) {
              // Not a valid date, continue
            }
          }
        }
        
        if (foundDateInWeek) break;
      }
      
      if (foundDateInWeek) break;
    }
    
    return currentWeekIndex;
  }

  // Navigate to the next week
  private goToNext = (): void => {
    if (this.state.currentWeekIndex < this.state.totalWeeks - 1) {
      this.setState({
        currentWeekIndex: this.state.currentWeekIndex + 1
      });
    }
  }

  // Navigate to the previous week
  private goToPrevious = (): void => {
    if (this.state.currentWeekIndex > 0) {
      this.setState({
        currentWeekIndex: this.state.currentWeekIndex - 1
      });
    }
  }

  public render(): React.ReactElement<IAcrScheduleViewerProps> {
    const { loading, error, scheduleData, currentWeekIndex, totalWeeks, lastRefreshTime } = this.state;
    const { isDarkTheme } = this.props;

    return (
      <section className={`${styles.acrScheduleViewer} ${isDarkTheme ? styles.darkTheme : ''}`}>
        <div className={styles.container}>
          <div className={styles.row}>
            <div className={styles.column}>
              <h2 className={styles.title}>ACR Schedule Viewer</h2>
              
              {loading && <Spinner label="Loading schedule data..." size={SpinnerSize.large} />}
              
              {error && (
                <MessageBar messageBarType={MessageBarType.error}>
                  Error: {error}
                </MessageBar>
              )}
              
              {!loading && !error && scheduleData && (
                <>
                  <div className={styles.lastRefresh}>
                    Last refreshed: {lastRefreshTime.toLocaleString()}
                  </div>
                  
                  <RosterView 
                    sheet={scheduleData} 
                    currentWeekIndex={currentWeekIndex} 
                  />
                  
                  {totalWeeks > 0 && (
                    <Pagination 
                      currentPage={currentWeekIndex + 1} 
                      totalPages={totalWeeks} 
                      onNext={this.goToNext} 
                      onPrevious={this.goToPrevious} 
                    />
                  )}
                </>
              )}
              
              {!loading && !error && !scheduleData && (
                <MessageBar messageBarType={MessageBarType.info}>
                  No schedule data found. Please check the Excel file URL in the web part properties.
                </MessageBar>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }
}
