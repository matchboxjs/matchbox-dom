var Selector = require("../Selector")
var Event = require("./Event")
var Child = require("./Child")

module.exports = Action

Action.DEFAULT_ATTRIBUTE = "data-action"

function Action(actionInit) {
  this.lookup = actionInit.lookup || null
  this.event = new Event(actionInit.eventOptions)
}

Action.prototype.initialize = function(action, viewName) {
  var selector = new Selector({attribute: Action.DEFAULT_ATTRIBUTE, value: action})

  if (!Array.isArray(this.event.target)) {
    this.event.target = []
  }

  this.event.target = this.event.target.map(function(selector) {
    if (!(typeof selector == "string")) {
      return selector
    }

    if (!viewName || selector[0] != Selector.DEFAULT_NEST_SEPARATOR) {
      return new Child(selector)
    }

    selector = selector.substr(1)
    return new Child(selector).prefix(viewName)
  })

  if (viewName) {
    this.event.target.push(selector.prefix(viewName))
  }
  else {
    this.event.target.push(selector)
  }

  var lookup = this.lookup
  this.event.transform = function(view, delegateSelector, delegateElement) {
    var child
    if (delegateSelector instanceof Child) {
      child = view.getChildView(delegateSelector.name, delegateElement)
    }
    else if (delegateSelector instanceof Selector && lookup) {
      child = view.getChildView(lookup, delegateElement)
    }

    return child || delegateElement
  }
}

Action.prototype.registerEvent = function(element, context) {
  this.event.register(element, context)
}

Action.prototype.unRegisterEvent = function(element) {
  this.event.unRegister(element)
}
