var inherit = require("matchbox-factory/inherit")
var include = require("matchbox-factory/include")
var FloatAttribute = require("matchbox-attributes/Float")
var DomAttribute = require("./DomAttribute")

module.exports = DomFloat

function DomFloat (def) {
  FloatAttribute.call(this, def)
}
inherit(DomFloat, FloatAttribute)
include(DomFloat, DomAttribute)
