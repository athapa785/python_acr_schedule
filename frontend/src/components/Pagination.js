import React from 'react';
import '../styles/Pagination.css';

function Pagination({ currentPage, totalPages, onPrevious, onNext }) {
  return (
    <div className="pagination">
      <div className="pagination-controls">
        <button 
          onClick={onPrevious} 
          disabled={currentPage <= 1}
          className="arrow-button"
          aria-label="Previous week"
        >
          ←
        </button>
        <button 
          onClick={onNext} 
          disabled={currentPage >= totalPages}
          className="arrow-button"
          aria-label="Next week"
        >
          →
        </button>
      </div>
      <span className="page-info">{currentPage} of {totalPages}</span>
    </div>
  );
}

export default Pagination;