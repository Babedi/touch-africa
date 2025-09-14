(function () {
  if (window.ensureNotifications) return;
  window.ensureNotifications = function () {
    if (window.TANotification) return Promise.resolve(window.TANotification);
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "/frontend/shared/scripts/components/notification.js";
      s.async = true;
      s.onload = () => resolve(window.TANotification);
      s.onerror = (err) => reject(err);
      document.head.appendChild(s);
    });
  };
})();
