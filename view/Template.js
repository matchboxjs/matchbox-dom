var merge = require("backyard/object/merge")

module.exports = Template

function Template(options) {
  options = options || {}
  if (typeof options == "function") {
    options = {compiler: options}
  }
  if (typeof options == "string") {
    options = {source: options}
  }

  this.source = options.source || ""
  this.compiler = options.compiler || this.compiler
  this.compilerOptions = options.compilerOptions
  this.cacheRenderFn = !!options.cacheRenderFn
  this.cacheOutput = !!options.cacheOutput
  this.renderFn = null
  this.output = null
  this.first = options.first == null || !!options.first
  this.timeout = options.timeout || 2000
}

Template.prototype.compiler = function(source/*, options, cb*/) {
  return function(/*context*/) {
    return source
  }
}

Template.prototype.compile = function(options) {
  var template = this

  return new Promise(function(resolve, reject) {
    var resolved = false
    var id

    function finish(err, renderFn) {
      if (resolved) return
      resolved = true
      clearTimeout(id)

      if (err) {
        reject(err)
      }
      else {
        if (template.cacheRenderFn) {
          template.renderFn = renderFn
        }
        resolve(renderFn)
      }
    }

    try {
      id = setTimeout(function() {
        reject(new Error("Render timed out"))
      }, template.timeout)
      var renderFn = template.compiler(template.source, options, finish)
      // the compiler synchronously returned a render function
      if (!resolved && typeof renderFn == "function") {
        finish(null, renderFn)
      }
    }
    catch (e) {
      finish(e)
    }
  })
}

Template.prototype.render = function(context, options) {
  options = this.compilerOptions
    ? merge(this.compilerOptions, options)
    : options
  var template = this
  var renderFn = template.renderFn

  if (template.output) {
    return Promise.resolve(createFragment(template.output))
  }

  var render = function(rendererFn) {
    return new Promise(function(resolve, reject) {
      var resolved = false
      var id

      function finish(err, output) {
        if (resolved) return
        resolved = true
        clearTimeout(id)

        if (err) {
          reject(err)
          return
        }

        if (template.cacheOutput) {
          template.output = output
        }
        resolve(createFragment(output))
      }

      try {
        var output = rendererFn(context, finish)
        // the renderer synchronously returned the output
        if (!resolved && typeof output == "string") {
          finish(null, output)
        }
      }
      catch (e) {
        finish(e)
      }
    })
  }
  if (renderFn) {
    return render(renderFn)
  }

  return this.compile(options).then(function(rendererFn) {
    return render(rendererFn)
  })
}

function createFragment(html) {
  var temp = document.createElement("div")

  temp.innerHTML = html || this.html

  if (this.first === undefined || this.first) {
    return temp.children[0]
  }

  var fragment = document.createDocumentFragment()
  while (temp.childNodes.length) {
    fragment.appendChild(temp.firstChild)
  }

  return fragment
}
