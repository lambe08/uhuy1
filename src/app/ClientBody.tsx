"use client";

import { useEffect } from "react";

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  // Remove any extension-added classes during hydration and register SW
  useEffect(() => {
    // This runs only on the client after hydration
    document.body.className = "antialiased";

    // Register service worker for PWA functionality
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered successfully:', registration);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            console.log('SW update found');
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New version available, could show update notification
                  console.log('New version available');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.log('SW registration failed:', error);
        });
    }
  }, []);

  return <div className="antialiased">{children}</div>;
}
