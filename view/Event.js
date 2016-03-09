var delegate = require("../event/delegate")
var Selector = require("../Selector")
var Child = require("./Child")

module.exports = Event

function Event(eventInit) {
  this.type = eventInit.type
  this.target = eventInit.target
  this.once = !!eventInit.once
  this.capture = !!eventInit.capture
  this.handler = eventInit.handler
  this.transform = eventInit.transform
  this.proxy = this.handler
}

Event.prototype.initialize = function(view, viewName) {
  if (this.target) {
    if (!Array.isArray(this.target)) {
      this.target = [this.target]
    }

    this.target = this.target.map(function(selector) {
      if (!(typeof selector == "string")) {
        return selector
      }

      if (selector[0] != Selector.DEFAULT_NEST_SEPARATOR) {
        return new Child(selector)
      }

      selector = selector.substr(1)
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
    if (this.once) {
      element.addEventListener(this.type, this.handler, this.capture)
    }
    else {
      element.addEventListener(this.type, this.handler, this.capture)
    }
  }
}

Event.prototype.unRegister = function(element) {
  if (this.proxy) {
    element.removeEventListener(this.type, this.proxy, this.capture)
  }
  else {
    element.removeEventListener(this.type, this.handler, this.capture)
  }
}
