/**
 * Required Field Asterisk Styling
 * This script automatically styles asterisks (*) in labels to be red
 * for better visual indication of required fields.
 */

(function () {
  "use strict";

  /**
   * Style all asterisks in labels to be red
   */
  function styleRequiredFieldAsterisks() {
    // Find all labels and form-labels
    const labels = document.querySelectorAll("label, .form-label");

    labels.forEach((label) => {
      // Check if the label contains an asterisk
      if (label.textContent && label.textContent.includes("*")) {
        // Wrap asterisks in span with red styling
        const html = label.innerHTML;
        const styledHtml = html.replace(
          /\*/g,
          '<span class="required-asterisk">*</span>'
        );

        // Only update if we actually found asterisks to replace
        if (styledHtml !== html) {
          label.innerHTML = styledHtml;
        }
      }
    });
  }

  /**
   * Initialize asterisk styling
   */
  function init() {
    // Style existing asterisks
    styleRequiredFieldAsterisks();

    // Watch for dynamically added content (like modals)
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          // Check if any new labels were added
          mutation.addedNodes.forEach(function (node) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Style asterisks in the new content
              const newLabels = node.querySelectorAll
                ? node.querySelectorAll("label, .form-label")
                : [];

              newLabels.forEach((label) => {
                if (label.textContent && label.textContent.includes("*")) {
                  const html = label.innerHTML;
                  const styledHtml = html.replace(
                    /\*/g,
                    '<span class="required-asterisk">*</span>'
                  );
                  if (styledHtml !== html) {
                    label.innerHTML = styledHtml;
                  }
                }
              });
            }
          });
        }
      });
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Export for manual usage if needed
  window.styleRequiredFieldAsterisks = styleRequiredFieldAsterisks;
})();
