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