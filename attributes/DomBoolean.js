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

DomBoolean.prototype.parseValue = function (serializedValue) {
  return serializedValue != null
}

DomBoolean.prototype.serializeValue = function (parseValue) {
  return parseValue ? "" : null
}
