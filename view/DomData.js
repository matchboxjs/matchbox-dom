module.exports = DomData

function DomData(options) {
  if (!(this instanceof DomData)) {
    return new DomData(options)
  }

  options = options || {}
  this.name = options.name
  this.type = options.type
  this.default = options.default
  this.onChange = options.onChange
  this.overwriteAttribute = options.overwriteAttribute
}

DomData.prototype.getAttributeName = function() {
  return "data-" + this.name
}

DomData.prototype.get = function(element) {
  var value = element.getAttribute(this.getAttributeName())

  switch (this.type) {
    case "number":
    case "int":
    case "integer":
      if (!this.has(element)) return null
      return parseInt(value)
    case "float":
    case "double":
      if (!this.has(element)) return null
      return parseFloat(value)
    case "json":
    case "object":
      if (!this.has(element)) return null
      return JSON.parse(value)
    case "boolean":
    case "bool":
      return this.has(element)
    default:
      return value
  }
}

DomData.prototype.reset = function(context, element) {
  if (this.has(element)) {
    if (this.overwriteAttribute) {
      this.set(context, element, this.default)
    }
  }
  else {
    this.set(context, element, this.default)
  }
}

DomData.prototype.set = function(context, element, value, silent) {
  if (value == null) {
    return
  }

  switch (this.type) {
    case "json":
      value = JSON.stringify(value)
      break
    case "boolean":
      if (value) {
        element.setAttribute(this.getAttributeName(), "")
      }
      else {
        element.removeAttribute(this.getAttributeName())
      }
      return
  }
  element.setAttribute(this.getAttributeName(), value)
}

DomData.prototype.remove = function(context, element, silent) {
  element.setAttribute(this.getAttributeName())
}

DomData.prototype.has = function(element) {
  return element.hasAttribute(this.getAttributeName())
}
