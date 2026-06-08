// Service Worker Registration
// Set this to false to disable service worker (useful for development)
const SW_ENABLED = true;

if (SW_ENABLED && 'serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      console.log('Service Worker registered:', registration.scope);

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Check every hour

      // Handle controller change (new version activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        promptUpdate();
      });

      // Check if there's a waiting service worker
      if (registration.waiting) {
        promptUpdate();
      }

      // Handle new service worker waiting
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              promptUpdate();
            }
          });
        }
      });
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  });
}

function promptUpdate() {
  // Avoid multiple prompts
  if (document.getElementById('sw-update-prompt')) return;

  const prompt = document.createElement('div');
  prompt.id = 'sw-update-prompt';
  prompt.innerHTML = `
    <div style="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);
                background:#333;color:#fff;padding:16px 24px;border-radius:8px;
                display:flex;gap:12px;align-items:center;z-index:9999;
                font-family:system-ui,sans-serif;box-shadow:0 4px 12px rgba(0,0,0,0.3)">
      <span>New version available</span>
      <button id="sw-update-btn" style="background:#4CAF50;color:#fff;border:none;
                padding:8px 16px;border-radius:4px;cursor:pointer;font-weight:bold;">
        Update
      </button>
      <button id="sw-dismiss-btn" style="background:#666;color:#fff;border:none;
                padding:8px 12px;border-radius:4px;cursor:pointer;">
        Later
      </button>
    </div>
  `;
  document.body.appendChild(prompt);

  document.getElementById('sw-update-btn').addEventListener('click', () => {
    // Tell the waiting service worker to activate
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg && reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    }
  });

  document.getElementById('sw-dismiss-btn').addEventListener('click', () => {
    prompt.remove();
  });
}