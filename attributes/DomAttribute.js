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

