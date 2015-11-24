(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.matchboxDom = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = DomData

function DomData (name, defaultValue, onChange) {
  this.name = name
  this.onChange = onChange || null
  this.default = defaultValue == null ? null : defaultValue
}

DomData.prototype.type = ""

DomData.prototype.attributeName = function () {
  return "data-"+this.name
}
DomData.prototype.checkType = function (value) {
  return value != null
}

DomData.prototype.parse = function (value) {
  return value
}

DomData.prototype.stringify = function (value) {
  return ""+value
}

DomData.prototype.get = function (element) {
  var attributeName = this.attributeName()
  if (element.hasAttribute(attributeName)) {
    return this.parse(element.getAttribute(attributeName))
  }

  return this.default
}

DomData.prototype.set = function (element, value, context, silent) {
  if (!this.checkType(value)) {
    throw new TypeError("Can't set DomData "+this.type+" to '"+value+"'")
  }

  var attributeName = this.attributeName()

  var hasValue = element.hasAttribute(attributeName)
  var newStringValue = this.stringify(value)
  var prevStringValue = hasValue ? element.getAttribute(attributeName) : null

  if (newStringValue === prevStringValue) {
    return
  }

  element.setAttribute(attributeName, newStringValue)

  if (!silent) {
    var onChange = this.onChange
    if (onChange) {
      var previousValue = hasValue ? this.parse(prevStringValue) : null
      onChange.call(context, previousValue, value)
    }
  }
}

DomData.prototype.has = function (element) {
  return element.hasAttribute(this.attributeName())
}

DomData.prototype.remove = function (element, context, silent) {
  var attributeName = this.attributeName()
  if (!element.hasAttribute(attributeName)) {
    return
  }

  var previousValue = element.hasAttribute(attributeName)
      ? this.parse(element.getAttribute(attributeName))
      : null

  element.removeAttribute(attributeName)

  if (!silent) {
    var onChange = this.onChange
    if (onChange) {
      onChange.call(context, previousValue, null)
    }
  }
}


},{}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
module.exports = Selector

Selector.DEFAULT_NEST_SEPARATOR = ":"

function Selector (selector) {
  selector = selector || {}
  this.attribute = selector.attribute || ""
  this.value = selector.value || null
  this.operator = selector.operator || "="
  this.extra = selector.extra || ""

  this.element = selector.element || null
  this.unwantedParentSelector = selector.unwantedParentSelector || null

  this.Constructor = selector.Constructor || null
  this.instantiate = selector.instantiate || null
  this.multiple = selector.multiple != null ? !!selector.multiple : false

  this.matcher = selector.matcher || null
}

function parentFilter (unMatchSelector, realParent) {
  return function isUnwantedChild(el) {
    var parent = el.parentNode
    while (parent && parent != realParent) {
      if (parent.matches(unMatchSelector)) {
        return false
      }
      parent = parent.parentNode
    }
    return true
  }
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
  s.operator = "~="
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

Selector.prototype.from = function (element, except) {
  var s = this.clone()
  s.element = element
  if (except) {
    s.unwantedParentSelector = except.toString()
  }
  return s
}

Selector.prototype.select = function (element, transform) {
  var result = element.querySelector(this.toString())
  if (result && this.unwantedParentSelector && this.element) {
    var isUnwantedChild = parentFilter(this.unwantedParentSelector, this.element)
    if (isUnwantedChild(result)) {
      return null
    }
  }
  return result
      ? transform ? transform(result) : result
      : null
}

Selector.prototype.selectAll = function (element, transform) {
  var result = element.querySelectorAll(this.toString())
  if (this.unwantedParentSelector && this.element) {
    result = [].filter.call(result, parentFilter(this.unwantedParentSelector, this.element))
  }
  return transform ? [].map.call(result, transform) : [].slice.call(result)
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
    return this.nodeList().map(instantiate)
  }
  else {
    return this.node(instantiate)
  }
}

Selector.prototype.find = function () {
  if (this.Constructor || this.instantiate) {
    return this.construct()
  }
  if (this.multiple) {
    return this.nodeList()
  }
  else {
    return this.node()
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

},{}],4:[function(require,module,exports){
var inherit = require("matchbox-factory/inherit")
var Data = require("../Data")

module.exports = BooleanData

function BooleanData (name, defaultValue, onChange) {
  Data.call(this, name, defaultValue, onChange)
}

inherit(BooleanData, Data)

BooleanData.prototype.type = "Boolean"

BooleanData.prototype.checkType = function (value) {
  return typeof value == "boolean"
}

BooleanData.prototype.parse = function (value) {
  return value === "true"
}

BooleanData.prototype.stringify = function (value) {
  return value ? "true" : "false"
}

},{"../Data":1,"matchbox-factory/inherit":14}],5:[function(require,module,exports){
var inherit = require("matchbox-factory/inherit")
var Data = require("../Data")

module.exports = FloatData

function FloatData (name, defaultValue, onChange) {
  Data.call(this, name, defaultValue, onChange)
}

inherit(FloatData, Data)

FloatData.prototype.type = "float"

FloatData.prototype.checkType = function (value) {
  return typeof value == "number"
}

FloatData.prototype.parse = function (value) {
  return parseFloat(value)
}

FloatData.prototype.stringify = function (value) {
  return ""+value
}

},{"../Data":1,"matchbox-factory/inherit":14}],6:[function(require,module,exports){
var inherit = require("matchbox-factory/inherit")
var Data = require("../Data")

module.exports = JSONData

function JSONData (name, defaultValue, onChange) {
  Data.call(this, name, defaultValue, onChange)
}

inherit(JSONData, Data)

JSONData.prototype.type = "json"

JSONData.prototype.checkType = function (value) {
  return value != null
}

JSONData.prototype.parse = function (value) {
  return JSON.parse(value)
}

JSONData.prototype.stringify = function (value) {
  return JSON.stringify(value)
}

},{"../Data":1,"matchbox-factory/inherit":14}],7:[function(require,module,exports){
var inherit = require("matchbox-factory/inherit")
var Data = require("../Data")

module.exports = NumberData

function NumberData (name, defaultValue, onChange) {
  Data.call(this, name, defaultValue, onChange)
}

inherit(NumberData, Data)

NumberData.prototype.type = "number"

NumberData.prototype.checkType = function (value) {
  return typeof value == "number"
}

NumberData.prototype.parse = function (value) {
  return parseInt(value, 10)
}

NumberData.prototype.stringify = function (value) {
  return ""+value
}

},{"../Data":1,"matchbox-factory/inherit":14}],8:[function(require,module,exports){
var inherit = require("matchbox-factory/inherit")
var Data = require("../Data")

module.exports = StringData

function StringData (name, defaultValue, onChange) {
  Data.call(this, name, defaultValue, onChange)
}

inherit(StringData, Data)

StringData.prototype.type = "string"

StringData.prototype.checkType = function (value) {
  return typeof value == "string"
}

StringData.prototype.parse = function (value) {
  return value ? ""+value : ""
}

StringData.prototype.stringify = function (value) {
  return value ? ""+value : ""
}

},{"../Data":1,"matchbox-factory/inherit":14}],9:[function(require,module,exports){
var data = module.exports = {}

data.Boolean = require("./BooleanData")
data.String = require("./StringData")
data.Number = require("./NumberData")
data.Float = require("./FloatData")
data.JSON = require("./JSONData")

data.create = function (name, value, onChange) {
  if (value == null) {
    return null
  }

  var type = typeof value

  switch(type) {
    case "boolean":
      return new data.Boolean(name, value, onChange)
    case "string":
      return new data.String(name, value, onChange)
    case "number":
      // note: it fails for 1.0
      if (value === +value && value !== (value | 0)) {
        return new data.Float(name, value, onChange)
      }
      return new data.Number(name, value, onChange)
    default:
      return new data.JSON(name, value, onChange)
  }
}

},{"./BooleanData":4,"./FloatData":5,"./JSONData":6,"./NumberData":7,"./StringData":8}],10:[function(require,module,exports){
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

},{"../Selector":3}],11:[function(require,module,exports){
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

dom.data = require("./data")
dom.Data = require("./Data")
dom.event = require("./event")
dom.Fragment = require("./Fragment")
dom.Selector = require("./Selector")

},{"./Data":1,"./Fragment":2,"./Selector":3,"./data":9,"./event":11}],14:[function(require,module,exports){
module.exports = function inherit (Class, Base) {
  Class.prototype = Object.create(Base.prototype)
  Class.prototype.constructor = Class

  return Class
}

},{}]},{},[13])(13)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJEYXRhLmpzIiwiRnJhZ21lbnQuanMiLCJTZWxlY3Rvci5qcyIsImRhdGEvQm9vbGVhbkRhdGEuanMiLCJkYXRhL0Zsb2F0RGF0YS5qcyIsImRhdGEvSlNPTkRhdGEuanMiLCJkYXRhL051bWJlckRhdGEuanMiLCJkYXRhL1N0cmluZ0RhdGEuanMiLCJkYXRhL2luZGV4LmpzIiwiZXZlbnQvZGVsZWdhdGUuanMiLCJldmVudC9pbmRleC5qcyIsImV2ZW50L21pc3NjbGljay5qcyIsImluZGV4LmpzIiwibm9kZV9tb2R1bGVzL21hdGNoYm94LWZhY3RvcnkvaW5oZXJpdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gRG9tRGF0YVxuXG5mdW5jdGlvbiBEb21EYXRhIChuYW1lLCBkZWZhdWx0VmFsdWUsIG9uQ2hhbmdlKSB7XG4gIHRoaXMubmFtZSA9IG5hbWVcbiAgdGhpcy5vbkNoYW5nZSA9IG9uQ2hhbmdlIHx8IG51bGxcbiAgdGhpcy5kZWZhdWx0ID0gZGVmYXVsdFZhbHVlID09IG51bGwgPyBudWxsIDogZGVmYXVsdFZhbHVlXG59XG5cbkRvbURhdGEucHJvdG90eXBlLnR5cGUgPSBcIlwiXG5cbkRvbURhdGEucHJvdG90eXBlLmF0dHJpYnV0ZU5hbWUgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBcImRhdGEtXCIrdGhpcy5uYW1lXG59XG5Eb21EYXRhLnByb3RvdHlwZS5jaGVja1R5cGUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlICE9IG51bGxcbn1cblxuRG9tRGF0YS5wcm90b3R5cGUucGFyc2UgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlXG59XG5cbkRvbURhdGEucHJvdG90eXBlLnN0cmluZ2lmeSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gXCJcIit2YWx1ZVxufVxuXG5Eb21EYXRhLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICB2YXIgYXR0cmlidXRlTmFtZSA9IHRoaXMuYXR0cmlidXRlTmFtZSgpXG4gIGlmIChlbGVtZW50Lmhhc0F0dHJpYnV0ZShhdHRyaWJ1dGVOYW1lKSkge1xuICAgIHJldHVybiB0aGlzLnBhcnNlKGVsZW1lbnQuZ2V0QXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUpKVxuICB9XG5cbiAgcmV0dXJuIHRoaXMuZGVmYXVsdFxufVxuXG5Eb21EYXRhLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAoZWxlbWVudCwgdmFsdWUsIGNvbnRleHQsIHNpbGVudCkge1xuICBpZiAoIXRoaXMuY2hlY2tUeXBlKHZhbHVlKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW4ndCBzZXQgRG9tRGF0YSBcIit0aGlzLnR5cGUrXCIgdG8gJ1wiK3ZhbHVlK1wiJ1wiKVxuICB9XG5cbiAgdmFyIGF0dHJpYnV0ZU5hbWUgPSB0aGlzLmF0dHJpYnV0ZU5hbWUoKVxuXG4gIHZhciBoYXNWYWx1ZSA9IGVsZW1lbnQuaGFzQXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUpXG4gIHZhciBuZXdTdHJpbmdWYWx1ZSA9IHRoaXMuc3RyaW5naWZ5KHZhbHVlKVxuICB2YXIgcHJldlN0cmluZ1ZhbHVlID0gaGFzVmFsdWUgPyBlbGVtZW50LmdldEF0dHJpYnV0ZShhdHRyaWJ1dGVOYW1lKSA6IG51bGxcblxuICBpZiAobmV3U3RyaW5nVmFsdWUgPT09IHByZXZTdHJpbmdWYWx1ZSkge1xuICAgIHJldHVyblxuICB9XG5cbiAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoYXR0cmlidXRlTmFtZSwgbmV3U3RyaW5nVmFsdWUpXG5cbiAgaWYgKCFzaWxlbnQpIHtcbiAgICB2YXIgb25DaGFuZ2UgPSB0aGlzLm9uQ2hhbmdlXG4gICAgaWYgKG9uQ2hhbmdlKSB7XG4gICAgICB2YXIgcHJldmlvdXNWYWx1ZSA9IGhhc1ZhbHVlID8gdGhpcy5wYXJzZShwcmV2U3RyaW5nVmFsdWUpIDogbnVsbFxuICAgICAgb25DaGFuZ2UuY2FsbChjb250ZXh0LCBwcmV2aW91c1ZhbHVlLCB2YWx1ZSlcbiAgICB9XG4gIH1cbn1cblxuRG9tRGF0YS5wcm90b3R5cGUuaGFzID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgcmV0dXJuIGVsZW1lbnQuaGFzQXR0cmlidXRlKHRoaXMuYXR0cmlidXRlTmFtZSgpKVxufVxuXG5Eb21EYXRhLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAoZWxlbWVudCwgY29udGV4dCwgc2lsZW50KSB7XG4gIHZhciBhdHRyaWJ1dGVOYW1lID0gdGhpcy5hdHRyaWJ1dGVOYW1lKClcbiAgaWYgKCFlbGVtZW50Lmhhc0F0dHJpYnV0ZShhdHRyaWJ1dGVOYW1lKSkge1xuICAgIHJldHVyblxuICB9XG5cbiAgdmFyIHByZXZpb3VzVmFsdWUgPSBlbGVtZW50Lmhhc0F0dHJpYnV0ZShhdHRyaWJ1dGVOYW1lKVxuICAgICAgPyB0aGlzLnBhcnNlKGVsZW1lbnQuZ2V0QXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUpKVxuICAgICAgOiBudWxsXG5cbiAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoYXR0cmlidXRlTmFtZSlcblxuICBpZiAoIXNpbGVudCkge1xuICAgIHZhciBvbkNoYW5nZSA9IHRoaXMub25DaGFuZ2VcbiAgICBpZiAob25DaGFuZ2UpIHtcbiAgICAgIG9uQ2hhbmdlLmNhbGwoY29udGV4dCwgcHJldmlvdXNWYWx1ZSwgbnVsbClcbiAgICB9XG4gIH1cbn1cblxuIiwibW9kdWxlLmV4cG9ydHMgPSBGcmFnbWVudFxuXG5mdW5jdGlvbiBGcmFnbWVudCAoZnJhZ21lbnQpIHtcbiAgZnJhZ21lbnQgPSBmcmFnbWVudCB8fCB7fVxuICB0aGlzLmh0bWwgPSBmcmFnbWVudC5odG1sIHx8IFwiXCJcbiAgdGhpcy5maXJzdCA9IGZyYWdtZW50LmZpcnN0ID09IHVuZGVmaW5lZCB8fCAhIWZyYWdtZW50LmZpcnN0XG4gIHRoaXMudGltZW91dCA9IGZyYWdtZW50LnRpbWVvdXQgfHwgMjAwMFxufVxuXG5GcmFnbWVudC5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24gKGh0bWwpIHtcbiAgdmFyIHRlbXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuXG4gIHRlbXAuaW5uZXJIVE1MID0gaHRtbCB8fCB0aGlzLmh0bWxcblxuICBpZiAodGhpcy5maXJzdCA9PT0gdW5kZWZpbmVkIHx8IHRoaXMuZmlyc3QpIHtcbiAgICByZXR1cm4gdGVtcC5jaGlsZHJlblswXVxuICB9XG5cbiAgdmFyIGZyYWdtZW50ID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpXG4gIHdoaWxlICh0ZW1wLmNoaWxkTm9kZXMubGVuZ3RoKSB7XG4gICAgZnJhZ21lbnQuYXBwZW5kQ2hpbGQodGVtcC5maXJzdENoaWxkKVxuICB9XG5cbiAgcmV0dXJuIGZyYWdtZW50O1xufVxuXG5GcmFnbWVudC5wcm90b3R5cGUuY29tcGlsZSA9IGZ1bmN0aW9uIChodG1sLCBvcHRpb25zLCBjYikge1xuICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICBjYihudWxsLCBodG1sKVxuICB9LCA0KVxufVxuXG5GcmFnbWVudC5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gKGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgdmFyIGZyYWdtZW50ID0gdGhpc1xuICBjb250ZXh0ID0gY29udGV4dCB8fCB7fVxuXG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgdmFyIHJlc29sdmVkID0gZmFsc2VcbiAgICB2YXIgaWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJSZW5kZXIgdGltZWQgb3V0XCIpKVxuICAgIH0sIGZyYWdtZW50LnRpbWVvdXQpXG5cbiAgICB0cnkge1xuICAgICAgZnJhZ21lbnQuY29tcGlsZShjb250ZXh0LCBvcHRpb25zLCBmdW5jdGlvbiAoZXJyLCByZW5kZXJlZCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoaWQpXG4gICAgICAgIGlmIChyZXNvbHZlZCkgcmV0dXJuXG5cbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJlamVjdChlcnIpXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgcmVzb2x2ZShmcmFnbWVudC5jcmVhdGUocmVuZGVyZWQpKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgcmVqZWN0KGUpXG4gICAgfVxuICB9KVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBTZWxlY3RvclxuXG5TZWxlY3Rvci5ERUZBVUxUX05FU1RfU0VQQVJBVE9SID0gXCI6XCJcblxuZnVuY3Rpb24gU2VsZWN0b3IgKHNlbGVjdG9yKSB7XG4gIHNlbGVjdG9yID0gc2VsZWN0b3IgfHwge31cbiAgdGhpcy5hdHRyaWJ1dGUgPSBzZWxlY3Rvci5hdHRyaWJ1dGUgfHwgXCJcIlxuICB0aGlzLnZhbHVlID0gc2VsZWN0b3IudmFsdWUgfHwgbnVsbFxuICB0aGlzLm9wZXJhdG9yID0gc2VsZWN0b3Iub3BlcmF0b3IgfHwgXCI9XCJcbiAgdGhpcy5leHRyYSA9IHNlbGVjdG9yLmV4dHJhIHx8IFwiXCJcblxuICB0aGlzLmVsZW1lbnQgPSBzZWxlY3Rvci5lbGVtZW50IHx8IG51bGxcbiAgdGhpcy51bndhbnRlZFBhcmVudFNlbGVjdG9yID0gc2VsZWN0b3IudW53YW50ZWRQYXJlbnRTZWxlY3RvciB8fCBudWxsXG5cbiAgdGhpcy5Db25zdHJ1Y3RvciA9IHNlbGVjdG9yLkNvbnN0cnVjdG9yIHx8IG51bGxcbiAgdGhpcy5pbnN0YW50aWF0ZSA9IHNlbGVjdG9yLmluc3RhbnRpYXRlIHx8IG51bGxcbiAgdGhpcy5tdWx0aXBsZSA9IHNlbGVjdG9yLm11bHRpcGxlICE9IG51bGwgPyAhIXNlbGVjdG9yLm11bHRpcGxlIDogZmFsc2VcblxuICB0aGlzLm1hdGNoZXIgPSBzZWxlY3Rvci5tYXRjaGVyIHx8IG51bGxcbn1cblxuZnVuY3Rpb24gcGFyZW50RmlsdGVyICh1bk1hdGNoU2VsZWN0b3IsIHJlYWxQYXJlbnQpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGlzVW53YW50ZWRDaGlsZChlbCkge1xuICAgIHZhciBwYXJlbnQgPSBlbC5wYXJlbnROb2RlXG4gICAgd2hpbGUgKHBhcmVudCAmJiBwYXJlbnQgIT0gcmVhbFBhcmVudCkge1xuICAgICAgaWYgKHBhcmVudC5tYXRjaGVzKHVuTWF0Y2hTZWxlY3RvcikpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50Tm9kZVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZVxuICB9XG59XG5cblNlbGVjdG9yLnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIG5ldyBTZWxlY3Rvcih0aGlzKVxufVxuXG5TZWxlY3Rvci5wcm90b3R5cGUuY29tYmluZSA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuICB2YXIgcyA9IHRoaXMuY2xvbmUoKVxuICBzLmV4dHJhICs9IHNlbGVjdG9yLnRvU3RyaW5nKClcbiAgcmV0dXJuIHNcbn1cblxuU2VsZWN0b3IucHJvdG90eXBlLmVxdWFsID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHZhciBzID0gdGhpcy5jbG9uZSgpXG4gIHMub3BlcmF0b3IgPSBcIj1cIlxuICBzLnZhbHVlID0gdmFsdWVcbiAgcmV0dXJuIHNcbn1cblxuU2VsZWN0b3IucHJvdG90eXBlLmNvbnRhaW5zID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHZhciBzID0gdGhpcy5jbG9uZSgpXG4gIHMub3BlcmF0b3IgPSBcIn49XCJcbiAgcy52YWx1ZSA9IHZhbHVlXG4gIHJldHVybiBzXG59XG5cblNlbGVjdG9yLnByb3RvdHlwZS5wcmVmaXggPSBmdW5jdGlvbiAocHJlLCBzZXBhcmF0b3IpIHtcbiAgdmFyIHMgPSB0aGlzLmNsb25lKClcbiAgdmFyIHNlcCA9IHMudmFsdWUgPyBzZXBhcmF0b3IgfHwgU2VsZWN0b3IuREVGQVVMVF9ORVNUX1NFUEFSQVRPUiA6IFwiXCJcbiAgcy52YWx1ZSA9IHByZSArIHNlcCArIHMudmFsdWVcbiAgcmV0dXJuIHNcbn1cblxuU2VsZWN0b3IucHJvdG90eXBlLm5lc3QgPSBmdW5jdGlvbiAocG9zdCwgc2VwYXJhdG9yKSB7XG4gIHZhciBzID0gdGhpcy5jbG9uZSgpXG4gIHZhciBzZXAgPSBzLnZhbHVlID8gc2VwYXJhdG9yIHx8IFNlbGVjdG9yLkRFRkFVTFRfTkVTVF9TRVBBUkFUT1IgOiBcIlwiXG4gIHMudmFsdWUgKz0gc2VwICsgcG9zdFxuICByZXR1cm4gc1xufVxuXG5TZWxlY3Rvci5wcm90b3R5cGUuZnJvbSA9IGZ1bmN0aW9uIChlbGVtZW50LCBleGNlcHQpIHtcbiAgdmFyIHMgPSB0aGlzLmNsb25lKClcbiAgcy5lbGVtZW50ID0gZWxlbWVudFxuICBpZiAoZXhjZXB0KSB7XG4gICAgcy51bndhbnRlZFBhcmVudFNlbGVjdG9yID0gZXhjZXB0LnRvU3RyaW5nKClcbiAgfVxuICByZXR1cm4gc1xufVxuXG5TZWxlY3Rvci5wcm90b3R5cGUuc2VsZWN0ID0gZnVuY3Rpb24gKGVsZW1lbnQsIHRyYW5zZm9ybSkge1xuICB2YXIgcmVzdWx0ID0gZWxlbWVudC5xdWVyeVNlbGVjdG9yKHRoaXMudG9TdHJpbmcoKSlcbiAgaWYgKHJlc3VsdCAmJiB0aGlzLnVud2FudGVkUGFyZW50U2VsZWN0b3IgJiYgdGhpcy5lbGVtZW50KSB7XG4gICAgdmFyIGlzVW53YW50ZWRDaGlsZCA9IHBhcmVudEZpbHRlcih0aGlzLnVud2FudGVkUGFyZW50U2VsZWN0b3IsIHRoaXMuZWxlbWVudClcbiAgICBpZiAoaXNVbndhbnRlZENoaWxkKHJlc3VsdCkpIHtcbiAgICAgIHJldHVybiBudWxsXG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHRcbiAgICAgID8gdHJhbnNmb3JtID8gdHJhbnNmb3JtKHJlc3VsdCkgOiByZXN1bHRcbiAgICAgIDogbnVsbFxufVxuXG5TZWxlY3Rvci5wcm90b3R5cGUuc2VsZWN0QWxsID0gZnVuY3Rpb24gKGVsZW1lbnQsIHRyYW5zZm9ybSkge1xuICB2YXIgcmVzdWx0ID0gZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKHRoaXMudG9TdHJpbmcoKSlcbiAgaWYgKHRoaXMudW53YW50ZWRQYXJlbnRTZWxlY3RvciAmJiB0aGlzLmVsZW1lbnQpIHtcbiAgICByZXN1bHQgPSBbXS5maWx0ZXIuY2FsbChyZXN1bHQsIHBhcmVudEZpbHRlcih0aGlzLnVud2FudGVkUGFyZW50U2VsZWN0b3IsIHRoaXMuZWxlbWVudCkpXG4gIH1cbiAgcmV0dXJuIHRyYW5zZm9ybSA/IFtdLm1hcC5jYWxsKHJlc3VsdCwgdHJhbnNmb3JtKSA6IFtdLnNsaWNlLmNhbGwocmVzdWx0KVxufVxuXG5TZWxlY3Rvci5wcm90b3R5cGUubm9kZSA9IGZ1bmN0aW9uICh0cmFuc2Zvcm0pIHtcbiAgcmV0dXJuIHRoaXMuc2VsZWN0KHRoaXMuZWxlbWVudCwgdHJhbnNmb3JtKVxufVxuXG5TZWxlY3Rvci5wcm90b3R5cGUubm9kZUxpc3QgPSBmdW5jdGlvbiAodHJhbnNmb3JtKSB7XG4gIHJldHVybiB0aGlzLnNlbGVjdEFsbCh0aGlzLmVsZW1lbnQsIHRyYW5zZm9ybSlcbn1cblxuU2VsZWN0b3IucHJvdG90eXBlLmNvbnN0cnVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIENvbnN0cnVjdG9yID0gdGhpcy5Db25zdHJ1Y3RvclxuICB2YXIgaW5zdGFudGlhdGUgPSB0aGlzLmluc3RhbnRpYXRlIHx8IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgcmV0dXJuIG5ldyBDb25zdHJ1Y3RvcihlbGVtZW50KVxuICB9XG4gIGlmICh0aGlzLm11bHRpcGxlKSB7XG4gICAgcmV0dXJuIHRoaXMubm9kZUxpc3QoKS5tYXAoaW5zdGFudGlhdGUpXG4gIH1cbiAgZWxzZSB7XG4gICAgcmV0dXJuIHRoaXMubm9kZShpbnN0YW50aWF0ZSlcbiAgfVxufVxuXG5TZWxlY3Rvci5wcm90b3R5cGUuZmluZCA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHRoaXMuQ29uc3RydWN0b3IgfHwgdGhpcy5pbnN0YW50aWF0ZSkge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdCgpXG4gIH1cbiAgaWYgKHRoaXMubXVsdGlwbGUpIHtcbiAgICByZXR1cm4gdGhpcy5ub2RlTGlzdCgpXG4gIH1cbiAgZWxzZSB7XG4gICAgcmV0dXJuIHRoaXMubm9kZSgpXG4gIH1cbn1cblxuU2VsZWN0b3IucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICB2YXIgc3RyaW5nID0gXCJcIlxuICB2YXIgdmFsdWUgPSB0aGlzLnZhbHVlXG4gIHZhciBhdHRyaWJ1dGUgPSB0aGlzLmF0dHJpYnV0ZVxuICB2YXIgZXh0cmEgPSB0aGlzLmV4dHJhIHx8IFwiXCJcblxuICBzd2l0Y2ggKGF0dHJpYnV0ZSkge1xuICAgIGNhc2UgXCJpZFwiOlxuICAgICAgICBzdHJpbmcgPSBcIiNcIiArIHZhbHVlXG4gICAgICBicmVha1xuICAgIGNhc2UgXCJjbGFzc1wiOlxuICAgICAgc3RyaW5nID0gXCIuXCIgKyB2YWx1ZVxuICAgICAgYnJlYWtcbiAgICBjYXNlIFwiXCI6XG4gICAgICBzdHJpbmcgPSB2YWx1ZSB8fCBcIlwiXG4gICAgICBicmVha1xuICAgIGRlZmF1bHQ6XG4gICAgICB2YWx1ZSA9IHZhbHVlID09PSBcIlwiIHx8IHZhbHVlID09PSB0cnVlIHx8IHZhbHVlID09PSBmYWxzZSB8fCB2YWx1ZSA9PSBudWxsXG4gICAgICAgID8gXCJcIlxuICAgICAgICA6ICdcIicgKyB2YWx1ZSArICdcIidcbiAgICAgIHZhciBvcGVyYXRvciA9IHZhbHVlID8gdGhpcy5vcGVyYXRvciB8fCBcIj1cIiA6IFwiXCJcbiAgICAgIHN0cmluZyA9IFwiW1wiICsgYXR0cmlidXRlICsgb3BlcmF0b3IgKyB2YWx1ZSArIFwiXVwiXG4gIH1cblxuICBzdHJpbmcgKz0gZXh0cmFcblxuICByZXR1cm4gc3RyaW5nXG59XG4iLCJ2YXIgaW5oZXJpdCA9IHJlcXVpcmUoXCJtYXRjaGJveC1mYWN0b3J5L2luaGVyaXRcIilcbnZhciBEYXRhID0gcmVxdWlyZShcIi4uL0RhdGFcIilcblxubW9kdWxlLmV4cG9ydHMgPSBCb29sZWFuRGF0YVxuXG5mdW5jdGlvbiBCb29sZWFuRGF0YSAobmFtZSwgZGVmYXVsdFZhbHVlLCBvbkNoYW5nZSkge1xuICBEYXRhLmNhbGwodGhpcywgbmFtZSwgZGVmYXVsdFZhbHVlLCBvbkNoYW5nZSlcbn1cblxuaW5oZXJpdChCb29sZWFuRGF0YSwgRGF0YSlcblxuQm9vbGVhbkRhdGEucHJvdG90eXBlLnR5cGUgPSBcIkJvb2xlYW5cIlxuXG5Cb29sZWFuRGF0YS5wcm90b3R5cGUuY2hlY2tUeXBlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gXCJib29sZWFuXCJcbn1cblxuQm9vbGVhbkRhdGEucHJvdG90eXBlLnBhcnNlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSA9PT0gXCJ0cnVlXCJcbn1cblxuQm9vbGVhbkRhdGEucHJvdG90eXBlLnN0cmluZ2lmeSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgPyBcInRydWVcIiA6IFwiZmFsc2VcIlxufVxuIiwidmFyIGluaGVyaXQgPSByZXF1aXJlKFwibWF0Y2hib3gtZmFjdG9yeS9pbmhlcml0XCIpXG52YXIgRGF0YSA9IHJlcXVpcmUoXCIuLi9EYXRhXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gRmxvYXREYXRhXG5cbmZ1bmN0aW9uIEZsb2F0RGF0YSAobmFtZSwgZGVmYXVsdFZhbHVlLCBvbkNoYW5nZSkge1xuICBEYXRhLmNhbGwodGhpcywgbmFtZSwgZGVmYXVsdFZhbHVlLCBvbkNoYW5nZSlcbn1cblxuaW5oZXJpdChGbG9hdERhdGEsIERhdGEpXG5cbkZsb2F0RGF0YS5wcm90b3R5cGUudHlwZSA9IFwiZmxvYXRcIlxuXG5GbG9hdERhdGEucHJvdG90eXBlLmNoZWNrVHlwZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09IFwibnVtYmVyXCJcbn1cblxuRmxvYXREYXRhLnByb3RvdHlwZS5wYXJzZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gcGFyc2VGbG9hdCh2YWx1ZSlcbn1cblxuRmxvYXREYXRhLnByb3RvdHlwZS5zdHJpbmdpZnkgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgcmV0dXJuIFwiXCIrdmFsdWVcbn1cbiIsInZhciBpbmhlcml0ID0gcmVxdWlyZShcIm1hdGNoYm94LWZhY3RvcnkvaW5oZXJpdFwiKVxudmFyIERhdGEgPSByZXF1aXJlKFwiLi4vRGF0YVwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEpTT05EYXRhXG5cbmZ1bmN0aW9uIEpTT05EYXRhIChuYW1lLCBkZWZhdWx0VmFsdWUsIG9uQ2hhbmdlKSB7XG4gIERhdGEuY2FsbCh0aGlzLCBuYW1lLCBkZWZhdWx0VmFsdWUsIG9uQ2hhbmdlKVxufVxuXG5pbmhlcml0KEpTT05EYXRhLCBEYXRhKVxuXG5KU09ORGF0YS5wcm90b3R5cGUudHlwZSA9IFwianNvblwiXG5cbkpTT05EYXRhLnByb3RvdHlwZS5jaGVja1R5cGUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlICE9IG51bGxcbn1cblxuSlNPTkRhdGEucHJvdG90eXBlLnBhcnNlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiBKU09OLnBhcnNlKHZhbHVlKVxufVxuXG5KU09ORGF0YS5wcm90b3R5cGUuc3RyaW5naWZ5ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiBKU09OLnN0cmluZ2lmeSh2YWx1ZSlcbn1cbiIsInZhciBpbmhlcml0ID0gcmVxdWlyZShcIm1hdGNoYm94LWZhY3RvcnkvaW5oZXJpdFwiKVxudmFyIERhdGEgPSByZXF1aXJlKFwiLi4vRGF0YVwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IE51bWJlckRhdGFcblxuZnVuY3Rpb24gTnVtYmVyRGF0YSAobmFtZSwgZGVmYXVsdFZhbHVlLCBvbkNoYW5nZSkge1xuICBEYXRhLmNhbGwodGhpcywgbmFtZSwgZGVmYXVsdFZhbHVlLCBvbkNoYW5nZSlcbn1cblxuaW5oZXJpdChOdW1iZXJEYXRhLCBEYXRhKVxuXG5OdW1iZXJEYXRhLnByb3RvdHlwZS50eXBlID0gXCJudW1iZXJcIlxuXG5OdW1iZXJEYXRhLnByb3RvdHlwZS5jaGVja1R5cGUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PSBcIm51bWJlclwiXG59XG5cbk51bWJlckRhdGEucHJvdG90eXBlLnBhcnNlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiBwYXJzZUludCh2YWx1ZSwgMTApXG59XG5cbk51bWJlckRhdGEucHJvdG90eXBlLnN0cmluZ2lmeSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gXCJcIit2YWx1ZVxufVxuIiwidmFyIGluaGVyaXQgPSByZXF1aXJlKFwibWF0Y2hib3gtZmFjdG9yeS9pbmhlcml0XCIpXG52YXIgRGF0YSA9IHJlcXVpcmUoXCIuLi9EYXRhXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gU3RyaW5nRGF0YVxuXG5mdW5jdGlvbiBTdHJpbmdEYXRhIChuYW1lLCBkZWZhdWx0VmFsdWUsIG9uQ2hhbmdlKSB7XG4gIERhdGEuY2FsbCh0aGlzLCBuYW1lLCBkZWZhdWx0VmFsdWUsIG9uQ2hhbmdlKVxufVxuXG5pbmhlcml0KFN0cmluZ0RhdGEsIERhdGEpXG5cblN0cmluZ0RhdGEucHJvdG90eXBlLnR5cGUgPSBcInN0cmluZ1wiXG5cblN0cmluZ0RhdGEucHJvdG90eXBlLmNoZWNrVHlwZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09IFwic3RyaW5nXCJcbn1cblxuU3RyaW5nRGF0YS5wcm90b3R5cGUucGFyc2UgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlID8gXCJcIit2YWx1ZSA6IFwiXCJcbn1cblxuU3RyaW5nRGF0YS5wcm90b3R5cGUuc3RyaW5naWZ5ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSA/IFwiXCIrdmFsdWUgOiBcIlwiXG59XG4iLCJ2YXIgZGF0YSA9IG1vZHVsZS5leHBvcnRzID0ge31cblxuZGF0YS5Cb29sZWFuID0gcmVxdWlyZShcIi4vQm9vbGVhbkRhdGFcIilcbmRhdGEuU3RyaW5nID0gcmVxdWlyZShcIi4vU3RyaW5nRGF0YVwiKVxuZGF0YS5OdW1iZXIgPSByZXF1aXJlKFwiLi9OdW1iZXJEYXRhXCIpXG5kYXRhLkZsb2F0ID0gcmVxdWlyZShcIi4vRmxvYXREYXRhXCIpXG5kYXRhLkpTT04gPSByZXF1aXJlKFwiLi9KU09ORGF0YVwiKVxuXG5kYXRhLmNyZWF0ZSA9IGZ1bmN0aW9uIChuYW1lLCB2YWx1ZSwgb25DaGFuZ2UpIHtcbiAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWVcblxuICBzd2l0Y2godHlwZSkge1xuICAgIGNhc2UgXCJib29sZWFuXCI6XG4gICAgICByZXR1cm4gbmV3IGRhdGEuQm9vbGVhbihuYW1lLCB2YWx1ZSwgb25DaGFuZ2UpXG4gICAgY2FzZSBcInN0cmluZ1wiOlxuICAgICAgcmV0dXJuIG5ldyBkYXRhLlN0cmluZyhuYW1lLCB2YWx1ZSwgb25DaGFuZ2UpXG4gICAgY2FzZSBcIm51bWJlclwiOlxuICAgICAgLy8gbm90ZTogaXQgZmFpbHMgZm9yIDEuMFxuICAgICAgaWYgKHZhbHVlID09PSArdmFsdWUgJiYgdmFsdWUgIT09ICh2YWx1ZSB8IDApKSB7XG4gICAgICAgIHJldHVybiBuZXcgZGF0YS5GbG9hdChuYW1lLCB2YWx1ZSwgb25DaGFuZ2UpXG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IGRhdGEuTnVtYmVyKG5hbWUsIHZhbHVlLCBvbkNoYW5nZSlcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIG5ldyBkYXRhLkpTT04obmFtZSwgdmFsdWUsIG9uQ2hhbmdlKVxuICB9XG59XG4iLCJ2YXIgU2VsZWN0b3IgPSByZXF1aXJlKFwiLi4vU2VsZWN0b3JcIilcblxuLyoqXG4gKiBSZWdpc3RlcnMgYW4gZXZlbnQgbGlzdGVuZXIgb24gYW4gZWxlbWVudFxuICogYW5kIHJldHVybnMgYSBkZWxlZ2F0b3IuXG4gKiBBIGRlbGVnYXRlZCBldmVudCBydW5zIG1hdGNoZXMgdG8gZmluZCBhbiBldmVudCB0YXJnZXQsXG4gKiB0aGVuIGV4ZWN1dGVzIHRoZSBoYW5kbGVyIHBhaXJlZCB3aXRoIHRoZSBtYXRjaGVyLlxuICogTWF0Y2hlcnMgY2FuIGNoZWNrIGlmIGFuIGV2ZW50IHRhcmdldCBtYXRjaGVzIGEgZ2l2ZW4gc2VsZWN0b3IsXG4gKiBvciBzZWUgaWYgYW4gb2YgaXRzIHBhcmVudHMgZG8uXG4gKiAqL1xubW9kdWxlLmV4cG9ydHMgPSBkZWxlZ2F0ZVxuXG5mdW5jdGlvbiBkZWxlZ2F0ZSggb3B0aW9ucyApe1xuICB2YXIgZWxlbWVudCA9IG9wdGlvbnMuZWxlbWVudFxuICAgICwgZXZlbnQgPSBvcHRpb25zLmV2ZW50XG4gICAgLCBjYXB0dXJlID0gISFvcHRpb25zLmNhcHR1cmUgfHwgZmFsc2VcbiAgICAsIGNvbnRleHQgPSBvcHRpb25zLmNvbnRleHQgfHwgZWxlbWVudFxuICAgICwgdHJhbnNmb3JtID0gb3B0aW9ucy50cmFuc2Zvcm0gfHwgbnVsbFxuXG4gIGlmKCAhZWxlbWVudCApe1xuICAgIGNvbnNvbGUubG9nKFwiQ2FuJ3QgZGVsZWdhdGUgdW5kZWZpbmVkIGVsZW1lbnRcIilcbiAgICByZXR1cm4gbnVsbFxuICB9XG4gIGlmKCAhZXZlbnQgKXtcbiAgICBjb25zb2xlLmxvZyhcIkNhbid0IGRlbGVnYXRlIHVuZGVmaW5lZCBldmVudFwiKVxuICAgIHJldHVybiBudWxsXG4gIH1cblxuICB2YXIgaGFuZGxlciA9IGNyZWF0ZUhhbmRsZXIoY29udGV4dCwgdHJhbnNmb3JtKVxuICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZXIsIGNhcHR1cmUpXG5cbiAgcmV0dXJuIGhhbmRsZXJcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgZGVsZWdhdG9yIHRoYXQgY2FuIGJlIHVzZWQgYXMgYW4gZXZlbnQgbGlzdGVuZXIuXG4gKiBUaGUgZGVsZWdhdG9yIGhhcyBzdGF0aWMgbWV0aG9kcyB3aGljaCBjYW4gYmUgdXNlZCB0byByZWdpc3RlciBoYW5kbGVycy5cbiAqICovXG5mdW5jdGlvbiBjcmVhdGVIYW5kbGVyKCBjb250ZXh0LCB0cmFuc2Zvcm0gKXtcbiAgdmFyIG1hdGNoZXJzID0gW11cblxuICBmdW5jdGlvbiBkZWxlZ2F0ZWRIYW5kbGVyKCBlICl7XG4gICAgdmFyIGwgPSBtYXRjaGVycy5sZW5ndGhcbiAgICBpZiggIWwgKXtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgdmFyIGVsID0gdGhpc1xuICAgICAgICAsIGkgPSAtMVxuICAgICAgICAsIGhhbmRsZXJcbiAgICAgICAgLCBzZWxlY3RvclxuICAgICAgICAsIGRlbGVnYXRlRWxlbWVudFxuICAgICAgICAsIHN0b3BQcm9wYWdhdGlvblxuICAgICAgICAsIGFyZ3NcblxuICAgIHdoaWxlKCArK2kgPCBsICl7XG4gICAgICBhcmdzID0gbWF0Y2hlcnNbaV1cbiAgICAgIGhhbmRsZXIgPSBhcmdzWzBdXG4gICAgICBzZWxlY3RvciA9IGFyZ3NbMV1cblxuICAgICAgZGVsZWdhdGVFbGVtZW50ID0gbWF0Y2hDYXB0dXJlUGF0aChzZWxlY3RvciwgZWwsIGUsIHRyYW5zZm9ybSwgY29udGV4dClcbiAgICAgIGlmKCBkZWxlZ2F0ZUVsZW1lbnQgJiYgZGVsZWdhdGVFbGVtZW50Lmxlbmd0aCApIHtcbiAgICAgICAgc3RvcFByb3BhZ2F0aW9uID0gZmFsc2UgPT09IGhhbmRsZXIuYXBwbHkoY29udGV4dCwgW2VdLmNvbmNhdChkZWxlZ2F0ZUVsZW1lbnQpKVxuICAgICAgICBpZiggc3RvcFByb3BhZ2F0aW9uICkge1xuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgYSBoYW5kbGVyIHdpdGggYSB0YXJnZXQgZmluZGVyIGxvZ2ljXG4gICAqICovXG4gIGRlbGVnYXRlZEhhbmRsZXIubWF0Y2ggPSBmdW5jdGlvbiggc2VsZWN0b3IsIGhhbmRsZXIgKXtcbiAgICBtYXRjaGVycy5wdXNoKFtoYW5kbGVyLCBzZWxlY3Rvcl0pXG4gICAgcmV0dXJuIGRlbGVnYXRlZEhhbmRsZXJcbiAgfVxuXG4gIHJldHVybiBkZWxlZ2F0ZWRIYW5kbGVyXG59XG5cbmZ1bmN0aW9uIG1hdGNoQ2FwdHVyZVBhdGgoIHNlbGVjdG9yLCBlbCwgZSwgdHJhbnNmb3JtLCBjb250ZXh0ICl7XG4gIHZhciBkZWxlZ2F0ZUVsZW1lbnRzID0gW11cbiAgdmFyIGRlbGVnYXRlRWxlbWVudCA9IG51bGxcbiAgaWYoIEFycmF5LmlzQXJyYXkoc2VsZWN0b3IpICl7XG4gICAgdmFyIGkgPSAtMVxuICAgIHZhciBsID0gc2VsZWN0b3IubGVuZ3RoXG4gICAgd2hpbGUoICsraSA8IGwgKXtcbiAgICAgIGRlbGVnYXRlRWxlbWVudCA9IGZpbmRQYXJlbnQoc2VsZWN0b3JbaV0sIGVsLCBlKVxuICAgICAgaWYoICFkZWxlZ2F0ZUVsZW1lbnQgKSByZXR1cm4gbnVsbFxuICAgICAgaWYgKHR5cGVvZiB0cmFuc2Zvcm0gPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGRlbGVnYXRlRWxlbWVudCA9IHRyYW5zZm9ybShjb250ZXh0LCBzZWxlY3RvciwgZGVsZWdhdGVFbGVtZW50KVxuICAgICAgfVxuICAgICAgZGVsZWdhdGVFbGVtZW50cy5wdXNoKGRlbGVnYXRlRWxlbWVudClcbiAgICB9XG4gIH1cbiAgZWxzZSB7XG4gICAgZGVsZWdhdGVFbGVtZW50ID0gZmluZFBhcmVudChzZWxlY3RvciwgZWwsIGUpXG4gICAgaWYoICFkZWxlZ2F0ZUVsZW1lbnQgKSByZXR1cm4gbnVsbFxuICAgIGlmICh0eXBlb2YgdHJhbnNmb3JtID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgZGVsZWdhdGVFbGVtZW50ID0gdHJhbnNmb3JtKGNvbnRleHQsIHNlbGVjdG9yLCBkZWxlZ2F0ZUVsZW1lbnQpXG4gICAgfVxuICAgIGRlbGVnYXRlRWxlbWVudHMucHVzaChkZWxlZ2F0ZUVsZW1lbnQpXG4gIH1cbiAgcmV0dXJuIGRlbGVnYXRlRWxlbWVudHNcbn1cblxuLyoqXG4gKiBDaGVjayBpZiB0aGUgdGFyZ2V0IG9yIGFueSBvZiBpdHMgcGFyZW50IG1hdGNoZXMgYSBzZWxlY3RvclxuICogKi9cbmZ1bmN0aW9uIGZpbmRQYXJlbnQoIHNlbGVjdG9yLCBlbCwgZSApe1xuICB2YXIgdGFyZ2V0ID0gZS50YXJnZXRcbiAgaWYgKHNlbGVjdG9yIGluc3RhbmNlb2YgU2VsZWN0b3IpIHtcbiAgICBzZWxlY3RvciA9IHNlbGVjdG9yLnRvU3RyaW5nKClcbiAgfVxuICBzd2l0Y2goIHR5cGVvZiBzZWxlY3RvciApe1xuICAgIGNhc2UgXCJzdHJpbmdcIjpcbiAgICAgIHdoaWxlKCB0YXJnZXQgJiYgdGFyZ2V0ICE9IGVsICl7XG4gICAgICAgIGlmKCB0YXJnZXQubWF0Y2hlcyAmJiB0YXJnZXQubWF0Y2hlcyhzZWxlY3RvcikgKSByZXR1cm4gdGFyZ2V0XG4gICAgICAgIHRhcmdldCA9IHRhcmdldC5wYXJlbnROb2RlXG4gICAgICB9XG4gICAgICBicmVha1xuICAgIGNhc2UgXCJmdW5jdGlvblwiOlxuICAgICAgd2hpbGUoIHRhcmdldCAmJiB0YXJnZXQgIT0gZWwgKXtcbiAgICAgICAgaWYoIHNlbGVjdG9yLmNhbGwoZWwsIHRhcmdldCkgKSByZXR1cm4gdGFyZ2V0XG4gICAgICAgIHRhcmdldCA9IHRhcmdldC5wYXJlbnROb2RlXG4gICAgICB9XG4gICAgICBicmVha1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gbnVsbFxuICB9XG4gIHJldHVybiBudWxsXG59XG4iLCJ2YXIgZXZlbnQgPSBtb2R1bGUuZXhwb3J0cyA9IHt9XG5cbmV2ZW50LmRlbGVnYXRlID0gcmVxdWlyZShcIi4vZGVsZWdhdGVcIilcbmV2ZW50Lm1pc3NjbGljayA9IHJlcXVpcmUoXCIuL21pc3NjbGlja1wiKVxuIiwibW9kdWxlLmV4cG9ydHMgPSBtaXNzY2xpY2tcblxudmFyIGVsZW1lbnRzID0gW11cbnZhciBsaXN0ZW5lcnMgPSBbXVxuXG5mdW5jdGlvbiBtaXNzY2xpY2sgKGVsZW1lbnQsIGNiKSB7XG4gIGlmIChpc1JlZ2lzdGVyZWQoZWxlbWVudCkpIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIHJlZ2lzdGVyKGVsZW1lbnQsIGNiKVxufVxuXG5mdW5jdGlvbiBpc1JlZ2lzdGVyZWQgKGVsZW1lbnQpIHtcbiAgcmV0dXJuICEhfmVsZW1lbnRzLmluZGV4T2YoZWxlbWVudClcbn1cblxuZnVuY3Rpb24gcmVnaXN0ZXIgKGVsZW1lbnQsIGNiKSB7XG4gIGZ1bmN0aW9uIGxpc3RlbmVyIChlKSB7XG4gICAgaWYgKCFpc1JlZ2lzdGVyZWQoZWxlbWVudCkpIHtcbiAgICAgIHJlbW92ZUxpc3RlbmVyKClcbiAgICB9XG4gICAgZWxzZSBpZiAoIWVsZW1lbnQuY29udGFpbnMoZS50YXJnZXQpICYmIGUudGFyZ2V0ICE9IGVsZW1lbnQpIHtcbiAgICAgIHJlbW92ZUxpc3RlbmVyKClcbiAgICAgIGNiICYmIGNiKGUpXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIgKCkge1xuICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGxpc3RlbmVyLCBmYWxzZSlcbiAgICBpZiAoaXNSZWdpc3RlcmVkKGVsZW1lbnQpKSB7XG4gICAgICBlbGVtZW50cy5zcGxpY2UoZWxlbWVudHMuaW5kZXhPZihlbGVtZW50KSwgMSlcbiAgICAgIGxpc3RlbmVycy5zcGxpY2UobGlzdGVuZXJzLmluZGV4T2YocmVtb3ZlTGlzdGVuZXIpLCAxKVxuICAgIH1cbiAgfVxuXG4gIGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGxpc3RlbmVyLCBmYWxzZSlcblxuICBlbGVtZW50cy5wdXNoKGVsZW1lbnQpXG4gIGxpc3RlbmVycy5wdXNoKHJlbW92ZUxpc3RlbmVyKVxufVxuXG5taXNzY2xpY2sucmVtb3ZlID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgaWYgKGlzUmVnaXN0ZXJlZChlbGVtZW50KSkge1xuICAgIGxpc3RlbmVyc1tlbGVtZW50cy5pbmRleE9mKGVsZW1lbnQpXSgpXG4gIH1cbn1cbiIsInZhciBkb20gPSBtb2R1bGUuZXhwb3J0cyA9IHt9XG5cbmRvbS5kYXRhID0gcmVxdWlyZShcIi4vZGF0YVwiKVxuZG9tLkRhdGEgPSByZXF1aXJlKFwiLi9EYXRhXCIpXG5kb20uZXZlbnQgPSByZXF1aXJlKFwiLi9ldmVudFwiKVxuZG9tLkZyYWdtZW50ID0gcmVxdWlyZShcIi4vRnJhZ21lbnRcIilcbmRvbS5TZWxlY3RvciA9IHJlcXVpcmUoXCIuL1NlbGVjdG9yXCIpXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXQgKENsYXNzLCBCYXNlKSB7XG4gIENsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQmFzZS5wcm90b3R5cGUpXG4gIENsYXNzLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IENsYXNzXG5cbiAgcmV0dXJuIENsYXNzXG59XG4iXX0=
