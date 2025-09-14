// CoreUtils – Single Source of Truth utilities
(function (window) {
  "use strict";
  if (window.CoreUtils) return; // prevent double load

  function toArray(val) {
    return Array.isArray(val) ? val : val == null ? [] : [val];
  }

  var CoreUtils = {
    permissions: {
      parse: function (p) {
        if (!p || typeof p !== "string") return { module: "", action: "" };
        var parts = p.split(".");
        if (parts.length < 2) return { module: "", action: parts[0] || "" };
        var action = parts.pop();
        return { module: parts.join("."), action: action };
      },
      format: function (m, a) {
        return m + "." + a;
      },
      cleanAction: function (m, a) {
        if (!m || !a) return a;
        var pref = m + ".";
        var lpref = m.toLowerCase() + ".";
        if (a.indexOf(pref) === 0) return a.substring(pref.length);
        if (a.toLowerCase().indexOf(lpref) === 0)
          return a.substring(pref.length);
        return a;
      },
      groupByModule: function (list) {
        var map = {};
        (list || []).forEach(function (item) {
          var id =
            typeof item === "string"
              ? item
              : item &&
                (item.id || item.permissionId || item.code || item.name);
          if (!id) return;
          var parsed = CoreUtils.permissions.parse(id);
          if (!parsed.module || !parsed.action) return;
          map[parsed.module] = map[parsed.module] || new Set();
          map[parsed.module].add(parsed.action);
        });
        return map;
      },
      toArrayFormat: function (grouped) {
        var out = [];
        Object.keys(grouped || {})
          .sort()
          .forEach(function (mod) {
            out.push({
              module: mod,
              permissions: Array.from(grouped[mod])
                .sort()
                .map(function (a) {
                  return { id: mod + "." + a, action: a };
                }),
            });
          });
        return out;
      },
    },
    api: {
      getConfig: function () {
        // Prefer internal_token, fallback to generic token used currently by dashboards
        var token =
          localStorage.getItem("internal_token") ||
          localStorage.getItem("token");
        return {
          baseURL: window.API_BASE_URL || "/api/v1",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? "Bearer " + token : "",
          },
        };
      },
      // requestWithParams: builds a query string from primitive param values.
      // NOTE: Array/object values are intentionally ignored (current lightweight behavior)
      // to avoid ambiguous serialization. Future enhancement could expand arrays as
      // repeated keys (?tag=a&tag=b) once needed. Documented so tests assert this.
      requestWithParams: function (method, endpoint, params) {
        if (params && method === "GET") {
          var qs = Object.entries(params)
            .filter(function (e) {
              return e[1] !== undefined && e[1] !== null && e[1] !== "";
            })
            .map(function (e) {
              return encodeURIComponent(e[0]) + "=" + encodeURIComponent(e[1]);
            })
            .join("&");
          if (qs) endpoint += (endpoint.indexOf("?") >= 0 ? "&" : "?") + qs;
        }
        return CoreUtils.api.request(
          method,
          endpoint,
          method === "GET" ? null : params
        );
      },
      request: function (method, endpoint, data) {
        var cfg = CoreUtils.api.getConfig();
        var url = cfg.baseURL + endpoint;
        var opt = { method: method, headers: cfg.headers };
        if (data && ["POST", "PUT", "PATCH"].indexOf(method) >= 0)
          opt.body = JSON.stringify(data);
        return fetch(url, opt).then(function (r) {
          return r.text().then(function (t) {
            var json;
            try {
              json = t ? JSON.parse(t) : {};
            } catch (e) {
              json = { raw: t };
            }
            if (!r.ok) {
              var err = new Error(json.message || "HTTP " + r.status);
              err.status = r.status;
              err.data = json;
              throw err;
            }
            return json;
          });
        });
      },
    },
    table: {
      getNestedValue: function (obj, path) {
        if (!obj || !path) return;
        if (path.slice(-7) === ".length") {
          var arr = this.getNestedValue(obj, path.slice(0, -7));
          return Array.isArray(arr) ? arr.length : 0;
        }
        return path.split(".").reduce(function (acc, k) {
          return acc && acc[k];
        }, obj);
      },
      sort: function (data, field, dir) {
        if (!Array.isArray(data) || !field) return data;
        var d = (dir || "asc").toLowerCase() === "desc" ? -1 : 1;
        return data.slice().sort(function (a, b) {
          var av = CoreUtils.table.getNestedValue(a, field);
          var bv = CoreUtils.table.getNestedValue(b, field);
          if (av == null && bv == null) return 0;
          if (av == null) return 1 * d;
          if (bv == null) return -1 * d;
          if (typeof av === "number" && typeof bv === "number")
            return (av - bv) * d;
          av = String(av).toLowerCase();
          bv = String(bv).toLowerCase();
          if (av < bv) return -1 * d;
          if (av > bv) return 1 * d;
          return 0;
        });
      },
      filter: function (data, term, fields) {
        if (!term) return data;
        var q = term.toLowerCase();
        return (data || []).filter(function (row) {
          var keys = fields && fields.length ? fields : Object.keys(row || {});
          return keys.some(function (f) {
            var v = CoreUtils.table.getNestedValue(row, f);
            return v != null && String(v).toLowerCase().indexOf(q) >= 0;
          });
        });
      },
    },
    modal: {
      _active: {},
      open: function (id, opt) {
        opt = opt || {};
        if (this._active[id]) return Promise.resolve(this._active[id]);
        var inst = { id: id, element: opt.element || null, closeHandlers: [] };
        this._active[id] = inst;
        if (inst.element) {
          document.body.appendChild(inst.element);
          requestAnimationFrame(function () {
            inst.element.classList.add("show");
          });
        }
        inst._esc = function (e) {
          if (e.key === "Escape" && opt.closeOnEscape !== false)
            CoreUtils.modal.close(id);
        };
        document.addEventListener("keydown", inst._esc);
        return Promise.resolve(inst);
      },
      close: function (id) {
        var inst = this._active[id];
        if (!inst) return Promise.resolve();
        return Promise.resolve()
          .then(function () {
            return inst.closeHandlers.reduce(function (p, h) {
              return p.then(h);
            }, Promise.resolve());
          })
          .then(function () {
            if (inst.element) {
              inst.element.classList.remove("show");
              setTimeout(function () {
                if (inst.element && inst.element.parentNode)
                  inst.element.parentNode.removeChild(inst.element);
              }, 180);
            }
            document.removeEventListener("keydown", inst._esc);
            delete CoreUtils.modal._active[id];
          });
      },
      onClose: function (id, h) {
        var inst = this._active[id];
        if (inst) inst.closeHandlers.push(h);
      },
    },
    form: {
      serialize: function (form) {
        var data = {};
        if (!form) return data;
        var fd = new FormData(form);
        fd.forEach(function (v, k) {
          if (k.slice(-2) === "[]") {
            var key = k.slice(0, -2);
            data[key] = data[key] || [];
            data[key].push(v);
          } else if (data[k] !== undefined) {
            if (!Array.isArray(data[k])) data[k] = [data[k]];
            data[k].push(v);
          } else data[k] = v;
        });
        Array.prototype.forEach.call(
          form.querySelectorAll('input[type="checkbox"]'),
          function (cb) {
            if (!cb.name) return;
            if (cb.name.slice(-2) === "[]") {
              var key = cb.name.slice(0, -2);
              data[key] = data[key] || [];
              if (cb.checked && data[key].indexOf(cb.value) < 0)
                data[key].push(cb.value);
            } else if (!fd.has(cb.name)) data[cb.name] = cb.checked;
          }
        );
        return data;
      },
      populate: function (form, values) {
        if (!form || !values) return;
        Object.keys(values).forEach(function (k) {
          var els = form.querySelectorAll(
            '[name="' + k + '"],[name="' + k + '[]"]'
          );
          Array.prototype.forEach.call(els, function (el) {
            var val = values[k];
            if (el.type === "checkbox") {
              if (Array.isArray(val)) el.checked = val.indexOf(el.value) >= 0;
              else
                el.checked =
                  !!val && (el.value === String(val) || val === true);
            } else if (el.type === "radio") {
              el.checked = String(el.value) === String(val);
            } else if (el.tagName === "SELECT" && el.multiple) {
              var arr = toArray(val);
              Array.prototype.forEach.call(el.options, function (o) {
                o.selected = arr.indexOf(o.value) >= 0;
              });
            } else {
              el.value = val;
            }
          });
        });
      },
      validate: function (form) {
        var errors = {},
          valid = true;
        if (!form.checkValidity()) {
          valid = false;
          Array.prototype.forEach.call(
            form.querySelectorAll(":invalid"),
            function (el) {
              errors[el.name] = el.validationMessage;
            }
          );
        }
        return { valid: valid, errors: errors };
      },
      defineRules: function (rules) {
        return rules || {};
      },
      runRules: function (form, rules) {
        var out = { valid: true, errors: {} };
        if (!form || !rules) return out;
        Object.keys(rules).forEach(function (name) {
          var el = form.elements[name];
          if (!el) return;
          var value = el.value.trim();
          rules[name].forEach(function (rule) {
            if (out.errors[name]) return; // skip further rules if already failed
            var res = rule.validate(value, el, form);
            // Async pattern: rule.validate may trigger side-effects (e.g. uniqueness fetch)
            // and return true synchronously; such rules should themselves mark field state
            // later. We only handle explicit false here to keep runner lightweight.
            if (res === false) {
              out.valid = false;
              out.errors[name] = rule.message || "Invalid";
            }
          });
        });
        return out;
      },
      attachLiveValidation: function (form, rules, delay) {
        if (!form || !rules) return;
        var self = this;
        var debounced = CoreUtils.debounce(function (e) {
          var r = self.runRules(form, rules);
          Object.keys(r.errors).forEach(function (name) {
            var el = form.elements[name];
            if (!el) return;
            el.classList.add("is-invalid");
            var fb = form.querySelector(
              '.invalid-feedback[data-for="' + name + '"]'
            );
            if (fb) fb.textContent = r.errors[name];
          });
        }, delay || 300);
        form.addEventListener("input", debounced);
      },
    },
    storage: {
      setWithExpiry: function (k, v, ttl) {
        var item = { value: v, expiry: ttl ? Date.now() + ttl : null };
        localStorage.setItem(k, JSON.stringify(item));
      },
      getWithExpiry: function (k) {
        var raw = localStorage.getItem(k);
        if (!raw) return null;
        try {
          var item = JSON.parse(raw);
          if (item.expiry && Date.now() > item.expiry) {
            localStorage.removeItem(k);
            return null;
          }
          return item.value;
        } catch (e) {
          return raw;
        }
      },
    },
    debounce: function (fn, wait) {
      var t;
      return function () {
        var args = arguments,
          ctx = this;
        clearTimeout(t);
        t = setTimeout(function () {
          fn.apply(ctx, args);
        }, wait);
      };
    },
    throttle: function (fn, limit) {
      var run = true;
      return function () {
        if (!run) return;
        fn.apply(this, arguments);
        run = false;
        setTimeout(function () {
          run = true;
        }, limit);
      };
    },
  };

  window.CoreUtils = CoreUtils;
  if (typeof module !== "undefined" && module.exports)
    module.exports = CoreUtils;
})(window);
