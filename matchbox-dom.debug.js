(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.matchboxDom = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = DomData

function DomData (name, defaultValue, onChange) {
  this.name = "data-"+name
  this.onChange = onChange || null
  this.default = defaultValue == null ? null : defaultValue
}

DomData.prototype.type = ""

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
  if (element.hasAttribute(this.name)) {
    return this.parse(element.getAttribute(this.name))
  }

  return this.default
}

DomData.prototype.set = function (element, value, context, silent) {
  if (!this.checkType(value)) {
    throw new TypeError("Can't set DomData "+this.type+" to '"+value+"'")
  }


  var hasValue = element.hasAttribute(this.name)
  var newStringValue = this.stringify(value)
  var prevStringValue = hasValue ? element.getAttribute(this.name) : null

  if (newStringValue === prevStringValue) {
    return
  }

  element.setAttribute(this.name, newStringValue)

  if (!silent) {
    var onChange = this.onChange
    if (onChange) {
      var previousValue = hasValue ? this.parse(prevStringValue) : null
      onChange.call(context, previousValue, value)
    }
  }
}

DomData.prototype.has = function (element) {
  return element.hasAttribute(this.name)
}

DomData.prototype.remove = function (element, context, silent) {
  if (!element.hasAttribute(this.name)) {
    return
  }

  var previousValue = element.hasAttribute(this.name)
      ? this.parse(element.getAttribute(this.name))
      : null

  element.removeAttribute(this.name)

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

Selector.prototype.from = function (element) {
  var s = this.clone()
  s.element = element
  return s
}

Selector.prototype.select = function (element, transform) {
  var result = element.querySelector(this.toString())
  return result
      ? transform ? transform(result) : result
      : null
}

Selector.prototype.selectAll = function (element, transform) {
  var result = element.querySelectorAll(this.toString())
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJEYXRhLmpzIiwiRnJhZ21lbnQuanMiLCJTZWxlY3Rvci5qcyIsImRhdGEvQm9vbGVhbkRhdGEuanMiLCJkYXRhL0Zsb2F0RGF0YS5qcyIsImRhdGEvSlNPTkRhdGEuanMiLCJkYXRhL051bWJlckRhdGEuanMiLCJkYXRhL1N0cmluZ0RhdGEuanMiLCJkYXRhL2luZGV4LmpzIiwiZXZlbnQvZGVsZWdhdGUuanMiLCJldmVudC9pbmRleC5qcyIsImV2ZW50L21pc3NjbGljay5qcyIsImluZGV4LmpzIiwibm9kZV9tb2R1bGVzL21hdGNoYm94LWZhY3RvcnkvaW5oZXJpdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gRG9tRGF0YVxuXG5mdW5jdGlvbiBEb21EYXRhIChuYW1lLCBkZWZhdWx0VmFsdWUsIG9uQ2hhbmdlKSB7XG4gIHRoaXMubmFtZSA9IFwiZGF0YS1cIituYW1lXG4gIHRoaXMub25DaGFuZ2UgPSBvbkNoYW5nZSB8fCBudWxsXG4gIHRoaXMuZGVmYXVsdCA9IGRlZmF1bHRWYWx1ZSA9PSBudWxsID8gbnVsbCA6IGRlZmF1bHRWYWx1ZVxufVxuXG5Eb21EYXRhLnByb3RvdHlwZS50eXBlID0gXCJcIlxuXG5Eb21EYXRhLnByb3RvdHlwZS5jaGVja1R5cGUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlICE9IG51bGxcbn1cblxuRG9tRGF0YS5wcm90b3R5cGUucGFyc2UgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlXG59XG5cbkRvbURhdGEucHJvdG90eXBlLnN0cmluZ2lmeSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gXCJcIit2YWx1ZVxufVxuXG5Eb21EYXRhLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICBpZiAoZWxlbWVudC5oYXNBdHRyaWJ1dGUodGhpcy5uYW1lKSkge1xuICAgIHJldHVybiB0aGlzLnBhcnNlKGVsZW1lbnQuZ2V0QXR0cmlidXRlKHRoaXMubmFtZSkpXG4gIH1cblxuICByZXR1cm4gdGhpcy5kZWZhdWx0XG59XG5cbkRvbURhdGEucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChlbGVtZW50LCB2YWx1ZSwgY29udGV4dCwgc2lsZW50KSB7XG4gIGlmICghdGhpcy5jaGVja1R5cGUodmFsdWUpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbid0IHNldCBEb21EYXRhIFwiK3RoaXMudHlwZStcIiB0byAnXCIrdmFsdWUrXCInXCIpXG4gIH1cblxuXG4gIHZhciBoYXNWYWx1ZSA9IGVsZW1lbnQuaGFzQXR0cmlidXRlKHRoaXMubmFtZSlcbiAgdmFyIG5ld1N0cmluZ1ZhbHVlID0gdGhpcy5zdHJpbmdpZnkodmFsdWUpXG4gIHZhciBwcmV2U3RyaW5nVmFsdWUgPSBoYXNWYWx1ZSA/IGVsZW1lbnQuZ2V0QXR0cmlidXRlKHRoaXMubmFtZSkgOiBudWxsXG5cbiAgaWYgKG5ld1N0cmluZ1ZhbHVlID09PSBwcmV2U3RyaW5nVmFsdWUpIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKHRoaXMubmFtZSwgbmV3U3RyaW5nVmFsdWUpXG5cbiAgaWYgKCFzaWxlbnQpIHtcbiAgICB2YXIgb25DaGFuZ2UgPSB0aGlzLm9uQ2hhbmdlXG4gICAgaWYgKG9uQ2hhbmdlKSB7XG4gICAgICB2YXIgcHJldmlvdXNWYWx1ZSA9IGhhc1ZhbHVlID8gdGhpcy5wYXJzZShwcmV2U3RyaW5nVmFsdWUpIDogbnVsbFxuICAgICAgb25DaGFuZ2UuY2FsbChjb250ZXh0LCBwcmV2aW91c1ZhbHVlLCB2YWx1ZSlcbiAgICB9XG4gIH1cbn1cblxuRG9tRGF0YS5wcm90b3R5cGUuaGFzID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgcmV0dXJuIGVsZW1lbnQuaGFzQXR0cmlidXRlKHRoaXMubmFtZSlcbn1cblxuRG9tRGF0YS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKGVsZW1lbnQsIGNvbnRleHQsIHNpbGVudCkge1xuICBpZiAoIWVsZW1lbnQuaGFzQXR0cmlidXRlKHRoaXMubmFtZSkpIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIHZhciBwcmV2aW91c1ZhbHVlID0gZWxlbWVudC5oYXNBdHRyaWJ1dGUodGhpcy5uYW1lKVxuICAgICAgPyB0aGlzLnBhcnNlKGVsZW1lbnQuZ2V0QXR0cmlidXRlKHRoaXMubmFtZSkpXG4gICAgICA6IG51bGxcblxuICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSh0aGlzLm5hbWUpXG5cbiAgaWYgKCFzaWxlbnQpIHtcbiAgICB2YXIgb25DaGFuZ2UgPSB0aGlzLm9uQ2hhbmdlXG4gICAgaWYgKG9uQ2hhbmdlKSB7XG4gICAgICBvbkNoYW5nZS5jYWxsKGNvbnRleHQsIHByZXZpb3VzVmFsdWUsIG51bGwpXG4gICAgfVxuICB9XG59XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gRnJhZ21lbnRcblxuZnVuY3Rpb24gRnJhZ21lbnQgKGZyYWdtZW50KSB7XG4gIGZyYWdtZW50ID0gZnJhZ21lbnQgfHwge31cbiAgdGhpcy5odG1sID0gZnJhZ21lbnQuaHRtbCB8fCBcIlwiXG4gIHRoaXMuZmlyc3QgPSBmcmFnbWVudC5maXJzdCA9PSB1bmRlZmluZWQgfHwgISFmcmFnbWVudC5maXJzdFxuICB0aGlzLnRpbWVvdXQgPSBmcmFnbWVudC50aW1lb3V0IHx8IDIwMDBcbn1cblxuRnJhZ21lbnQucHJvdG90eXBlLmNyZWF0ZSA9IGZ1bmN0aW9uIChodG1sKSB7XG4gIHZhciB0ZW1wID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcblxuICB0ZW1wLmlubmVySFRNTCA9IGh0bWwgfHwgdGhpcy5odG1sXG5cbiAgaWYgKHRoaXMuZmlyc3QgPT09IHVuZGVmaW5lZCB8fCB0aGlzLmZpcnN0KSB7XG4gICAgcmV0dXJuIHRlbXAuY2hpbGRyZW5bMF1cbiAgfVxuXG4gIHZhciBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKVxuICB3aGlsZSAodGVtcC5jaGlsZE5vZGVzLmxlbmd0aCkge1xuICAgIGZyYWdtZW50LmFwcGVuZENoaWxkKHRlbXAuZmlyc3RDaGlsZClcbiAgfVxuXG4gIHJldHVybiBmcmFnbWVudDtcbn1cblxuRnJhZ21lbnQucHJvdG90eXBlLmNvbXBpbGUgPSBmdW5jdGlvbiAoaHRtbCwgb3B0aW9ucywgY2IpIHtcbiAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgY2IobnVsbCwgaHRtbClcbiAgfSwgNClcbn1cblxuRnJhZ21lbnQucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIChjb250ZXh0LCBvcHRpb25zKSB7XG4gIHZhciBmcmFnbWVudCA9IHRoaXNcbiAgY29udGV4dCA9IGNvbnRleHQgfHwge31cblxuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgIHZhciByZXNvbHZlZCA9IGZhbHNlXG4gICAgdmFyIGlkID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICByZWplY3QobmV3IEVycm9yKFwiUmVuZGVyIHRpbWVkIG91dFwiKSlcbiAgICB9LCBmcmFnbWVudC50aW1lb3V0KVxuXG4gICAgdHJ5IHtcbiAgICAgIGZyYWdtZW50LmNvbXBpbGUoY29udGV4dCwgb3B0aW9ucywgZnVuY3Rpb24gKGVyciwgcmVuZGVyZWQpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGlkKVxuICAgICAgICBpZiAocmVzb2x2ZWQpIHJldHVyblxuXG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHJlc29sdmUoZnJhZ21lbnQuY3JlYXRlKHJlbmRlcmVkKSlcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgIHJlamVjdChlKVxuICAgIH1cbiAgfSlcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gU2VsZWN0b3JcblxuU2VsZWN0b3IuREVGQVVMVF9ORVNUX1NFUEFSQVRPUiA9IFwiOlwiXG5cbmZ1bmN0aW9uIFNlbGVjdG9yIChzZWxlY3Rvcikge1xuICBzZWxlY3RvciA9IHNlbGVjdG9yIHx8IHt9XG4gIHRoaXMuYXR0cmlidXRlID0gc2VsZWN0b3IuYXR0cmlidXRlIHx8IFwiXCJcbiAgdGhpcy52YWx1ZSA9IHNlbGVjdG9yLnZhbHVlIHx8IG51bGxcbiAgdGhpcy5vcGVyYXRvciA9IHNlbGVjdG9yLm9wZXJhdG9yIHx8IFwiPVwiXG4gIHRoaXMuZXh0cmEgPSBzZWxlY3Rvci5leHRyYSB8fCBcIlwiXG5cbiAgdGhpcy5lbGVtZW50ID0gc2VsZWN0b3IuZWxlbWVudCB8fCBudWxsXG5cbiAgdGhpcy5Db25zdHJ1Y3RvciA9IHNlbGVjdG9yLkNvbnN0cnVjdG9yIHx8IG51bGxcbiAgdGhpcy5pbnN0YW50aWF0ZSA9IHNlbGVjdG9yLmluc3RhbnRpYXRlIHx8IG51bGxcbiAgdGhpcy5tdWx0aXBsZSA9IHNlbGVjdG9yLm11bHRpcGxlICE9IG51bGwgPyAhIXNlbGVjdG9yLm11bHRpcGxlIDogZmFsc2VcblxuICB0aGlzLm1hdGNoZXIgPSBzZWxlY3Rvci5tYXRjaGVyIHx8IG51bGxcbn1cblxuU2VsZWN0b3IucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gbmV3IFNlbGVjdG9yKHRoaXMpXG59XG5cblNlbGVjdG9yLnByb3RvdHlwZS5jb21iaW5lID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gIHZhciBzID0gdGhpcy5jbG9uZSgpXG4gIHMuZXh0cmEgKz0gc2VsZWN0b3IudG9TdHJpbmcoKVxuICByZXR1cm4gc1xufVxuXG5TZWxlY3Rvci5wcm90b3R5cGUuZXF1YWwgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgdmFyIHMgPSB0aGlzLmNsb25lKClcbiAgcy5vcGVyYXRvciA9IFwiPVwiXG4gIHMudmFsdWUgPSB2YWx1ZVxuICByZXR1cm4gc1xufVxuXG5TZWxlY3Rvci5wcm90b3R5cGUuY29udGFpbnMgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgdmFyIHMgPSB0aGlzLmNsb25lKClcbiAgcy5vcGVyYXRvciA9IFwifj1cIlxuICBzLnZhbHVlID0gdmFsdWVcbiAgcmV0dXJuIHNcbn1cblxuU2VsZWN0b3IucHJvdG90eXBlLnByZWZpeCA9IGZ1bmN0aW9uIChwcmUsIHNlcGFyYXRvcikge1xuICB2YXIgcyA9IHRoaXMuY2xvbmUoKVxuICB2YXIgc2VwID0gcy52YWx1ZSA/IHNlcGFyYXRvciB8fCBTZWxlY3Rvci5ERUZBVUxUX05FU1RfU0VQQVJBVE9SIDogXCJcIlxuICBzLnZhbHVlID0gcHJlICsgc2VwICsgcy52YWx1ZVxuICByZXR1cm4gc1xufVxuXG5TZWxlY3Rvci5wcm90b3R5cGUubmVzdCA9IGZ1bmN0aW9uIChwb3N0LCBzZXBhcmF0b3IpIHtcbiAgdmFyIHMgPSB0aGlzLmNsb25lKClcbiAgdmFyIHNlcCA9IHMudmFsdWUgPyBzZXBhcmF0b3IgfHwgU2VsZWN0b3IuREVGQVVMVF9ORVNUX1NFUEFSQVRPUiA6IFwiXCJcbiAgcy52YWx1ZSArPSBzZXAgKyBwb3N0XG4gIHJldHVybiBzXG59XG5cblNlbGVjdG9yLnByb3RvdHlwZS5mcm9tID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgdmFyIHMgPSB0aGlzLmNsb25lKClcbiAgcy5lbGVtZW50ID0gZWxlbWVudFxuICByZXR1cm4gc1xufVxuXG5TZWxlY3Rvci5wcm90b3R5cGUuc2VsZWN0ID0gZnVuY3Rpb24gKGVsZW1lbnQsIHRyYW5zZm9ybSkge1xuICB2YXIgcmVzdWx0ID0gZWxlbWVudC5xdWVyeVNlbGVjdG9yKHRoaXMudG9TdHJpbmcoKSlcbiAgcmV0dXJuIHJlc3VsdFxuICAgICAgPyB0cmFuc2Zvcm0gPyB0cmFuc2Zvcm0ocmVzdWx0KSA6IHJlc3VsdFxuICAgICAgOiBudWxsXG59XG5cblNlbGVjdG9yLnByb3RvdHlwZS5zZWxlY3RBbGwgPSBmdW5jdGlvbiAoZWxlbWVudCwgdHJhbnNmb3JtKSB7XG4gIHZhciByZXN1bHQgPSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwodGhpcy50b1N0cmluZygpKVxuICByZXR1cm4gdHJhbnNmb3JtID8gW10ubWFwLmNhbGwocmVzdWx0LCB0cmFuc2Zvcm0pIDogW10uc2xpY2UuY2FsbChyZXN1bHQpXG59XG5cblNlbGVjdG9yLnByb3RvdHlwZS5ub2RlID0gZnVuY3Rpb24gKHRyYW5zZm9ybSkge1xuICByZXR1cm4gdGhpcy5zZWxlY3QodGhpcy5lbGVtZW50LCB0cmFuc2Zvcm0pXG59XG5cblNlbGVjdG9yLnByb3RvdHlwZS5ub2RlTGlzdCA9IGZ1bmN0aW9uICh0cmFuc2Zvcm0pIHtcbiAgcmV0dXJuIHRoaXMuc2VsZWN0QWxsKHRoaXMuZWxlbWVudCwgdHJhbnNmb3JtKVxufVxuXG5TZWxlY3Rvci5wcm90b3R5cGUuY29uc3RydWN0ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgQ29uc3RydWN0b3IgPSB0aGlzLkNvbnN0cnVjdG9yXG4gIHZhciBpbnN0YW50aWF0ZSA9IHRoaXMuaW5zdGFudGlhdGUgfHwgZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICByZXR1cm4gbmV3IENvbnN0cnVjdG9yKGVsZW1lbnQpXG4gIH1cbiAgaWYgKHRoaXMubXVsdGlwbGUpIHtcbiAgICByZXR1cm4gdGhpcy5ub2RlTGlzdCgpLm1hcChpbnN0YW50aWF0ZSlcbiAgfVxuICBlbHNlIHtcbiAgICByZXR1cm4gdGhpcy5ub2RlKGluc3RhbnRpYXRlKVxuICB9XG59XG5cblNlbGVjdG9yLnByb3RvdHlwZS5maW5kID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5Db25zdHJ1Y3RvciB8fCB0aGlzLmluc3RhbnRpYXRlKSB7XG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0KClcbiAgfVxuICBpZiAodGhpcy5tdWx0aXBsZSkge1xuICAgIHJldHVybiB0aGlzLm5vZGVMaXN0KClcbiAgfVxuICBlbHNlIHtcbiAgICByZXR1cm4gdGhpcy5ub2RlKClcbiAgfVxufVxuXG5TZWxlY3Rvci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBzdHJpbmcgPSBcIlwiXG4gIHZhciB2YWx1ZSA9IHRoaXMudmFsdWVcbiAgdmFyIGF0dHJpYnV0ZSA9IHRoaXMuYXR0cmlidXRlXG4gIHZhciBleHRyYSA9IHRoaXMuZXh0cmEgfHwgXCJcIlxuXG4gIHN3aXRjaCAoYXR0cmlidXRlKSB7XG4gICAgY2FzZSBcImlkXCI6XG4gICAgICAgIHN0cmluZyA9IFwiI1wiICsgdmFsdWVcbiAgICAgIGJyZWFrXG4gICAgY2FzZSBcImNsYXNzXCI6XG4gICAgICBzdHJpbmcgPSBcIi5cIiArIHZhbHVlXG4gICAgICBicmVha1xuICAgIGNhc2UgXCJcIjpcbiAgICAgIHN0cmluZyA9IHZhbHVlIHx8IFwiXCJcbiAgICAgIGJyZWFrXG4gICAgZGVmYXVsdDpcbiAgICAgIHZhbHVlID0gdmFsdWUgPT09IFwiXCIgfHwgdmFsdWUgPT09IHRydWUgfHwgdmFsdWUgPT09IGZhbHNlIHx8IHZhbHVlID09IG51bGxcbiAgICAgICAgPyBcIlwiXG4gICAgICAgIDogJ1wiJyArIHZhbHVlICsgJ1wiJ1xuICAgICAgdmFyIG9wZXJhdG9yID0gdmFsdWUgPyB0aGlzLm9wZXJhdG9yIHx8IFwiPVwiIDogXCJcIlxuICAgICAgc3RyaW5nID0gXCJbXCIgKyBhdHRyaWJ1dGUgKyBvcGVyYXRvciArIHZhbHVlICsgXCJdXCJcbiAgfVxuXG4gIHN0cmluZyArPSBleHRyYVxuXG4gIHJldHVybiBzdHJpbmdcbn1cbiIsInZhciBpbmhlcml0ID0gcmVxdWlyZShcIm1hdGNoYm94LWZhY3RvcnkvaW5oZXJpdFwiKVxudmFyIERhdGEgPSByZXF1aXJlKFwiLi4vRGF0YVwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEJvb2xlYW5EYXRhXG5cbmZ1bmN0aW9uIEJvb2xlYW5EYXRhIChuYW1lLCBkZWZhdWx0VmFsdWUsIG9uQ2hhbmdlKSB7XG4gIERhdGEuY2FsbCh0aGlzLCBuYW1lLCBkZWZhdWx0VmFsdWUsIG9uQ2hhbmdlKVxufVxuXG5pbmhlcml0KEJvb2xlYW5EYXRhLCBEYXRhKVxuXG5Cb29sZWFuRGF0YS5wcm90b3R5cGUudHlwZSA9IFwiQm9vbGVhblwiXG5cbkJvb2xlYW5EYXRhLnByb3RvdHlwZS5jaGVja1R5cGUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PSBcImJvb2xlYW5cIlxufVxuXG5Cb29sZWFuRGF0YS5wcm90b3R5cGUucGFyc2UgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlID09PSBcInRydWVcIlxufVxuXG5Cb29sZWFuRGF0YS5wcm90b3R5cGUuc3RyaW5naWZ5ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSA/IFwidHJ1ZVwiIDogXCJmYWxzZVwiXG59XG4iLCJ2YXIgaW5oZXJpdCA9IHJlcXVpcmUoXCJtYXRjaGJveC1mYWN0b3J5L2luaGVyaXRcIilcbnZhciBEYXRhID0gcmVxdWlyZShcIi4uL0RhdGFcIilcblxubW9kdWxlLmV4cG9ydHMgPSBGbG9hdERhdGFcblxuZnVuY3Rpb24gRmxvYXREYXRhIChuYW1lLCBkZWZhdWx0VmFsdWUsIG9uQ2hhbmdlKSB7XG4gIERhdGEuY2FsbCh0aGlzLCBuYW1lLCBkZWZhdWx0VmFsdWUsIG9uQ2hhbmdlKVxufVxuXG5pbmhlcml0KEZsb2F0RGF0YSwgRGF0YSlcblxuRmxvYXREYXRhLnByb3RvdHlwZS50eXBlID0gXCJmbG9hdFwiXG5cbkZsb2F0RGF0YS5wcm90b3R5cGUuY2hlY2tUeXBlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gXCJudW1iZXJcIlxufVxuXG5GbG9hdERhdGEucHJvdG90eXBlLnBhcnNlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiBwYXJzZUZsb2F0KHZhbHVlKVxufVxuXG5GbG9hdERhdGEucHJvdG90eXBlLnN0cmluZ2lmeSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gXCJcIit2YWx1ZVxufVxuIiwidmFyIGluaGVyaXQgPSByZXF1aXJlKFwibWF0Y2hib3gtZmFjdG9yeS9pbmhlcml0XCIpXG52YXIgRGF0YSA9IHJlcXVpcmUoXCIuLi9EYXRhXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gSlNPTkRhdGFcblxuZnVuY3Rpb24gSlNPTkRhdGEgKG5hbWUsIGRlZmF1bHRWYWx1ZSwgb25DaGFuZ2UpIHtcbiAgRGF0YS5jYWxsKHRoaXMsIG5hbWUsIGRlZmF1bHRWYWx1ZSwgb25DaGFuZ2UpXG59XG5cbmluaGVyaXQoSlNPTkRhdGEsIERhdGEpXG5cbkpTT05EYXRhLnByb3RvdHlwZS50eXBlID0gXCJqc29uXCJcblxuSlNPTkRhdGEucHJvdG90eXBlLmNoZWNrVHlwZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgIT0gbnVsbFxufVxuXG5KU09ORGF0YS5wcm90b3R5cGUucGFyc2UgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgcmV0dXJuIEpTT04ucGFyc2UodmFsdWUpXG59XG5cbkpTT05EYXRhLnByb3RvdHlwZS5zdHJpbmdpZnkgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHZhbHVlKVxufVxuIiwidmFyIGluaGVyaXQgPSByZXF1aXJlKFwibWF0Y2hib3gtZmFjdG9yeS9pbmhlcml0XCIpXG52YXIgRGF0YSA9IHJlcXVpcmUoXCIuLi9EYXRhXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gTnVtYmVyRGF0YVxuXG5mdW5jdGlvbiBOdW1iZXJEYXRhIChuYW1lLCBkZWZhdWx0VmFsdWUsIG9uQ2hhbmdlKSB7XG4gIERhdGEuY2FsbCh0aGlzLCBuYW1lLCBkZWZhdWx0VmFsdWUsIG9uQ2hhbmdlKVxufVxuXG5pbmhlcml0KE51bWJlckRhdGEsIERhdGEpXG5cbk51bWJlckRhdGEucHJvdG90eXBlLnR5cGUgPSBcIm51bWJlclwiXG5cbk51bWJlckRhdGEucHJvdG90eXBlLmNoZWNrVHlwZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09IFwibnVtYmVyXCJcbn1cblxuTnVtYmVyRGF0YS5wcm90b3R5cGUucGFyc2UgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgcmV0dXJuIHBhcnNlSW50KHZhbHVlLCAxMClcbn1cblxuTnVtYmVyRGF0YS5wcm90b3R5cGUuc3RyaW5naWZ5ID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiBcIlwiK3ZhbHVlXG59XG4iLCJ2YXIgaW5oZXJpdCA9IHJlcXVpcmUoXCJtYXRjaGJveC1mYWN0b3J5L2luaGVyaXRcIilcbnZhciBEYXRhID0gcmVxdWlyZShcIi4uL0RhdGFcIilcblxubW9kdWxlLmV4cG9ydHMgPSBTdHJpbmdEYXRhXG5cbmZ1bmN0aW9uIFN0cmluZ0RhdGEgKG5hbWUsIGRlZmF1bHRWYWx1ZSwgb25DaGFuZ2UpIHtcbiAgRGF0YS5jYWxsKHRoaXMsIG5hbWUsIGRlZmF1bHRWYWx1ZSwgb25DaGFuZ2UpXG59XG5cbmluaGVyaXQoU3RyaW5nRGF0YSwgRGF0YSlcblxuU3RyaW5nRGF0YS5wcm90b3R5cGUudHlwZSA9IFwic3RyaW5nXCJcblxuU3RyaW5nRGF0YS5wcm90b3R5cGUuY2hlY2tUeXBlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gXCJzdHJpbmdcIlxufVxuXG5TdHJpbmdEYXRhLnByb3RvdHlwZS5wYXJzZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgPyBcIlwiK3ZhbHVlIDogXCJcIlxufVxuXG5TdHJpbmdEYXRhLnByb3RvdHlwZS5zdHJpbmdpZnkgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlID8gXCJcIit2YWx1ZSA6IFwiXCJcbn1cbiIsInZhciBkYXRhID0gbW9kdWxlLmV4cG9ydHMgPSB7fVxuXG5kYXRhLkJvb2xlYW4gPSByZXF1aXJlKFwiLi9Cb29sZWFuRGF0YVwiKVxuZGF0YS5TdHJpbmcgPSByZXF1aXJlKFwiLi9TdHJpbmdEYXRhXCIpXG5kYXRhLk51bWJlciA9IHJlcXVpcmUoXCIuL051bWJlckRhdGFcIilcbmRhdGEuRmxvYXQgPSByZXF1aXJlKFwiLi9GbG9hdERhdGFcIilcbmRhdGEuSlNPTiA9IHJlcXVpcmUoXCIuL0pTT05EYXRhXCIpXG4iLCJ2YXIgU2VsZWN0b3IgPSByZXF1aXJlKFwiLi4vU2VsZWN0b3JcIilcblxuLyoqXG4gKiBSZWdpc3RlcnMgYW4gZXZlbnQgbGlzdGVuZXIgb24gYW4gZWxlbWVudFxuICogYW5kIHJldHVybnMgYSBkZWxlZ2F0b3IuXG4gKiBBIGRlbGVnYXRlZCBldmVudCBydW5zIG1hdGNoZXMgdG8gZmluZCBhbiBldmVudCB0YXJnZXQsXG4gKiB0aGVuIGV4ZWN1dGVzIHRoZSBoYW5kbGVyIHBhaXJlZCB3aXRoIHRoZSBtYXRjaGVyLlxuICogTWF0Y2hlcnMgY2FuIGNoZWNrIGlmIGFuIGV2ZW50IHRhcmdldCBtYXRjaGVzIGEgZ2l2ZW4gc2VsZWN0b3IsXG4gKiBvciBzZWUgaWYgYW4gb2YgaXRzIHBhcmVudHMgZG8uXG4gKiAqL1xubW9kdWxlLmV4cG9ydHMgPSBkZWxlZ2F0ZVxuXG5mdW5jdGlvbiBkZWxlZ2F0ZSggb3B0aW9ucyApe1xuICB2YXIgZWxlbWVudCA9IG9wdGlvbnMuZWxlbWVudFxuICAgICwgZXZlbnQgPSBvcHRpb25zLmV2ZW50XG4gICAgLCBjYXB0dXJlID0gISFvcHRpb25zLmNhcHR1cmUgfHwgZmFsc2VcbiAgICAsIGNvbnRleHQgPSBvcHRpb25zLmNvbnRleHQgfHwgZWxlbWVudFxuICAgICwgdHJhbnNmb3JtID0gb3B0aW9ucy50cmFuc2Zvcm0gfHwgbnVsbFxuXG4gIGlmKCAhZWxlbWVudCApe1xuICAgIGNvbnNvbGUubG9nKFwiQ2FuJ3QgZGVsZWdhdGUgdW5kZWZpbmVkIGVsZW1lbnRcIilcbiAgICByZXR1cm4gbnVsbFxuICB9XG4gIGlmKCAhZXZlbnQgKXtcbiAgICBjb25zb2xlLmxvZyhcIkNhbid0IGRlbGVnYXRlIHVuZGVmaW5lZCBldmVudFwiKVxuICAgIHJldHVybiBudWxsXG4gIH1cblxuICB2YXIgaGFuZGxlciA9IGNyZWF0ZUhhbmRsZXIoY29udGV4dCwgdHJhbnNmb3JtKVxuICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZXIsIGNhcHR1cmUpXG5cbiAgcmV0dXJuIGhhbmRsZXJcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgZGVsZWdhdG9yIHRoYXQgY2FuIGJlIHVzZWQgYXMgYW4gZXZlbnQgbGlzdGVuZXIuXG4gKiBUaGUgZGVsZWdhdG9yIGhhcyBzdGF0aWMgbWV0aG9kcyB3aGljaCBjYW4gYmUgdXNlZCB0byByZWdpc3RlciBoYW5kbGVycy5cbiAqICovXG5mdW5jdGlvbiBjcmVhdGVIYW5kbGVyKCBjb250ZXh0LCB0cmFuc2Zvcm0gKXtcbiAgdmFyIG1hdGNoZXJzID0gW11cblxuICBmdW5jdGlvbiBkZWxlZ2F0ZWRIYW5kbGVyKCBlICl7XG4gICAgdmFyIGwgPSBtYXRjaGVycy5sZW5ndGhcbiAgICBpZiggIWwgKXtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgdmFyIGVsID0gdGhpc1xuICAgICAgICAsIGkgPSAtMVxuICAgICAgICAsIGhhbmRsZXJcbiAgICAgICAgLCBzZWxlY3RvclxuICAgICAgICAsIGRlbGVnYXRlRWxlbWVudFxuICAgICAgICAsIHN0b3BQcm9wYWdhdGlvblxuICAgICAgICAsIGFyZ3NcblxuICAgIHdoaWxlKCArK2kgPCBsICl7XG4gICAgICBhcmdzID0gbWF0Y2hlcnNbaV1cbiAgICAgIGhhbmRsZXIgPSBhcmdzWzBdXG4gICAgICBzZWxlY3RvciA9IGFyZ3NbMV1cblxuICAgICAgZGVsZWdhdGVFbGVtZW50ID0gbWF0Y2hDYXB0dXJlUGF0aChzZWxlY3RvciwgZWwsIGUsIHRyYW5zZm9ybSwgY29udGV4dClcbiAgICAgIGlmKCBkZWxlZ2F0ZUVsZW1lbnQgJiYgZGVsZWdhdGVFbGVtZW50Lmxlbmd0aCApIHtcbiAgICAgICAgc3RvcFByb3BhZ2F0aW9uID0gZmFsc2UgPT09IGhhbmRsZXIuYXBwbHkoY29udGV4dCwgW2VdLmNvbmNhdChkZWxlZ2F0ZUVsZW1lbnQpKVxuICAgICAgICBpZiggc3RvcFByb3BhZ2F0aW9uICkge1xuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgYSBoYW5kbGVyIHdpdGggYSB0YXJnZXQgZmluZGVyIGxvZ2ljXG4gICAqICovXG4gIGRlbGVnYXRlZEhhbmRsZXIubWF0Y2ggPSBmdW5jdGlvbiggc2VsZWN0b3IsIGhhbmRsZXIgKXtcbiAgICBtYXRjaGVycy5wdXNoKFtoYW5kbGVyLCBzZWxlY3Rvcl0pXG4gICAgcmV0dXJuIGRlbGVnYXRlZEhhbmRsZXJcbiAgfVxuXG4gIHJldHVybiBkZWxlZ2F0ZWRIYW5kbGVyXG59XG5cbmZ1bmN0aW9uIG1hdGNoQ2FwdHVyZVBhdGgoIHNlbGVjdG9yLCBlbCwgZSwgdHJhbnNmb3JtLCBjb250ZXh0ICl7XG4gIHZhciBkZWxlZ2F0ZUVsZW1lbnRzID0gW11cbiAgdmFyIGRlbGVnYXRlRWxlbWVudCA9IG51bGxcbiAgaWYoIEFycmF5LmlzQXJyYXkoc2VsZWN0b3IpICl7XG4gICAgdmFyIGkgPSAtMVxuICAgIHZhciBsID0gc2VsZWN0b3IubGVuZ3RoXG4gICAgd2hpbGUoICsraSA8IGwgKXtcbiAgICAgIGRlbGVnYXRlRWxlbWVudCA9IGZpbmRQYXJlbnQoc2VsZWN0b3JbaV0sIGVsLCBlKVxuICAgICAgaWYoICFkZWxlZ2F0ZUVsZW1lbnQgKSByZXR1cm4gbnVsbFxuICAgICAgaWYgKHR5cGVvZiB0cmFuc2Zvcm0gPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGRlbGVnYXRlRWxlbWVudCA9IHRyYW5zZm9ybShjb250ZXh0LCBzZWxlY3RvciwgZGVsZWdhdGVFbGVtZW50KVxuICAgICAgfVxuICAgICAgZGVsZWdhdGVFbGVtZW50cy5wdXNoKGRlbGVnYXRlRWxlbWVudClcbiAgICB9XG4gIH1cbiAgZWxzZSB7XG4gICAgZGVsZWdhdGVFbGVtZW50ID0gZmluZFBhcmVudChzZWxlY3RvciwgZWwsIGUpXG4gICAgaWYoICFkZWxlZ2F0ZUVsZW1lbnQgKSByZXR1cm4gbnVsbFxuICAgIGlmICh0eXBlb2YgdHJhbnNmb3JtID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgZGVsZWdhdGVFbGVtZW50ID0gdHJhbnNmb3JtKGNvbnRleHQsIHNlbGVjdG9yLCBkZWxlZ2F0ZUVsZW1lbnQpXG4gICAgfVxuICAgIGRlbGVnYXRlRWxlbWVudHMucHVzaChkZWxlZ2F0ZUVsZW1lbnQpXG4gIH1cbiAgcmV0dXJuIGRlbGVnYXRlRWxlbWVudHNcbn1cblxuLyoqXG4gKiBDaGVjayBpZiB0aGUgdGFyZ2V0IG9yIGFueSBvZiBpdHMgcGFyZW50IG1hdGNoZXMgYSBzZWxlY3RvclxuICogKi9cbmZ1bmN0aW9uIGZpbmRQYXJlbnQoIHNlbGVjdG9yLCBlbCwgZSApe1xuICB2YXIgdGFyZ2V0ID0gZS50YXJnZXRcbiAgaWYgKHNlbGVjdG9yIGluc3RhbmNlb2YgU2VsZWN0b3IpIHtcbiAgICBzZWxlY3RvciA9IHNlbGVjdG9yLnRvU3RyaW5nKClcbiAgfVxuICBzd2l0Y2goIHR5cGVvZiBzZWxlY3RvciApe1xuICAgIGNhc2UgXCJzdHJpbmdcIjpcbiAgICAgIHdoaWxlKCB0YXJnZXQgJiYgdGFyZ2V0ICE9IGVsICl7XG4gICAgICAgIGlmKCB0YXJnZXQubWF0Y2hlcyAmJiB0YXJnZXQubWF0Y2hlcyhzZWxlY3RvcikgKSByZXR1cm4gdGFyZ2V0XG4gICAgICAgIHRhcmdldCA9IHRhcmdldC5wYXJlbnROb2RlXG4gICAgICB9XG4gICAgICBicmVha1xuICAgIGNhc2UgXCJmdW5jdGlvblwiOlxuICAgICAgd2hpbGUoIHRhcmdldCAmJiB0YXJnZXQgIT0gZWwgKXtcbiAgICAgICAgaWYoIHNlbGVjdG9yLmNhbGwoZWwsIHRhcmdldCkgKSByZXR1cm4gdGFyZ2V0XG4gICAgICAgIHRhcmdldCA9IHRhcmdldC5wYXJlbnROb2RlXG4gICAgICB9XG4gICAgICBicmVha1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gbnVsbFxuICB9XG4gIHJldHVybiBudWxsXG59XG4iLCJ2YXIgZXZlbnQgPSBtb2R1bGUuZXhwb3J0cyA9IHt9XG5cbmV2ZW50LmRlbGVnYXRlID0gcmVxdWlyZShcIi4vZGVsZWdhdGVcIilcbmV2ZW50Lm1pc3NjbGljayA9IHJlcXVpcmUoXCIuL21pc3NjbGlja1wiKVxuIiwibW9kdWxlLmV4cG9ydHMgPSBtaXNzY2xpY2tcblxudmFyIGVsZW1lbnRzID0gW11cbnZhciBsaXN0ZW5lcnMgPSBbXVxuXG5mdW5jdGlvbiBtaXNzY2xpY2sgKGVsZW1lbnQsIGNiKSB7XG4gIGlmIChpc1JlZ2lzdGVyZWQoZWxlbWVudCkpIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIHJlZ2lzdGVyKGVsZW1lbnQsIGNiKVxufVxuXG5mdW5jdGlvbiBpc1JlZ2lzdGVyZWQgKGVsZW1lbnQpIHtcbiAgcmV0dXJuICEhfmVsZW1lbnRzLmluZGV4T2YoZWxlbWVudClcbn1cblxuZnVuY3Rpb24gcmVnaXN0ZXIgKGVsZW1lbnQsIGNiKSB7XG4gIGZ1bmN0aW9uIGxpc3RlbmVyIChlKSB7XG4gICAgaWYgKCFpc1JlZ2lzdGVyZWQoZWxlbWVudCkpIHtcbiAgICAgIHJlbW92ZUxpc3RlbmVyKClcbiAgICB9XG4gICAgZWxzZSBpZiAoIWVsZW1lbnQuY29udGFpbnMoZS50YXJnZXQpICYmIGUudGFyZ2V0ICE9IGVsZW1lbnQpIHtcbiAgICAgIHJlbW92ZUxpc3RlbmVyKClcbiAgICAgIGNiICYmIGNiKGUpXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIgKCkge1xuICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGxpc3RlbmVyLCBmYWxzZSlcbiAgICBpZiAoaXNSZWdpc3RlcmVkKGVsZW1lbnQpKSB7XG4gICAgICBlbGVtZW50cy5zcGxpY2UoZWxlbWVudHMuaW5kZXhPZihlbGVtZW50KSwgMSlcbiAgICAgIGxpc3RlbmVycy5zcGxpY2UobGlzdGVuZXJzLmluZGV4T2YocmVtb3ZlTGlzdGVuZXIpLCAxKVxuICAgIH1cbiAgfVxuXG4gIGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGxpc3RlbmVyLCBmYWxzZSlcblxuICBlbGVtZW50cy5wdXNoKGVsZW1lbnQpXG4gIGxpc3RlbmVycy5wdXNoKHJlbW92ZUxpc3RlbmVyKVxufVxuXG5taXNzY2xpY2sucmVtb3ZlID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgaWYgKGlzUmVnaXN0ZXJlZChlbGVtZW50KSkge1xuICAgIGxpc3RlbmVyc1tlbGVtZW50cy5pbmRleE9mKGVsZW1lbnQpXSgpXG4gIH1cbn1cbiIsInZhciBkb20gPSBtb2R1bGUuZXhwb3J0cyA9IHt9XG5cbmRvbS5kYXRhID0gcmVxdWlyZShcIi4vZGF0YVwiKVxuZG9tLkRhdGEgPSByZXF1aXJlKFwiLi9EYXRhXCIpXG5kb20uZXZlbnQgPSByZXF1aXJlKFwiLi9ldmVudFwiKVxuZG9tLkZyYWdtZW50ID0gcmVxdWlyZShcIi4vRnJhZ21lbnRcIilcbmRvbS5TZWxlY3RvciA9IHJlcXVpcmUoXCIuL1NlbGVjdG9yXCIpXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXQgKENsYXNzLCBCYXNlKSB7XG4gIENsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQmFzZS5wcm90b3R5cGUpXG4gIENsYXNzLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IENsYXNzXG5cbiAgcmV0dXJuIENsYXNzXG59XG4iXX0=
