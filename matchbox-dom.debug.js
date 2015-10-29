(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.matchboxDom = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = Fragment

function Fragment (fragment) {
  fragment = fragment || {}
  this.html = fragment.html || ""
  this.first = fragment.first == undefined || !!fragment.first
  this.timeout = fragment.timeout || 2000
}

Fragment.prototype.create = function (html) {
  var temp = document.createElement('div')

  temp.innerHTML = html || this.html

  if (this.first === undefined || this.first) {
    return temp.children[0]
  }

  var fragment = document.createDocumentFragment()
  while (temp.childNodes.length) {
    fragment.appendChild(temp.firstChild)
  }

  return fragment;
}

Fragment.prototype.compile = function (html, options, cb) {
  setTimeout(function () {
    cb(null, html)
  }, 4)
}

Fragment.prototype.render = function (context, options) {
  var fragment = this
  context = context || {}

  return new Promise(function (resolve, reject) {
    var resolved = false
    var id = setTimeout(function () {
      reject(new Error("Render timed out"))
    }, fragment.timeout)

    try {
      fragment.compile(context, options, function (err, rendered) {
        clearTimeout(id)
        if (resolved) return

        if (err) {
          reject(err)
        }
        else {
          resolve(fragment.create(rendered))
        }
      })
    }
    catch (e) {
      reject(e)
    }
  })
}

},{}],2:[function(require,module,exports){
module.exports = Selector

Selector.DEFAULT_NEST_SEPARATOR = ":"

function Selector (selector) {
  selector = selector || {}
  this.attribute = selector.attribute || ""
  this.value = selector.value || null
  this.operator = selector.operator || "="
  this.extra = selector.extra || ""

  this.element = selector.element || null

  this.Constructor = selector.Constructor || null
  this.instantiate = selector.instantiate || null
  this.multiple = selector.multiple != null ? !!selector.multiple : false

  this.matcher = selector.matcher || null
}

Selector.prototype.clone = function () {
  return new Selector(this)
}

Selector.prototype.combine = function (selector) {
  var s = this.clone()
  s.extra += selector.toString()
  return s
}

Selector.prototype.equal = function (value) {
  var s = this.clone()
  s.operator = "="
  s.value = value
  return s
}

Selector.prototype.contains = function (value) {
  var s = this.clone()
  s.operator = "~"
  s.value = value
  return s
}

Selector.prototype.prefix = function (pre, separator) {
  var s = this.clone()
  var sep = s.value ? separator || Selector.DEFAULT_NEST_SEPARATOR : ""
  s.value = pre + sep + s.value
  return s
}

Selector.prototype.nest = function (post, separator) {
  var s = this.clone()
  var sep = s.value ? separator || Selector.DEFAULT_NEST_SEPARATOR : ""
  s.value += sep + post
  return s
}

Selector.prototype.from = function (element) {
  var s = this.clone()
  s.element = element
  return s
}

Selector.prototype.select = function (element, transform) {
  var result = element.querySelector(this.toString())
  return transform ? transform(result) : result
}

Selector.prototype.selectAll = function (element, transform) {
  var result = element.querySelectorAll(this.toString())
  return transform ? transform(result) : result
}

Selector.prototype.node = function (transform) {
  return this.select(this.element, transform)
}

Selector.prototype.nodeList = function (transform) {
  return this.selectAll(this.element, transform)
}

Selector.prototype.construct = function () {
  var Constructor = this.Constructor
  var instantiate = this.instantiate || function (element) {
    return new Constructor(element)
  }
  if (this.multiple) {
    return this.nodeList(function (elements) {
      return [].map.call(elements, instantiate)
    })
  }
  else {
    return this.node(instantiate)
  }
}

Selector.prototype.toString = function () {
  var string = ""
  var value = this.value
  var attribute = this.attribute
  var extra = this.extra || ""

  switch (attribute) {
    case "id":
        string = "#" + value
      break
    case "class":
      string = "." + value
      break
    case "":
      string = value || ""
      break
    default:
      value = value === "" || value === true || value === false || value == null
        ? ""
        : '"' + value + '"'
      var operator = value ? this.operator || "=" : ""
      string = "[" + attribute + operator + value + "]"
  }

  string += extra

  return string
}

},{}],3:[function(require,module,exports){
module.exports = DomAttribute

function DomAttribute () {}

DomAttribute.prototype.defaultPrefix = "data-"

DomAttribute.prototype.getFromContext = function( element, name ){
  return element.getAttribute(name)
}
DomAttribute.prototype.setOnContext = function( element, name, value ){
  return element.setAttribute(name, value)
}
DomAttribute.prototype.hasOnContext = function( element, name ){
  return element.hasAttribute(name)
}
DomAttribute.prototype.removeFromContext = function( element, name ){
  return element.removeAttribute(name)
}


},{}],4:[function(require,module,exports){
var inherit = require("matchbox-factory/inherit")
var include = require("matchbox-factory/include")
var BooleanAttribute = require("matchbox-attributes/Boolean")
var DomAttribute = require("./DomAttribute")

module.exports = DomBoolean

function DomBoolean (def) {
  BooleanAttribute.call(this, def)
  if (typeof this.default != "boolean") {
    this.default = false
  }
}
inherit(DomBoolean, BooleanAttribute)
include(DomBoolean, DomAttribute)

DomBoolean.prototype.shouldRemove = function (parsedValue) {
  return parsedValue == null || parsedValue === false
}

DomBoolean.prototype.parseValue = function (serializedValue) {
  return serializedValue != null
}

DomBoolean.prototype.serializeValue = function (parseValue) {
  return parseValue ? "" : null
}

},{"./DomAttribute":3,"matchbox-attributes/Boolean":16,"matchbox-factory/include":22,"matchbox-factory/inherit":23}],5:[function(require,module,exports){
var inherit = require("matchbox-factory/inherit")
var include = require("matchbox-factory/include")
var FloatAttribute = require("matchbox-attributes/Float")
var DomAttribute = require("./DomAttribute")

module.exports = DomFloat

function DomFloat (def) {
  FloatAttribute.call(this, def)
}
inherit(DomFloat, FloatAttribute)
include(DomFloat, DomAttribute)

},{"./DomAttribute":3,"matchbox-attributes/Float":17,"matchbox-factory/include":22,"matchbox-factory/inherit":23}],6:[function(require,module,exports){
var inherit = require("matchbox-factory/inherit")
var include = require("matchbox-factory/include")
var JSONAttribute = require("matchbox-attributes/JSON")
var DomAttribute = require("./DomAttribute")

module.exports = DomJSON

function DomJSON (def) {
  JSONAttribute.call(this, def)
}
inherit(DomJSON, JSONAttribute)
include(DomJSON, DomAttribute)

},{"./DomAttribute":3,"matchbox-attributes/JSON":18,"matchbox-factory/include":22,"matchbox-factory/inherit":23}],7:[function(require,module,exports){
var inherit = require("matchbox-factory/inherit")
var include = require("matchbox-factory/include")
var NumberAttribute = require("matchbox-attributes/Number")
var DomAttribute = require("./DomAttribute")

module.exports = DomNumber

function DomNumber (def) {
  NumberAttribute.call(this, def)
}
inherit(DomNumber, NumberAttribute)
include(DomNumber, DomAttribute)

},{"./DomAttribute":3,"matchbox-attributes/Number":19,"matchbox-factory/include":22,"matchbox-factory/inherit":23}],8:[function(require,module,exports){
var inherit = require("matchbox-factory/inherit")
var include = require("matchbox-factory/include")
var StringAttribute = require("matchbox-attributes/String")
var DomAttribute = require("./DomAttribute")

module.exports = DomString

function DomString (def) {
  StringAttribute.call(this, def)
}
inherit(DomString, StringAttribute)
include(DomString, DomAttribute)

},{"./DomAttribute":3,"matchbox-attributes/String":20,"matchbox-factory/include":22,"matchbox-factory/inherit":23}],9:[function(require,module,exports){
var Attribute = require("matchbox-attributes/Attribute")
var DomString = require("./DomString")
var DomBoolean = require("./DomBoolean")
var DomNumber = require("./DomNumber")
var DomFloat = require("./DomFloat")
var DomJSON = require("./DomJSON")

var attributes = module.exports = {}

attributes.String = DomString
attributes.Boolean = DomBoolean
attributes.Number = DomNumber
attributes.Float = DomFloat
attributes.JSON = DomJSON

attributes.create = function (def) {
  switch (Attribute.getType(def)) {
    case "string":
      return new DomString(def)
    case "boolean":
      return new DomBoolean(def)
    case "number":
      return new DomNumber(def)
    case "float":
      return new DomFloat(def)
    case "json":
      return new DomJSON(def)
  }
}

},{"./DomBoolean":4,"./DomFloat":5,"./DomJSON":6,"./DomNumber":7,"./DomString":8,"matchbox-attributes/Attribute":15}],10:[function(require,module,exports){
var Selector = require("../Selector")

/**
 * Registers an event listener on an element
 * and returns a delegator.
 * A delegated event runs matches to find an event target,
 * then executes the handler paired with the matcher.
 * Matchers can check if an event target matches a given selector,
 * or see if an of its parents do.
 * */
module.exports = delegate

function delegate( options ){
  var element = options.element
    , event = options.event
    , capture = !!options.capture || false
    , context = options.context || element
    , transform = options.transform || null

  if( !element ){
    console.log("Can't delegate undefined element")
    return null
  }
  if( !event ){
    console.log("Can't delegate undefined event")
    return null
  }

  var handler = createHandler(context, transform)
  element.addEventListener(event, handler, capture)

  return handler
}

/**
 * Returns a delegator that can be used as an event listener.
 * The delegator has static methods which can be used to register handlers.
 * */
function createHandler( context, transform ){
  var matchers = []

  function delegatedHandler( e ){
    var l = matchers.length
    if( !l ){
      return true
    }

    var el = this
        , i = -1
        , handler
        , selector
        , delegateElement
        , stopPropagation
        , args

    while( ++i < l ){
      args = matchers[i]
      handler = args[0]
      selector = args[1]

      delegateElement = matchCapturePath(selector, el, e, transform, context)
      if( delegateElement && delegateElement.length ) {
        stopPropagation = false === handler.apply(context, [e].concat(delegateElement))
        if( stopPropagation ) {
          return false
        }
      }
    }

    return true
  }

  /**
   * Registers a handler with a target finder logic
   * */
  delegatedHandler.match = function( selector, handler ){
    matchers.push([handler, selector])
    return delegatedHandler
  }

  return delegatedHandler
}

function matchCapturePath( selector, el, e, transform, context ){
  var delegateElements = []
  var delegateElement = null
  if( Array.isArray(selector) ){
    var i = -1
    var l = selector.length
    while( ++i < l ){
      delegateElement = findParent(selector[i], el, e)
      if( !delegateElement ) return null
      if (typeof transform == "function") {
        delegateElement = transform(context, selector, delegateElement)
      }
      delegateElements.push(delegateElement)
    }
  }
  else {
    delegateElement = findParent(selector, el, e)
    if( !delegateElement ) return null
    if (typeof transform == "function") {
      delegateElement = transform(context, selector, delegateElement)
    }
    delegateElements.push(delegateElement)
  }
  return delegateElements
}

/**
 * Check if the target or any of its parent matches a selector
 * */
function findParent( selector, el, e ){
  var target = e.target
  if (selector instanceof Selector) {
    selector = selector.toString()
  }
  switch( typeof selector ){
    case "string":
      while( target && target != el ){
        if( target.matches && target.matches(selector) ) return target
        target = target.parentNode
      }
      break
    case "function":
      while( target && target != el ){
        if( selector.call(el, target) ) return target
        target = target.parentNode
      }
      break
    default:
      return null
  }
  return null
}

},{"../Selector":2}],11:[function(require,module,exports){
var event = module.exports = {}

event.delegate = require("./delegate")
event.missclick = require("./missclick")

},{"./delegate":10,"./missclick":12}],12:[function(require,module,exports){
module.exports = missclick

var elements = []
var listeners = []

function missclick (element, cb) {
  if (isRegistered(element)) {
    return
  }

  register(element, cb)
}

function isRegistered (element) {
  return !!~elements.indexOf(element)
}

function register (element, cb) {
  function listener (e) {
    if (!isRegistered(element)) {
      removeListener()
    }
    else if (!element.contains(e.target) && e.target != element) {
      removeListener()
      cb && cb(e)
    }
  }

  function removeListener () {
    document.body.removeEventListener("click", listener, false)
    if (isRegistered(element)) {
      elements.splice(elements.indexOf(element), 1)
      listeners.splice(listeners.indexOf(removeListener), 1)
    }
  }

  document.body.addEventListener("click", listener, false)

  elements.push(element)
  listeners.push(removeListener)
}

missclick.remove = function (element) {
  if (isRegistered(element)) {
    listeners[elements.indexOf(element)]()
  }
}

},{}],13:[function(require,module,exports){
var dom = module.exports = {}

dom.attributes = require("./attributes")
dom.event = require("./event")
dom.Fragment = require("./Fragment")
dom.Selector = require("./Selector")

},{"./Fragment":1,"./Selector":2,"./attributes":9,"./event":11}],14:[function(require,module,exports){
'use strict';
module.exports = function () {
	var str = [].map.call(arguments, function (str) {
		return str.trim();
	}).filter(function (str) {
		return str.length;
	}).join('-');

	if (!str.length) {
		return '';
	}

	if (str.length === 1 || !(/[_.\- ]+/).test(str) ) {
		if (str[0] === str[0].toLowerCase() && str.slice(1) !== str.slice(1).toLowerCase()) {
			return str;
		}

		return str.toLowerCase();
	}

	return str
	.replace(/^[_.\- ]+/, '')
	.toLowerCase()
	.replace(/[_.\- ]+(\w|$)/g, function (m, p1) {
		return p1.toUpperCase();
	});
};

},{}],15:[function(require,module,exports){
var camelcase = require("camelcase")

module.exports = Attribute

function Attribute (def) {
  if (typeof def == "undefined" || def == null) {
    def = {}
  }
  this.type = def.type || this.defaultType
  this.name = def.name || ""
  this.prefix = def.prefix || this.defaultPrefix
  this.camelcase = def.camelcase == null ? this.defaultCamelcase : !!def.camelcase
  this.property = def.property || this.name
  this.onchange = def.onchange || null
  this.default = null

  if (Attribute.isPrimitive(def)) {
    this.default = def
  }
  else if (def != null && def.hasOwnProperty("default")) {
    this.default = def.default
  }
}

/**
 * Returns the type from a default value, or a definition object.
 * Note: that it fails to detect whole number floats as float.
 * */
Attribute.getType = function (def) {
  if (typeof def == "undefined" || def == null) {
    return null
  }

  var value
  if (Attribute.isPrimitive(def)) {
    value = def
  }
  else if (typeof def.type == "string") {
    return def.type
  }
  else if (def.hasOwnProperty("default")) {
    value = def.default
    if (typeof value == "object") {
      return "json"
    }
  }

  switch (typeof value) {
    case "number":
      // note: it fails for 1.0
      if (value === +value && value !== (value | 0)) {
        return "float"
      }
  }
  return typeof value
}

/**
 * Check if this value is primitive
 * */
Attribute.isPrimitive = function (value) {
  switch( typeof value ) {
    case "boolean":
    case "number":
    case "string":
      return true
    default:
      return false
  }
}

Attribute.prototype.defaultType = "string"
Attribute.prototype.defaultPrefix = ""
/** Controls if the property accessor is camelized. */
Attribute.prototype.defaultCamelcase = true

/**
 * Returns the prefixed name for this attribute
 * */
Object.defineProperty(Attribute.prototype, "prefixedName", {
  get: function () {
    return this.prefix + this.name
  }
})

/**
 * Called when retrieving a value from a context.
 * It should return a normalized form if a serialized value.
 * */
Attribute.prototype.parseValue = function (serializedValue) {
  return serializedValue
}
/**
 * Called when setting a value on a context.
 * It should return a serialized representation of a value.
 * */
Attribute.prototype.serializeValue = function (parsedValue) {
  return parsedValue
}
/**
 * Checks if a value should trigger an attribute removal.
 * */
Attribute.prototype.shouldRemove = function( parsedValue ){
  return parsedValue == null
}

/**
 * Returns a context for the attribute manager methods
 * */
Attribute.prototype.getContext = function (context) {
  return context
}

/**
 * Assign a property getter-setter to an object
 * which will proxy the attribute definition's `get` and `set` methods.
 * */
Attribute.prototype.defineProperty = function (obj, propertyName, getContext) {
  var attribute = this
  propertyName = this.camelcase ? camelcase(propertyName) : propertyName
  getContext = getContext || attribute.getContext

  Object.defineProperty(obj, propertyName, {
    get: function () {
      var context = getContext(this) || this
      return attribute.get(context)
    },
    set: function (value) {
      var context = getContext(this) || this
      attribute.set(context, value, true)
    }
  })
}

/**
 * It should return a serialized value from a context.
 * */
Attribute.prototype.getFromContext = function (context, prefixedName) {
  return context[prefixedName]
}
/**
 * It should set a serialized value on a context.
 * */
Attribute.prototype.setOnContext = function (context, prefixedName, serializedValue) {
  context[prefixedName] = serializedValue
}
/**
 * It should return whether or not an attribute exists on a context.
 * */
Attribute.prototype.hasOnContext = function (context, prefixedName) {
  return context.hasOwnProperty(prefixedName)
}
/**
 * It should remove an attribute value from a context.
 * */
Attribute.prototype.removeFromContext = function (context, prefixedName) {
  return delete context[prefixedName]
}

/**
 * Returns a parsed value from the context if it exists,
 * otherwise the default value.
 * */
Attribute.prototype.get = function( context ){
  if (this.hasOnContext(context, this.prefixedName)) {
    return this.parseValue(this.getFromContext(context, this.prefixedName))
  }
  else {
    return this.default
  }
}
/**
 * Serializes a parsed value and sets it on the context,
 * but only if it's not equal to the previous value.
 * If the value provided triggers a removal, it removes the attribute from the context.
 * */
Attribute.prototype.set = function( context, parsedValue, callOnchange ){
  var previousValue = this.parseValue(this.getFromContext(context, this.prefixedName))
  var newValue

  // setting to the same value
  if( previousValue === parsedValue ){
    return
  }

  if (this.hasOnContext(context, this.prefixedName)) {
    // removing existing value
    if( this.shouldRemove(parsedValue) ){
      this.removeFromContext(context, this.prefixedName)
      if (this.onchange && callOnchange != false) {
        this.onchange.call(context, previousValue, parsedValue)
      }
      return
    }
  }

  // don't need to remove which is not there
  if( this.shouldRemove(parsedValue) ){
    return
  }

  // setting a new value
  newValue = this.serializeValue(parsedValue)
  this.setOnContext(context, this.prefixedName, newValue)
  if (this.onchange && callOnchange != false) {
    this.onchange.call(context, previousValue, parsedValue)
  }
}

},{"camelcase":14}],16:[function(require,module,exports){
var inherit = require("matchbox-factory/inherit")
var Attribute = require("./Attribute")

module.exports = BooleanAttribute

function BooleanAttribute (def) {
  Attribute.call(this, def)
  this.type = "boolean"
}

inherit(BooleanAttribute, Attribute)

BooleanAttribute.prototype.parseValue = function(serializedValue){
  return serializedValue == null
    ? null
    : !!serializedValue
}

},{"./Attribute":15,"matchbox-factory/inherit":23}],17:[function(require,module,exports){
var inherit = require("matchbox-factory/inherit")
var Attribute = require("./Attribute")

module.exports = FloatAttribute

function FloatAttribute (def) {
  Attribute.call(this, def)
  this.type = "float"
}

inherit(FloatAttribute, Attribute)

FloatAttribute.prototype.parseValue = function(serializedValue){
  return serializedValue == null
      ? null
      : parseFloat(serializedValue)
}

},{"./Attribute":15,"matchbox-factory/inherit":23}],18:[function(require,module,exports){
var inherit = require("matchbox-factory/inherit")
var Attribute = require("./Attribute")

module.exports = JSONAttribute

function JSONAttribute (def) {
  Attribute.call(this, def)
  this.type = "json"
}

inherit(JSONAttribute, Attribute)

JSONAttribute.prototype.parseValue = function(serializedValue){
  return serializedValue == null
      ? null
      : JSON.parse(serializedValue)
}

JSONAttribute.prototype.serializeValue = function(prasedValue){
  return prasedValue == null
      ? null
      : JSON.stringify(prasedValue)
}

},{"./Attribute":15,"matchbox-factory/inherit":23}],19:[function(require,module,exports){
var inherit = require("matchbox-factory/inherit")
var Attribute = require("./Attribute")

module.exports = NumberAttribute

function NumberAttribute (def) {
  Attribute.call(this, def)
  this.type = "number"
}

inherit(NumberAttribute, Attribute)

NumberAttribute.prototype.parseValue = function(serializedValue){
  return serializedValue == null
      ? null
      : parseFloat(serializedValue)
}

},{"./Attribute":15,"matchbox-factory/inherit":23}],20:[function(require,module,exports){
var inherit = require("matchbox-factory/inherit")
var Attribute = require("./Attribute")

module.exports = StringAttribute

function StringAttribute (def) {
  Attribute.call(this, def)
  this.type = "string"
}

inherit(StringAttribute, Attribute)

StringAttribute.prototype.parseValue = function(serializedValue){
  return serializedValue == null
      ? null
      : "" + serializedValue
}

},{"./Attribute":15,"matchbox-factory/inherit":23}],21:[function(require,module,exports){
module.exports = function extend (Class, prototype) {
  Object.getOwnPropertyNames(prototype).forEach(function (name) {
    if (name !== "constructor" ) {
      var descriptor = Object.getOwnPropertyDescriptor(prototype, name)
      Object.defineProperty(Class.prototype, name, descriptor)
    }
  })

  return Class
}

},{}],22:[function(require,module,exports){
var extend = require("./extend")

module.exports = function include (Class, Other) {
  if (Array.isArray(Other)) {
    Other.forEach(function (Other) {
      if (typeof Other == "function") {
        extend(Class, Other.prototype)
      }
      else if (typeof Other == "object") {
        extend(Class, Other)
      }
    })
  }
  else {
    if (typeof Other == "function") {
      extend(Class, Other.prototype)
    }
    else if (typeof Other == "object") {
      extend(Class, Other)
    }
  }

  return Class
}

},{"./extend":21}],23:[function(require,module,exports){
module.exports = function inherit (Class, Base) {
  Class.prototype = Object.create(Base.prototype)
  Class.prototype.constructor = Class

  return Class
}

},{}]},{},[13])(13)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJGcmFnbWVudC5qcyIsIlNlbGVjdG9yLmpzIiwiYXR0cmlidXRlcy9Eb21BdHRyaWJ1dGUuanMiLCJhdHRyaWJ1dGVzL0RvbUJvb2xlYW4uanMiLCJhdHRyaWJ1dGVzL0RvbUZsb2F0LmpzIiwiYXR0cmlidXRlcy9Eb21KU09OLmpzIiwiYXR0cmlidXRlcy9Eb21OdW1iZXIuanMiLCJhdHRyaWJ1dGVzL0RvbVN0cmluZy5qcyIsImF0dHJpYnV0ZXMvaW5kZXguanMiLCJldmVudC9kZWxlZ2F0ZS5qcyIsImV2ZW50L2luZGV4LmpzIiwiZXZlbnQvbWlzc2NsaWNrLmpzIiwiaW5kZXguanMiLCJub2RlX21vZHVsZXMvY2FtZWxjYXNlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL21hdGNoYm94LWF0dHJpYnV0ZXMvQXR0cmlidXRlLmpzIiwibm9kZV9tb2R1bGVzL21hdGNoYm94LWF0dHJpYnV0ZXMvQm9vbGVhbi5qcyIsIm5vZGVfbW9kdWxlcy9tYXRjaGJveC1hdHRyaWJ1dGVzL0Zsb2F0LmpzIiwibm9kZV9tb2R1bGVzL21hdGNoYm94LWF0dHJpYnV0ZXMvSlNPTi5qcyIsIm5vZGVfbW9kdWxlcy9tYXRjaGJveC1hdHRyaWJ1dGVzL051bWJlci5qcyIsIm5vZGVfbW9kdWxlcy9tYXRjaGJveC1hdHRyaWJ1dGVzL1N0cmluZy5qcyIsIm5vZGVfbW9kdWxlcy9tYXRjaGJveC1mYWN0b3J5L2V4dGVuZC5qcyIsIm5vZGVfbW9kdWxlcy9tYXRjaGJveC1mYWN0b3J5L2luY2x1ZGUuanMiLCJub2RlX21vZHVsZXMvbWF0Y2hib3gtZmFjdG9yeS9pbmhlcml0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gRnJhZ21lbnRcblxuZnVuY3Rpb24gRnJhZ21lbnQgKGZyYWdtZW50KSB7XG4gIGZyYWdtZW50ID0gZnJhZ21lbnQgfHwge31cbiAgdGhpcy5odG1sID0gZnJhZ21lbnQuaHRtbCB8fCBcIlwiXG4gIHRoaXMuZmlyc3QgPSBmcmFnbWVudC5maXJzdCA9PSB1bmRlZmluZWQgfHwgISFmcmFnbWVudC5maXJzdFxuICB0aGlzLnRpbWVvdXQgPSBmcmFnbWVudC50aW1lb3V0IHx8IDIwMDBcbn1cblxuRnJhZ21lbnQucHJvdG90eXBlLmNyZWF0ZSA9IGZ1bmN0aW9uIChodG1sKSB7XG4gIHZhciB0ZW1wID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcblxuICB0ZW1wLmlubmVySFRNTCA9IGh0bWwgfHwgdGhpcy5odG1sXG5cbiAgaWYgKHRoaXMuZmlyc3QgPT09IHVuZGVmaW5lZCB8fCB0aGlzLmZpcnN0KSB7XG4gICAgcmV0dXJuIHRlbXAuY2hpbGRyZW5bMF1cbiAgfVxuXG4gIHZhciBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKVxuICB3aGlsZSAodGVtcC5jaGlsZE5vZGVzLmxlbmd0aCkge1xuICAgIGZyYWdtZW50LmFwcGVuZENoaWxkKHRlbXAuZmlyc3RDaGlsZClcbiAgfVxuXG4gIHJldHVybiBmcmFnbWVudDtcbn1cblxuRnJhZ21lbnQucHJvdG90eXBlLmNvbXBpbGUgPSBmdW5jdGlvbiAoaHRtbCwgb3B0aW9ucywgY2IpIHtcbiAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgY2IobnVsbCwgaHRtbClcbiAgfSwgNClcbn1cblxuRnJhZ21lbnQucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIChjb250ZXh0LCBvcHRpb25zKSB7XG4gIHZhciBmcmFnbWVudCA9IHRoaXNcbiAgY29udGV4dCA9IGNvbnRleHQgfHwge31cblxuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgIHZhciByZXNvbHZlZCA9IGZhbHNlXG4gICAgdmFyIGlkID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICByZWplY3QobmV3IEVycm9yKFwiUmVuZGVyIHRpbWVkIG91dFwiKSlcbiAgICB9LCBmcmFnbWVudC50aW1lb3V0KVxuXG4gICAgdHJ5IHtcbiAgICAgIGZyYWdtZW50LmNvbXBpbGUoY29udGV4dCwgb3B0aW9ucywgZnVuY3Rpb24gKGVyciwgcmVuZGVyZWQpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGlkKVxuICAgICAgICBpZiAocmVzb2x2ZWQpIHJldHVyblxuXG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHJlc29sdmUoZnJhZ21lbnQuY3JlYXRlKHJlbmRlcmVkKSlcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgIHJlamVjdChlKVxuICAgIH1cbiAgfSlcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gU2VsZWN0b3JcblxuU2VsZWN0b3IuREVGQVVMVF9ORVNUX1NFUEFSQVRPUiA9IFwiOlwiXG5cbmZ1bmN0aW9uIFNlbGVjdG9yIChzZWxlY3Rvcikge1xuICBzZWxlY3RvciA9IHNlbGVjdG9yIHx8IHt9XG4gIHRoaXMuYXR0cmlidXRlID0gc2VsZWN0b3IuYXR0cmlidXRlIHx8IFwiXCJcbiAgdGhpcy52YWx1ZSA9IHNlbGVjdG9yLnZhbHVlIHx8IG51bGxcbiAgdGhpcy5vcGVyYXRvciA9IHNlbGVjdG9yLm9wZXJhdG9yIHx8IFwiPVwiXG4gIHRoaXMuZXh0cmEgPSBzZWxlY3Rvci5leHRyYSB8fCBcIlwiXG5cbiAgdGhpcy5lbGVtZW50ID0gc2VsZWN0b3IuZWxlbWVudCB8fCBudWxsXG5cbiAgdGhpcy5Db25zdHJ1Y3RvciA9IHNlbGVjdG9yLkNvbnN0cnVjdG9yIHx8IG51bGxcbiAgdGhpcy5pbnN0YW50aWF0ZSA9IHNlbGVjdG9yLmluc3RhbnRpYXRlIHx8IG51bGxcbiAgdGhpcy5tdWx0aXBsZSA9IHNlbGVjdG9yLm11bHRpcGxlICE9IG51bGwgPyAhIXNlbGVjdG9yLm11bHRpcGxlIDogZmFsc2VcblxuICB0aGlzLm1hdGNoZXIgPSBzZWxlY3Rvci5tYXRjaGVyIHx8IG51bGxcbn1cblxuU2VsZWN0b3IucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gbmV3IFNlbGVjdG9yKHRoaXMpXG59XG5cblNlbGVjdG9yLnByb3RvdHlwZS5jb21iaW5lID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gIHZhciBzID0gdGhpcy5jbG9uZSgpXG4gIHMuZXh0cmEgKz0gc2VsZWN0b3IudG9TdHJpbmcoKVxuICByZXR1cm4gc1xufVxuXG5TZWxlY3Rvci5wcm90b3R5cGUuZXF1YWwgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgdmFyIHMgPSB0aGlzLmNsb25lKClcbiAgcy5vcGVyYXRvciA9IFwiPVwiXG4gIHMudmFsdWUgPSB2YWx1ZVxuICByZXR1cm4gc1xufVxuXG5TZWxlY3Rvci5wcm90b3R5cGUuY29udGFpbnMgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgdmFyIHMgPSB0aGlzLmNsb25lKClcbiAgcy5vcGVyYXRvciA9IFwiflwiXG4gIHMudmFsdWUgPSB2YWx1ZVxuICByZXR1cm4gc1xufVxuXG5TZWxlY3Rvci5wcm90b3R5cGUucHJlZml4ID0gZnVuY3Rpb24gKHByZSwgc2VwYXJhdG9yKSB7XG4gIHZhciBzID0gdGhpcy5jbG9uZSgpXG4gIHZhciBzZXAgPSBzLnZhbHVlID8gc2VwYXJhdG9yIHx8IFNlbGVjdG9yLkRFRkFVTFRfTkVTVF9TRVBBUkFUT1IgOiBcIlwiXG4gIHMudmFsdWUgPSBwcmUgKyBzZXAgKyBzLnZhbHVlXG4gIHJldHVybiBzXG59XG5cblNlbGVjdG9yLnByb3RvdHlwZS5uZXN0ID0gZnVuY3Rpb24gKHBvc3QsIHNlcGFyYXRvcikge1xuICB2YXIgcyA9IHRoaXMuY2xvbmUoKVxuICB2YXIgc2VwID0gcy52YWx1ZSA/IHNlcGFyYXRvciB8fCBTZWxlY3Rvci5ERUZBVUxUX05FU1RfU0VQQVJBVE9SIDogXCJcIlxuICBzLnZhbHVlICs9IHNlcCArIHBvc3RcbiAgcmV0dXJuIHNcbn1cblxuU2VsZWN0b3IucHJvdG90eXBlLmZyb20gPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICB2YXIgcyA9IHRoaXMuY2xvbmUoKVxuICBzLmVsZW1lbnQgPSBlbGVtZW50XG4gIHJldHVybiBzXG59XG5cblNlbGVjdG9yLnByb3RvdHlwZS5zZWxlY3QgPSBmdW5jdGlvbiAoZWxlbWVudCwgdHJhbnNmb3JtKSB7XG4gIHZhciByZXN1bHQgPSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3IodGhpcy50b1N0cmluZygpKVxuICByZXR1cm4gdHJhbnNmb3JtID8gdHJhbnNmb3JtKHJlc3VsdCkgOiByZXN1bHRcbn1cblxuU2VsZWN0b3IucHJvdG90eXBlLnNlbGVjdEFsbCA9IGZ1bmN0aW9uIChlbGVtZW50LCB0cmFuc2Zvcm0pIHtcbiAgdmFyIHJlc3VsdCA9IGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCh0aGlzLnRvU3RyaW5nKCkpXG4gIHJldHVybiB0cmFuc2Zvcm0gPyB0cmFuc2Zvcm0ocmVzdWx0KSA6IHJlc3VsdFxufVxuXG5TZWxlY3Rvci5wcm90b3R5cGUubm9kZSA9IGZ1bmN0aW9uICh0cmFuc2Zvcm0pIHtcbiAgcmV0dXJuIHRoaXMuc2VsZWN0KHRoaXMuZWxlbWVudCwgdHJhbnNmb3JtKVxufVxuXG5TZWxlY3Rvci5wcm90b3R5cGUubm9kZUxpc3QgPSBmdW5jdGlvbiAodHJhbnNmb3JtKSB7XG4gIHJldHVybiB0aGlzLnNlbGVjdEFsbCh0aGlzLmVsZW1lbnQsIHRyYW5zZm9ybSlcbn1cblxuU2VsZWN0b3IucHJvdG90eXBlLmNvbnN0cnVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIENvbnN0cnVjdG9yID0gdGhpcy5Db25zdHJ1Y3RvclxuICB2YXIgaW5zdGFudGlhdGUgPSB0aGlzLmluc3RhbnRpYXRlIHx8IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgcmV0dXJuIG5ldyBDb25zdHJ1Y3RvcihlbGVtZW50KVxuICB9XG4gIGlmICh0aGlzLm11bHRpcGxlKSB7XG4gICAgcmV0dXJuIHRoaXMubm9kZUxpc3QoZnVuY3Rpb24gKGVsZW1lbnRzKSB7XG4gICAgICByZXR1cm4gW10ubWFwLmNhbGwoZWxlbWVudHMsIGluc3RhbnRpYXRlKVxuICAgIH0pXG4gIH1cbiAgZWxzZSB7XG4gICAgcmV0dXJuIHRoaXMubm9kZShpbnN0YW50aWF0ZSlcbiAgfVxufVxuXG5TZWxlY3Rvci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBzdHJpbmcgPSBcIlwiXG4gIHZhciB2YWx1ZSA9IHRoaXMudmFsdWVcbiAgdmFyIGF0dHJpYnV0ZSA9IHRoaXMuYXR0cmlidXRlXG4gIHZhciBleHRyYSA9IHRoaXMuZXh0cmEgfHwgXCJcIlxuXG4gIHN3aXRjaCAoYXR0cmlidXRlKSB7XG4gICAgY2FzZSBcImlkXCI6XG4gICAgICAgIHN0cmluZyA9IFwiI1wiICsgdmFsdWVcbiAgICAgIGJyZWFrXG4gICAgY2FzZSBcImNsYXNzXCI6XG4gICAgICBzdHJpbmcgPSBcIi5cIiArIHZhbHVlXG4gICAgICBicmVha1xuICAgIGNhc2UgXCJcIjpcbiAgICAgIHN0cmluZyA9IHZhbHVlIHx8IFwiXCJcbiAgICAgIGJyZWFrXG4gICAgZGVmYXVsdDpcbiAgICAgIHZhbHVlID0gdmFsdWUgPT09IFwiXCIgfHwgdmFsdWUgPT09IHRydWUgfHwgdmFsdWUgPT09IGZhbHNlIHx8IHZhbHVlID09IG51bGxcbiAgICAgICAgPyBcIlwiXG4gICAgICAgIDogJ1wiJyArIHZhbHVlICsgJ1wiJ1xuICAgICAgdmFyIG9wZXJhdG9yID0gdmFsdWUgPyB0aGlzLm9wZXJhdG9yIHx8IFwiPVwiIDogXCJcIlxuICAgICAgc3RyaW5nID0gXCJbXCIgKyBhdHRyaWJ1dGUgKyBvcGVyYXRvciArIHZhbHVlICsgXCJdXCJcbiAgfVxuXG4gIHN0cmluZyArPSBleHRyYVxuXG4gIHJldHVybiBzdHJpbmdcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gRG9tQXR0cmlidXRlXG5cbmZ1bmN0aW9uIERvbUF0dHJpYnV0ZSAoKSB7fVxuXG5Eb21BdHRyaWJ1dGUucHJvdG90eXBlLmRlZmF1bHRQcmVmaXggPSBcImRhdGEtXCJcblxuRG9tQXR0cmlidXRlLnByb3RvdHlwZS5nZXRGcm9tQ29udGV4dCA9IGZ1bmN0aW9uKCBlbGVtZW50LCBuYW1lICl7XG4gIHJldHVybiBlbGVtZW50LmdldEF0dHJpYnV0ZShuYW1lKVxufVxuRG9tQXR0cmlidXRlLnByb3RvdHlwZS5zZXRPbkNvbnRleHQgPSBmdW5jdGlvbiggZWxlbWVudCwgbmFtZSwgdmFsdWUgKXtcbiAgcmV0dXJuIGVsZW1lbnQuc2V0QXR0cmlidXRlKG5hbWUsIHZhbHVlKVxufVxuRG9tQXR0cmlidXRlLnByb3RvdHlwZS5oYXNPbkNvbnRleHQgPSBmdW5jdGlvbiggZWxlbWVudCwgbmFtZSApe1xuICByZXR1cm4gZWxlbWVudC5oYXNBdHRyaWJ1dGUobmFtZSlcbn1cbkRvbUF0dHJpYnV0ZS5wcm90b3R5cGUucmVtb3ZlRnJvbUNvbnRleHQgPSBmdW5jdGlvbiggZWxlbWVudCwgbmFtZSApe1xuICByZXR1cm4gZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUobmFtZSlcbn1cblxuIiwidmFyIGluaGVyaXQgPSByZXF1aXJlKFwibWF0Y2hib3gtZmFjdG9yeS9pbmhlcml0XCIpXG52YXIgaW5jbHVkZSA9IHJlcXVpcmUoXCJtYXRjaGJveC1mYWN0b3J5L2luY2x1ZGVcIilcbnZhciBCb29sZWFuQXR0cmlidXRlID0gcmVxdWlyZShcIm1hdGNoYm94LWF0dHJpYnV0ZXMvQm9vbGVhblwiKVxudmFyIERvbUF0dHJpYnV0ZSA9IHJlcXVpcmUoXCIuL0RvbUF0dHJpYnV0ZVwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IERvbUJvb2xlYW5cblxuZnVuY3Rpb24gRG9tQm9vbGVhbiAoZGVmKSB7XG4gIEJvb2xlYW5BdHRyaWJ1dGUuY2FsbCh0aGlzLCBkZWYpXG4gIGlmICh0eXBlb2YgdGhpcy5kZWZhdWx0ICE9IFwiYm9vbGVhblwiKSB7XG4gICAgdGhpcy5kZWZhdWx0ID0gZmFsc2VcbiAgfVxufVxuaW5oZXJpdChEb21Cb29sZWFuLCBCb29sZWFuQXR0cmlidXRlKVxuaW5jbHVkZShEb21Cb29sZWFuLCBEb21BdHRyaWJ1dGUpXG5cbkRvbUJvb2xlYW4ucHJvdG90eXBlLnNob3VsZFJlbW92ZSA9IGZ1bmN0aW9uIChwYXJzZWRWYWx1ZSkge1xuICByZXR1cm4gcGFyc2VkVmFsdWUgPT0gbnVsbCB8fCBwYXJzZWRWYWx1ZSA9PT0gZmFsc2Vcbn1cblxuRG9tQm9vbGVhbi5wcm90b3R5cGUucGFyc2VWYWx1ZSA9IGZ1bmN0aW9uIChzZXJpYWxpemVkVmFsdWUpIHtcbiAgcmV0dXJuIHNlcmlhbGl6ZWRWYWx1ZSAhPSBudWxsXG59XG5cbkRvbUJvb2xlYW4ucHJvdG90eXBlLnNlcmlhbGl6ZVZhbHVlID0gZnVuY3Rpb24gKHBhcnNlVmFsdWUpIHtcbiAgcmV0dXJuIHBhcnNlVmFsdWUgPyBcIlwiIDogbnVsbFxufVxuIiwidmFyIGluaGVyaXQgPSByZXF1aXJlKFwibWF0Y2hib3gtZmFjdG9yeS9pbmhlcml0XCIpXG52YXIgaW5jbHVkZSA9IHJlcXVpcmUoXCJtYXRjaGJveC1mYWN0b3J5L2luY2x1ZGVcIilcbnZhciBGbG9hdEF0dHJpYnV0ZSA9IHJlcXVpcmUoXCJtYXRjaGJveC1hdHRyaWJ1dGVzL0Zsb2F0XCIpXG52YXIgRG9tQXR0cmlidXRlID0gcmVxdWlyZShcIi4vRG9tQXR0cmlidXRlXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gRG9tRmxvYXRcblxuZnVuY3Rpb24gRG9tRmxvYXQgKGRlZikge1xuICBGbG9hdEF0dHJpYnV0ZS5jYWxsKHRoaXMsIGRlZilcbn1cbmluaGVyaXQoRG9tRmxvYXQsIEZsb2F0QXR0cmlidXRlKVxuaW5jbHVkZShEb21GbG9hdCwgRG9tQXR0cmlidXRlKVxuIiwidmFyIGluaGVyaXQgPSByZXF1aXJlKFwibWF0Y2hib3gtZmFjdG9yeS9pbmhlcml0XCIpXG52YXIgaW5jbHVkZSA9IHJlcXVpcmUoXCJtYXRjaGJveC1mYWN0b3J5L2luY2x1ZGVcIilcbnZhciBKU09OQXR0cmlidXRlID0gcmVxdWlyZShcIm1hdGNoYm94LWF0dHJpYnV0ZXMvSlNPTlwiKVxudmFyIERvbUF0dHJpYnV0ZSA9IHJlcXVpcmUoXCIuL0RvbUF0dHJpYnV0ZVwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IERvbUpTT05cblxuZnVuY3Rpb24gRG9tSlNPTiAoZGVmKSB7XG4gIEpTT05BdHRyaWJ1dGUuY2FsbCh0aGlzLCBkZWYpXG59XG5pbmhlcml0KERvbUpTT04sIEpTT05BdHRyaWJ1dGUpXG5pbmNsdWRlKERvbUpTT04sIERvbUF0dHJpYnV0ZSlcbiIsInZhciBpbmhlcml0ID0gcmVxdWlyZShcIm1hdGNoYm94LWZhY3RvcnkvaW5oZXJpdFwiKVxudmFyIGluY2x1ZGUgPSByZXF1aXJlKFwibWF0Y2hib3gtZmFjdG9yeS9pbmNsdWRlXCIpXG52YXIgTnVtYmVyQXR0cmlidXRlID0gcmVxdWlyZShcIm1hdGNoYm94LWF0dHJpYnV0ZXMvTnVtYmVyXCIpXG52YXIgRG9tQXR0cmlidXRlID0gcmVxdWlyZShcIi4vRG9tQXR0cmlidXRlXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gRG9tTnVtYmVyXG5cbmZ1bmN0aW9uIERvbU51bWJlciAoZGVmKSB7XG4gIE51bWJlckF0dHJpYnV0ZS5jYWxsKHRoaXMsIGRlZilcbn1cbmluaGVyaXQoRG9tTnVtYmVyLCBOdW1iZXJBdHRyaWJ1dGUpXG5pbmNsdWRlKERvbU51bWJlciwgRG9tQXR0cmlidXRlKVxuIiwidmFyIGluaGVyaXQgPSByZXF1aXJlKFwibWF0Y2hib3gtZmFjdG9yeS9pbmhlcml0XCIpXG52YXIgaW5jbHVkZSA9IHJlcXVpcmUoXCJtYXRjaGJveC1mYWN0b3J5L2luY2x1ZGVcIilcbnZhciBTdHJpbmdBdHRyaWJ1dGUgPSByZXF1aXJlKFwibWF0Y2hib3gtYXR0cmlidXRlcy9TdHJpbmdcIilcbnZhciBEb21BdHRyaWJ1dGUgPSByZXF1aXJlKFwiLi9Eb21BdHRyaWJ1dGVcIilcblxubW9kdWxlLmV4cG9ydHMgPSBEb21TdHJpbmdcblxuZnVuY3Rpb24gRG9tU3RyaW5nIChkZWYpIHtcbiAgU3RyaW5nQXR0cmlidXRlLmNhbGwodGhpcywgZGVmKVxufVxuaW5oZXJpdChEb21TdHJpbmcsIFN0cmluZ0F0dHJpYnV0ZSlcbmluY2x1ZGUoRG9tU3RyaW5nLCBEb21BdHRyaWJ1dGUpXG4iLCJ2YXIgQXR0cmlidXRlID0gcmVxdWlyZShcIm1hdGNoYm94LWF0dHJpYnV0ZXMvQXR0cmlidXRlXCIpXG52YXIgRG9tU3RyaW5nID0gcmVxdWlyZShcIi4vRG9tU3RyaW5nXCIpXG52YXIgRG9tQm9vbGVhbiA9IHJlcXVpcmUoXCIuL0RvbUJvb2xlYW5cIilcbnZhciBEb21OdW1iZXIgPSByZXF1aXJlKFwiLi9Eb21OdW1iZXJcIilcbnZhciBEb21GbG9hdCA9IHJlcXVpcmUoXCIuL0RvbUZsb2F0XCIpXG52YXIgRG9tSlNPTiA9IHJlcXVpcmUoXCIuL0RvbUpTT05cIilcblxudmFyIGF0dHJpYnV0ZXMgPSBtb2R1bGUuZXhwb3J0cyA9IHt9XG5cbmF0dHJpYnV0ZXMuU3RyaW5nID0gRG9tU3RyaW5nXG5hdHRyaWJ1dGVzLkJvb2xlYW4gPSBEb21Cb29sZWFuXG5hdHRyaWJ1dGVzLk51bWJlciA9IERvbU51bWJlclxuYXR0cmlidXRlcy5GbG9hdCA9IERvbUZsb2F0XG5hdHRyaWJ1dGVzLkpTT04gPSBEb21KU09OXG5cbmF0dHJpYnV0ZXMuY3JlYXRlID0gZnVuY3Rpb24gKGRlZikge1xuICBzd2l0Y2ggKEF0dHJpYnV0ZS5nZXRUeXBlKGRlZikpIHtcbiAgICBjYXNlIFwic3RyaW5nXCI6XG4gICAgICByZXR1cm4gbmV3IERvbVN0cmluZyhkZWYpXG4gICAgY2FzZSBcImJvb2xlYW5cIjpcbiAgICAgIHJldHVybiBuZXcgRG9tQm9vbGVhbihkZWYpXG4gICAgY2FzZSBcIm51bWJlclwiOlxuICAgICAgcmV0dXJuIG5ldyBEb21OdW1iZXIoZGVmKVxuICAgIGNhc2UgXCJmbG9hdFwiOlxuICAgICAgcmV0dXJuIG5ldyBEb21GbG9hdChkZWYpXG4gICAgY2FzZSBcImpzb25cIjpcbiAgICAgIHJldHVybiBuZXcgRG9tSlNPTihkZWYpXG4gIH1cbn1cbiIsInZhciBTZWxlY3RvciA9IHJlcXVpcmUoXCIuLi9TZWxlY3RvclwiKVxuXG4vKipcbiAqIFJlZ2lzdGVycyBhbiBldmVudCBsaXN0ZW5lciBvbiBhbiBlbGVtZW50XG4gKiBhbmQgcmV0dXJucyBhIGRlbGVnYXRvci5cbiAqIEEgZGVsZWdhdGVkIGV2ZW50IHJ1bnMgbWF0Y2hlcyB0byBmaW5kIGFuIGV2ZW50IHRhcmdldCxcbiAqIHRoZW4gZXhlY3V0ZXMgdGhlIGhhbmRsZXIgcGFpcmVkIHdpdGggdGhlIG1hdGNoZXIuXG4gKiBNYXRjaGVycyBjYW4gY2hlY2sgaWYgYW4gZXZlbnQgdGFyZ2V0IG1hdGNoZXMgYSBnaXZlbiBzZWxlY3RvcixcbiAqIG9yIHNlZSBpZiBhbiBvZiBpdHMgcGFyZW50cyBkby5cbiAqICovXG5tb2R1bGUuZXhwb3J0cyA9IGRlbGVnYXRlXG5cbmZ1bmN0aW9uIGRlbGVnYXRlKCBvcHRpb25zICl7XG4gIHZhciBlbGVtZW50ID0gb3B0aW9ucy5lbGVtZW50XG4gICAgLCBldmVudCA9IG9wdGlvbnMuZXZlbnRcbiAgICAsIGNhcHR1cmUgPSAhIW9wdGlvbnMuY2FwdHVyZSB8fCBmYWxzZVxuICAgICwgY29udGV4dCA9IG9wdGlvbnMuY29udGV4dCB8fCBlbGVtZW50XG4gICAgLCB0cmFuc2Zvcm0gPSBvcHRpb25zLnRyYW5zZm9ybSB8fCBudWxsXG5cbiAgaWYoICFlbGVtZW50ICl7XG4gICAgY29uc29sZS5sb2coXCJDYW4ndCBkZWxlZ2F0ZSB1bmRlZmluZWQgZWxlbWVudFwiKVxuICAgIHJldHVybiBudWxsXG4gIH1cbiAgaWYoICFldmVudCApe1xuICAgIGNvbnNvbGUubG9nKFwiQ2FuJ3QgZGVsZWdhdGUgdW5kZWZpbmVkIGV2ZW50XCIpXG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIHZhciBoYW5kbGVyID0gY3JlYXRlSGFuZGxlcihjb250ZXh0LCB0cmFuc2Zvcm0pXG4gIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgaGFuZGxlciwgY2FwdHVyZSlcblxuICByZXR1cm4gaGFuZGxlclxufVxuXG4vKipcbiAqIFJldHVybnMgYSBkZWxlZ2F0b3IgdGhhdCBjYW4gYmUgdXNlZCBhcyBhbiBldmVudCBsaXN0ZW5lci5cbiAqIFRoZSBkZWxlZ2F0b3IgaGFzIHN0YXRpYyBtZXRob2RzIHdoaWNoIGNhbiBiZSB1c2VkIHRvIHJlZ2lzdGVyIGhhbmRsZXJzLlxuICogKi9cbmZ1bmN0aW9uIGNyZWF0ZUhhbmRsZXIoIGNvbnRleHQsIHRyYW5zZm9ybSApe1xuICB2YXIgbWF0Y2hlcnMgPSBbXVxuXG4gIGZ1bmN0aW9uIGRlbGVnYXRlZEhhbmRsZXIoIGUgKXtcbiAgICB2YXIgbCA9IG1hdGNoZXJzLmxlbmd0aFxuICAgIGlmKCAhbCApe1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG5cbiAgICB2YXIgZWwgPSB0aGlzXG4gICAgICAgICwgaSA9IC0xXG4gICAgICAgICwgaGFuZGxlclxuICAgICAgICAsIHNlbGVjdG9yXG4gICAgICAgICwgZGVsZWdhdGVFbGVtZW50XG4gICAgICAgICwgc3RvcFByb3BhZ2F0aW9uXG4gICAgICAgICwgYXJnc1xuXG4gICAgd2hpbGUoICsraSA8IGwgKXtcbiAgICAgIGFyZ3MgPSBtYXRjaGVyc1tpXVxuICAgICAgaGFuZGxlciA9IGFyZ3NbMF1cbiAgICAgIHNlbGVjdG9yID0gYXJnc1sxXVxuXG4gICAgICBkZWxlZ2F0ZUVsZW1lbnQgPSBtYXRjaENhcHR1cmVQYXRoKHNlbGVjdG9yLCBlbCwgZSwgdHJhbnNmb3JtLCBjb250ZXh0KVxuICAgICAgaWYoIGRlbGVnYXRlRWxlbWVudCAmJiBkZWxlZ2F0ZUVsZW1lbnQubGVuZ3RoICkge1xuICAgICAgICBzdG9wUHJvcGFnYXRpb24gPSBmYWxzZSA9PT0gaGFuZGxlci5hcHBseShjb250ZXh0LCBbZV0uY29uY2F0KGRlbGVnYXRlRWxlbWVudCkpXG4gICAgICAgIGlmKCBzdG9wUHJvcGFnYXRpb24gKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyBhIGhhbmRsZXIgd2l0aCBhIHRhcmdldCBmaW5kZXIgbG9naWNcbiAgICogKi9cbiAgZGVsZWdhdGVkSGFuZGxlci5tYXRjaCA9IGZ1bmN0aW9uKCBzZWxlY3RvciwgaGFuZGxlciApe1xuICAgIG1hdGNoZXJzLnB1c2goW2hhbmRsZXIsIHNlbGVjdG9yXSlcbiAgICByZXR1cm4gZGVsZWdhdGVkSGFuZGxlclxuICB9XG5cbiAgcmV0dXJuIGRlbGVnYXRlZEhhbmRsZXJcbn1cblxuZnVuY3Rpb24gbWF0Y2hDYXB0dXJlUGF0aCggc2VsZWN0b3IsIGVsLCBlLCB0cmFuc2Zvcm0sIGNvbnRleHQgKXtcbiAgdmFyIGRlbGVnYXRlRWxlbWVudHMgPSBbXVxuICB2YXIgZGVsZWdhdGVFbGVtZW50ID0gbnVsbFxuICBpZiggQXJyYXkuaXNBcnJheShzZWxlY3RvcikgKXtcbiAgICB2YXIgaSA9IC0xXG4gICAgdmFyIGwgPSBzZWxlY3Rvci5sZW5ndGhcbiAgICB3aGlsZSggKytpIDwgbCApe1xuICAgICAgZGVsZWdhdGVFbGVtZW50ID0gZmluZFBhcmVudChzZWxlY3RvcltpXSwgZWwsIGUpXG4gICAgICBpZiggIWRlbGVnYXRlRWxlbWVudCApIHJldHVybiBudWxsXG4gICAgICBpZiAodHlwZW9mIHRyYW5zZm9ybSA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgZGVsZWdhdGVFbGVtZW50ID0gdHJhbnNmb3JtKGNvbnRleHQsIHNlbGVjdG9yLCBkZWxlZ2F0ZUVsZW1lbnQpXG4gICAgICB9XG4gICAgICBkZWxlZ2F0ZUVsZW1lbnRzLnB1c2goZGVsZWdhdGVFbGVtZW50KVxuICAgIH1cbiAgfVxuICBlbHNlIHtcbiAgICBkZWxlZ2F0ZUVsZW1lbnQgPSBmaW5kUGFyZW50KHNlbGVjdG9yLCBlbCwgZSlcbiAgICBpZiggIWRlbGVnYXRlRWxlbWVudCApIHJldHVybiBudWxsXG4gICAgaWYgKHR5cGVvZiB0cmFuc2Zvcm0gPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBkZWxlZ2F0ZUVsZW1lbnQgPSB0cmFuc2Zvcm0oY29udGV4dCwgc2VsZWN0b3IsIGRlbGVnYXRlRWxlbWVudClcbiAgICB9XG4gICAgZGVsZWdhdGVFbGVtZW50cy5wdXNoKGRlbGVnYXRlRWxlbWVudClcbiAgfVxuICByZXR1cm4gZGVsZWdhdGVFbGVtZW50c1xufVxuXG4vKipcbiAqIENoZWNrIGlmIHRoZSB0YXJnZXQgb3IgYW55IG9mIGl0cyBwYXJlbnQgbWF0Y2hlcyBhIHNlbGVjdG9yXG4gKiAqL1xuZnVuY3Rpb24gZmluZFBhcmVudCggc2VsZWN0b3IsIGVsLCBlICl7XG4gIHZhciB0YXJnZXQgPSBlLnRhcmdldFxuICBpZiAoc2VsZWN0b3IgaW5zdGFuY2VvZiBTZWxlY3Rvcikge1xuICAgIHNlbGVjdG9yID0gc2VsZWN0b3IudG9TdHJpbmcoKVxuICB9XG4gIHN3aXRjaCggdHlwZW9mIHNlbGVjdG9yICl7XG4gICAgY2FzZSBcInN0cmluZ1wiOlxuICAgICAgd2hpbGUoIHRhcmdldCAmJiB0YXJnZXQgIT0gZWwgKXtcbiAgICAgICAgaWYoIHRhcmdldC5tYXRjaGVzICYmIHRhcmdldC5tYXRjaGVzKHNlbGVjdG9yKSApIHJldHVybiB0YXJnZXRcbiAgICAgICAgdGFyZ2V0ID0gdGFyZ2V0LnBhcmVudE5vZGVcbiAgICAgIH1cbiAgICAgIGJyZWFrXG4gICAgY2FzZSBcImZ1bmN0aW9uXCI6XG4gICAgICB3aGlsZSggdGFyZ2V0ICYmIHRhcmdldCAhPSBlbCApe1xuICAgICAgICBpZiggc2VsZWN0b3IuY2FsbChlbCwgdGFyZ2V0KSApIHJldHVybiB0YXJnZXRcbiAgICAgICAgdGFyZ2V0ID0gdGFyZ2V0LnBhcmVudE5vZGVcbiAgICAgIH1cbiAgICAgIGJyZWFrXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBudWxsXG4gIH1cbiAgcmV0dXJuIG51bGxcbn1cbiIsInZhciBldmVudCA9IG1vZHVsZS5leHBvcnRzID0ge31cblxuZXZlbnQuZGVsZWdhdGUgPSByZXF1aXJlKFwiLi9kZWxlZ2F0ZVwiKVxuZXZlbnQubWlzc2NsaWNrID0gcmVxdWlyZShcIi4vbWlzc2NsaWNrXCIpXG4iLCJtb2R1bGUuZXhwb3J0cyA9IG1pc3NjbGlja1xuXG52YXIgZWxlbWVudHMgPSBbXVxudmFyIGxpc3RlbmVycyA9IFtdXG5cbmZ1bmN0aW9uIG1pc3NjbGljayAoZWxlbWVudCwgY2IpIHtcbiAgaWYgKGlzUmVnaXN0ZXJlZChlbGVtZW50KSkge1xuICAgIHJldHVyblxuICB9XG5cbiAgcmVnaXN0ZXIoZWxlbWVudCwgY2IpXG59XG5cbmZ1bmN0aW9uIGlzUmVnaXN0ZXJlZCAoZWxlbWVudCkge1xuICByZXR1cm4gISF+ZWxlbWVudHMuaW5kZXhPZihlbGVtZW50KVxufVxuXG5mdW5jdGlvbiByZWdpc3RlciAoZWxlbWVudCwgY2IpIHtcbiAgZnVuY3Rpb24gbGlzdGVuZXIgKGUpIHtcbiAgICBpZiAoIWlzUmVnaXN0ZXJlZChlbGVtZW50KSkge1xuICAgICAgcmVtb3ZlTGlzdGVuZXIoKVxuICAgIH1cbiAgICBlbHNlIGlmICghZWxlbWVudC5jb250YWlucyhlLnRhcmdldCkgJiYgZS50YXJnZXQgIT0gZWxlbWVudCkge1xuICAgICAgcmVtb3ZlTGlzdGVuZXIoKVxuICAgICAgY2IgJiYgY2IoZSlcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lciAoKSB7XG4gICAgZG9jdW1lbnQuYm9keS5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgbGlzdGVuZXIsIGZhbHNlKVxuICAgIGlmIChpc1JlZ2lzdGVyZWQoZWxlbWVudCkpIHtcbiAgICAgIGVsZW1lbnRzLnNwbGljZShlbGVtZW50cy5pbmRleE9mKGVsZW1lbnQpLCAxKVxuICAgICAgbGlzdGVuZXJzLnNwbGljZShsaXN0ZW5lcnMuaW5kZXhPZihyZW1vdmVMaXN0ZW5lciksIDEpXG4gICAgfVxuICB9XG5cbiAgZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgbGlzdGVuZXIsIGZhbHNlKVxuXG4gIGVsZW1lbnRzLnB1c2goZWxlbWVudClcbiAgbGlzdGVuZXJzLnB1c2gocmVtb3ZlTGlzdGVuZXIpXG59XG5cbm1pc3NjbGljay5yZW1vdmUgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICBpZiAoaXNSZWdpc3RlcmVkKGVsZW1lbnQpKSB7XG4gICAgbGlzdGVuZXJzW2VsZW1lbnRzLmluZGV4T2YoZWxlbWVudCldKClcbiAgfVxufVxuIiwidmFyIGRvbSA9IG1vZHVsZS5leHBvcnRzID0ge31cblxuZG9tLmF0dHJpYnV0ZXMgPSByZXF1aXJlKFwiLi9hdHRyaWJ1dGVzXCIpXG5kb20uZXZlbnQgPSByZXF1aXJlKFwiLi9ldmVudFwiKVxuZG9tLkZyYWdtZW50ID0gcmVxdWlyZShcIi4vRnJhZ21lbnRcIilcbmRvbS5TZWxlY3RvciA9IHJlcXVpcmUoXCIuL1NlbGVjdG9yXCIpXG4iLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcblx0dmFyIHN0ciA9IFtdLm1hcC5jYWxsKGFyZ3VtZW50cywgZnVuY3Rpb24gKHN0cikge1xuXHRcdHJldHVybiBzdHIudHJpbSgpO1xuXHR9KS5maWx0ZXIoZnVuY3Rpb24gKHN0cikge1xuXHRcdHJldHVybiBzdHIubGVuZ3RoO1xuXHR9KS5qb2luKCctJyk7XG5cblx0aWYgKCFzdHIubGVuZ3RoKSB7XG5cdFx0cmV0dXJuICcnO1xuXHR9XG5cblx0aWYgKHN0ci5sZW5ndGggPT09IDEgfHwgISgvW18uXFwtIF0rLykudGVzdChzdHIpICkge1xuXHRcdGlmIChzdHJbMF0gPT09IHN0clswXS50b0xvd2VyQ2FzZSgpICYmIHN0ci5zbGljZSgxKSAhPT0gc3RyLnNsaWNlKDEpLnRvTG93ZXJDYXNlKCkpIHtcblx0XHRcdHJldHVybiBzdHI7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHN0ci50b0xvd2VyQ2FzZSgpO1xuXHR9XG5cblx0cmV0dXJuIHN0clxuXHQucmVwbGFjZSgvXltfLlxcLSBdKy8sICcnKVxuXHQudG9Mb3dlckNhc2UoKVxuXHQucmVwbGFjZSgvW18uXFwtIF0rKFxcd3wkKS9nLCBmdW5jdGlvbiAobSwgcDEpIHtcblx0XHRyZXR1cm4gcDEudG9VcHBlckNhc2UoKTtcblx0fSk7XG59O1xuIiwidmFyIGNhbWVsY2FzZSA9IHJlcXVpcmUoXCJjYW1lbGNhc2VcIilcblxubW9kdWxlLmV4cG9ydHMgPSBBdHRyaWJ1dGVcblxuZnVuY3Rpb24gQXR0cmlidXRlIChkZWYpIHtcbiAgaWYgKHR5cGVvZiBkZWYgPT0gXCJ1bmRlZmluZWRcIiB8fCBkZWYgPT0gbnVsbCkge1xuICAgIGRlZiA9IHt9XG4gIH1cbiAgdGhpcy50eXBlID0gZGVmLnR5cGUgfHwgdGhpcy5kZWZhdWx0VHlwZVxuICB0aGlzLm5hbWUgPSBkZWYubmFtZSB8fCBcIlwiXG4gIHRoaXMucHJlZml4ID0gZGVmLnByZWZpeCB8fCB0aGlzLmRlZmF1bHRQcmVmaXhcbiAgdGhpcy5jYW1lbGNhc2UgPSBkZWYuY2FtZWxjYXNlID09IG51bGwgPyB0aGlzLmRlZmF1bHRDYW1lbGNhc2UgOiAhIWRlZi5jYW1lbGNhc2VcbiAgdGhpcy5wcm9wZXJ0eSA9IGRlZi5wcm9wZXJ0eSB8fCB0aGlzLm5hbWVcbiAgdGhpcy5vbmNoYW5nZSA9IGRlZi5vbmNoYW5nZSB8fCBudWxsXG4gIHRoaXMuZGVmYXVsdCA9IG51bGxcblxuICBpZiAoQXR0cmlidXRlLmlzUHJpbWl0aXZlKGRlZikpIHtcbiAgICB0aGlzLmRlZmF1bHQgPSBkZWZcbiAgfVxuICBlbHNlIGlmIChkZWYgIT0gbnVsbCAmJiBkZWYuaGFzT3duUHJvcGVydHkoXCJkZWZhdWx0XCIpKSB7XG4gICAgdGhpcy5kZWZhdWx0ID0gZGVmLmRlZmF1bHRcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIHR5cGUgZnJvbSBhIGRlZmF1bHQgdmFsdWUsIG9yIGEgZGVmaW5pdGlvbiBvYmplY3QuXG4gKiBOb3RlOiB0aGF0IGl0IGZhaWxzIHRvIGRldGVjdCB3aG9sZSBudW1iZXIgZmxvYXRzIGFzIGZsb2F0LlxuICogKi9cbkF0dHJpYnV0ZS5nZXRUeXBlID0gZnVuY3Rpb24gKGRlZikge1xuICBpZiAodHlwZW9mIGRlZiA9PSBcInVuZGVmaW5lZFwiIHx8IGRlZiA9PSBudWxsKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIHZhciB2YWx1ZVxuICBpZiAoQXR0cmlidXRlLmlzUHJpbWl0aXZlKGRlZikpIHtcbiAgICB2YWx1ZSA9IGRlZlxuICB9XG4gIGVsc2UgaWYgKHR5cGVvZiBkZWYudHlwZSA9PSBcInN0cmluZ1wiKSB7XG4gICAgcmV0dXJuIGRlZi50eXBlXG4gIH1cbiAgZWxzZSBpZiAoZGVmLmhhc093blByb3BlcnR5KFwiZGVmYXVsdFwiKSkge1xuICAgIHZhbHVlID0gZGVmLmRlZmF1bHRcbiAgICBpZiAodHlwZW9mIHZhbHVlID09IFwib2JqZWN0XCIpIHtcbiAgICAgIHJldHVybiBcImpzb25cIlxuICAgIH1cbiAgfVxuXG4gIHN3aXRjaCAodHlwZW9mIHZhbHVlKSB7XG4gICAgY2FzZSBcIm51bWJlclwiOlxuICAgICAgLy8gbm90ZTogaXQgZmFpbHMgZm9yIDEuMFxuICAgICAgaWYgKHZhbHVlID09PSArdmFsdWUgJiYgdmFsdWUgIT09ICh2YWx1ZSB8IDApKSB7XG4gICAgICAgIHJldHVybiBcImZsb2F0XCJcbiAgICAgIH1cbiAgfVxuICByZXR1cm4gdHlwZW9mIHZhbHVlXG59XG5cbi8qKlxuICogQ2hlY2sgaWYgdGhpcyB2YWx1ZSBpcyBwcmltaXRpdmVcbiAqICovXG5BdHRyaWJ1dGUuaXNQcmltaXRpdmUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgc3dpdGNoKCB0eXBlb2YgdmFsdWUgKSB7XG4gICAgY2FzZSBcImJvb2xlYW5cIjpcbiAgICBjYXNlIFwibnVtYmVyXCI6XG4gICAgY2FzZSBcInN0cmluZ1wiOlxuICAgICAgcmV0dXJuIHRydWVcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuQXR0cmlidXRlLnByb3RvdHlwZS5kZWZhdWx0VHlwZSA9IFwic3RyaW5nXCJcbkF0dHJpYnV0ZS5wcm90b3R5cGUuZGVmYXVsdFByZWZpeCA9IFwiXCJcbi8qKiBDb250cm9scyBpZiB0aGUgcHJvcGVydHkgYWNjZXNzb3IgaXMgY2FtZWxpemVkLiAqL1xuQXR0cmlidXRlLnByb3RvdHlwZS5kZWZhdWx0Q2FtZWxjYXNlID0gdHJ1ZVxuXG4vKipcbiAqIFJldHVybnMgdGhlIHByZWZpeGVkIG5hbWUgZm9yIHRoaXMgYXR0cmlidXRlXG4gKiAqL1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KEF0dHJpYnV0ZS5wcm90b3R5cGUsIFwicHJlZml4ZWROYW1lXCIsIHtcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucHJlZml4ICsgdGhpcy5uYW1lXG4gIH1cbn0pXG5cbi8qKlxuICogQ2FsbGVkIHdoZW4gcmV0cmlldmluZyBhIHZhbHVlIGZyb20gYSBjb250ZXh0LlxuICogSXQgc2hvdWxkIHJldHVybiBhIG5vcm1hbGl6ZWQgZm9ybSBpZiBhIHNlcmlhbGl6ZWQgdmFsdWUuXG4gKiAqL1xuQXR0cmlidXRlLnByb3RvdHlwZS5wYXJzZVZhbHVlID0gZnVuY3Rpb24gKHNlcmlhbGl6ZWRWYWx1ZSkge1xuICByZXR1cm4gc2VyaWFsaXplZFZhbHVlXG59XG4vKipcbiAqIENhbGxlZCB3aGVuIHNldHRpbmcgYSB2YWx1ZSBvbiBhIGNvbnRleHQuXG4gKiBJdCBzaG91bGQgcmV0dXJuIGEgc2VyaWFsaXplZCByZXByZXNlbnRhdGlvbiBvZiBhIHZhbHVlLlxuICogKi9cbkF0dHJpYnV0ZS5wcm90b3R5cGUuc2VyaWFsaXplVmFsdWUgPSBmdW5jdGlvbiAocGFyc2VkVmFsdWUpIHtcbiAgcmV0dXJuIHBhcnNlZFZhbHVlXG59XG4vKipcbiAqIENoZWNrcyBpZiBhIHZhbHVlIHNob3VsZCB0cmlnZ2VyIGFuIGF0dHJpYnV0ZSByZW1vdmFsLlxuICogKi9cbkF0dHJpYnV0ZS5wcm90b3R5cGUuc2hvdWxkUmVtb3ZlID0gZnVuY3Rpb24oIHBhcnNlZFZhbHVlICl7XG4gIHJldHVybiBwYXJzZWRWYWx1ZSA9PSBudWxsXG59XG5cbi8qKlxuICogUmV0dXJucyBhIGNvbnRleHQgZm9yIHRoZSBhdHRyaWJ1dGUgbWFuYWdlciBtZXRob2RzXG4gKiAqL1xuQXR0cmlidXRlLnByb3RvdHlwZS5nZXRDb250ZXh0ID0gZnVuY3Rpb24gKGNvbnRleHQpIHtcbiAgcmV0dXJuIGNvbnRleHRcbn1cblxuLyoqXG4gKiBBc3NpZ24gYSBwcm9wZXJ0eSBnZXR0ZXItc2V0dGVyIHRvIGFuIG9iamVjdFxuICogd2hpY2ggd2lsbCBwcm94eSB0aGUgYXR0cmlidXRlIGRlZmluaXRpb24ncyBgZ2V0YCBhbmQgYHNldGAgbWV0aG9kcy5cbiAqICovXG5BdHRyaWJ1dGUucHJvdG90eXBlLmRlZmluZVByb3BlcnR5ID0gZnVuY3Rpb24gKG9iaiwgcHJvcGVydHlOYW1lLCBnZXRDb250ZXh0KSB7XG4gIHZhciBhdHRyaWJ1dGUgPSB0aGlzXG4gIHByb3BlcnR5TmFtZSA9IHRoaXMuY2FtZWxjYXNlID8gY2FtZWxjYXNlKHByb3BlcnR5TmFtZSkgOiBwcm9wZXJ0eU5hbWVcbiAgZ2V0Q29udGV4dCA9IGdldENvbnRleHQgfHwgYXR0cmlidXRlLmdldENvbnRleHRcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBwcm9wZXJ0eU5hbWUsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBjb250ZXh0ID0gZ2V0Q29udGV4dCh0aGlzKSB8fCB0aGlzXG4gICAgICByZXR1cm4gYXR0cmlidXRlLmdldChjb250ZXh0KVxuICAgIH0sXG4gICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgIHZhciBjb250ZXh0ID0gZ2V0Q29udGV4dCh0aGlzKSB8fCB0aGlzXG4gICAgICBhdHRyaWJ1dGUuc2V0KGNvbnRleHQsIHZhbHVlLCB0cnVlKVxuICAgIH1cbiAgfSlcbn1cblxuLyoqXG4gKiBJdCBzaG91bGQgcmV0dXJuIGEgc2VyaWFsaXplZCB2YWx1ZSBmcm9tIGEgY29udGV4dC5cbiAqICovXG5BdHRyaWJ1dGUucHJvdG90eXBlLmdldEZyb21Db250ZXh0ID0gZnVuY3Rpb24gKGNvbnRleHQsIHByZWZpeGVkTmFtZSkge1xuICByZXR1cm4gY29udGV4dFtwcmVmaXhlZE5hbWVdXG59XG4vKipcbiAqIEl0IHNob3VsZCBzZXQgYSBzZXJpYWxpemVkIHZhbHVlIG9uIGEgY29udGV4dC5cbiAqICovXG5BdHRyaWJ1dGUucHJvdG90eXBlLnNldE9uQ29udGV4dCA9IGZ1bmN0aW9uIChjb250ZXh0LCBwcmVmaXhlZE5hbWUsIHNlcmlhbGl6ZWRWYWx1ZSkge1xuICBjb250ZXh0W3ByZWZpeGVkTmFtZV0gPSBzZXJpYWxpemVkVmFsdWVcbn1cbi8qKlxuICogSXQgc2hvdWxkIHJldHVybiB3aGV0aGVyIG9yIG5vdCBhbiBhdHRyaWJ1dGUgZXhpc3RzIG9uIGEgY29udGV4dC5cbiAqICovXG5BdHRyaWJ1dGUucHJvdG90eXBlLmhhc09uQ29udGV4dCA9IGZ1bmN0aW9uIChjb250ZXh0LCBwcmVmaXhlZE5hbWUpIHtcbiAgcmV0dXJuIGNvbnRleHQuaGFzT3duUHJvcGVydHkocHJlZml4ZWROYW1lKVxufVxuLyoqXG4gKiBJdCBzaG91bGQgcmVtb3ZlIGFuIGF0dHJpYnV0ZSB2YWx1ZSBmcm9tIGEgY29udGV4dC5cbiAqICovXG5BdHRyaWJ1dGUucHJvdG90eXBlLnJlbW92ZUZyb21Db250ZXh0ID0gZnVuY3Rpb24gKGNvbnRleHQsIHByZWZpeGVkTmFtZSkge1xuICByZXR1cm4gZGVsZXRlIGNvbnRleHRbcHJlZml4ZWROYW1lXVxufVxuXG4vKipcbiAqIFJldHVybnMgYSBwYXJzZWQgdmFsdWUgZnJvbSB0aGUgY29udGV4dCBpZiBpdCBleGlzdHMsXG4gKiBvdGhlcndpc2UgdGhlIGRlZmF1bHQgdmFsdWUuXG4gKiAqL1xuQXR0cmlidXRlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiggY29udGV4dCApe1xuICBpZiAodGhpcy5oYXNPbkNvbnRleHQoY29udGV4dCwgdGhpcy5wcmVmaXhlZE5hbWUpKSB7XG4gICAgcmV0dXJuIHRoaXMucGFyc2VWYWx1ZSh0aGlzLmdldEZyb21Db250ZXh0KGNvbnRleHQsIHRoaXMucHJlZml4ZWROYW1lKSlcbiAgfVxuICBlbHNlIHtcbiAgICByZXR1cm4gdGhpcy5kZWZhdWx0XG4gIH1cbn1cbi8qKlxuICogU2VyaWFsaXplcyBhIHBhcnNlZCB2YWx1ZSBhbmQgc2V0cyBpdCBvbiB0aGUgY29udGV4dCxcbiAqIGJ1dCBvbmx5IGlmIGl0J3Mgbm90IGVxdWFsIHRvIHRoZSBwcmV2aW91cyB2YWx1ZS5cbiAqIElmIHRoZSB2YWx1ZSBwcm92aWRlZCB0cmlnZ2VycyBhIHJlbW92YWwsIGl0IHJlbW92ZXMgdGhlIGF0dHJpYnV0ZSBmcm9tIHRoZSBjb250ZXh0LlxuICogKi9cbkF0dHJpYnV0ZS5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24oIGNvbnRleHQsIHBhcnNlZFZhbHVlLCBjYWxsT25jaGFuZ2UgKXtcbiAgdmFyIHByZXZpb3VzVmFsdWUgPSB0aGlzLnBhcnNlVmFsdWUodGhpcy5nZXRGcm9tQ29udGV4dChjb250ZXh0LCB0aGlzLnByZWZpeGVkTmFtZSkpXG4gIHZhciBuZXdWYWx1ZVxuXG4gIC8vIHNldHRpbmcgdG8gdGhlIHNhbWUgdmFsdWVcbiAgaWYoIHByZXZpb3VzVmFsdWUgPT09IHBhcnNlZFZhbHVlICl7XG4gICAgcmV0dXJuXG4gIH1cblxuICBpZiAodGhpcy5oYXNPbkNvbnRleHQoY29udGV4dCwgdGhpcy5wcmVmaXhlZE5hbWUpKSB7XG4gICAgLy8gcmVtb3ZpbmcgZXhpc3RpbmcgdmFsdWVcbiAgICBpZiggdGhpcy5zaG91bGRSZW1vdmUocGFyc2VkVmFsdWUpICl7XG4gICAgICB0aGlzLnJlbW92ZUZyb21Db250ZXh0KGNvbnRleHQsIHRoaXMucHJlZml4ZWROYW1lKVxuICAgICAgaWYgKHRoaXMub25jaGFuZ2UgJiYgY2FsbE9uY2hhbmdlICE9IGZhbHNlKSB7XG4gICAgICAgIHRoaXMub25jaGFuZ2UuY2FsbChjb250ZXh0LCBwcmV2aW91c1ZhbHVlLCBwYXJzZWRWYWx1ZSlcbiAgICAgIH1cbiAgICAgIHJldHVyblxuICAgIH1cbiAgfVxuXG4gIC8vIGRvbid0IG5lZWQgdG8gcmVtb3ZlIHdoaWNoIGlzIG5vdCB0aGVyZVxuICBpZiggdGhpcy5zaG91bGRSZW1vdmUocGFyc2VkVmFsdWUpICl7XG4gICAgcmV0dXJuXG4gIH1cblxuICAvLyBzZXR0aW5nIGEgbmV3IHZhbHVlXG4gIG5ld1ZhbHVlID0gdGhpcy5zZXJpYWxpemVWYWx1ZShwYXJzZWRWYWx1ZSlcbiAgdGhpcy5zZXRPbkNvbnRleHQoY29udGV4dCwgdGhpcy5wcmVmaXhlZE5hbWUsIG5ld1ZhbHVlKVxuICBpZiAodGhpcy5vbmNoYW5nZSAmJiBjYWxsT25jaGFuZ2UgIT0gZmFsc2UpIHtcbiAgICB0aGlzLm9uY2hhbmdlLmNhbGwoY29udGV4dCwgcHJldmlvdXNWYWx1ZSwgcGFyc2VkVmFsdWUpXG4gIH1cbn1cbiIsInZhciBpbmhlcml0ID0gcmVxdWlyZShcIm1hdGNoYm94LWZhY3RvcnkvaW5oZXJpdFwiKVxudmFyIEF0dHJpYnV0ZSA9IHJlcXVpcmUoXCIuL0F0dHJpYnV0ZVwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEJvb2xlYW5BdHRyaWJ1dGVcblxuZnVuY3Rpb24gQm9vbGVhbkF0dHJpYnV0ZSAoZGVmKSB7XG4gIEF0dHJpYnV0ZS5jYWxsKHRoaXMsIGRlZilcbiAgdGhpcy50eXBlID0gXCJib29sZWFuXCJcbn1cblxuaW5oZXJpdChCb29sZWFuQXR0cmlidXRlLCBBdHRyaWJ1dGUpXG5cbkJvb2xlYW5BdHRyaWJ1dGUucHJvdG90eXBlLnBhcnNlVmFsdWUgPSBmdW5jdGlvbihzZXJpYWxpemVkVmFsdWUpe1xuICByZXR1cm4gc2VyaWFsaXplZFZhbHVlID09IG51bGxcbiAgICA/IG51bGxcbiAgICA6ICEhc2VyaWFsaXplZFZhbHVlXG59XG4iLCJ2YXIgaW5oZXJpdCA9IHJlcXVpcmUoXCJtYXRjaGJveC1mYWN0b3J5L2luaGVyaXRcIilcbnZhciBBdHRyaWJ1dGUgPSByZXF1aXJlKFwiLi9BdHRyaWJ1dGVcIilcblxubW9kdWxlLmV4cG9ydHMgPSBGbG9hdEF0dHJpYnV0ZVxuXG5mdW5jdGlvbiBGbG9hdEF0dHJpYnV0ZSAoZGVmKSB7XG4gIEF0dHJpYnV0ZS5jYWxsKHRoaXMsIGRlZilcbiAgdGhpcy50eXBlID0gXCJmbG9hdFwiXG59XG5cbmluaGVyaXQoRmxvYXRBdHRyaWJ1dGUsIEF0dHJpYnV0ZSlcblxuRmxvYXRBdHRyaWJ1dGUucHJvdG90eXBlLnBhcnNlVmFsdWUgPSBmdW5jdGlvbihzZXJpYWxpemVkVmFsdWUpe1xuICByZXR1cm4gc2VyaWFsaXplZFZhbHVlID09IG51bGxcbiAgICAgID8gbnVsbFxuICAgICAgOiBwYXJzZUZsb2F0KHNlcmlhbGl6ZWRWYWx1ZSlcbn1cbiIsInZhciBpbmhlcml0ID0gcmVxdWlyZShcIm1hdGNoYm94LWZhY3RvcnkvaW5oZXJpdFwiKVxudmFyIEF0dHJpYnV0ZSA9IHJlcXVpcmUoXCIuL0F0dHJpYnV0ZVwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEpTT05BdHRyaWJ1dGVcblxuZnVuY3Rpb24gSlNPTkF0dHJpYnV0ZSAoZGVmKSB7XG4gIEF0dHJpYnV0ZS5jYWxsKHRoaXMsIGRlZilcbiAgdGhpcy50eXBlID0gXCJqc29uXCJcbn1cblxuaW5oZXJpdChKU09OQXR0cmlidXRlLCBBdHRyaWJ1dGUpXG5cbkpTT05BdHRyaWJ1dGUucHJvdG90eXBlLnBhcnNlVmFsdWUgPSBmdW5jdGlvbihzZXJpYWxpemVkVmFsdWUpe1xuICByZXR1cm4gc2VyaWFsaXplZFZhbHVlID09IG51bGxcbiAgICAgID8gbnVsbFxuICAgICAgOiBKU09OLnBhcnNlKHNlcmlhbGl6ZWRWYWx1ZSlcbn1cblxuSlNPTkF0dHJpYnV0ZS5wcm90b3R5cGUuc2VyaWFsaXplVmFsdWUgPSBmdW5jdGlvbihwcmFzZWRWYWx1ZSl7XG4gIHJldHVybiBwcmFzZWRWYWx1ZSA9PSBudWxsXG4gICAgICA/IG51bGxcbiAgICAgIDogSlNPTi5zdHJpbmdpZnkocHJhc2VkVmFsdWUpXG59XG4iLCJ2YXIgaW5oZXJpdCA9IHJlcXVpcmUoXCJtYXRjaGJveC1mYWN0b3J5L2luaGVyaXRcIilcbnZhciBBdHRyaWJ1dGUgPSByZXF1aXJlKFwiLi9BdHRyaWJ1dGVcIilcblxubW9kdWxlLmV4cG9ydHMgPSBOdW1iZXJBdHRyaWJ1dGVcblxuZnVuY3Rpb24gTnVtYmVyQXR0cmlidXRlIChkZWYpIHtcbiAgQXR0cmlidXRlLmNhbGwodGhpcywgZGVmKVxuICB0aGlzLnR5cGUgPSBcIm51bWJlclwiXG59XG5cbmluaGVyaXQoTnVtYmVyQXR0cmlidXRlLCBBdHRyaWJ1dGUpXG5cbk51bWJlckF0dHJpYnV0ZS5wcm90b3R5cGUucGFyc2VWYWx1ZSA9IGZ1bmN0aW9uKHNlcmlhbGl6ZWRWYWx1ZSl7XG4gIHJldHVybiBzZXJpYWxpemVkVmFsdWUgPT0gbnVsbFxuICAgICAgPyBudWxsXG4gICAgICA6IHBhcnNlRmxvYXQoc2VyaWFsaXplZFZhbHVlKVxufVxuIiwidmFyIGluaGVyaXQgPSByZXF1aXJlKFwibWF0Y2hib3gtZmFjdG9yeS9pbmhlcml0XCIpXG52YXIgQXR0cmlidXRlID0gcmVxdWlyZShcIi4vQXR0cmlidXRlXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gU3RyaW5nQXR0cmlidXRlXG5cbmZ1bmN0aW9uIFN0cmluZ0F0dHJpYnV0ZSAoZGVmKSB7XG4gIEF0dHJpYnV0ZS5jYWxsKHRoaXMsIGRlZilcbiAgdGhpcy50eXBlID0gXCJzdHJpbmdcIlxufVxuXG5pbmhlcml0KFN0cmluZ0F0dHJpYnV0ZSwgQXR0cmlidXRlKVxuXG5TdHJpbmdBdHRyaWJ1dGUucHJvdG90eXBlLnBhcnNlVmFsdWUgPSBmdW5jdGlvbihzZXJpYWxpemVkVmFsdWUpe1xuICByZXR1cm4gc2VyaWFsaXplZFZhbHVlID09IG51bGxcbiAgICAgID8gbnVsbFxuICAgICAgOiBcIlwiICsgc2VyaWFsaXplZFZhbHVlXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGV4dGVuZCAoQ2xhc3MsIHByb3RvdHlwZSkge1xuICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhwcm90b3R5cGUpLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICBpZiAobmFtZSAhPT0gXCJjb25zdHJ1Y3RvclwiICkge1xuICAgICAgdmFyIGRlc2NyaXB0b3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHByb3RvdHlwZSwgbmFtZSlcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDbGFzcy5wcm90b3R5cGUsIG5hbWUsIGRlc2NyaXB0b3IpXG4gICAgfVxuICB9KVxuXG4gIHJldHVybiBDbGFzc1xufVxuIiwidmFyIGV4dGVuZCA9IHJlcXVpcmUoXCIuL2V4dGVuZFwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluY2x1ZGUgKENsYXNzLCBPdGhlcikge1xuICBpZiAoQXJyYXkuaXNBcnJheShPdGhlcikpIHtcbiAgICBPdGhlci5mb3JFYWNoKGZ1bmN0aW9uIChPdGhlcikge1xuICAgICAgaWYgKHR5cGVvZiBPdGhlciA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgZXh0ZW5kKENsYXNzLCBPdGhlci5wcm90b3R5cGUpXG4gICAgICB9XG4gICAgICBlbHNlIGlmICh0eXBlb2YgT3RoZXIgPT0gXCJvYmplY3RcIikge1xuICAgICAgICBleHRlbmQoQ2xhc3MsIE90aGVyKVxuICAgICAgfVxuICAgIH0pXG4gIH1cbiAgZWxzZSB7XG4gICAgaWYgKHR5cGVvZiBPdGhlciA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIGV4dGVuZChDbGFzcywgT3RoZXIucHJvdG90eXBlKVxuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgT3RoZXIgPT0gXCJvYmplY3RcIikge1xuICAgICAgZXh0ZW5kKENsYXNzLCBPdGhlcilcbiAgICB9XG4gIH1cblxuICByZXR1cm4gQ2xhc3Ncbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdCAoQ2xhc3MsIEJhc2UpIHtcbiAgQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlLnByb3RvdHlwZSlcbiAgQ2xhc3MucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQ2xhc3NcblxuICByZXR1cm4gQ2xhc3Ncbn1cbiJdfQ==
