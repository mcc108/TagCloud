/*!
 * TagCloud.js v2.5.0
 * Copyright (c) 2016-2024 @ Cong Min
 * MIT License - https://github.com/mcc108/TagCloud
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.TagCloud = factory());
}(this, function () { 'use strict';

  function _classCallCheck(a, n) {
    if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
  }
  function _defineProperties(e, r) {
    for (var t = 0; t < r.length; t++) {
      var o = r[t];
      o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o);
    }
  }
  function _createClass(e, r, t) {
    return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", {
      writable: !1
    }), e;
  }
  function _defineProperty(e, r, t) {
    return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
      value: t,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }) : e[r] = t, e;
  }
  function _extends() {
    return _extends = Object.assign ? Object.assign.bind() : function (n) {
      for (var e = 1; e < arguments.length; e++) {
        var t = arguments[e];
        for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
      }
      return n;
    }, _extends.apply(null, arguments);
  }
  function ownKeys(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var o = Object.getOwnPropertySymbols(e);
      r && (o = o.filter(function (r) {
        return Object.getOwnPropertyDescriptor(e, r).enumerable;
      })), t.push.apply(t, o);
    }
    return t;
  }
  function _objectSpread2(e) {
    for (var r = 1; r < arguments.length; r++) {
      var t = null != arguments[r] ? arguments[r] : {};
      r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {
        _defineProperty(e, r, t[r]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
        Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
      });
    }
    return e;
  }
  function _toPrimitive(t, r) {
    if ("object" != typeof t || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r || "default");
      if ("object" != typeof i) return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
  }
  function _toPropertyKey(t) {
    var i = _toPrimitive(t, "string");
    return "symbol" == typeof i ? i : i + "";
  }

  /**
   * TagCloud.js (c) 2016-2019 @ Cong Min
   * MIT License - https://github.com/cong-min/TagCloud
   */
  var TagCloud = /*#__PURE__*/function () {
    /* constructor */
    function TagCloud() {
      var container = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : document.body;
      var texts = arguments.length > 1 ? arguments[1] : undefined;
      var options = arguments.length > 2 ? arguments[2] : undefined;
      _classCallCheck(this, TagCloud);
      var self = this;
      if (!container || container.nodeType !== 1) return new Error('Incorrect element type');

      // params
      self.$container = container;
      self.texts = texts || [];
      self.config = _objectSpread2(_objectSpread2({}, TagCloud._defaultConfig), options || {});

      // calculate config
      self.radius = self.config.radius; // rolling radius
      self.depth = 2 * self.radius; // rolling depth
      self.size = 1.5 * self.radius; // rolling area size with mouse
      self.maxSpeed = TagCloud._getMaxSpeed(self.config.maxSpeed); // rolling max speed
      self.initSpeed = TagCloud._getInitSpeed(self.config.initSpeed); // rolling init speed
      self.direction = self.config.direction; // rolling init direction
      self.keep = self.config.keep; // whether to keep rolling after mouse out area
      self.paused = false; // keep state to pause the animation

      // 添加手动模式和惯性相关的配置
      self.manualMode = self.config.manualMode || false;
      self.inertia = self.config.inertia || 0.95; // 调整默认惯性值
      self.velocity = {
        x: 0,
        y: 0
      };
      self.dampening = self.config.dampening || 0.1; // 添加阻尼系数
      self.stopThreshold = self.config.stopThreshold || 0.1; // 添加停止阈值

      // create element
      self._createElment();
      // init
      self._init();
      // set elements and instances
      TagCloud.list.push({
        el: self.$el,
        container: container,
        instance: self
      });

      // 在手动模式下，将初始速度设置为0
      if (self.manualMode) {
        self.mouseX0 = 0;
        self.mouseY0 = 0;
        self.mouseX = 0;
        self.mouseY = 0;
      }
    }

    /* static method */
    // all TagCloud list
    return _createClass(TagCloud, [{
      key: "_createElment",
      value: /* instance property method */
      // create elment
      function _createElment() {
        var self = this;

        // create container
        var $el = document.createElement('div');
        $el.className = self.config.containerClass;
        if (self.config.useContainerInlineStyles) {
          $el.style.position = 'relative';
          $el.style.width = "".concat(2 * self.radius, "px");
          $el.style.height = "".concat(2 * self.radius, "px");
        }

        // create texts
        self.items = [];
        self.texts.forEach(function (text, index) {
          var item = self._createTextItem(text, index);
          $el.appendChild(item.el);
          self.items.push(item);
        });
        self.$container.appendChild($el);
        self.$el = $el;
      }

      // create a text
    }, {
      key: "_createTextItem",
      value: function _createTextItem(text) {
        var index = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        var self = this;
        var itemEl = document.createElement('span');
        itemEl.className = self.config.itemClass;
        if (self.config.useItemInlineStyles) {
          itemEl.style.willChange = 'transform, opacity, filter';
          itemEl.style.position = 'absolute';
          itemEl.style.top = '50%';
          itemEl.style.left = '50%';
          itemEl.style.zIndex = index + 1;
          itemEl.style.filter = 'alpha(opacity=0)';
          itemEl.style.opacity = 0;
          var transformOrigin = '50% 50%';
          itemEl.style.WebkitTransformOrigin = transformOrigin;
          itemEl.style.MozTransformOrigin = transformOrigin;
          itemEl.style.OTransformOrigin = transformOrigin;
          itemEl.style.transformOrigin = transformOrigin;
          var transform = 'translate3d(-50%, -50%, 0) scale(1)';
          itemEl.style.WebkitTransform = transform;
          itemEl.style.MozTransform = transform;
          itemEl.style.OTransform = transform;
          itemEl.style.transform = transform;
        }
        if (self.config.useHTML) {
          itemEl.innerHTML = text;
        } else {
          itemEl.innerText = text;
        }
        return _objectSpread2({
          el: itemEl
        }, self._computePosition(index));
      }

      // calculate appropriate place
    }, {
      key: "_computePosition",
      value: function _computePosition(index) {
        var random = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        var self = this;
        var textsLength = self.texts.length;
        // if random `true`, It means that a random appropriate place is generated, and the position will be independent of `index`
        if (random) index = Math.floor(Math.random() * (textsLength + 1));
        var phi = Math.acos(-1 + (2 * index + 1) / textsLength);
        var theta = Math.sqrt((textsLength + 1) * Math.PI) * phi;
        return {
          x: self.size * Math.cos(theta) * Math.sin(phi) / 2,
          y: self.size * Math.sin(theta) * Math.sin(phi) / 2,
          z: self.size * Math.cos(phi) / 2
        };
      }
    }, {
      key: "_requestInterval",
      value: function _requestInterval(fn, delay) {
        var requestAnimFrame = (function () {
          return window.requestAnimationFrame;
        } || function (callback, element) {
          window.setTimeout(callback, 1000 / 60);
        })();
        var start = new Date().getTime();
        var handle = {};
        function loop() {
          handle.value = requestAnimFrame(loop);
          var current = new Date().getTime(),
            delta = current - start;
          if (delta >= delay) {
            fn.call();
            start = new Date().getTime();
          }
        }
        handle.value = requestAnimFrame(loop);
        return handle;
      }

      // init
    }, {
      key: "_init",
      value: function _init() {
        var self = this;
        self.active = false; // whether the mouse is activated

        self.mouseX0 = self.initSpeed * Math.sin(self.direction * (Math.PI / 180)); // init distance between the mouse and rolling center x axis
        self.mouseY0 = -self.initSpeed * Math.cos(self.direction * (Math.PI / 180)); // init distance between the mouse and rolling center y axis

        self.mouseX = self.mouseX0; // current distance between the mouse and rolling center x axis
        self.mouseY = self.mouseY0; // current distance between the mouse and rolling center y axis

        // 检测是否支持触摸
        var isTouchDevice = 'ontouchstart' in window || window.navigator && window.navigator.maxTouchPoints > 0;
        if (isTouchDevice) {
          // 触摸开始
          TagCloud._on(self.$el, 'touchstart', function () {
            self.active = true;
          });
          // 触摸结束
          TagCloud._on(self.$el, 'touchend', function () {
            self.active = false;
          });
          // 触摸移动
          TagCloud._on(self.keep ? window : self.$el, 'touchmove', function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            if (ev.touches.length === 1) {
              var touch = ev.touches[0];
              var rect = self.$el.getBoundingClientRect();
              self.mouseX = (touch.clientX - (rect.left + rect.width / 2)) / 5;
              self.mouseY = (touch.clientY - (rect.top + rect.height / 2)) / 5;
            }
          });
        } else {
          // 鼠标事件
          var hasHoverSupport = window.matchMedia('(hover: hover)').matches;
          if (hasHoverSupport) {
            TagCloud._on(self.$el, 'mouseover', function () {
              self.active = true;
            });
            TagCloud._on(self.$el, 'mouseout', function () {
              self.active = false;
            });
            TagCloud._on(self.keep ? window : self.$el, 'mousemove', function (ev) {
              ev = ev || window.event;
              var rect = self.$el.getBoundingClientRect();
              self.mouseX = (ev.clientX - (rect.left + rect.width / 2)) / 5;
              self.mouseY = (ev.clientY - (rect.top + rect.height / 2)) / 5;
            });
          }
        }

        // update state regularly
        self._next(); // init update state
        self.interval = self._requestInterval(function () {
          self._next.call(self);
        }, 10);
      }

      // calculate the next state
    }, {
      key: "_next",
      value: function _next() {
        var self = this;
        if (self.paused) {
          return;
        }
        if (self.manualMode) {
          if (!self.active) {
            // 应用惯性和阻尼
            self.velocity.x *= self.inertia;
            self.velocity.y *= self.inertia;

            // 应用阻尼力
            self.velocity.x -= self.velocity.x * self.dampening;
            self.velocity.y -= self.velocity.y * self.dampening;
            self.mouseX += self.velocity.x;
            self.mouseY += self.velocity.y;

            // 如果速度很小，就停止移动
            if (Math.abs(self.velocity.x) < self.stopThreshold && Math.abs(self.velocity.y) < self.stopThreshold) {
              self.velocity.x = 0;
              self.velocity.y = 0;
            }
          } else {
            // 当用户触发滚动时，更新速度
            self.velocity.x = (self.mouseX - self.mouseX0) * 0.5; // 减小速度增量
            self.velocity.y = (self.mouseY - self.mouseY0) * 0.5;
          }
          self.mouseX0 = self.mouseX;
          self.mouseY0 = self.mouseY;
        } else {
          // 原有的自动模式逻辑
          if (!self.keep && !self.active) {
            self.mouseX = Math.abs(self.mouseX - self.mouseX0) < 1 ? self.mouseX0 : (self.mouseX + self.mouseX0) / 2;
            self.mouseY = Math.abs(self.mouseY - self.mouseY0) < 1 ? self.mouseY0 : (self.mouseY + self.mouseY0) / 2;
          }
        }
        var a = -(Math.min(Math.max(-self.mouseY, -self.size), self.size) / self.radius) * self.maxSpeed;
        var b = Math.min(Math.max(-self.mouseX, -self.size), self.size) / self.radius * self.maxSpeed;

        // inverse direction if enabled
        if (self.config.reverseDirection) {
          a = -a;
          b = -b;
        }
        if (Math.abs(a) <= 0.01 && Math.abs(b) <= 0.01) return; // pause

        // calculate offset
        var l = Math.PI / 180;
        var sc = [Math.sin(a * l), Math.cos(a * l), Math.sin(b * l), Math.cos(b * l)];
        self.items.forEach(function (item) {
          var rx1 = item.x;
          var ry1 = item.y * sc[1] + item.z * -sc[0];
          var rz1 = item.y * sc[0] + item.z * sc[1];
          var rx2 = rx1 * sc[3] + rz1 * sc[2];
          var ry2 = ry1;
          var rz2 = rz1 * sc[3] - rx1 * sc[2];
          var per = 2 * self.depth / (2 * self.depth + rz2); // todo

          item.x = rx2;
          item.y = ry2;
          item.z = rz2;
          item.scale = per.toFixed(3);
          var alpha = per * per - 0.25;
          alpha = (alpha > 1 ? 1 : alpha).toFixed(3);
          var itemEl = item.el;
          var left = (item.x - itemEl.offsetWidth / 2).toFixed(2);
          var top = (item.y - itemEl.offsetHeight / 2).toFixed(2);
          var transform = "translate3d(".concat(left, "px, ").concat(top, "px, 0) scale(").concat(item.scale, ")");
          itemEl.style.WebkitTransform = transform;
          itemEl.style.MozTransform = transform;
          itemEl.style.OTransform = transform;
          itemEl.style.transform = transform;
          itemEl.style.filter = "alpha(opacity=".concat(100 * alpha, ")");
          itemEl.style.opacity = alpha;
        });
      }

      /* export instance properties and methods */
      // update
    }, {
      key: "update",
      value: function update(texts) {
        var self = this;
        // params
        self.texts = texts || [];
        // judging and processing items based on texts
        self.texts.forEach(function (text, index) {
          var item = self.items[index];
          if (!item) {
            // if not had, then create
            item = self._createTextItem(text, index);
            _extends(item, self._computePosition(index, true)); // random place
            self.$el.appendChild(item.el);
            self.items.push(item);
          }
          // if had, replace text
          if (self.config.useHTML) {
            item.el.innerHTML = text;
          } else {
            item.el.innerText = text;
          }
        });
        // remove redundant self.items
        var textsLength = self.texts.length;
        var itemsLength = self.items.length;
        if (textsLength < itemsLength) {
          var removeList = self.items.splice(textsLength, itemsLength - textsLength);
          removeList.forEach(function (item) {
            self.$el.removeChild(item.el);
          });
        }
      }

      // destroy
    }, {
      key: "destroy",
      value: function destroy() {
        var self = this;
        self.interval = null;
        // clear in TagCloud.list
        var index = TagCloud.list.findIndex(function (e) {
          return e.el === self.$el;
        });
        if (index !== -1) TagCloud.list.splice(index, 1);
        // clear element
        if (self.$container && self.$el) {
          self.$container.removeChild(self.$el);
        }
      }
    }, {
      key: "pause",
      value: function pause() {
        var self = this;
        self.paused = true;
      }
    }, {
      key: "resume",
      value: function resume() {
        var self = this;
        self.paused = false;
      }
    }], [{
      key: "_on",
      value:
      // event listener
      function _on(el, ev, handler, cap) {
        if (el.addEventListener) {
          el.addEventListener(ev, handler, cap);
        } else if (el.attachEvent) {
          el.attachEvent("on".concat(ev), handler);
        } else {
          el["on".concat(ev)] = handler;
        }
      }
    }]);
  }();
  TagCloud.list = [];
  // default config
  TagCloud._defaultConfig = {
    radius: 100,
    // rolling radius, unit `px`
    maxSpeed: 'normal',
    // rolling max speed, optional: `slow`, `normal`(default), `fast`
    initSpeed: 'normal',
    // rolling init speed, optional: `slow`, `normal`(default), `fast`
    direction: 135,
    // rolling init direction, unit clockwise `deg`, optional: `0`(top) , `90`(left), `135`(right-bottom)(default)...
    keep: true,
    // whether to keep rolling after mouse out area, optional: `false`, `true`(default)(decelerate to rolling init speed, and keep rolling with mouse)
    reverseDirection: false,
    useContainerInlineStyles: true,
    useItemInlineStyles: true,
    containerClass: 'tagcloud',
    itemClass: 'tagcloud--item',
    useHTML: false,
    manualMode: false,
    inertia: 0.95,
    dampening: 0.1,
    stopThreshold: 0.1
  };
  // speed value
  TagCloud._getMaxSpeed = function (name) {
    return {
      slow: 0.5,
      normal: 1,
      fast: 2
    }[name] || 1;
  };
  TagCloud._getInitSpeed = function (name) {
    return {
      slow: 16,
      normal: 32,
      fast: 80
    }[name] || 32;
  };
  var index = (function (els, texts, options) {
    if (typeof els === 'string') els = document.querySelectorAll(els);
    if (!els.forEach) els = [els];
    var instances = [];
    els.forEach(function (el) {
      if (el) {
        instances.push(new TagCloud(el, texts, options));
      }
    });
    return instances.length <= 1 ? instances[0] : instances;
  });

  return index;

}));
