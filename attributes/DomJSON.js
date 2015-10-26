var inherit = require("matchbox-factory/inherit")
var include = require("matchbox-factory/include")
var JSONAttribute = require("matchbox-attributes/JSON")
var DomAttribute = require("./DomAttribute")

module.exports = DomJSON

function DomJSON (def) {
  JSONAttribute.call(this, def)
}
inherit(DomJSON, JSONAttribute)
include(DomJSON, DomAttribute)
