// Debug script to test tenant user modal PIN toggle
function debugTenantUserPinToggle() {
  console.log("🔍 DEBUG: Testing Tenant User Modal PIN Toggle");
  console.log("");

  // 1. Check if modal exists
  const modal = document.getElementById("tenantUserModalOverlay");
  console.log("📋 Modal found:", !!modal);

  if (!modal) {
    console.log("❌ Modal not found. Make sure the modal is loaded.");
    return;
  }

  // Check modal visibility
  const modalStyle = getComputedStyle(modal);
  const isModalVisible =
    modalStyle.display !== "none" &&
    modalStyle.visibility !== "hidden" &&
    modalStyle.opacity !== "0";
  console.log("📋 Modal visible:", isModalVisible);
  console.log("📋 Modal display:", modalStyle.display);
  console.log("📋 Modal visibility:", modalStyle.visibility);
  console.log("📋 Modal opacity:", modalStyle.opacity);

  // 2. Check if PIN input exists
  const pinInput = document.getElementById("tenantUserPin");
  console.log("📋 PIN input found:", !!pinInput);
  console.log("📋 PIN input type:", pinInput?.type);

  // 3. Check if password toggle button exists
  const passwordToggle = modal.querySelector(".password-toggle");
  console.log("📋 Password toggle found:", !!passwordToggle);

  if (!passwordToggle) {
    console.log("❌ Password toggle button not found in modal");
    return;
  }

  // 4. Check if icons exist
  const showIcon = passwordToggle.querySelector(".show-icon");
  const hideIcon = passwordToggle.querySelector(".hide-icon");
  console.log("📋 Show icon found:", !!showIcon);
  console.log("📋 Hide icon found:", !!hideIcon);
  console.log("📋 Show icon display:", showIcon?.style.display || "default");
  console.log("📋 Hide icon display:", hideIcon?.style.display || "default");

  // 5. Check if modal instance exists
  console.log(
    "📋 TenantUserLoginModal class available:",
    !!window.TenantUserLoginModal
  );

  // 6. Check existing event listeners
  console.log("📋 Checking event listeners...");
  try {
    const events = getEventListeners
      ? getEventListeners(passwordToggle)
      : "N/A (dev tools only)";
    console.log("📋 Password toggle event listeners:", events);
  } catch (e) {
    console.log("📋 Event listeners check failed:", e.message);
  }

  // 7. Test manual toggle function
  console.log("");
  console.log("🧪 Testing manual PIN toggle...");

  function manualToggle() {
    if (!pinInput || !passwordToggle) {
      console.log("❌ Required elements missing");
      return;
    }

    const isPassword = pinInput.type === "password";
    console.log("📊 Current PIN type:", pinInput.type);

    // Toggle the input type
    pinInput.type = isPassword ? "text" : "password";
    console.log("📊 New PIN type:", pinInput.type);

    // Toggle the icons
    if (showIcon && hideIcon) {
      showIcon.style.display = isPassword ? "none" : "block";
      hideIcon.style.display = isPassword ? "block" : "none";
      console.log("✅ Icons toggled successfully");
      console.log("📊 Show icon display:", showIcon.style.display);
      console.log("📊 Hide icon display:", hideIcon.style.display);
    } else {
      console.log("❌ Icons not found for toggling");
    }

    // Update aria-label
    passwordToggle.setAttribute(
      "aria-label",
      isPassword ? "Hide PIN" : "Show PIN"
    );
    console.log(
      "✅ Aria-label updated to:",
      passwordToggle.getAttribute("aria-label")
    );
  }

  // 8. Add fresh click event for testing
  if (passwordToggle) {
    // Remove any existing listeners by cloning the element
    const newPasswordToggle = passwordToggle.cloneNode(true);
    passwordToggle.parentNode.replaceChild(newPasswordToggle, passwordToggle);

    newPasswordToggle.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      console.log("🖱️ Password toggle clicked!");

      // Get fresh references since we cloned the element
      const freshPinInput = document.getElementById("tenantUserPin");
      const freshShowIcon = newPasswordToggle.querySelector(".show-icon");
      const freshHideIcon = newPasswordToggle.querySelector(".hide-icon");

      if (!freshPinInput) {
        console.log("❌ PIN input not found");
        return;
      }

      const isPassword = freshPinInput.type === "password";
      console.log("📊 Current PIN type:", freshPinInput.type);

      // Toggle the input type
      freshPinInput.type = isPassword ? "text" : "password";
      console.log("📊 New PIN type:", freshPinInput.type);

      // Toggle the icons
      if (freshShowIcon && freshHideIcon) {
        freshShowIcon.style.display = isPassword ? "none" : "block";
        freshHideIcon.style.display = isPassword ? "block" : "none";
        console.log("✅ Icons toggled successfully");
      } else {
        console.log("❌ Icons not found for toggling");
      }

      // Update aria-label
      newPasswordToggle.setAttribute(
        "aria-label",
        isPassword ? "Hide PIN" : "Show PIN"
      );
      console.log(
        "✅ Aria-label updated to:",
        newPasswordToggle.getAttribute("aria-label")
      );
    });

    console.log("✅ Fresh click handler attached to password toggle");

    // 9. Add visual highlight to make it easy to find
    newPasswordToggle.style.border = "2px solid red";
    newPasswordToggle.style.backgroundColor = "yellow";
    newPasswordToggle.style.cursor = "pointer";
    console.log(
      "🎯 Password toggle highlighted with red border and yellow background"
    );
  }

  // 10. Test initial toggle
  console.log("");
  console.log("🧪 Testing initial toggle...");
  manualToggle();

  console.log("");
  console.log(
    "✅ Debug complete. The eye icon should now be highlighted and clickable!"
  );
}

// Export for manual testing
window.debugTenantUserPinToggle = debugTenantUserPinToggle;
