import * as React from 'react';
import styles from './Pagination.module.scss';
import { DefaultButton } from 'office-ui-fabric-react/lib/Button';

export interface IPaginationProps {
  currentPage: number;
  totalPages: number;
  onNext: () => void;
  onPrevious: () => void;
}

export default class Pagination extends React.Component<IPaginationProps> {
  public render(): React.ReactElement<IPaginationProps> {
    const { currentPage, totalPages, onNext, onPrevious } = this.props;
    
    return (
      <div className={styles.pagination}>
        <DefaultButton 
          text="Previous Week" 
          onClick={onPrevious} 
          disabled={currentPage <= 1}
          className={styles.paginationButton}
        />
        
        <span className={styles.pageInfo}>
          Week {currentPage} of {totalPages}
        </span>
        
        <DefaultButton 
          text="Next Week" 
          onClick={onNext} 
          disabled={currentPage >= totalPages}
          className={styles.paginationButton}
        />
      </div>
    );
  }
}
