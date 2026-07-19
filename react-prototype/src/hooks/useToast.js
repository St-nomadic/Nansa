import { useRef, useState, useCallback } from 'react';

const DISPLAY_MS = 2200;

export default function useToast() {
  const [toast, setToast] = useState({ show: false, message: '' });
  const timerRef = useRef(null);

  const showToast = useCallback(message => {
    setToast({ show: true, message });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(t => ({ ...t, show: false })), DISPLAY_MS);
  }, []);

  return { toast, showToast };
}
