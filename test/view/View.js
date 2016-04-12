var assert = require("chai").assert

function test(name, fn) {
  it(name, function(done) {
    var element = createViewElement("test")
    document.body.appendChild(element)
    try {
      fn.call(this, element, done)
    }
    catch (e) {
      document.body.removeChild(element)
      throw e
    }
    document.body.removeChild(element)
  })
}

function dispatch(element, type) {
  element.dispatchEvent(new window.CustomEvent(type, {
    detail: null,
    view: window,
    bubbles: true,
    cancelable: true
  }))
}

function createViewElement(name) {
  var element = document.createElement("div")
  element.dataset.view = name
  return element
}

var viewModule = require("../../view")
var View = viewModule.View
var dataTypes = require("../../data")

describe("View", function() {
  it("no arguments", function() {
    var view = new View()
    assert.instanceOf(view, View)
  })
  test("with element argument", function(element, done) {
    var view = new View(element)
    assert.instanceOf(view, View)
    assert.equal(view.element, element)
    done()
  })
  test("CustomView", function(element, done) {
    var CustomView = View.extend({})
    var view = new CustomView(element)
    assert.instanceOf(view, View)
    assert.instanceOf(view, CustomView)
    done()
  })

  describe("viewName", function() {
    test("not provided", function(element, done) {
      var CustomView = View.extend({})
      assert.equal(CustomView.prototype.viewName, "")
      var view = new CustomView(element)
      assert.equal(view.viewName, "")
      done()
    })
    test("provided", function(element, done) {
      var CustomView = View.extend({
        viewName: "test"
      })
      assert.equal(CustomView.prototype.viewName, "test")
      var view = new CustomView(element)
      assert.equal(view.viewName, "test")
      done()
    })
    test("inherited", function(element, done) {
      var CustomView = View.extend({
        viewName: "test"
      })
      var ExtendedView = CustomView.extend({})
      assert.equal(ExtendedView.prototype.viewName, "test")
      var view = new ExtendedView(element)
      assert.equal(view.viewName, "test")
      done()
    })
    test("overridden", function(element, done) {
      var CustomView = View.extend({
        viewName: "test"
      })
      var ExtendedView = CustomView.extend({
        viewName: "override"
      })
      assert.equal(ExtendedView.prototype.viewName, "override")
      var view = new ExtendedView(element)
      assert.equal(view.viewName, "override")
      done()
    })
  })

  describe("layouts", function() {
    test("call test", function(element, done) {
      var called = false
      var CustomView = View.extend({
        layouts: {
          "test": function() {
            called = true
          }
        }
      })
      var view = new CustomView(element)
      assert.equal(view.currentLayout, "")
      view.changeLayout("test").then(function() {
        assert.equal(view.currentLayout, "test")
        assert.isTrue(called)
        done()
      })
      assert.equal(view.currentLayout, "")
    })
  })

  describe("events", function() {
    test("simple event", function(element, done) {
      var view = new (View.extend({
        events: {
          test: new viewModule.Event("click", function() {
            done()
          })
        }
      }))(element)
      dispatch(element, "click")
    })
    test("targeted event", function(element, done) {
      var child = createViewElement("child")
      element.appendChild(child)
      var view = new (View.extend({
        children: {
          child: "child"
        },
        events: {
          test: new viewModule.Event("click", "child", function(e, arg1) {
            assert.equal(child, arg1)
            done()
          })
        }
      }))(element)
      dispatch(child, "click")
    })
    test("multiple targeted event", function(element, done) {
      var child1 = createViewElement("child1")
      var child2 = createViewElement("child2")
      element.appendChild(child1)
      child1.appendChild(child2)
      var view = new (View.extend({
        children: {
          child1: "child1",
          child2: "child2"
        },
        events: {
          test: new viewModule.Event("click", ["child1", "child2"], function(e, arg1, arg2) {
            assert.equal(child1, arg1)
            assert.equal(child2, arg2)
            done()
          })
        }
      }))(element)
      dispatch(child2, "click")
    })
  })

  describe("dataset", function() {
    describe("no default", function() {
      test("boolean", function(element, done) {
        var view = new (View.extend({
          dataset: {
            boolean: new dataTypes.Boolean()
          }
        }))(element)
        assert.isNull(view.getData("boolean"))
        assert.isFalse(element.hasAttribute("data-boolean"))
        done()
      })
      test("string", function(element, done) {
        var view = new (View.extend({
          dataset: {
            string: new dataTypes.String()
          }
        }))(element)
        assert.isNull(view.getData("string"))
        assert.isFalse(element.hasAttribute("data-string"))
        assert.isNull(element.getAttribute("data-string"))
        done()
      })
      test("number", function(element, done) {
        var view = new (View.extend({
          dataset: {
            number: new dataTypes.Number()
          }
        }))(element)
        assert.isNull(view.getData("number"))
        assert.isFalse(element.hasAttribute("data-number"))
        assert.isNull(element.getAttribute("data-number"))
        done()
      })
      test("float", function(element, done) {
        var view = new (View.extend({
          dataset: {
            float: new dataTypes.Float()
          }
        }))(element)
        assert.isNull(view.getData("float"))
        assert.isFalse(element.hasAttribute("data-float"))
        assert.isNull(element.getAttribute("data-float"))
        done()
      })
      test("json", function(element, done) {
        var view = new (View.extend({
          dataset: {
            json: new dataTypes.JSON()
          }
        }))(element)
        assert.isNull(view.getData("float"))
        assert.isFalse(element.hasAttribute("data-json"))
        assert.isNull(element.getAttribute("data-json"))
        done()
      })
    })

    describe("default", function() {
      test("boolean", function(element, done) {
        var view = new (View.extend({
          dataset: {
            boolean: false
          }
        }))(element)
        assert.isFalse(view.getData("boolean"))
        assert.isTrue(element.hasAttribute("data-boolean"))
        done()
      })
      test("string", function(element, done) {
        var view = new (View.extend({
          dataset: {
            string: "test"
          }
        }))(element)
        assert.equal(view.getData("string"), "test")
        assert.isTrue(element.hasAttribute("data-string"))
        assert.equal(element.getAttribute("data-string"), "test")
        done()
      })
      test("number", function(element, done) {
        var view = new (View.extend({
          dataset: {
            number: 1
          }
        }))(element)
        assert.equal(view.getData("number"), 1)
        assert.isTrue(element.hasAttribute("data-number"))
        assert.equal(element.getAttribute("data-number"), 1)
        done()
      })
      test("float", function(element, done) {
        var view = new (View.extend({
          dataset: {
            float: 1.1
          }
        }))(element)
        assert.equal(view.getData("float"), 1.1)
        assert.isTrue(element.hasAttribute("data-float"))
        assert.equal(element.getAttribute("data-float"), 1.1)
        done()
      })
      test("json", function(element, done) {
        var data = {hey: "ho"}
        var expectation = JSON.stringify(data)
        var view = new (View.extend({
          dataset: {
            json: new dataTypes.JSON("json", data)
          }
        }))(element)
        assert.equal(JSON.stringify(view.getData("json")), expectation)
        assert.isTrue(element.hasAttribute("data-json"))
        assert.equal(element.getAttribute("data-json"), expectation)
        done()
      })
    })
  })

  describe("children", function() {
    test("bare bone example", function(element, done) {
      var child = createViewElement("test:child")
      element.appendChild(child)
      var el = new (View.extend({
        viewName: "test",
        children: {
          child: new viewModule.Child()
        }
      }))(element)
      assert.equal(el.findChild("child"), child)
      done()
    })
    test("nonexistent child", function(element, done) {
      var el = new (View.extend({
        viewName: "test",
        children: {
          child: new viewModule.Child()
        }
      }))(element)
      assert.isNull(el.findChild("child"))
      assert.isNull(el.findChild("asdqwe"))
      done()
    })
    test("name override", function(element, done) {
      var child = createViewElement("other-child")
      element.appendChild(child)
      var el = new (View.extend({
        viewName: "test",
        children: {
          child: new viewModule.Child("other-child")
        }
      }))(element)
      assert.equal(el.findChild("child"), child)
      done()
    })
    test("nested name override", function(element, done) {
      var child = createViewElement("test:other-child")
      element.appendChild(child)
      var el = new (View.extend({
        viewName: "test",
        children: {
          child: new viewModule.Child(":other-child")
        }
      }))(element)
      assert.equal(el.findChild("child"), child)
      done()
    })
    test("multiple child", function(element, done) {
      var child1 = createViewElement("test:child")
      var child2 = createViewElement("test:child")
      element.appendChild(child1)
      element.appendChild(child2)
      var el = new (View.extend({
        viewName: "test",
        children: {
          child: new viewModule.Child({
            multiple: true
          })
        }
      }))(element)
      assert.isNotNull(el.findChild("child"))
      assert.lengthOf(el.findChild("child"), 2)
      assert.equal(el.findChild("child")[0], child1)
      assert.equal(el.findChild("child")[1], child2)
      done()
    })
    test("with constructor", function(element, done) {
      var child = createViewElement("test:child")
      element.appendChild(child)
      var ChildElement = View.extend({})
      var el = new (View.extend({
        viewName: "test",
        children: {
          child: new viewModule.Child(ChildElement)
        }
      }))(element)
      assert.instanceOf(el.findChild("child"), ChildElement)
      assert.equal(el.findChild("child").element, child)
      done()
    })
    it("nested  children 1", function() {
      var el1 = createViewElement("test")
      var el2 = createViewElement("test2")
      var el1child = createViewElement("child")
      var el2child = createViewElement("child")
      el1.appendChild(el1child)
      el2.appendChild(el2child)
      el1child.appendChild(el2)

      var view = new (View.extend({
        viewName: "test",
        children: {
          child: new viewModule.Child({
            value: "child",
            multiple: true
          })
        }
      }))(el1)

      var children = view.findChild("child")
      assert.lengthOf(children, 2)
      assert.equal(children[0], el1child)
    })
    it("nested children 2", function() {
      var el1 = createViewElement("test")
      var el2 = createViewElement("test")
      var el1child = createViewElement("child")
      var el2child = createViewElement("child")
      el1.appendChild(el1child)
      el2.appendChild(el2child)
      el1child.appendChild(el2)

      var view = new (View.extend({
        viewName: "test",
        children: {
          child: new viewModule.Child({
            value: "child",
            multiple: true
          })
        }
      }))(el1)

      var children = view.findChild("child")
      assert.lengthOf(children, 1)
      assert.equal(children[0], el1child)
    })
    it("scoped nested children 1", function() {
      var el1 = createViewElement("test")
      var el2 = createViewElement("test")
      var el1child = createViewElement("test:child")
      var el2child = createViewElement("test:child")
      el1.appendChild(el1child)
      el2.appendChild(el2child)
      el1child.appendChild(el2)

      var view = new (View.extend({
        viewName: "test",
        children: {
          child: new viewModule.Child({
            value: ":child",
            multiple: true
          })
        }
      }))(el1)

      var children = view.findChild("child")
      assert.lengthOf(children, 1)
      assert.equal(children[0], el1child)
    })
    it("scoped nested children 2", function() {
      var el1 = createViewElement("test")
      var el2 = createViewElement("test2")
      var el1child = createViewElement("test:child")
      var el2child = createViewElement("test2:child")
      el1.appendChild(el1child)
      el2.appendChild(el2child)
      el1child.appendChild(el2)

      var view = new (View.extend({
        viewName: "test",
        children: {
          child: new viewModule.Child({
            value: ":child",
            multiple: true
          })
        }
      }))(el1)

      var children = view.findChild("child")
      assert.lengthOf(children, 1)
      assert.equal(children[0], el1child)
    })
    test("find element", function(element, done) {
      var view = new (View.extend({
        viewName: "test"
      }))()
      view.setupElement()
      assert.equal(view.element, element)
      done()
    })
  })

  describe("classList", function() {

    test("no default", function(element, done) {
      var view = new (View.extend({
        classList: {test: new viewModule.ClassName(null, ["on", "off"])}
      }))(element)
      assert.isNull(view.getClassName("test"))
      assert.isFalse(element.classList.contains("on"))
      assert.isFalse(element.classList.contains("off"))
      done()
    })
    test("default to a defined value", function(element, done) {
      var view = new (View.extend({
        classList: {test: new viewModule.ClassName("on", ["on", "off"])}
      }))(element)
      assert.equal(view.getClassName("test"), "on")
      assert.isTrue(element.classList.contains("on"))
      assert.isFalse(element.classList.contains("off"))
      done()
    })
    test("default to an invalid value", function(element, done) {
      var view = new (View.extend({
        classList: {test: new viewModule.ClassName("off", ["on", ""])}
      }))(element)
      assert.isNull(view.getClassName("test"))
      assert.isFalse(element.classList.contains("on"))
      assert.isFalse(element.classList.contains("off"))
      done()
    })
    test("setting to a defined value", function(element, done) {
      var view = new (View.extend({
        classList: {test: new viewModule.ClassName(null, ["on", "off"])}
      }))(element)
      view.setClassName("test", "on")
      assert.equal(view.getClassName("test"), "on")
      assert.isTrue(element.classList.contains("on"))
      assert.isFalse(element.classList.contains("off"))
      view.setClassName("test", "off")
      assert.equal(view.getClassName("test"), "off")
      assert.isFalse(element.classList.contains("on"))
      assert.isTrue(element.classList.contains("off"))
      done()
    })
    test("setting to an invalid value", function(element, done) {
      var view = new (View.extend({
        classList: {test: new viewModule.ClassName(null, ["", ""])}
      }))(element)
      view.setClassName("test", "on")
      assert.isNull(view.getClassName("test"))
      assert.isFalse(element.classList.contains("on"))
      assert.isFalse(element.classList.contains("off"))
      done()
    })
    test("remove valid value", function(element, done) {
      var view = new (View.extend({
        classList: {test: new viewModule.ClassName("on", ["on", "off"])}
      }))(element)
      assert.equal(view.getClassName("test"), "on")
      assert.isTrue(element.classList.contains("on"))
      assert.isFalse(element.classList.contains("off"))
      view.removeClassName("test")
      assert.isNull(view.getClassName("test"))
      assert.isFalse(element.classList.contains("on"))
      assert.isFalse(element.classList.contains("off"))
      done()
    })
    test("remove invalid value", function(element, done) {
      var view = new (View.extend({
        classList: {test: new viewModule.ClassName(null, ["", ""])}
      }))(element)
      assert.isNull(view.getClassName("test"))
      assert.isFalse(element.classList.contains("on"))
      assert.isFalse(element.classList.contains("off"))
      view.removeClassName("test")
      assert.isNull(view.getClassName("test"))
      assert.isFalse(element.classList.contains("on"))
      assert.isFalse(element.classList.contains("off"))
      done()
    })
    test("animation delay", function(element, done) {
      var view = new (View.extend({
        classList: {test: new viewModule.ClassName("off", ["on", "off"], 500)}
      }))(element)
      view.setClassName("test", "on").then(function() {
        assert.isTrue(element.classList.contains("on"))
        assert.isFalse(element.classList.contains("off"))
      }).then(function() {
        return view.removeClassName("test")
      }).then(function() {
        assert.isNull(view.getClassName("test"))
        assert.isFalse(element.classList.contains("on"))
        assert.isFalse(element.classList.contains("off"))
        done()
      })
      assert.equal(view.getClassName("test"), "on")
      assert.isTrue(element.classList.contains("on"))
      assert.isFalse(element.classList.contains("off"))
    })
  })
})
