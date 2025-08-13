import { useState, useEffect } from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  message: string;
}

let toastCount = 0;
let toastListeners: ((toasts: ToastMessage[]) => void)[] = [];
let currentToasts: ToastMessage[] = [];

function addToast(type: 'success' | 'error', message: string) {
  const toast: ToastMessage = {
    id: String(++toastCount),
    type,
    message,
  };

  currentToasts = [...currentToasts, toast];
  toastListeners.forEach(listener => listener(currentToasts));

  // Auto-remove after 4 seconds
  setTimeout(() => {
    removeToast(toast.id);
  }, 4000);
}

function removeToast(id: string) {
  currentToasts = currentToasts.filter(toast => toast.id !== id);
  toastListeners.forEach(listener => listener(currentToasts));
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>(currentToasts);

  useEffect(() => {
    toastListeners.push(setToasts);
    return () => {
      toastListeners = toastListeners.filter(listener => listener !== setToasts);
    };
  }, []);

  return {
    toasts,
    showSuccess: (message: string) => addToast('success', message),
    showError: (message: string) => addToast('error', message),
    removeToast,
  };
}

export function Toast({ toast, onRemove }: { toast: ToastMessage; onRemove: () => void }) {
  return (
    <div 
      className={`toast toast--${toast.type}`}
      onClick={onRemove}
      style={{ cursor: 'pointer' }}
    >
      {toast.message}
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
      {toasts.map(toast => (
        <Toast 
          key={toast.id} 
          toast={toast} 
          onRemove={() => removeToast(toast.id)} 
        />
      ))}
    </div>
  );
}
