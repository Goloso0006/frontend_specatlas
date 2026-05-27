import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const SESSION_KEY = 'specatlas_history_map';

/**
 * useSmartNavigate provides a `navigate` alternative for "Up" navigation
 * (like Breadcrumbs or Home buttons). 
 * 
 * Instead of pushing a new state to the history stack (which causes the "Back" 
 * button to send the user back into deep views), this hook calculates if the 
 * target path was already visited in the current session. If it was, it uses 
 * `navigate(-delta)` to natively unwind the browser's history stack.
 */
export function useSmartNavigate() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // React Router DOM v6 keeps track of the history index in window.history.state.idx
    const state = window.history.state;
    const idx = state?.idx;
    
    if (typeof idx === 'number') {
      try {
        const mapRaw = sessionStorage.getItem(SESSION_KEY);
        const map = mapRaw ? JSON.parse(mapRaw) : {};
        
        // Record the LATEST index where this exact path was visited.
        map[location.pathname] = idx;
        
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(map));
      } catch (e) {
        console.error('Error saving history map', e);
      }
    }
  }, [location.pathname]);

  const smartNavigate = (to: string, options?: { replace?: boolean }) => {
    try {
      const state = window.history.state;
      const currentIdx = state?.idx;
      
      const mapRaw = sessionStorage.getItem(SESSION_KEY);
      if (mapRaw && typeof currentIdx === 'number') {
        const map = JSON.parse(mapRaw);
        const targetIdx = map[to];
        
        // If we found the target in our history, AND it's strictly in the past,
        // we unwind the stack by moving backwards.
        if (typeof targetIdx === 'number' && targetIdx < currentIdx) {
          const delta = targetIdx - currentIdx;
          navigate(delta);
          return;
        }
      }
    } catch (e) {
      console.error('Error reading history map', e);
    }
    
    // Fallback: If it's a new path or something failed, just do a normal navigate
    navigate(to, options);
  };

  return smartNavigate;
}
