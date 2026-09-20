import React, { useEffect, useState } from 'react';
import { socketManager } from '../utils/api';
import { Bell, X, Info, Zap, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Toast {
  id: string;
  type: string;
  message: string;
  patientId?: string;
  sender?: string;
  timestamp: string;
}

export default function NotificationCenter() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<Toast[]>([]);

  useEffect(() => {
    // Subscribe to central WebSocket events
    const unsubscribe = socketManager.subscribe((msg: any) => {
      console.log('Notification center received:', msg);
      
      // We handle relevant realtime notifications
      if (
        msg.type === 'PATIENT_REGISTERED' ||
        msg.type === 'VITALS_RECORDED' ||
        msg.type === 'PATIENT_UPDATED'
      ) {
        const newToast: Toast = {
          id: Math.random().toString(),
          type: msg.type,
          message: msg.message || 'System Notification',
          patientId: msg.patientId,
          sender: msg.sender,
          timestamp: new Date().toLocaleTimeString(),
        };

        // Add to toast overlays
        setToasts(prev => [newToast, ...prev].slice(0, 5));
        
        // Add to persistent notification drawer history
        setHistory(prev => [newToast, ...prev].slice(0, 50));

        // Play standard chime/alert audio
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          
          osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
          gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.15);
        } catch (e) {
          // Fallback if browser audio permissions are blocked
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'PATIENT_REGISTERED':
        return <Zap className="h-5 w-5 text-amber-400" />;
      case 'VITALS_RECORDED':
        return <Info className="h-5 w-5 text-emerald-400" />;
      default:
        return <AlertCircle className="h-5 w-5 text-blue-400" />;
    }
  };

  return (
    <>
      {/* Floating Toast Overlays */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, y: -20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="pointer-events-auto bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-4 flex gap-3 items-start text-white relative overflow-hidden"
            >
              {/* Highlight Bar */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400" />
              
              <div className="shrink-0 mt-0.5">{getIcon(toast.type)}</div>
              
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-xs font-mono text-slate-400 uppercase tracking-wider flex justify-between">
                  <span>{toast.type.replace('_', ' ')}</span>
                  <span>{toast.timestamp}</span>
                </p>
                <p className="text-sm font-medium mt-1 text-slate-100">{toast.message}</p>
                {toast.sender && (
                  <p className="text-xs text-slate-500 mt-0.5">By: @{toast.sender}</p>
                )}
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-slate-400 hover:text-white rounded p-0.5 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>


    </>
  );
}
