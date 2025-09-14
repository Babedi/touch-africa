# CoreUtils (Frontend Single Source of Truth)

Centralized utilities replacing duplicated logic across dashboards and modals.

## Modules

1. permissions

   - parse(id) => { module, action }
   - format(module, action) => "module.action"
   - cleanAction(module, actionName)
   - groupByModule(list)
   - toArrayFormat(groupedMap)

2. api

   - getConfig()
   - request(method, endpoint, data?) -> Promise(json)
   - requestWithParams(method, endpoint, params?, options?) -> builds query string then calls request

3. table

   - getNestedValue(obj, path)
   - sort(data, field, dir)
   - filter(data, term, fields?)

4. modal

   - open(id, opts)
   - close(id)
   - onClose(id, handler)

5. form

   - serialize(form)
   - populate(form, values)
   - validate(form)

6. storage

   - setWithExpiry(key, value, ttlMs)
   - getWithExpiry(key)

7. debounce(fn, wait)
8. throttle(fn, limit)

## Usage

Include once (e.g. in dashboard HTML):

```html
<script src="/frontend/shared/scripts/core-utils.js"></script>
```

Then call: `CoreUtils.permissions.parse('role.create')`.

## Migration Guide (Examples)

| Legacy Pattern                      | Replace With                                        |
| ----------------------------------- | --------------------------------------------------- |
| Manual `split('.')` for permissions | `CoreUtils.permissions.parse(id)`                   |
| Repeated prefix stripping           | `CoreUtils.permissions.cleanAction(module, action)` |
| Array `.sort()` duplications        | `CoreUtils.table.sort(rows, field, dir)`            |
| Ad-hoc search loops                 | `CoreUtils.table.filter(rows, term, fields)`        |
| FormData + checkbox patchwork       | `CoreUtils.form.serialize(form)`                    |
| LocalStorage expirable objects      | `CoreUtils.storage.setWithExpiry(k,v,ttl)`          |

## Testing

Open `frontend/tests/unit/core-utils.test.html` in a browser; QUnit results should be all green.

## Extension Points

Add new helpers under a namespaced object to avoid collisions. Keep pure utilities side-effect free.

## Notes

`CoreUtils` registers on `window`. Guard present to prevent double load.

### API Token Resolution Order

`CoreUtils.api.getConfig()` now resolves an auth token using this precedence:

1. Explicit token passed in options
2. `token` query or hash parameter (persisted to localStorage if present)
3. `window.__API_TOKEN__`
4. `localStorage.getItem('token')`
5. Cookie `authToken`

This removes the need for each page script to duplicate token lookup logic.
