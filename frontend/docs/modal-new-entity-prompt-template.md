# Dynamic Modal Creation Prompt Template

This template captures the pattern used by the Service Admin "New Person" flow (button -> dynamic import -> modal overlay -> validation -> API call -> toast -> list reload). Adjust the VARIABLES section before issuing as a prompt.

---

## VARIABLES (Edit Before Use)

ENTITY_NAME = "Person"
ENTITY_NAME_PLURAL = "People"
NEW_BUTTON_ID = "btn-new-person"
RELOAD_LIST_HOOK_NAME = "reloadPeopleList"
LIST_PAGE_SCRIPT_PATH = "/frontend/dashboards/internal.admin/pages/people/people.js"
MODAL_CONTAINER_ID = "personCreateModal"
MODAL_SCRIPT_DIR = "/frontend/dashboards/internal.admin/modals/person.create.modal"
MODAL_JS_FILENAME = "person.create.modal.js"
MODAL_HTML_FILENAME = "person.create.modal.html"
MODAL_OPEN_FN = "openPersonCreateModal"
MODAL_FORM_ID = "personCreateForm"
PRIMARY_ACTION_TEXT = "Create Person"
READONLY_FIELDS = ["idNumber","email"]
API_CLIENT_PATH_DEFAULT = "/integration/api-client.js"
API_BASE_URL_GLOBAL = "window.**API_BASE_URL**"
NOTIFICATION_SCRIPT = "/frontend/shared/scripts/components/notification.js"
MODAL_SIZE_CLASS = "modal-lg"
MODAL_EXTRA_CLASS = "modal-person-create"
OVERLAY_BASE_CLASS = "modal-overlay"
SHOW_CLASS = "show"
VALIDATION_RULES_LOCATION = "Inside modal JS (const RULES = { ... })"
SUCCESS_TOAST_MESSAGE = "Person created successfully"
ERROR_TOAST_GENERIC = "Could not create person"
CREATE_ENDPOINT_METHOD = "POST"
CREATE_ENDPOINT_PATH = "/api/v1/internal/persons"
TOKEN_SOURCE = "localStorage.getItem('token')"
CACHE_BUST_FLAG = "window.**DISABLE_CACHE**"
NEEDS_STATS_REFRESH = true
NEEDS_LIST_REFRESH = true

---

## PROMPT

Implement a dynamic modal flow for a NEW ENTITY modeled exactly after the existing New Person flow described below. Replace every occurrence of the Person-specific values with the provided VARIABLES.

1. Trigger & Dynamic Load

- Add a button with id: NEW_BUTTON_ID on the listing page.
- On first click: dynamically import `${MODAL_SCRIPT_DIR}/${MODAL_JS_FILENAME}` (append `?t=Date.now()` if CACHE_BUST_FLAG truthy).
- After import, call global window.MODAL_OPEN_FN().
- Prevent double wiring via a dataset flag.

2. Modal Creation Pattern

- In the modal JS:
  - Define container id: MODAL_CONTAINER_ID.
  - ensureOverlay(): if not found, create `<div id=MODAL_CONTAINER_ID class="OVERLAY_BASE_CLASS MODAL_SIZE_CLASS MODAL_EXTRA_CLASS">` appended to `document.body`.
  - Load HTML from `${MODAL_SCRIPT_DIR}/${MODAL_HTML_FILENAME}` (fetch, `cache: "no-store"`).
  - Set `container.dataset.loaded = "1"` after first load.

3. HTML Structure Requirements

- Wrapper: `<div class="modal-dialog"><div class="modal-content">…`.
- `.modal-header` with title + close button `.modal-close`.
- `.modal-body` containing `<form id=MODAL_FORM_ID novalidate>`.
- Use `.form-group`, `.form-grid`, `.invalid-feedback[data-for=field]`.
- READONLY_FIELDS have `readonly` + helper text.

4. Styling & Display

- Visibility toggled by adding/removing SHOW_CLASS on overlay.
- Rely on existing shared styles; no inline positioning hacks.
- Cancel & close both reset and hide.

5. Validation System

- Inline `RULES` object mapping field → validators (same pattern as VALIDATION_RULES_LOCATION).
- `validateField()` sets `.is-invalid` + writes message.
- Submit: validate all fields; stop on first invalid; focus it.
- If server returns structured field errors: map & mark; focus first invalid.

6. API Client

- `getApi()` loads API_CLIENT_PATH_DEFAULT (+ optional cache bust) and instantiates `TouchAfricaApiClient({ baseUrl: API_BASE_URL_GLOBAL || window.location.origin, token: TOKEN_SOURCE, timeout: 10000 })`.
- Reuse singleton.
- Submit via CREATE_ENDPOINT_METHOD to CREATE_ENDPOINT_PATH.
- Strip empty strings/nullish from payload; omit READONLY_FIELDS if server sets them.

7. Notifications

- Preload: call `window.ensureNotifications()` if present else inject NOTIFICATION_SCRIPT.
- Initialize TANotification (position top-right, zIndex high) if needed.
- `showToast(type, msg)` abstraction.

8. Success Flow

- Toast SUCCESS_TOAST_MESSAGE.
- If NEEDS_STATS_REFRESH or NEEDS_LIST_REFRESH: call `window.RELOAD_LIST_HOOK_NAME()` if defined.
- Close modal + reset form.

9. Failure Flow

- Network / timeout: toast ERROR_TOAST_GENERIC.
- Structured validation errors: iterate and mark each field.
- Preserve user-entered values unless invalid & cleared intentionally.

10. Global Exposure

- `window.MODAL_OPEN_FN = open;` where `open()` ensures load + adds SHOW_CLASS.
- `close()` is internal; may be bound to cancel/close button.

11. Accessibility

- Focus first non-readonly, visible input on open.
- Esc closes modal (keydown listener active only while open).
- ARIA labels: close button has `aria-label="Close"`.

12. Reload Hook (Listing Page)

- Define `window.RELOAD_LIST_HOOK_NAME = function() { if (NEEDS_STATS_REFRESH) refresh stats; if (NEEDS_LIST_REFRESH) reload page 1 }`.

13. Defensive Guards

- Prevent overlapping submissions (disable submit button; restore on finish).
- Ignore duplicate open requests while loading (loading flag).
- Gracefully toast & abort if HTML fetch fails.

14. Deliverables
    A. Listing page modification adding NEW_BUTTON_ID wiring
    B. Modal JS file
    C. Modal HTML file
    D. Brief README snippet or inline comments
    E. Manual test checklist (open, validation, network error, success, reload)

Return:

1. Summary of artifacts
2. File paths and new code sections
3. Test checklist

Follow existing code style (no external deps, keep functions small, reuse naming conventions).

---

## TEST CHECKLIST

- Button click loads script only once and opens modal.
- Esc key & close button hide modal; form resets.
- Required field empty → inline error & focus.
- Server validation error array maps to fields.
- Success closes modal and triggers reload hook.
- Readonly fields remain uneditable and excluded from payload.
- Multiple rapid clicks do not duplicate overlay.

---

## NOTES

This template is derived from the current Person creation flow under:

- Listing JS: `frontend/dashboards/internal.admin/pages/people/people.js`
- Modal HTML: `frontend/dashboards/internal.admin/modals/person.create.modal/person.create.modal.html`
- Modal JS: `frontend/dashboards/internal.admin/modals/person.create.modal/person.create.modal.js`

Adjust variable values for a new entity before execution.
