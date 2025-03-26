// Utility function to handle viewport height calculation
// This solves the issue of mobile browsers (especially iOS) with their
// UI elements taking up screen space

/**
 * Sets a CSS variable (--vh) that represents 1% of the viewport height
 * This allows us to use CSS like `height: calc(var(--vh, 1vh) * 100)`
 * which works correctly on mobile browsers
 */
export const setViewportHeight = (): void => {
  // First we get the viewport height and multiply it by 1% to get a value for a vh unit
  const vh = window.innerHeight * 0.01;
  
  // Then we set the value in the --vh custom property to the root of the document
  document.documentElement.style.setProperty('--vh', `${vh}px`);
  
  // Also set a --window-height variable in pixels for direct use 
  document.documentElement.style.setProperty('--window-height', `${window.innerHeight}px`);
  
  // Set variables to detect safe areas for notched devices
  const safeAreaBottom = getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0px';
  document.documentElement.style.setProperty('--safe-area-inset-bottom', safeAreaBottom);
};

/**
 * Check if the device is an iOS device
 */
const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

/**
 * Initializes the viewport height calculation and sets up a resize listener
 * Should be called early in your app's lifecycle (e.g., in main.tsx)
 */
export const initViewportHeight = (): void => {
  // Set the initial viewport height
  setViewportHeight();
  
  // Update on resize and orientationchange
  window.addEventListener('resize', setViewportHeight);
  window.addEventListener('orientationchange', () => {
    // For orientation changes, we wait a bit to get accurate height
    setTimeout(setViewportHeight, 100);
  });
  
  // For iOS Safari specifically, which has address bar behavior that affects height
  if (isIOS()) {
    // On iOS, also update on scroll as the address bar can hide/show during scrolling
    window.addEventListener('scroll', setViewportHeight);
    
    // Add additional event listeners for iOS Safari
    window.addEventListener('touchmove', setViewportHeight);
    window.addEventListener('touchend', setViewportHeight);
    
    // Check height on focus/blur of input elements (keyboard appears/disappears)
    document.addEventListener('focusin', () => {
      // On input focus, wait a bit for keyboard to fully appear
      setTimeout(setViewportHeight, 200);
    });
    
    document.addEventListener('focusout', () => {
      // On input blur, wait for keyboard to disappear
      setTimeout(setViewportHeight, 200);
    });
    
    // Set up an interval to check periodically (helpful for iOS)
    const intervalId = setInterval(setViewportHeight, 2000);
    
    // After page load, update a few times with delays to catch any post-load changes
    window.addEventListener('load', () => {
      setTimeout(setViewportHeight, 500);
      setTimeout(setViewportHeight, 1000);
      setTimeout(setViewportHeight, 2000);
    });
    
    // Clean up interval when window is closed
    window.addEventListener('beforeunload', () => {
      clearInterval(intervalId);
    });
  }
};

/**
 * Cleans up the event listeners
 * Call this when your app unmounts if needed
 */
export const cleanupViewportHeight = (): void => {
  window.removeEventListener('resize', setViewportHeight);
  window.removeEventListener('orientationchange', setViewportHeight);
  window.removeEventListener('scroll', setViewportHeight);
  
  if (isIOS()) {
    window.removeEventListener('touchmove', setViewportHeight);
    window.removeEventListener('touchend', setViewportHeight);
    document.removeEventListener('focusin', setViewportHeight);
    document.removeEventListener('focusout', setViewportHeight);
  }
}; 