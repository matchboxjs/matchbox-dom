var Selector = require("../Selector")

/**
 * Registers an event listener on an element
 * and returns a delegator.
 * A delegated event runs matches to find an event target,
 * then executes the handler paired with the matcher.
 * Matchers can check if an event target matches a given selector,
 * or see if an of its parents do.
 * */
module.exports = delegate

function delegate(options) {
  var element = options.element
  var event = options.event
  var capture = !!options.capture || false
  var context = options.context || element
  var transform = options.transform || null

  if (!element) {
    console.log("Can't delegate undefined element")
    return null
  }
  if (!event) {
    console.log("Can't delegate undefined event")
    return null
  }

  var handler = createHandler(context, transform)
  element.addEventListener(event, handler, capture)

  return handler
}

/**
 * Returns a delegator that can be used as an event listener.
 * The delegator has static methods which can be used to register handlers.
 *
 * @param {*} context
 * @param {Function} transform
 * @return {Function}
 * */
function createHandler(context, transform) {
  var matchers = []

  function delegatedHandler(e) {
    var l = matchers.length
    if (!l) {
      return true
    }

    var el = this
    var i = -1
    var handler
    var selector
    var delegateElement
    var stopPropagation
    var args

    while (++i < l) {
      args = matchers[i]
      handler = args[0]
      selector = args[1]

      delegateElement = matchCapturePath(selector, el, e, transform, context)
      if (delegateElement && delegateElement.length) {
        stopPropagation = handler.apply(context, [e].concat(delegateElement)) === false
        if (stopPropagation) {
          return false
        }
      }
    }

    return true
  }

  /**
   * Registers a handler with a target finder logic
   *
   * @param {String|String[]} selector
   * @param {Function} handler
   * @return {Function} delegatedHandler
   * */
  delegatedHandler.match = function(selector, handler) {
    matchers.push([handler, selector])
    return delegatedHandler
  }

  return delegatedHandler
}

/**
 * @param {String|String[]} selector
 * @param {HTMLElement} el
 * @param {Event} e
 * @param {Function} transform
 * @param {*} context
 * @return {*} delegatedHandler
 * */
function matchCapturePath(selector, el, e, transform, context) {
  var delegateElements = []
  var delegateElement = null
  if (Array.isArray(selector)) {
    var i = -1
    var l = selector.length
    while (++i < l) {
      delegateElement = findParent(selector[i], el, e)
      if (!delegateElement) return null
      if (typeof transform == "function") {
        delegateElement = transform(context, selector[i], delegateElement)
      }
      delegateElements.push(delegateElement)
    }
  }
  else {
    delegateElement = findParent(selector, el, e)
    if (!delegateElement) return null
    if (typeof transform == "function") {
      delegateElement = transform(context, selector, delegateElement)
    }
    delegateElements.push(delegateElement)
  }
  return delegateElements
}

/**
 * Check if the target or any of its parent matches a selector
 *
 * @param {String|Function} selector
 * @param {HTMLElement} el
 * @param {Event} e
 * @return {*}
 * */
function findParent(selector, el, e) {
  var target = e.target
  if (selector instanceof Selector) {
    selector = selector.toString()
  }
  switch (typeof selector) {
    case "string":
      while (target && target != el) {
        if (target.matches && target.matches(selector)) return target
        target = target.parentNode
      }
      break
    case "function":
      while (target && target != el) {
        if (selector.call(el, target)) return target
        target = target.parentNode
      }
      break
    default:
      return null
  }
  return null
}
