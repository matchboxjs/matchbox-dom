var inherit = require("matchbox-factory/inherit")
var include = require("matchbox-factory/include")
var NumberAttribute = require("matchbox-attributes/Number")
var DomAttribute = require("./DomAttribute")

module.exports = DomNumber

function DomNumber (def) {
  NumberAttribute.call(this, def)
}
inherit(DomNumber, NumberAttribute)
include(DomNumber, DomAttribute)
