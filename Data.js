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

