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

function delegate( options ){
  var element = options.element
    , event = options.event
    , capture = !!options.capture || false
    , context = options.context || element
    , transform = options.transform || null

  if( !element ){
    console.log("Can't delegate undefined element")
    return null
  }
  if( !event ){
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
 * */
function createHandler( context, transform ){
  var matchers = []

  function delegatedHandler( e ){
    var l = matchers.length
    if( !l ){
      return true
    }

    var el = this
        , i = -1
        , handler
        , selector
        , delegateElement
        , stopPropagation
        , args

    while( ++i < l ){
      args = matchers[i]
      handler = args[0]
      selector = args[1]

      delegateElement = matchCapturePath(selector, el, e, transform, context)
      if( delegateElement && delegateElement.length ) {
        stopPropagation = false === handler.apply(context, [e].concat(delegateElement))
        if( stopPropagation ) {
          return false
        }
      }
    }

    return true
  }

  /**
   * Registers a handler with a target finder logic
   * */
  delegatedHandler.match = function( selector, handler ){
    matchers.push([handler, selector])
    return delegatedHandler
  }

  return delegatedHandler
}

function matchCapturePath( selector, el, e, transform, context ){
  var delegateElements = []
  var delegateElement = null
  if( Array.isArray(selector) ){
    var i = -1
    var l = selector.length
    while( ++i < l ){
      delegateElement = findParent(selector[i], el, e)
      if( !delegateElement ) return null
      if (typeof transform == "function") {
        delegateElement = transform(context, selector[i], delegateElement)
      }
      delegateElements.push(delegateElement)
    }
  }
  else {
    delegateElement = findParent(selector, el, e)
    if( !delegateElement ) return null
    if (typeof transform == "function") {
      delegateElement = transform(context, selector, delegateElement)
    }
    delegateElements.push(delegateElement)
  }
  return delegateElements
}

/**
 * Check if the target or any of its parent matches a selector
 * */
function findParent( selector, el, e ){
  var target = e.target
  if (selector instanceof Selector) {
    selector = selector.toString()
  }
  switch( typeof selector ){
    case "string":
      while( target && target != el ){
        if( target.matches && target.matches(selector) ) return target
        target = target.parentNode
      }
      break
    case "function":
      while( target && target != el ){
        if( selector.call(el, target) ) return target
        target = target.parentNode
      }
      break
    default:
      return null
  }
  return null
}
