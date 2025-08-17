Based on the following, create the NeighbourGuard™ Frontend:

## Users: Internal Admins, Tenant Admins, and Tenant Users.

## Landing Page Implementation

### Landing Page Structure

**Base Path**: `frontend/public/`

**Main Landing Page**:

- `index.html` - Main landing page layout with hero section and authentication entry points
- `index.css` - Landing page styles with responsive design and animations
- `index.js` - Landing page functionality and modal triggers

**Assets**:

- `assets/logo.png` - NeighbourGuard™ logo
- `assets/favicon.ico` - Browser favicon
- `assets/hero-background.jpg` - Hero section background image (optional)

### Landing Page Content Structure

#### Header Section

- **Logo**: NeighbourGuard™ branding with tagline
- **Navigation**: Three authentication entry point buttons
- **Mobile Menu**: Hamburger menu for responsive design

#### Hero Section

- **Main Headline**: "Secure Emergency Response Platform"
- **Subheadline**: "Professional emergency activation and response management system"
- **Call-to-Action Buttons**: Primary authentication options
- **Hero Image/Background**: Professional security/emergency theme

#### Features Section

- **Service Highlights**: Key platform capabilities
- **Emergency Response**: 24/7 monitoring and response
- **Multi-tenant Support**: Scalable for organizations
- **Professional Integration**: Advanced alarm system support

#### Authentication Section

- **Login Options**: Three distinct user type entry points
- **Security Messaging**: Trust indicators and compliance information
- **Support Information**: Contact details for assistance

#### Footer Section

- **Company Information**: NeighbourGuard™ details
- **Legal Links**: Privacy policy, terms of service
- **Contact Information**: Support and sales contacts
- **Social Media**: Professional social media links

### Landing Page Authentication Entry Points

#### File Structure Organization

- **Public Modals**: `frontend/public/modals/` - Publicly accessible authentication modals
- **Internal Admin**: `frontend/private/internal/` - Internal admin dashboard and components
- **Tenant Admin**: `frontend/private/external/tenant.admin/` - Tenant admin dashboard and components
- **Tenant User**: `frontend/private/external/tenant.user/` - Tenant user dashboard and components

**Component Organization Principle**: Each component has its own folder containing separate HTML, CSS, and JS files to maintain separation of concerns and modularity.

**File Naming Convention**:

- **Folders**: Lowercase with dots (e.g., `login.modal/`, `admin.dashboard/`)
- **Files**: `index.html`, `index.css`, `index.js` within each component folder

### Landing Page Design Specifications

#### Color Scheme

- **Primary**: Orange gradient (#ff6b35 to #f7931e) for Internal Admin
- **Secondary**: Navy blue (#1e3a8a) for Tenant Admin
- **Tertiary**: Outlined style for Tenant User
- **Neutral**: Grays and whites for content sections
- **Success**: Green (#10b981) for success states
- **Error**: Red (#ef4444) for error states

#### Typography

- **Headlines**: Bold, professional sans-serif
- **Body Text**: Clean, readable sans-serif
- **UI Elements**: Medium weight for buttons and navigation
- **Technical Text**: Monospace for technical details

#### Layout Structure

- **Container**: Max-width with centered content
- **Grid System**: Responsive grid for feature sections
- **Spacing**: Consistent spacing scale using CSS custom properties
- **Breakpoints**: Mobile-first responsive design

#### Interactive Elements

- **Hover Effects**: Subtle animations on buttons and links
- **Focus States**: Clear accessibility indicators
- **Loading States**: Spinners for async operations
- **Transitions**: Smooth animations for state changes

### Landing Page Login Flow (index.html)

Based on the `index.css` structure, the landing page features three distinct login entry points in the header navigation:

#### Authentication Buttons

1. **Internal Admin Login** - Orange gradient button (primary)
2. **Tenant Admin Login** - Navy blue button (secondary)
3. **Tenant User Login** - Outlined button (tertiary)

#### Login Modal Pattern

Each button triggers a specific authentication modal with:

- **Blurred overlay** background
- **Real-time validation** using Zod schemas
- **Loading spinner** on form submission
- **Success snackbar** on successful authentication
- **Error messages** displayed within modal on failure
- **Dashboard redirection** on successful login

### Modal Implementation Structure

#### 1. Internal Admin Login Modal

**Component Folder**: `frontend/public/modals/internal.admin.login.modal/`

**Files**:

- `frontend/public/modals/internal.admin.login.modal/index.html`
- `frontend/public/modals/internal.admin.login.modal/index.css`
- `frontend/public/modals/internal.admin.login.modal/index.js`

**Form Fields** (based on backend validation):

- `email` (email input with `@neibourguard.co.za` validation)
- `password` (password input, min 8 chars)

**API Endpoint**: `POST /internal/admin/login`
**Success Redirect**: `frontend/private/internal/dashboard/index.html`

#### 2. Tenant Admin Login Modal

**Component Folder**: `frontend/public/modals/tenant.admin.login.modal/`

**Files**:

- `frontend/public/modals/tenant.admin.login.modal/index.html`
- `frontend/public/modals/tenant.admin.login.modal/index.css`
- `frontend/public/modals/tenant.admin.login.modal/index.js`

**Form Fields**:

- `tenantName` (text input for tenant identification)
- `email` (email input)
- `password` (password input)

**API Endpoint**: `POST /external/tenantAdmin/login`
**Success Redirect**: `frontend/private/external/tenant.admin/dashboard/index.html`

#### 3. Tenant User Login Modal

**Component Folder**: `frontend/public/modals/tenant.user.login.modal/`

**Files**:

- `frontend/public/modals/tenant.user.login.modal/index.html`
- `frontend/public/modals/tenant.user.login.modal/index.css`
- `frontend/public/modals/tenant.user.login.modal/index.js`

**Form Fields**:

- `tenantName` (text input for tenant identification)
- `phoneNumber` (tel input with +27 format validation)
- `pin` (4-digit input)

**API Endpoint**: `POST /external/tenantUser/login`
**Success Redirect**: `frontend/private/external/tenant.user/dashboard/index.html`

### Landing Page Implementation Details

#### Landing Page HTML Structure (`frontend/public/index.html`)

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>NeighbourGuard™ - Professional Emergency Response Platform</title>
    <link rel="stylesheet" href="./index.css" />
    <link rel="stylesheet" href="../shared/variables.css" />
    <link rel="icon" href="./assets/favicon.ico" type="image/x-icon" />
  </head>
  <body>
    <!-- Header with Navigation -->
    <header class="site-header">
      <div class="container">
        <div class="header-content">
          <div class="logo-section">
            <img
              src="./assets/logo.png"
              alt="NeighbourGuard™"
              class="site-logo"
            />
            <span class="logo-text">NeighbourGuard™</span>
          </div>

          <nav class="main-navigation">
            <button
              id="internalAdminLoginBtn"
              class="auth-button auth-button--primary"
            >
              Internal Admin Login
            </button>
            <button
              id="tenantAdminLoginBtn"
              class="auth-button auth-button--secondary"
            >
              Tenant Admin Login
            </button>
            <button
              id="tenantUserLoginBtn"
              class="auth-button auth-button--tertiary"
            >
              Tenant User Login
            </button>
          </nav>

          <button class="mobile-menu-toggle" aria-label="Toggle menu">
            <span class="hamburger"></span>
          </button>
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="container">
        <div class="hero-content">
          <div class="hero-text">
            <h1 class="hero-headline">Secure Emergency Response Platform</h1>
            <p class="hero-subheadline">
              Professional emergency activation and response management system
              for organizations and tenants
            </p>

            <div class="hero-buttons">
              <button
                class="cta-button cta-button--primary"
                data-login="internal.admin"
              >
                Admin Access
              </button>
              <button
                class="cta-button cta-button--secondary"
                data-login="tenant.admin"
              >
                Tenant Portal
              </button>
              <button
                class="cta-button cta-button--tertiary"
                data-login="tenant.user"
              >
                User Access
              </button>
            </div>
          </div>

          <div class="hero-visual">
            <div class="hero-graphic">
              <!-- Security/Emergency themed visual element -->
              <div class="security-badge">
                <svg class="shield-icon" viewBox="0 0 24 24">
                  <path
                    d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"
                  />
                </svg>
                <span>24/7 Monitoring</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features-section">
      <div class="container">
        <h2 class="section-title">Platform Capabilities</h2>

        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                />
              </svg>
            </div>
            <h3>Emergency Response</h3>
            <p>
              Instant emergency activation with professional response
              coordination and multi-channel communication.
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24">
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                />
              </svg>
            </div>
            <h3>Multi-Tenant Support</h3>
            <p>
              Scalable platform supporting multiple organizations with isolated
              tenant management and customization.
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24">
                <path
                  d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"
                />
              </svg>
            </div>
            <h3>Professional Integration</h3>
            <p>
              Advanced alarm system integration with RTU5024, RTU5025, and
              GSM2000 module support.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Authentication Section -->
    <section class="auth-section">
      <div class="container">
        <h2 class="section-title">Secure Access Portal</h2>
        <p class="section-subtitle">
          Choose your access level to enter the NeighbourGuard™ platform
        </p>

        <div class="auth-options">
          <div class="auth-option">
            <div class="auth-option-header">
              <h3>Internal Administration</h3>
              <span class="auth-badge">System Level</span>
            </div>
            <p>
              Full system administration with tenant management, service
              configuration, and system monitoring capabilities.
            </p>
            <button class="auth-option-button" data-login="internal.admin">
              Admin Login
            </button>
          </div>

          <div class="auth-option">
            <div class="auth-option-header">
              <h3>Tenant Administration</h3>
              <span class="auth-badge">Organization Level</span>
            </div>
            <p>
              Manage your organization's users, responders, alarm systems, and
              emergency response configuration.
            </p>
            <button class="auth-option-button" data-login="tenant.admin">
              Tenant Portal
            </button>
          </div>

          <div class="auth-option">
            <div class="auth-option-header">
              <h3>User Access</h3>
              <span class="auth-badge">Personal Level</span>
            </div>
            <p>
              Personal emergency activation, profile management, and private
              responder configuration.
            </p>
            <button class="auth-option-button" data-login="tenant.user">
              User Access
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="site-footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-section">
            <div class="footer-logo">
              <img
                src="./assets/logo.png"
                alt="NeighbourGuard™"
                class="footer-logo-img"
              />
              <span class="footer-logo-text">NeighbourGuard™</span>
            </div>
            <p class="footer-description">
              Professional emergency response platform providing 24/7 monitoring
              and coordination services.
            </p>
          </div>

          <div class="footer-section">
            <h4>Platform</h4>
            <ul class="footer-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#security">Security</a></li>
              <li><a href="#support">Support</a></li>
            </ul>
          </div>

          <div class="footer-section">
            <h4>Support</h4>
            <ul class="footer-links">
              <li>
                <a href="mailto:support@neighbourguard.co.za"
                  >Technical Support</a
                >
              </li>
              <li><a href="tel:+27119876543">Emergency: +27 11 987 6543</a></li>
              <li><a href="#contact">Contact Us</a></li>
            </ul>
          </div>

          <div class="footer-section">
            <h4>Legal</h4>
            <ul class="footer-links">
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms of Service</a></li>
              <li><a href="#compliance">Compliance</a></li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <p>&copy; 2025 NeighbourGuard™. All rights reserved.</p>
          <p>Professional Emergency Response Platform</p>
        </div>
      </div>
    </footer>

    <!-- Modal Container -->
    <div id="modalContainer">
      <!-- Authentication modals will be dynamically loaded here -->
    </div>

    <script src="./index.js"></script>
  </body>
</html>
```

#### Landing Page JavaScript Implementation (`frontend/public/index.js`)

```javascript
/**
 * NeighbourGuard™ Landing Page
 * Handles authentication modal triggers and landing page interactions
 */
class LandingPage {
  constructor() {
    this.modals = new Map();
    this.currentModal = null;
    this.mobileMenuOpen = false;

    this.init();
  }

  /**
   * Initialize landing page functionality
   */
  init() {
    this.attachEventListeners();
    this.setupMobileMenu();
    this.preloadCriticalAssets();

    // Check if user is already authenticated
    this.checkExistingAuthentication();
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Authentication button listeners
    const authButtons = document.querySelectorAll("[data-login]");
    authButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const loginType = e.target.dataset.login;
        this.openAuthModal(loginType);
      });
    });

    // Legacy button IDs for compatibility
    const internalAdminBtn = document.getElementById("internalAdminLoginBtn");
    const tenantAdminBtn = document.getElementById("tenantAdminLoginBtn");
    const tenantUserBtn = document.getElementById("tenantUserLoginBtn");

    internalAdminBtn?.addEventListener("click", () =>
      this.openAuthModal("internal.admin")
    );
    tenantAdminBtn?.addEventListener("click", () =>
      this.openAuthModal("tenant.admin")
    );
    tenantUserBtn?.addEventListener("click", () =>
      this.openAuthModal("tenant.user")
    );

    // Mobile menu toggle
    const mobileToggle = document.querySelector(".mobile-menu-toggle");
    mobileToggle?.addEventListener("click", () => this.toggleMobileMenu());

    // Close mobile menu on outside click
    document.addEventListener("click", (e) => {
      if (
        this.mobileMenuOpen &&
        !e.target.closest(".main-navigation") &&
        !e.target.closest(".mobile-menu-toggle")
      ) {
        this.closeMobileMenu();
      }
    });

    // Smooth scroll for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach((link) => {
      link.addEventListener("click", (e) => this.handleSmoothScroll(e));
    });

    // Keyboard navigation
    document.addEventListener("keydown", (e) => this.handleKeyboardNav(e));
  }

  /**
   * Open authentication modal
   */
  async openAuthModal(loginType) {
    try {
      const modal = await this.loadAuthModal(loginType);
      if (modal) {
        this.currentModal = modal;
        modal.show();
      }
    } catch (error) {
      console.error("Failed to open authentication modal:", error);
      this.showErrorMessage(
        "Failed to load login form. Please refresh and try again."
      );
    }
  }

  /**
   * Load authentication modal component
   */
  async loadAuthModal(loginType) {
    // Check if modal is already loaded
    if (this.modals.has(loginType)) {
      return this.modals.get(loginType);
    }

    const modalPaths = {
      "internal.admin": "modals/internal.admin.login.modal",
      "tenant.admin": "modals/tenant.admin.login.modal",
      "tenant.user": "modals/tenant.user.login.modal",
    };

    const modalPath = modalPaths[loginType];
    if (!modalPath) {
      throw new Error(`Unknown login type: ${loginType}`);
    }

    try {
      // Load modal HTML
      const htmlResponse = await fetch(`${modalPath}/index.html`);
      if (!htmlResponse.ok) throw new Error("Failed to load modal HTML");
      const modalHTML = await htmlResponse.text();

      // Create modal container
      const modalContainer = document.getElementById("modalContainer");
      const parser = new DOMParser();
      const modalDoc = parser.parseFromString(modalHTML, "text/html");
      const modalElement = modalDoc.body.firstElementChild;

      modalContainer.appendChild(modalElement);

      // Load modal CSS
      await this.loadModalCSS(modalPath);

      // Load modal JavaScript
      const modalClass = await this.loadModalJS(modalPath, loginType);

      // Create modal instance
      const modal = new modalClass();
      this.modals.set(loginType, modal);

      return modal;
    } catch (error) {
      console.error(`Failed to load modal ${loginType}:`, error);
      throw error;
    }
  }

  /**
   * Load modal CSS
   */
  async loadModalCSS(modalPath) {
    return new Promise((resolve, reject) => {
      const cssId = `modal-css-${modalPath.replace(/[\/\.]/g, "-")}`;

      // Check if already loaded
      if (document.getElementById(cssId)) {
        resolve();
        return;
      }

      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = `${modalPath}/index.css`;
      link.onload = resolve;
      link.onerror = reject;

      document.head.appendChild(link);
    });
  }

  /**
   * Load modal JavaScript
   */
  async loadModalJS(modalPath, loginType) {
    const script = document.createElement("script");
    script.src = `${modalPath}/index.js`;

    return new Promise((resolve, reject) => {
      script.onload = () => {
        // Get modal class based on login type
        const modalClasses = {
          "internal.admin": "InternalAdminLoginModal",
          "tenant.admin": "TenantAdminLoginModal",
          "tenant.user": "TenantUserLoginModal",
        };

        const className = modalClasses[loginType];
        if (window[className]) {
          resolve(window[className]);
        } else {
          reject(new Error(`Modal class ${className} not found`));
        }
      };
      script.onerror = reject;

      document.head.appendChild(script);
    });
  }

  /**
   * Setup mobile menu functionality
   */
  setupMobileMenu() {
    const navigation = document.querySelector(".main-navigation");
    if (navigation) {
      navigation.classList.add("mobile-menu");
    }
  }

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu() {
    const navigation = document.querySelector(".main-navigation");
    const toggle = document.querySelector(".mobile-menu-toggle");

    if (this.mobileMenuOpen) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  }

  /**
   * Open mobile menu
   */
  openMobileMenu() {
    const navigation = document.querySelector(".main-navigation");
    const toggle = document.querySelector(".mobile-menu-toggle");

    navigation?.classList.add("open");
    toggle?.classList.add("active");
    document.body.style.overflow = "hidden";

    this.mobileMenuOpen = true;
  }

  /**
   * Close mobile menu
   */
  closeMobileMenu() {
    const navigation = document.querySelector(".main-navigation");
    const toggle = document.querySelector(".mobile-menu-toggle");

    navigation?.classList.remove("open");
    toggle?.classList.remove("active");
    document.body.style.overflow = "";

    this.mobileMenuOpen = false;
  }

  /**
   * Handle smooth scrolling
   */
  handleSmoothScroll(e) {
    const href = e.target.getAttribute("href");
    if (href.startsWith("#") && href.length > 1) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  }

  /**
   * Handle keyboard navigation
   */
  handleKeyboardNav(e) {
    // Close mobile menu on escape
    if (e.key === "Escape" && this.mobileMenuOpen) {
      this.closeMobileMenu();
    }

    // Close modal on escape
    if (e.key === "Escape" && this.currentModal?.isVisible()) {
      this.currentModal.hide();
    }
  }

  /**
   * Check existing authentication
   */
  checkExistingAuthentication() {
    // Check for existing authentication tokens
    const internalAdminToken = localStorage.getItem("internalAdminToken");
    const tenantAdminToken = localStorage.getItem("tenantAdminToken");
    const tenantUserToken = localStorage.getItem("tenantUserToken");

    // Redirect to appropriate dashboard if authenticated
    if (internalAdminToken) {
      window.location.href =
        "/frontend/private/dashboards/internal.admin.dashboard/";
    } else if (tenantAdminToken) {
      window.location.href =
        "/frontend/private/dashboards/tenant.admin.dashboard/";
    } else if (tenantUserToken) {
      window.location.href =
        "/frontend/private/dashboards/tenant.user.dashboard/";
    }
  }

  /**
   * Preload critical assets
   */
  async preloadCriticalAssets() {
    const criticalAssets = ["./assets/logo.png", "../shared/variables.css"];

    criticalAssets.forEach((asset) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.href = asset;
      link.as = asset.endsWith(".css") ? "style" : "image";
      document.head.appendChild(link);
    });
  }

  /**
   * Show error message
   */
  showErrorMessage(message) {
    // Create temporary error notification
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-notification";
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 1rem;
            border-radius: 0.5rem;
            z-index: 10000;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;

    document.body.appendChild(errorDiv);

    // Auto remove after 5 seconds
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }
}

// Initialize landing page when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.landingPage = new LandingPage();
});
```

### Authentication Flow Implementation

#### Modal Trigger (index.js)

```javascript
// Event listeners for login buttons
document
  .getElementById("internalAdminLoginBtn")
  .addEventListener("click", () => {
    openLoginModal("internal.admin");
  });

document.getElementById("tenantAdminLoginBtn").addEventListener("click", () => {
  openLoginModal("tenant.admin");
});

document.getElementById("tenantUserLoginBtn").addEventListener("click", () => {
  openLoginModal("tenant.user");
});
```

#### Real-time Validation Pattern

Each modal implements:

- **Field-level validation** on input change
- **Form-level validation** before submission
- **Visual feedback** with error states and success indicators
- **Accessibility** with ARIA labels and focus management

#### Loading States

- **Button spinner** during API call
- **Disabled form** during submission
- **Loading overlay** to prevent multiple submissions

#### Success/Error Handling

- **Success**: JWT token storage → Dashboard redirect → Success snackbar
- **Error**: Display error message within modal → Re-enable form → Focus first error field

#### Landing Page CSS Specifications (`frontend/public/index.css`)

```css
/* NeighbourGuard™ Landing Page Styles */
@import "../shared/variables.css";

/* Reset and Base Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-sans);
  line-height: var(--line-height-base);
  color: var(--color-text-primary);
  background: var(--color-white);
  overflow-x: hidden;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

/* Header Styles */
.site-header {
  background: var(--color-white);
  border-bottom: 1px solid var(--border-light);
  position: sticky;
  top: 0;
  z-index: var(--z-header);
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80px;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.site-logo {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.logo-text {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}

/* Navigation Styles */
.main-navigation {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.auth-button {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  transition: var(--transition-base);
  cursor: pointer;
  border: 2px solid transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  white-space: nowrap;
}

.auth-button--primary {
  background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
  color: white;
  border-color: transparent;
}

.auth-button--primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  filter: brightness(1.1);
}

.auth-button--secondary {
  background: var(--color-secondary);
  color: white;
  border-color: var(--color-secondary);
}

.auth-button--secondary:hover {
  background: var(--color-secondary-600);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.auth-button--tertiary {
  background: transparent;
  color: var(--color-text-primary);
  border-color: var(--border-default);
}

.auth-button--tertiary:hover {
  background: var(--color-gray-50);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* Mobile Menu Toggle */
.mobile-menu-toggle {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--spacing-xs);
  flex-direction: column;
  gap: 4px;
}

.hamburger {
  width: 24px;
  height: 3px;
  background: var(--color-text-primary);
  transition: var(--transition-base);
  position: relative;
}

.hamburger::before,
.hamburger::after {
  content: "";
  position: absolute;
  width: 100%;
  height: 3px;
  background: var(--color-text-primary);
  transition: var(--transition-base);
}

.hamburger::before {
  top: -8px;
}

.hamburger::after {
  top: 8px;
}

.mobile-menu-toggle.active .hamburger {
  background: transparent;
}

.mobile-menu-toggle.active .hamburger::before {
  transform: rotate(45deg);
  top: 0;
}

.mobile-menu-toggle.active .hamburger::after {
  transform: rotate(-45deg);
  top: 0;
}

/* Hero Section */
.hero-section {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: var(--spacing-4xl) 0;
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("./assets/hero-pattern.svg") no-repeat center;
  background-size: cover;
  opacity: 0.05;
  z-index: 1;
}

.hero-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-4xl);
  align-items: center;
  position: relative;
  z-index: 2;
}

.hero-text {
  max-width: 600px;
}

.hero-headline {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-lg);
  line-height: var(--line-height-tight);
}

.hero-subheadline {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-2xl);
  line-height: var(--line-height-relaxed);
}

.hero-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.cta-button {
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
  transition: var(--transition-base);
  cursor: pointer;
  border: 2px solid transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 52px;
  min-width: 140px;
}

.cta-button--primary {
  background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
  color: white;
}

.cta-button--primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(255, 107, 53, 0.4);
}

.cta-button--secondary {
  background: var(--color-secondary);
  color: white;
}

.cta-button--secondary:hover {
  background: var(--color-secondary-600);
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(30, 58, 138, 0.4);
}

.cta-button--tertiary {
  background: transparent;
  color: var(--color-text-primary);
  border-color: var(--border-default);
}

.cta-button--tertiary:hover {
  background: var(--color-white);
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Hero Visual */
.hero-visual {
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-graphic {
  position: relative;
  width: 100%;
  max-width: 400px;
  aspect-ratio: 1;
}

.security-badge {
  background: var(--color-white);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  text-align: center;
}

.shield-icon {
  width: 80px;
  height: 80px;
  fill: var(--color-primary);
}

.security-badge span {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

/* Features Section */
.features-section {
  padding: var(--spacing-4xl) 0;
  background: var(--color-white);
}

.section-title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  text-align: center;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-3xl);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-2xl);
}

.feature-card {
  background: var(--color-white);
  border-radius: var(--radius-xl);
  padding: var(--spacing-2xl);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
  transition: var(--transition-base);
  text-align: center;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary-200);
}

.feature-icon {
  width: 60px;
  height: 60px;
  margin: 0 auto var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--color-primary-50);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-icon svg {
  width: 32px;
  height: 32px;
  fill: var(--color-primary);
}

.feature-card h3 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.feature-card p {
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}

/* Authentication Section */
.auth-section {
  padding: var(--spacing-4xl) 0;
  background: var(--color-gray-50);
}

.section-subtitle {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-3xl);
}

.auth-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: var(--spacing-xl);
}

.auth-option {
  background: var(--color-white);
  border-radius: var(--radius-xl);
  padding: var(--spacing-2xl);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
  transition: var(--transition-base);
}

.auth-option:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary-200);
}

.auth-option-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}

.auth-option h3 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.auth-badge {
  background: var(--color-primary-100);
  color: var(--color-primary-700);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.auth-option p {
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--spacing-lg);
}

.auth-option-button {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: var(--transition-base);
}

.auth-option-button:hover {
  background: var(--color-primary-600);
  transform: translateY(-1px);
}

/* Footer Styles */
.site-footer {
  background: var(--color-gray-900);
  color: var(--color-gray-300);
  padding: var(--spacing-3xl) 0 var(--spacing-xl);
}

.footer-content {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: var(--spacing-2xl);
  margin-bottom: var(--spacing-2xl);
}

.footer-section h4 {
  color: var(--color-white);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-md);
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.footer-logo-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.footer-logo-text {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-white);
}

.footer-description {
  color: var(--color-gray-400);
  line-height: var(--line-height-relaxed);
}

.footer-links {
  list-style: none;
}

.footer-links li {
  margin-bottom: var(--spacing-xs);
}

.footer-links a {
  color: var(--color-gray-400);
  text-decoration: none;
  transition: var(--transition-base);
}

.footer-links a:hover {
  color: var(--color-white);
}

.footer-bottom {
  border-top: 1px solid var(--color-gray-700);
  padding-top: var(--spacing-lg);
  text-align: center;
  color: var(--color-gray-500);
}

.footer-bottom p {
  margin-bottom: var(--spacing-xs);
}

/* Error Notification */
.error-notification {
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsive Design */
@media (max-width: 1024px) {
  .hero-content {
    grid-template-columns: 1fr;
    gap: var(--spacing-2xl);
    text-align: center;
  }

  .features-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }

  .footer-content {
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-xl);
  }
}

@media (max-width: 768px) {
  .container {
    padding: 0 var(--spacing-md);
  }

  .header-content {
    height: 70px;
  }

  .main-navigation {
    position: fixed;
    top: 70px;
    left: 0;
    right: 0;
    background: var(--color-white);
    border-bottom: 1px solid var(--border-light);
    flex-direction: column;
    padding: var(--spacing-lg);
    gap: var(--spacing-md);
    transform: translateY(-100%);
    opacity: 0;
    visibility: hidden;
    transition: var(--transition-base);
    z-index: var(--z-modal);
  }

  .main-navigation.open {
    transform: translateY(0);
    opacity: 1;
    visibility: visible;
  }

  .mobile-menu-toggle {
    display: flex;
  }

  .auth-button {
    width: 100%;
    justify-content: center;
  }

  .hero-section {
    padding: var(--spacing-2xl) 0;
  }

  .hero-buttons {
    justify-content: center;
  }

  .cta-button {
    flex: 1;
    min-width: 120px;
  }

  .auth-options {
    grid-template-columns: 1fr;
  }

  .footer-content {
    grid-template-columns: 1fr;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 0 var(--spacing-sm);
  }

  .hero-headline {
    font-size: 2rem;
  }

  .hero-buttons {
    flex-direction: column;
  }

  .cta-button {
    width: 100%;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .auth-options {
    gap: var(--spacing-lg);
  }

  .feature-card,
  .auth-option {
    padding: var(--spacing-lg);
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .auth-button,
  .cta-button {
    border-width: 3px;
  }

  .feature-card,
  .auth-option {
    border-width: 2px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .auth-button:hover,
  .cta-button:hover,
  .feature-card:hover,
  .auth-option:hover {
    transform: none;
  }
}

/* Print styles */
@media print {
  .site-header,
  .site-footer,
  .auth-section {
    display: none;
  }

  .hero-section {
    background: white;
    color: black;
  }

  .hero-section::before {
    display: none;
  }
}
```

## Design Patterns

### Modal Implementation Pattern

- **Trigger**: POST request buttons open modals with blurred overlay
- **Form Fields**: Conform to validation schemas from `*.validation.js` files
- **Real-time Validation**: Use Zod schemas for immediate field validation
- **Submission Flow**: Show spinner → API call → Success snackbar/Error message
- **API Endpoint**: Corresponding POST method in `*.route.js`

### Table Implementation Pattern

- **Data Source**: LIST routes from backend modules
- **Features**: Search filter, column sorting, action column
- **Actions**: View, Edit, Delete (where applicable)
- **Loading State**: Spinner while fetching data
- **Navigation**: Sidebar item triggers table population

---

## Dashboard File Structure & Organization

### 1. Internal Admin Dashboard Structure

**Base Path**: `frontend/private/internal/`

**Main Dashboard**:

- `dashboard/index.html` - Main dashboard layout
- `dashboard/index.css` - Dashboard-specific styles
- `dashboard/index.js` - Dashboard functionality

**Components**:

- `components/admin.sidebar/index.html` - Navigation sidebar
- `components/admin.sidebar/index.css` - Sidebar styling
- `components/admin.sidebar/index.js` - Sidebar interactions
- `components/admin.header/index.html` - Dashboard header
- `components/admin.header/index.css` - Header styling
- `components/admin.header/index.js` - Header functionality

**Management Pages**:

- `pages/admin.management/index.html` - Admin CRUD operations
- `pages/admin.management/index.css` - Admin management styling
- `pages/admin.management/index.js` - Admin management logic
- `pages/tenant.management/index.html` - Tenant CRUD operations
- `pages/tenant.management/index.css` - Tenant management styling
- `pages/tenant.management/index.js` - Tenant management logic
- `pages/service.info/index.html` - Service info configuration
- `pages/service.info/index.css` - Service info styling
- `pages/service.info/index.js` - Service info functionality
- `pages/service.requests/index.html` - Service request handling
- `pages/service.requests/index.css` - Service requests styling
- `pages/service.requests/index.js` - Service requests logic

**Modals & Forms**:

- `modals/admin.create.modal/index.html` - Create admin modal
- `modals/admin.create.modal/index.css` - Create admin modal styling
- `modals/admin.create.modal/index.js` - Create admin modal logic
- `modals/admin.edit.modal/index.html` - Edit admin modal
- `modals/admin.edit.modal/index.css` - Edit admin modal styling
- `modals/admin.edit.modal/index.js` - Edit admin modal logic
- `modals/tenant.create.modal/index.html` - Create tenant modal
- `modals/tenant.create.modal/index.css` - Create tenant modal styling
- `modals/tenant.create.modal/index.js` - Create tenant modal logic

### 2. Tenant Admin Dashboard Structure

**Base Path**: `frontend/private/external/tenant.admin/`

**Main Dashboard**:

- `dashboard/index.html` - Main dashboard layout
- `dashboard/index.css` - Dashboard-specific styles
- `dashboard/index.js` - Dashboard functionality

**Components**:

- `components/tenant.admin.sidebar/index.html` - Navigation sidebar
- `components/tenant.admin.sidebar/index.css` - Sidebar styling
- `components/tenant.admin.sidebar/index.js` - Sidebar interactions
- `components/tenant.admin.header/index.html` - Dashboard header
- `components/tenant.admin.header/index.css` - Header styling
- `components/tenant.admin.header/index.js` - Header functionality

**Management Pages**:

- `pages/user.management/index.html` - Tenant user CRUD
- `pages/user.management/index.css` - User management styling
- `pages/user.management/index.js` - User management logic
- `pages/private.responders/index.html` - Private responder management
- `pages/private.responders/index.css` - Private responder styling
- `pages/private.responders/index.js` - Private responder logic
- `pages/internal.alarms/index.html` - Internal alarm systems
- `pages/internal.alarms/index.css` - Internal alarm styling
- `pages/internal.alarms/index.js` - Internal alarm logic
- `pages/internal.alarm.menu/index.html` - Internal alarm menu config
- `pages/internal.alarm.menu/index.css` - Internal alarm menu styling
- `pages/internal.alarm.menu/index.js` - Internal alarm menu logic
- `pages/external.alarms/index.html` - External alarm systems
- `pages/external.alarms/index.css` - External alarm styling
- `pages/external.alarms/index.js` - External alarm logic
- `pages/external.alarm.menu/index.html` - External alarm menu config
- `pages/external.alarm.menu/index.css` - External alarm menu styling
- `pages/external.alarm.menu/index.js` - External alarm menu logic
- `pages/internal.responders/index.html` - Internal responder management
- `pages/internal.responders/index.css` - Internal responder styling
- `pages/internal.responders/index.js` - Internal responder logic
- `pages/external.responders/index.html` - External responder management
- `pages/external.responders/index.css` - External responder styling
- `pages/external.responders/index.js` - External responder logic

### 3. Tenant User Dashboard Structure

**Base Path**: `frontend/private/external/tenant.user/`

**Main Dashboard**:

- `dashboard/index.html` - Main dashboard layout
- `dashboard/index.css` - Dashboard-specific styles
- `dashboard/index.js` - Dashboard functionality

**Components**:

- `components/tenant.user.sidebar/index.html` - Navigation sidebar
- `components/tenant.user.sidebar/index.css` - Sidebar styling
- `components/tenant.user.sidebar/index.js` - Sidebar interactions
- `components/tenant.user.header/index.html` - Dashboard header
- `components/tenant.user.header/index.css` - Header styling
- `components/tenant.user.header/index.js` - Header functionality

**User Pages**:

- `pages/profile.management/index.html` - User profile editing
- `pages/profile.management/index.css` - Profile styling
- `pages/profile.management/index.js` - Profile logic
- `pages/my.private.responders/index.html` - Personal responder management
- `pages/my.private.responders/index.css` - Responder styling
- `pages/my.private.responders/index.js` - Responder logic
- `pages/emergency.activation/index.html` - Emergency activation interface
- `pages/emergency.activation/index.css` - Emergency activation styling
- `pages/emergency.activation/index.js` - Emergency activation logic
- `pages/activation.history/index.html` - Activation history view
- `pages/activation.history/index.css` - History styling
- `pages/activation.history/index.js` - History logic

---

## 1. Internal Admin Dashboard

### Sidebar Navigation Items

#### 1.1 Admin Management

**Route**: `/internal/admin`
**API Endpoints**:

- List: `GET /internal/admin/list`
- Create: `POST /internal/admin`
- View: `GET /internal/admin/:id`
- Update: `PUT /internal/admin/:id`
- Delete: `DELETE /internal/admin/:id`
- Activate: `PUT /internal/admin/:id/activate`
- Deactivate: `PUT /internal/admin/:id/deactivate`

**UI Journey**:

1. **Sidebar Click** → Show spinner → Load admin list in table
2. **Create Admin Button** → Open modal with form fields:
   - `roles[]` (dropdown multi-select)
   - `title` (dropdown)
   - `names` (text input)
   - `surname` (text input)
   - `accessDetails.email` (email input with `@neibourguard.co.za` validation)
   - `accessDetails.password` (password input, min 8 chars)
3. **Table Actions**:
   - **View**: Open read-only modal with admin details
   - **Edit**: Open editable modal with current values
   - **Activate/Deactivate**: Toggle status with confirmation
   - **Delete**: Confirmation dialog → API call

#### 1.2 Tenant Management

**Route**: `/external/tenant`
**API Endpoints**:

- List: `GET /external/tenant/list`
- Create: `POST /external/tenant`
- View: `GET /external/tenant/:id`
- Update: `PUT /external/tenant/:id`
- Delete: `DELETE /external/tenant/:id`

**UI Journey**:

1. **Sidebar Click** → Show spinner → Load tenant list in table
2. **Create Tenant Button** → Open modal with form fields:
   - `activationResponseBlockName` (text input)
   - `address.locality` (text input)
   - `address.province` (dropdown)
   - `address.country` (fixed: "South Africa")
   - `address.postalCode` (text input)
   - `activationContextMenu` (11 language tabs with 5 menu items each)
   - `ussdRefId` (number input)
3. **Table Columns**: ID, Locality, Province, Response Block, USSD Ref, Status
4. **Table Actions**: View, Edit, Delete, View Details

#### 1.3 Service Information

**Route**: `/general/serviceInfo`
**API Endpoints**:

- View: `GET /general/serviceInfo`
- Update: `PUT /general/serviceInfo`

**UI Journey**:

1. **Sidebar Click** → Load service info in form view
2. **Edit Mode**: Complex form with sections:
   - Basic Info: `name`, `version`, `logo`, `active`
   - Features: Dynamic array of feature objects
   - Descriptions: Dynamic array of strings
   - Social Links: Twitter, Facebook, Instagram, LinkedIn
   - Communication Channels: 8 department contacts
   - Emphasizes: Dynamic array of key points

#### 1.4 Service Requests

**Route**: `/internal/serviceRequest`
**API Endpoints**:

- List: `GET /internal/serviceRequest/list`
- View: `GET /internal/serviceRequest/:id`
- Update: `PUT /internal/serviceRequest/:id`

**UI Journey**:

1. **Sidebar Click** → Show spinner → Load service requests table
2. **Table Columns**: Title, Name, Company, Type, Status, Date
3. **Table Actions**: View, Update Status, Assign
4. **View Action**: Open modal with:
   - Contact details
   - Message content
   - Processing status
   - Response actions

---

## 2. Tenant Admin Dashboard

### Sidebar Navigation Items

#### 2.1 Tenant Users Management

**Route**: `/external/tenantUser`
**API Endpoints**:

- List: `GET /external/tenantUser/list`
- Create: `POST /external/tenantUser`
- View: `GET /external/tenantUser/:id`
- Update: `PUT /external/tenantUser/:id`
- Activate: `PUT /external/tenantUser/activate/:id`
- Deactivate: `PUT /external/tenantUser/deactivate/:id`

**UI Journey**:

1. **Sidebar Click** → Show spinner → Load tenant users table
2. **Create User Button** → Open modal with form fields:
   - `title` (dropdown)
   - `names` (text input)
   - `surname` (text input)
   - `subAddress.streetOrFloor` (text input)
   - `subAddress.unit` (text input)
   - `activationDetails.phoneNumber` (tel input, +27 format)
   - `activationDetails.pin` (4-digit input)
   - `activationDetails.preferredMenuLanguage` (dropdown)
   - `activationDetails.isATester` (checkbox)
3. **Table Actions**: View, Edit, Activate/Deactivate, Manage Private Responders

#### 2.2 Private Responders Management

**Route**: `/external/tenantUserPrivateResponders`
**API Endpoints**:

- List: `GET /external/tenantUserPrivateResponders/list/:userId`
- Create: `POST /external/tenantUserPrivateResponders/:userId`
- View: `GET /external/tenantUserPrivateResponders/:userId/:id`
- Update: `PUT /external/tenantUserPrivateResponders/:userId/:id`
- Delete: `DELETE /external/tenantUserPrivateResponders/:userId/:id`

**UI Journey**:

1. **Accessed from User Table** → Select user → Show private responders table
2. **Create Responder Button** → Open modal with form fields:
   - `title` (dropdown)
   - `names` (text input)
   - `surname` (text input)
   - `subAddress.streetOrFloor` (text input)
   - `subAddress.unit` (text input)
   - `activationDetails.phoneNumber` (tel input)
   - `activationDetails.pin` (4-digit input)
   - `activationDetails.preferredMenuLanguage` (dropdown)

#### 2.3 Internal Alarm Systems

**Route**: `/external/tenantInternalAlarmList`
**API Endpoints**:

- List: `GET /external/tenantInternalAlarmList/list`
- Create: `POST /external/tenantInternalAlarmList`
- View: `GET /external/tenantInternalAlarmList/:id`
- Update: `PUT /external/tenantInternalAlarmList/:id`
- Delete: `DELETE /external/tenantInternalAlarmList/:id`

**UI Journey**:

1. **Sidebar Click** → Show spinner → Load internal alarms table
2. **Create Alarm Button** → Open modal with form fields:
   - `serialNumber` (text input)
   - `sgmModuleType` (text input)
   - `modelDescription` (textarea)
   - `accessDetails.phoneNumber` (tel input, +27 format)
   - `accessDetails.pin` (4-digit input)
3. **Table Actions**: View, Edit, Delete, Assign to Menu

#### 2.4 Internal Alarm Menu Configuration

**Route**: `/external/tenantInternalAlarm`
**API Endpoints**:

- Update Menu: `PUT /external/tenantInternalAlarm/:menuKey`
- List Menu Items: `GET /external/tenantInternalAlarm/:menuKey/list`
- List All Menus: `GET /external/tenantInternalAlarm/menus`

**UI Journey**:

1. **Sidebar Click** → Load menu configuration interface
2. **5 Menu Items**: internalAlarmsMenuItem1-5
3. **Drag & Drop Interface**: Assign alarms to menu positions
4. **Menu Item Actions**: Configure, Clear, Preview

#### 2.5 External Alarm Systems

**Route**: `/external/tenantExternalAlarmList`
**API Endpoints**:

- List: `GET /external/tenantExternalAlarmList/list`
- Create: `POST /external/tenantExternalAlarmList`
- View: `GET /external/tenantExternalAlarmList/:id`
- Update: `PUT /external/tenantExternalAlarmList/:id`
- Delete: `DELETE /external/tenantExternalAlarmList/:id`

**UI Journey**:

1. **Sidebar Click** → Show spinner → Load external alarms table
2. **Create Alarm Button** → Open modal with form fields:
   - `serialNumber` (text input)
   - `sgmModuleType` (text input)
   - `modelDescription` (textarea)
   - `accessDetails.phoneNumber` (tel input)
   - `accessDetails.pin` (4-digit input)
   - `account.isActive.value` (checkbox)
3. **Table Actions**: View, Edit, Delete, Assign to Menu

#### 2.6 External Alarm Menu Configuration

**Route**: `/external/tenantExternalAlarm`
**API Endpoints**:

- Update Menu: `PUT /external/tenantExternalAlarm/:menuKey`
- List Menu Items: `GET /external/tenantExternalAlarm/:menuKey/list`

**UI Journey**:

1. **Sidebar Click** → Load external alarm menu configuration
2. **5 Menu Items**: externalAlarmsMenuItem1-5
3. **Interface**: Similar to internal alarms menu configuration

#### 2.7 Internal Responders

**Route**: `/external/tenantInternalResponderList`
**API Endpoints**:

- List: `GET /external/tenantInternalResponderList/list`
- Create: `POST /external/tenantInternalResponderList`
- View: `GET /external/tenantInternalResponderList/:id`
- Update: `PUT /external/tenantInternalResponderList/:id`
- Delete: `DELETE /external/tenantInternalResponderList/:id`

#### 2.8 External Responders

**Route**: `/external/tenantExternalResponderList`
**API Endpoints**:

- List: `GET /external/tenantExternalResponderList/list`
- Create: `POST /external/tenantExternalResponderList`
- View: `GET /external/tenantExternalResponderList/:id`
- Update: `PUT /external/tenantExternalResponderList/:id`
- Delete: `DELETE /external/tenantExternalResponderList/:id`

---

## 3. Tenant User Dashboard

### Sidebar Navigation Items

#### 3.1 My Profile

**Route**: `/external/tenantUser/me`
**API Endpoints**:

- View: `GET /external/tenantUser/:id`
- Update: `PUT /external/tenantUser/:id`

**UI Journey**:

1. **Sidebar Click** → Load user profile form
2. **Editable Fields**: Personal info, address, activation details
3. **Save Changes**: Real-time validation → API call → Success feedback

#### 3.2 My Private Responders

**Route**: `/external/tenantUserPrivateResponders/my`
**API Endpoints**:

- List: `GET /external/tenantUserPrivateResponders/list/:userId`
- Create: `POST /external/tenantUserPrivateResponders/:userId`
- Update: `PUT /external/tenantUserPrivateResponders/:userId/:id`
- Delete: `DELETE /external/tenantUserPrivateResponders/:userId/:id`

**UI Journey**:

1. **Sidebar Click** → Show spinner → Load my responders table
2. **Add Responder Button** → Open modal with responder form
3. **Table Actions**: View, Edit, Delete
4. **Emergency Contact Priority**: Drag to reorder

#### 3.3 Emergency Activation

**Route**: `/activation/emergency`
**API Endpoints**:

- Trigger: Various activation endpoints based on type

**UI Journey**:

1. **Sidebar Click** → Load emergency activation interface
2. **Quick Action Buttons**: Based on tenant's activation menu
3. **Emergency Types**: Life@Risk, Property@Risk, Both@Risk
4. **Activation Flow**: Select type → Confirm → Send alerts

#### 3.4 Activation History

**Route**: `/activation/history`
**API Endpoints**:

- List: `GET /activation/history/:userId`

**UI Journey**:

1. **Sidebar Click** → Load activation history table
2. **Table Columns**: Date, Type, Status, Response Time
3. **Table Actions**: View Details, Download Report

---

## Common UI Components

### Modal Component Structure

```javascript
// Modal with validation
{
  overlay: "blurred background",
  content: {
    header: "Action Title",
    form: {
      fields: "based on validation schema",
      realTimeValidation: "zod schema validation",
      submitButton: "with loading spinner"
    }
  },
  actions: {
    submit: "API call with spinner",
    cancel: "close modal"
  }
}
```

### Table Component Structure

```javascript
// Data table with actions
{
  loading: "spinner overlay",
  search: "global search filter",
  sorting: "column header click",
  pagination: "if needed",
  columns: "defined per module",
  actions: {
    view: "read-only modal",
    edit: "editable modal",
    delete: "confirmation dialog"
  }
}
```

### Snackbar Notifications

- **Success**: Green background, checkmark icon
- **Error**: Red background, error icon
- **Warning**: Orange background, warning icon
- **Info**: Blue background, info icon

### Loading States

- **Initial Load**: Full page spinner
- **Table Load**: Table skeleton or spinner overlay
- **Form Submit**: Button spinner with disabled state
- **Action Buttons**: Individual button loading states

---

## Implementation Notes

### Component Loading Pattern

#### Example: Loading Admin Dashboard Component

**Dashboard Index File**: `frontend/private/internal/dashboard/index.html`

```html
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="/shared/variables.css" />
    <link rel="stylesheet" href="index.css" />
  </head>
  <body>
    <div id="admin-dashboard">
      <!-- Dashboard content loaded here -->
    </div>
    <script src="index.js"></script>
  </body>
</html>
```

**Component Inclusion**: `frontend/private/internal/dashboard/index.js`

```javascript
// Load sidebar component
async function loadSidebar() {
  const sidebarHTML = await fetch("../components/admin.sidebar/index.html");
  const sidebarContent = await sidebarHTML.text();
  document.getElementById("sidebar-container").innerHTML = sidebarContent;

  // Load sidebar CSS
  const sidebarCSS = document.createElement("link");
  sidebarCSS.rel = "stylesheet";
  sidebarCSS.href = "../components/admin.sidebar/index.css";
  document.head.appendChild(sidebarCSS);

  // Load sidebar JavaScript
  import("../components/admin.sidebar/index.js");
}
```

### File Organization Standards

#### Component Folder Structure

Each component follows the **Component Folder Pattern**:

- **Component Folder**: `component.name/` (e.g., `admin.dashboard/`, `login.modal/`)
- **Required Files**:
  - `index.html` - Component markup
  - `index.css` - Component styling
  - `index.js` - Component functionality

#### Naming Convention

- **Folder names**: Lowercase with dots (e.g., `admin.dashboard/`, `user.management/`)
- **File names**: Always `index.html`, `index.css`, `index.js` within component folders
- **No mixing**: HTML, CSS, and JavaScript are never combined in the same file

#### Separation of Concerns

- **Strict separation**: Each component has exactly three files (HTML, CSS, JS)
- **Component isolation**: Each component folder is self-contained
- **Modular structure**: Dashboard pages, components, and modals are separately organized in their own folders
- **Asset organization**: Shared assets in `shared/` directory, component-specific assets within component folders

#### Directory Structure Rules

- **Public content**: Accessible without authentication in `frontend/public/`
- **Private content**: Requires authentication in `frontend/private/`
- **User-type separation**: Internal, tenant admin, and tenant user have separate directories
- **Component grouping**: Related components grouped in `components/`, `pages/`, `modals/` subdirectories
- **Component folders**: Each component has its own folder with three files

### Authentication Context

#### Landing Page Authentication Flow

1. **Button Click** → Load appropriate login modal component folder
2. **Modal Display** → Blurred overlay with form from `index.html`
3. **Real-time Validation** → Field-level feedback using Zod schemas from `index.js`
4. **Form Submission** → Show spinner, disable form via `index.css` classes
5. **API Response**:
   - **Success**: Store JWT → Redirect to dashboard folder → Show success snackbar
   - **Error**: Display error in modal → Re-enable form → Focus error field

#### Authentication Success Redirects

- **Internal Admin**: `/private/internal/dashboard/`
- **Tenant Admin**: `/private/external/tenant.admin/dashboard/`
- **Tenant User**: `/private/external/tenant.user/dashboard/`

#### Role-Based Access Control

- Each user type has different route access
- JWT tokens include role information
- Sidebar items filtered by user permissions
- Dashboard content dynamically loaded based on role

#### Session Management

- **Token Storage**: Secure localStorage for JWT tokens
- **Auto-refresh**: Refresh tokens before expiration
- **Session Timeout**: Automatic logout on token expiration
- **Route Protection**: Middleware checks authentication status

### Real-time Validation

#### Implementation Pattern

- Zod schemas imported from backend validation files
- Field-level validation on input change (debounced)
- Form-level validation on submit attempt
- Error messages display below fields with consistent styling
- Success indicators for valid fields

#### Validation Files

- **Shared validation**: `frontend/shared/validation/` for common schemas
- **Component validation**: Inline validation specific to components
- **API validation**: Backend Zod schemas imported and used directly

### API Integration

#### Authentication Endpoints

- **Internal Admin**: `POST /internal/admin/login`
- **Tenant Admin**: `POST /external/tenantAdmin/login`
- **Tenant User**: `POST /external/tenantUser/login`

#### Request Pattern

- Consistent error handling across all forms
- Loading states for all async operations
- Success feedback for all mutations
- Optimistic updates where appropriate
- Retry logic for failed requests

#### Headers Management

- **Authorization**: `Bearer ${token}` for authenticated requests
- **Tenant Context**: `x-tenant-id` header for tenant-scoped operations
- **Content-Type**: `application/json` for API requests

### Component Architecture

#### Reusable Components

- **Modal System**: Shared modal base with customizable content
- **Form Components**: Reusable form fields with validation
- **Table Components**: Data tables with search, sort, pagination
- **Loading States**: Consistent spinners and skeleton screens
- **Notification System**: Snackbars, alerts, and confirmations

#### State Management

- **Local State**: Component-level state for UI interactions
- **Global State**: User authentication, theme, tenant context
- **Cache Management**: API response caching for performance
- **Event System**: Component communication via custom events

### Responsive Design

#### Breakpoint Strategy

- **Mobile-first** approach using shared CSS variables
- **Collapsible sidebar** on mobile devices
- **Modal adjustments** for small screens
- **Table horizontal scroll** on mobile
- **Touch-friendly** button and interaction sizes

#### CSS Architecture

- **Shared foundation**: Variables, base styles, components in `shared/`
- **Component styles**: Specific styling with component files
- **Responsive utilities**: Shared classes for common responsive patterns
- **Theme support**: CSS custom properties for dynamic theming

This comprehensive implementation specification ensures consistent user experience across all three user types while maintaining the security, performance, and maintainability requirements of the NeighbourGuard™ system.
