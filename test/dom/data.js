var assert = require("chai").assert
var dataTypes = require("../../data")

describe("data", function() {
  function test(name, fn) {
    it(name, function() {
      var element = document.createElement("div")
      document.body.appendChild(element)
      fn.call(this, element)
      document.body.removeChild(element)
    })
  }

  function tryCatch(data, element, value) {
    var thrown = false
    try {
      data.set(element, value)
    }
    catch (e) {
      thrown = true
    }
    assert.isTrue(thrown)
  }

  function testDefault(DataType, defaultValue) {
    test("with default", function(element) {
      var data = new DataType("data", defaultValue)
      assert.equal(data.get(element), defaultValue)
      assert.isFalse(data.has(element))
      assert.isFalse(element.hasAttribute(data.name))
    })
    test("with no default", function(element) {
      var data = new DataType("data")
      assert.isNull(data.get(element))
      assert.isFalse(data.has(element))
      assert.isFalse(element.hasAttribute(data.name))
    })
  }

  function testType(DataType, testValue, invalidValues) {
    testDefault(DataType, testValue)
    test("set to valid", function(element) {
      var data = new DataType("data")
      data.set(element, testValue)
      assert.equal(data.get(element), testValue)
      assert.isTrue(element.hasAttribute(data.attributeName()))
      data.remove(element)
      assert.isFalse(element.hasAttribute(data.attributeName()))
    })
    test("set to invalid", function(element) {
      var data = new DataType("data")
      invalidValues.forEach(function(invalidValue) {
        tryCatch(data, element, invalidValue)
      })
    })
    test("remove", function(element) {
      var data = new DataType("data")
      assert.isFalse(data.has(element))
      data.remove(element)
      assert.isFalse(data.has(element))
      data.set(element, testValue)
      assert.isTrue(data.has(element))
    })
  }

  function testJSON(testValue, invalidValues) {
    testDefault(dataTypes.JSON, testValue)
    test("set to valid", function(element) {
      var data = new dataTypes.JSON("data")
      data.set(element, testValue)
      assert.equal(element.hasAttribute(data.attributeName()), true)
      assert.equal(element.getAttribute(data.attributeName()), JSON.stringify(testValue))
      data.remove(element)
      assert.equal(element.hasAttribute(data.attributeName()), false)
    })
    test("set to invalid", function(element) {
      var data = new dataTypes.JSON("data")
      invalidValues.forEach(function(invalidValue) {
        tryCatch(data, element, invalidValue)
      })
    })
    test("remove", function(element) {
      var data = new dataTypes.JSON("data")
      assert.isFalse(data.has(element))
      data.remove(element)
      assert.isFalse(data.has(element))
      data.set(element, testValue)
      assert.isTrue(data.has(element))
    })
  }

  describe("create", function() {
    it("boolean", function() {
      assert.instanceOf(dataTypes.create("data", true), dataTypes.Boolean)
    })
    it("string", function() {
      assert.instanceOf(dataTypes.create("data", "string"), dataTypes.String)
    })
    it("number", function() {
      assert.instanceOf(dataTypes.create("data", 0), dataTypes.Number)
      assert.instanceOf(dataTypes.create("data", 1.0), dataTypes.Number)
    })
    it("float", function() {
      assert.instanceOf(dataTypes.create("data", 1.1), dataTypes.Float)
    })
    it("json", function() {
      assert.instanceOf(dataTypes.create("data", {}), dataTypes.JSON)
      assert.instanceOf(dataTypes.create("data", []), dataTypes.JSON)
    })
    it("null", function() {
      assert.isNull(dataTypes.create("data"))
    })
  })

  describe("BooleanData", function() {
    describe("true", function() {
      testType(dataTypes.Boolean, true, [null, 1, "", {}, []])
    })
    describe("false", function() {
      testType(dataTypes.Boolean, false, [null, 1, "", {}, []])
    })
  })

  describe("StringData", function() {
    describe("string", function() {
      testType(dataTypes.String, "test", [null, 1, true, false, {}, []])
    })
    describe("empty string", function() {
      testType(dataTypes.String, "", [null, 1, true, false, {}, []])
    })
  })

  describe("NumberData", function() {
    describe("zero", function() {
      testType(dataTypes.Number, 0, [null, true, false, "", {}, []])
    })
    describe("non zero", function() {
      testType(dataTypes.Number, -1, [null, true, false, "", {}, []])
    })
  })

  describe("FloatData", function() {
    describe("zero", function() {
      testType(dataTypes.Float, 0, [null, true, false, "", {}, []])
    })
    describe("non zero", function() {
      testType(dataTypes.Float, -1.1, [null, true, false, "", {}, []])
    })
  })

  describe("JSONData", function() {
    describe("object", function() {
      testJSON({}, [null])
    })
    describe("array", function() {
      testJSON([0, "test", true], [null])
    })
    describe("number", function() {
      testJSON(-1.1, [null])
    })
    describe("boolean", function() {
      testJSON(true, [null])
    })
  })
})
