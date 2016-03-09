var assert = require("chai").assert
var view = require("../../view")

describe("Event", function() {
  it("event type", function() {
    var event = new view.Event("click")
    assert.equal(event.type, "click")
  })
  it("event type", function() {
    function handler() {
    }

    var event = new view.Event("click", handler)
    assert.equal(event.type, "click")
    assert.equal(event.handler, handler)
  })
  it("event target", function() {
    function handler() {
    }

    var event = new view.Event("click", "test", handler)
    assert.equal(event.type, "click")
    assert.equal(event.target, "test")
    assert.equal(event.handler, handler)
  })
  it("multiple event target", function() {
    function handler() {
    }

    var targets = ["test1", "test2"]
    var event = new view.Event("click", targets, handler)
    assert.equal(event.type, "click")
    assert.equal(event.target, targets)
    assert.equal(event.handler, handler)
  })
  it("captured event", function() {
    function handler() {
    }

    var targets = ["test1", "test2"]
    var event = new view.Event("click", targets, false, handler)
    assert.equal(event.type, "click")
    assert.equal(event.target, targets)
    assert.equal(event.capture, false)
    assert.equal(event.handler, handler)
  })
  it("one time event", function() {
    function handler() {
    }

    var targets = ["test1", "test2"]
    var event = new view.Event("click", targets, false, true, handler)
    assert.equal(event.type, "click")
    assert.equal(event.target, targets)
    assert.equal(event.capture, false)
    assert.equal(event.once, true)
    assert.equal(event.handler, handler)
  })
})
