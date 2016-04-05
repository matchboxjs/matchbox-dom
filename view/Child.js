var inherit = require("backyard/function/inherit")
var Selector = require("../Selector")

module.exports = Child

Child.DEFAULT_ATTRIBUTE = "data-view"

function Child(child) {
  child = child || {}
  if (!(this instanceof Child)) {
    return new Child(child)
  }

  switch (typeof child) {
    case "function":
      Selector.call(this, {Constructor: child})
      break
    case "string":
      Selector.call(this, {value: child})
      break
    default:
      Selector.call(this, child)
  }

  this.attribute = this.attribute || Child.DEFAULT_ATTRIBUTE
  this.autoselect = child.autoselect == undefined ? false : child.autoselect
  this.property = child.property || this.value
  this.lookup = child.lookup || null
}

inherit(Child, Selector)

Child.prototype.initialize = function(childProperty) {
  this.property = childProperty
}

Child.prototype.clone = function() {
  return new this.constructor(this)
}
