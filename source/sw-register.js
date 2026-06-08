// Service Worker Registration
// Set this to false to disable service worker (useful for development)
const SW_ENABLED = false;

if (SW_ENABLED && 'serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      console.log('Service Worker registered:', registration.scope);

      // Check for updates periodically
      setInterval(() => registration.update(), 60 * 60 * 1000);

      // Handle new version waiting
      const promptUpdate = () => {
        if (confirm('New version available. Update now?')) {
          registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
        }
      };

      if (registration.waiting) promptUpdate();

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            promptUpdate();
          }
        });
      });

      navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  });
}