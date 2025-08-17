// Global error handlers to prevent raw JSON from being displayed
console.log("🛡️ Loading global error protection...");

// Prevent raw JSON responses from being displayed
(function () {
  "use strict";

  // Add global error handling for unhandled promise rejections
  window.addEventListener("unhandledrejection", function (event) {
    console.error("🚨 Unhandled promise rejection:", event.reason);

    // Check if this is an authentication error
    if (event.reason && typeof event.reason === "object") {
      let isAuthError = false;
      let errorMessage = "An unexpected error occurred";

      // Check for authentication-related errors
      if (event.reason.status === 401 || event.reason.status === 403) {
        isAuthError = true;
        errorMessage = "Authentication required. Please log in.";
      } else if (event.reason.data && typeof event.reason.data === "object") {
        const data = event.reason.data;
        if (
          data.error === "Authentication required" ||
          data.message === "No authentication token provided" ||
          (data.error && data.error.toLowerCase().includes("authentication")) ||
          (data.message &&
            data.message.toLowerCase().includes("authentication"))
        ) {
          isAuthError = true;
          errorMessage = "Authentication required. Please log in.";
        }
      }

      // Handle authentication errors
      if (isAuthError) {
        console.log("🔑 Handling authentication error via global handler");

        // Show user-friendly notification
        if (window.notifications) {
          window.notifications.error("Login Required", errorMessage, {
            duration: 4000,
          });
        }

        // Clear any authentication data
        if (window.apiClient) {
          window.apiClient.clearAuthData();
        }

        // Redirect to home page after a delay
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);

        // Prevent the default handling
        event.preventDefault();
        return;
      }
    }

    // For non-auth errors, show a generic message
    if (window.notifications) {
      window.notifications.error(
        "Error",
        "An unexpected error occurred. Please try again.",
        { duration: 4000 }
      );
    }

    // Prevent the default handling to avoid raw error display
    event.preventDefault();
  });

  // Add global error handling for uncaught errors
  window.addEventListener("error", function (event) {
    console.error("🚨 Uncaught error:", event.error);

    // Prevent raw error display and show user-friendly message
    if (window.notifications) {
      window.notifications.error(
        "Error",
        "An unexpected error occurred. Please refresh the page.",
        { duration: 4000 }
      );
    }
  });

  // Override fetch to prevent raw JSON responses from being displayed
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    try {
      const response = await originalFetch.apply(this, args);

      // If this is an authentication error, handle it properly
      if (response.status === 401 || response.status === 403) {
        const clonedResponse = response.clone();
        try {
          const data = await clonedResponse.json();

          if (
            data.error === "Authentication required" ||
            data.message === "No authentication token provided"
          ) {
            console.log("🔑 Authentication error detected in fetch");

            // Show user-friendly notification
            if (window.notifications) {
              window.notifications.error(
                "Login Required",
                "Please log in to continue",
                { duration: 4000 }
              );
            }

            // Clear any authentication data
            if (window.apiClient) {
              window.apiClient.clearAuthData();
            }

            // Redirect to home page after a delay
            setTimeout(() => {
              window.location.href = "/";
            }, 1500);
          }
        } catch (e) {
          // If we can't parse the response, continue with original response
        }
      }

      return response;
    } catch (error) {
      console.error("🚨 Fetch error:", error);
      throw error;
    }
  };

  console.log("✅ Global error protection loaded");
})();
