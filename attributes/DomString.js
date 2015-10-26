var inherit = require("matchbox-factory/inherit")
var include = require("matchbox-factory/include")
var StringAttribute = require("matchbox-attributes/String")
var DomAttribute = require("./DomAttribute")

module.exports = DomString

function DomString (def) {
  StringAttribute.call(this, def)
}
inherit(DomString, StringAttribute)
include(DomString, DomAttribute)
