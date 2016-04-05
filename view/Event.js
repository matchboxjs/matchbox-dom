var delegate = require("../event/delegate")
var Selector = require("../Selector")
var Child = require("./Child")

module.exports = Event

function Event(eventInit, event, target, handler) {
  this.type = eventInit.type
  this.target = eventInit.target
  this.once = !!eventInit.once
  this.capture = !!eventInit.capture
  this.handler = eventInit.handler
  this.transform = eventInit.transform
  this.proxy = this.handler
  this.element = eventInit.element
}

Event.prototype.initialize = function(view) {
  if (typeof this.handler == "string" && typeof view[this.handler] == "function") {
    this.handler = view[this.handler]
  }

  if (this.target) {
    if (!Array.isArray(this.target)) {
      this.target = [this.target]
    }

    this.target = this.target.map(function(selector) {
      if (!(typeof selector == "string")) {
        return selector
      }

      return view.children[selector]
    })
  }

  if (!this.transform) {
    this.transform = function(view, delegateSelector, delegateElement) {
      var child

      if (delegateSelector instanceof Child) {
        child = view.getChildView(delegateSelector.property, delegateElement)
      }

      return child || delegateElement
    }
  }
}

Event.prototype.register = function(element, context) {
  var event = this

  this.element = element = element || this.element

  if (this.target) {
    this.proxy = delegate({
      element: element,
      event: this.type,
      context: context,
      transform: this.transform
    })
    this.proxy.match(this.target, this.handler)
  }
  else {
    this.proxy = function() {
      var result = event.handler.apply(context, arguments)
      if (event.once) {
        element.removeEventListener(event.type, event.proxy, event.capture)
        event.proxy = null
        event.element = null
      }
      return result
    }
    element.addEventListener(this.type, event.proxy, this.capture)
  }
}
Event.prototype.unRegister = function(element, removeElement) {
  element = element || this.element
  removeElement = removeElement === false ? false : true
  if (this.proxy) {
    element.removeEventListener(this.type, this.proxy, this.capture)
    if (removeElement) {
      this.element = null
    }
  }
}
