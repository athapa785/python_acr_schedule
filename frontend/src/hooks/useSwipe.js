import { useEffect } from 'react';

/**
 * Custom hook to detect swipe gestures on touchscreen devices
 * @param {Function} onSwipeLeft - Callback function for left swipe
 * @param {Function} onSwipeRight - Callback function for right swipe
 * @param {number} threshold - Minimum distance in pixels to trigger swipe (default: 50)
 * @param {string} elementId - ID of the element to attach swipe detection (default: document.body)
 */
const useSwipe = (onSwipeLeft, onSwipeRight, threshold = 50, elementId = null) => {
  useEffect(() => {
    let touchStartX = 0;
    let touchEndX = 0;
    
    // Get the target element
    let targetElement = elementId ? document.getElementById(elementId) : document.body;
    
    if (!targetElement) {
      console.error(`Element with ID "${elementId}" not found. Using document.body instead.`);
      targetElement = document.body;
    }
    
    const handleTouchStart = (e) => {
      touchStartX = e.changedTouches[0].screenX;
    };
    
    const handleTouchEnd = (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    };
    
    const handleSwipe = () => {
      // Calculate the distance of the swipe
      const swipeDistance = touchEndX - touchStartX;
      
      // Check if the swipe distance exceeds the threshold
      if (Math.abs(swipeDistance) > threshold) {
        if (swipeDistance > 0) {
          // Swiped right
          onSwipeRight && onSwipeRight();
        } else {
          // Swiped left
          onSwipeLeft && onSwipeLeft();
        }
      }
    };
    
    // Add event listeners
    targetElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    targetElement.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // Clean up event listeners on unmount
    return () => {
      targetElement.removeEventListener('touchstart', handleTouchStart);
      targetElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, threshold, elementId]);
};

export default useSwipe;
