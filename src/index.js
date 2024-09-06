/**
 * TagCloud.js (c) 2016-2019 @ Cong Min
 * MIT License - https://github.com/cong-min/TagCloud
 */

class TagCloud {
    /* constructor */
    constructor(container = document.body, texts, options) {
        const self = this;
        if (!container || container.nodeType !== 1) return new Error('Incorrect element type');

        // params
        self.$container = container;
        self.texts = texts || [];
        self.config = { ...TagCloud._defaultConfig, ...options || {} };

        // calculate config
        self.radius = self.config.radius; // rolling radius
        self.depth = 2 * self.radius; // rolling depth
        self.size = 1.5 * self.radius; // rolling area size with mouse
        self.maxSpeed = TagCloud._getMaxSpeed(self.config.maxSpeed); // rolling max speed
        self.initSpeed = TagCloud._getInitSpeed(self.config.initSpeed); // rolling init speed
        self.direction = self.config.direction; // rolling init direction
        self.keep = self.config.keep; // whether to keep rolling after mouse out area
        self.paused = false; // keep state to pause the animation

        // create element
        self._createElment();
        // init
        self._init();
        // set elements and instances
        TagCloud.list.push({ el: self.$el, container, instance: self });
    }

    /* static method */
    // all TagCloud list
    static list = [];

    // default config
    static _defaultConfig = {
        radius: 100, // rolling radius, unit `px`
        maxSpeed: 'normal', // rolling max speed, optional: `slow`, `normal`(default), `fast`
        initSpeed: 'normal', // rolling init speed, optional: `slow`, `normal`(default), `fast`
        direction: 135, // rolling init direction, unit clockwise `deg`, optional: `0`(top) , `90`(left), `135`(right-bottom)(default)...
        keep: true, // whether to keep rolling after mouse out area, optional: `false`, `true`(default)(decelerate to rolling init speed, and keep rolling with mouse)
        reverseDirection: false,
        useContainerInlineStyles: true,
        useItemInlineStyles: true,
        containerClass: 'tagcloud',
        itemClass: 'tagcloud--item',
        useHTML: false,
    };

    // speed value
    static _getMaxSpeed = (name) => ({ slow: 0.5, normal: 1, fast: 2 })[name] || 1;

    static _getInitSpeed = (name) => ({ slow: 16, normal: 32, fast: 80 })[name] || 32;

    // event listener
    static _on(el, ev, handler, cap) {
        if (el.addEventListener) {
            el.addEventListener(ev, handler, cap);
        } else if (el.attachEvent) {
            el.attachEvent(`on${ev}`, handler);
        } else {
            el[`on${ev}`] = handler;
        }
    }

    /* instance property method */
    // create elment
    _createElment() {
        const self = this;

        // create container
        const $el = document.createElement('div');
        $el.className = self.config.containerClass;
        if (self.config.useContainerInlineStyles) {
            $el.style.position = 'relative';
            $el.style.width = `${2 * self.radius}px`;
            $el.style.height = `${2 * self.radius}px`;
        }

        // create texts
        self.items = [];
        self.texts.forEach((text, index) => {
            const item = self._createTextItem(text, index);
            $el.appendChild(item.el);
            self.items.push(item);
        });
        self.$container.appendChild($el);
        self.$el = $el;
    }

    // create a text
    _createTextItem(text, index = 0) {
        const self = this;
        const itemEl = document.createElement('span');
        itemEl.className = self.config.itemClass;
        if (self.config.useItemInlineStyles) {
            itemEl.style.willChange = 'transform, opacity, filter';
            itemEl.style.position = 'absolute';
            itemEl.style.top = '50%';
            itemEl.style.left = '50%';
            itemEl.style.zIndex = index + 1;
            itemEl.style.filter = 'alpha(opacity=0)';
            itemEl.style.opacity = 0;
            const transformOrigin = '50% 50%';
            itemEl.style.WebkitTransformOrigin = transformOrigin;
            itemEl.style.MozTransformOrigin = transformOrigin;
            itemEl.style.OTransformOrigin = transformOrigin;
            itemEl.style.transformOrigin = transformOrigin;
            const transform = 'translate3d(-50%, -50%, 0) scale(1)';
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
        return {
            el: itemEl,
            ...self._computePosition(index), // distributed in appropriate place
        };
    }

    // calculate appropriate place
    _computePosition(index, random = false) {
        const self = this;
        const textsLength = self.texts.length;
        // if random `true`, It means that a random appropriate place is generated, and the position will be independent of `index`
        if (random) index = Math.floor(Math.random() * (textsLength + 1));
        const phi = Math.acos(-1 + (2 * index + 1) / textsLength);
        const theta = Math.sqrt((textsLength + 1) * Math.PI) * phi;
        return {
            x: (self.size * Math.cos(theta) * Math.sin(phi)) / 2,
            y: (self.size * Math.sin(theta) * Math.sin(phi)) / 2,
            z: (self.size * Math.cos(phi)) / 2,
        };
    }

    _requestInterval(fn, delay) {
        const requestAnimFrame = ((() => window.requestAnimationFrame) || ((callback, element) => {
            window.setTimeout(callback, 1000 / 60);
        }))();
        let start = new Date().getTime();
        const handle = {};
        function loop() {
            handle.value = requestAnimFrame(loop);
            const current = new Date().getTime(),
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
    _init() {
        const self = this;

        self.active = false; // whether the mouse is activated

        self.mouseX0 = self.initSpeed * Math.sin(self.direction * (Math.PI / 180)); // init distance between the mouse and rolling center x axis
        self.mouseY0 = -self.initSpeed * Math.cos(self.direction * (Math.PI / 180)); // init distance between the mouse and rolling center y axis

        self.mouseX = self.mouseX0; // current distance between the mouse and rolling center x axis
        self.mouseY = self.mouseY0; // current distance between the mouse and rolling center y axis

        // 检测是否支持触摸
        const isTouchDevice = 'ontouchstart' in window || (window.navigator && window.navigator.maxTouchPoints > 0);

        if (isTouchDevice) {
            // 触摸开始
            TagCloud._on(self.$el, 'touchstart', () => { self.active = true; });
            // 触摸结束
            TagCloud._on(self.$el, 'touchend', () => { self.active = false; });
            // 触摸移动
            TagCloud._on(self.keep ? window : self.$el, 'touchmove', (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                if (ev.touches.length === 1) {
                    const touch = ev.touches[0];
                    const rect = self.$el.getBoundingClientRect();
                    self.mouseX = (touch.clientX - (rect.left + rect.width / 2)) / 5;
                    self.mouseY = (touch.clientY - (rect.top + rect.height / 2)) / 5;
                }
            },{
                passive:false
            });
        } else {
            // 鼠标事件
            const hasHoverSupport = window.matchMedia('(hover: hover)').matches;
            if (hasHoverSupport) {
                TagCloud._on(self.$el, 'mouseover', () => { self.active = true; });
                TagCloud._on(self.$el, 'mouseout', () => { self.active = false; });
                TagCloud._on(self.keep ? window : self.$el, 'mousemove', (ev) => {
                    ev = ev || window.event;
                    const rect = self.$el.getBoundingClientRect();
                    self.mouseX = (ev.clientX - (rect.left + rect.width / 2)) / 5;
                    self.mouseY = (ev.clientY - (rect.top + rect.height / 2)) / 5;
                });
            }
        }

        // update state regularly
        self._next(); // init update state
        self.interval = self._requestInterval(() => {
            self._next.call(self);
        }, 10);
    }

    // calculate the next state
    _next() {
        const self = this;

        if (self.paused) {
            return;
        }

        // if keep `false`, pause rolling after moving mouse out area
        if (!self.keep && !self.active) {
            self.mouseX = Math.abs(self.mouseX - self.mouseX0) < 1
                ? self.mouseX0 : (self.mouseX + self.mouseX0) / 2; // reset distance between the mouse and rolling center x axis
            self.mouseY = Math.abs(self.mouseY - self.mouseY0) < 1
                ? self.mouseY0 : (self.mouseY + self.mouseY0) / 2; // reset distance between the mouse and rolling center y axis
        }

        // Add gradual stopping logic
        if (!self.active) {
            self.mouseX *= 0.95; // gradually reduce mouseX
            self.mouseY *= 0.95; // gradually reduce mouseY
        }

        let a = -(Math.min(Math.max(-self.mouseY, -self.size), self.size) / self.radius)
            * self.maxSpeed;
        let b = (Math.min(Math.max(-self.mouseX, -self.size), self.size) / self.radius)
            * self.maxSpeed;

        // inverse direction if enabled
        if (self.config.reverseDirection) {
            a = -a;
            b = -b;
        }

        if (Math.abs(a) <= 0.01 && Math.abs(b) <= 0.01) return; // pause

        // calculate offset
        const l = Math.PI / 180;
        const sc = [
            Math.sin(a * l),
            Math.cos(a * l),
            Math.sin(b * l),
            Math.cos(b * l)
        ];

        self.items.forEach(item => {
            const rx1 = item.x;
            const ry1 = item.y * sc[1] + item.z * (-sc[0]);
            const rz1 = item.y * sc[0] + item.z * sc[1];

            const rx2 = rx1 * sc[3] + rz1 * sc[2];
            const ry2 = ry1;
            const rz2 = rz1 * sc[3] - rx1 * sc[2];

            const per = (2 * self.depth) / (2 * self.depth + rz2); // todo

            item.x = rx2;
            item.y = ry2;
            item.z = rz2;
            item.scale = per.toFixed(3);
            let alpha = per * per - 0.25;
            alpha = (alpha > 1 ? 1 : alpha).toFixed(3);

            const itemEl = item.el;
            const left = (item.x - itemEl.offsetWidth / 2).toFixed(2);
            const top = (item.y - itemEl.offsetHeight / 2).toFixed(2);
            const transform = `translate3d(${left}px, ${top}px, 0) scale(${item.scale})`;
            itemEl.style.WebkitTransform = transform;
            itemEl.style.MozTransform = transform;
            itemEl.style.OTransform = transform;
            itemEl.style.transform = transform;
            itemEl.style.filter = `alpha(opacity=${100 * alpha})`;
            itemEl.style.opacity = alpha;
        });
    }

    /* export instance properties and methods */
    // update
    update(texts) {
        const self = this;
        // params
        self.texts = texts || [];
        // judging and processing items based on texts
        self.texts.forEach((text, index) => {
            let item = self.items[index];
            if (!item) { // if not had, then create
                item = self._createTextItem(text, index);
                Object.assign(item, self._computePosition(index, true)); // random place
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
        const textsLength = self.texts.length;
        const itemsLength = self.items.length;
        if (textsLength < itemsLength) {
            const removeList = self.items.splice(textsLength, itemsLength - textsLength);
            removeList.forEach(item => {
                self.$el.removeChild(item.el);
            });
        }
    }

    // destroy
    destroy() {
        const self = this;
        self.interval = null;
        // clear in TagCloud.list
        const index = TagCloud.list.findIndex(e => e.el === self.$el);
        if (index !== -1) TagCloud.list.splice(index, 1);
        // clear element
        if (self.$container && self.$el) {
            self.$container.removeChild(self.$el);
        }
    }

    pause() {
        const self = this;

        self.paused = true;
    }

    resume() {
        const self = this;

        self.paused = false;
    }
}

export default (els, texts, options) => {
    if (typeof els === 'string') els = document.querySelectorAll(els);
    if (!els.forEach) els = [els];
    const instances = [];
    els.forEach(el => {
        if (el) {
            instances.push(new TagCloud(el, texts, options));
        }
    });
    return instances.length <= 1 ? instances[0] : instances;
};
