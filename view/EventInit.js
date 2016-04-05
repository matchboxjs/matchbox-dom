module.exports = EventInit

function EventInit(event, target, handler) {
  if (!(this instanceof EventInit)) {
    switch (arguments.length) {
      case 1:
        return new EventInit(event)
      case 2:
        return new EventInit({
          type: event,
          handler: target
        })
      case 3:
        return new EventInit({
          type: event,
          target: target,
          handler: handler
        })
    }
  }

  switch (arguments.length) {
    case 2:
      event = {
        type: event,
        handler: target
      }
      break
    case 3:
      event = {
        type: event,
        target: target,
        handler: handler
      }
      break
  }

  this.type = event.type
  this.target = event.target
  this.once = !!event.once
  this.capture = !!event.capture
  this.handler = event.handler
  this.transform = event.transform
  this.element = event.element
}
