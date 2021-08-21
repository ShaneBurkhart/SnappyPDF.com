const { match } = require("path-to-regexp")

const matchRoute = (path, routes) => {
  if (!routes || Object.getPrototypeOf(routes) !== Object.prototype) {
    throw `Routes is not defined`
  }

  const paths = sortPaths(Object.keys(routes))

  for (var p in paths) { 
    const m = match(paths[p])(path)
    if (m) return { path: paths[p], match: m }
  }
  throw `${path} route not found`
}

const sortPaths = (paths) => {
  const pathObjects = paths.map(r => ({ r, parts: r.split("/") }))
  
  pathObjects.sort((a, b) => {
    if (a.parts.length !== b.parts.length) {
      return a.parts.length > b.parts.length ? 1 : -1
    }
    const l = Math.max(a.parts.length, b.parts.length)
    for (var i = 0; i < l; i++){
      if (a.parts[i] === undefined) return -1
      if (b.parts[i] === undefined) return 1
      // Special characters come before letters so we reverse sorting for convenience
      const o = a.parts[i].localeCompare(b.parts[i]) * -1
      if (o !== 0) return o
    }
    return 0
  })
  
  return pathObjects.map(r => r.r)
}

exports.sortPaths = sortPaths;
exports.matchRoute = matchRoute;