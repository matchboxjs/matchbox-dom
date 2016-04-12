var define = require("backyard/object/define")
var defaults = require("backyard/object/defaults")
var forIn = require("backyard/object/in")
var Radio = require("stations")
var factory = require("offspring")
var InstanceExtension = factory.InstanceExtension
var CacheExtension = factory.CacheExtension
var PrototypeExtension = factory.PrototypeExtension

var domData = require("../data")
var DomData = require("../data/Data")
var Selector = require("../Selector")
var Fragment = require("../Fragment")
var Event = require("./Event")
var ClassName = require("./ClassName")
var Child = require("./Child")

module.exports = factory({
  include: [Radio],

  extensions: {
    viewName: new PrototypeExtension({loop: false}, function(prototype, property, value) {
      prototype.viewName = value

      if (prototype.viewName) {
        prototype.elementSelector = new Child(prototype.viewName)
      }
    }),
    layouts: new CacheExtension(),
    models: new CacheExtension(),
    events: new InstanceExtension(function(view, name, init) {
      var event = init instanceof Event
        ? init.clone()
        : new Event(init)

      event.initialize(view)

      view._events[name] = event
    }),
    dataset: new CacheExtension(function(prototype, name, data) {
      if (!(data instanceof DomData)) {
        data = domData.create(name, data)
      }
      data.name = data.name || name

      return data
    }),
    classList: new InstanceExtension(function(view, name, init) {
      init = init instanceof ClassName
        ? init.clone()
        : new ClassName(init)
      view._classList[name] = new ClassName(init)
    }),
    children: new CacheExtension(function(prototype, childProperty, child) {
      if (!(child instanceof Selector)) {
        child = new Child(child)
      }

      if (child instanceof Child) {
        child.property = childProperty
      }

      var viewValue = child.value && Selector.completeNestShorthand(child.value, prototype.viewName)
      return viewValue
        ? child.contains(viewValue)
        : child
    }),
    fragments: new CacheExtension(function(prototype, name, fragment) {
      if (!(fragment instanceof Fragment)) {
        return new Fragment(fragment)
      }
      return fragment
    })
  },

  layouts: {},
  models: {},
  events: {},
  dataset: {},
  classList: {},
  fragments: {},
  children: {},

  constructor: function View(element) {
    Radio.call(this)
    define.value(this, "_events", {})
    define.value(this, "_models", {})
    define.value(this, "_classList", {})
    define.writable.value(this, "_element", null)
    define.writable.value(this, "currentLayout", "")
    View.initialize(this)
    this.element = element
  },

  accessor: {
    element: {
      get: function() {
        return this._element
      },
      set: function(element) {
        var previous = this._element
        if (previous == element) {
          return
        }
        this._element = element
        this.onElementChange(element, previous)
      }
    }
  },

  prototype: {
    viewName: "",
    elementSelector: null,

    // Callbacks

    onElementChange: function(element, previous) {
      var view = this
      forIn(this._events, function(name, event) {
        if (previous) event.unRegister(previous)
        if (element) event.register(element, view)
      })
      forIn(this._classList, function(name, modifier) {
        modifier.reset(element, view)
      })
      forIn(this.dataset, function(name, data) {
        if (!data.has(element) && data.default != null) {
          data.set(element, data.default)
        }
      })
      forIn(this.children, function(name) {
        var child = view.children[name]
        if (child && child.autoselect) {
          view[name] = view.findChild(name)
        }
      })
      forIn(this.models, function(name, Constructor) {
        view._models[name] = new Constructor()
      })
    },
    onLayoutChange: function(layout, previous) {},

    // Layout

    changeLayout: function(layout) {
      if (this.currentLayout == layout) {
        return Promise.resolve()
      }

      var layoutHandler = this.layouts[layout]
      if (typeof layoutHandler != "function") {
        return Promise.reject(new Error("Invalid layout handler: " + layout))
      }

      var view = this
      var previous = view.currentLayout
      return Promise.resolve(previous).then(function() {
        return layoutHandler.call(view, previous)
      }).then(function() {
        view.currentLayout = layout
        view.onLayoutChange(previous, layout)
      })
    },

    // Events

    registerEvent: function(eventName) {
      var event = this.event[eventName]
      if (!(event instanceof Event)) {
        return
      }
      event.register(this.element, this)
    },
    unRegisterEvent: function(eventName) {
      var event = this.event[eventName]
      if (!(event instanceof Event)) {
        return
      }
      event.unRegister(this.element)
    },
    dispatch: function(type, detail, def) {
      var definition = defaults(def, {
        detail: detail || null,
        view: window,
        bubbles: true,
        cancelable: true
      })
      return this.element.dispatchEvent(new window.CustomEvent(type, definition))
    },

    // Data

    getData: function(name) {
      var data = this.dataset[name]
      if (data) {
        return data.get(this.element)
      }
      return null
    },
    setData: function(name, value, silent) {
      var data = this.dataset[name]
      if (data) {
        return data.set(this.element, value, silent)
      }
    },
    removeData: function(name, silent) {
      var data = this.dataset[name]
      if (data) {
        data.remove(this.element, silent)
      }
    },
    hasData: function(name) {
      var data = this.dataset[name]
      if (data) {
        return data.has(this.element)
      }
      return false
    },

    // ClassNames

    getClassName: function(name) {
      if (this._classList[name]) {
        return this._classList[name].get()
      }
    },
    setClassName: function(name, value) {
      if (this._classList[name] && this.element) {
        return this._classList[name].set(value, this.element, this)
      }
    },
    hasClassName: function(name) {
      if (this._classList[name]) {
        return this._classList[name].hasValue()
      }
    },
    isClassNameSet: function(name) {
      if (this._classList[name]) {
        return this._classList[name].isSet(this.element)
      }
    },
    isClassNameValue: function(name, value) {
      return this.isClassNameSet(name) && this.getClassName(name) == value
    },
    removeClassName: function(name) {
      if (this._classList[name]) {
        return this._classList[name].remove(this.element, this)
      }
    },
    toggleClassName: function(name) {
      if (this._classList[name]) {
        return this._classList[name].toggle(this.element, this)
      }
    },

    // Model

    getModel: function(name) {
      name = name || "default"
      var model = this._models[name]
      if (model == null) {
        throw new Error("Unable to access unknown model")
      }

      return model
    },
    setModel: function(name, model) {
      if (!model) {
        model = name
        name = "default"
      }
      this._models[name] = model
    },

    setupElement: function(root) {
      root = root || document.body
      if (root && this.elementSelector) {
        this.element = this.elementSelector.from(root).find()
      }

      return this
    },

    // Children

    getChildView: function(childProperty, element) {
      var child = this.children[childProperty]
      var member = this[childProperty]

      if (!child) {
        return member
      }

      if (child.lookup) {
        return this.getChildView(child.lookup, element)
      }

      if (child.multiple && Array.isArray(member)) {
        var l = member.length
        while (l--) {
          if (member[l] == element || member[l].element == element) {
            return member[l]
          }
        }
      }

      return null
    },
    findChild: function(property) {
      var child
      if (typeof property == "string") {
        child = this.children[property]
      }
      else if (property instanceof Selector) {
        child = property
      }

      if (child) {
        var element = child.from(this.element, this.elementSelector).find(this)
        if (element && child.lookup) {
          return this.getChildView(child.lookup, element)
        }
        return element
      }

      return null
    }
  }
})
