const axios = require('axios');

const bouncerConfig = require('../config/bouncer.js');

const { matchRoute } = require('./util')

const Validator = require('./validate')
const Authorization = require('./authorization')

const authorization = new Authorization(bouncerConfig.authorizers || {})
const validate = new Validator(bouncerConfig.validators || {})

const routes = require("../build/routes.json")
if (!routes || typeof routes !== "object") throw `routes.yaml is not found or is not an object or is not compiled. Run "npm run build"`

// Shouldn't make any async requests
// Returns an object of errors for the form
const validateForm = (method, url, form) => {
  const { path, match } = matchRoute(url, routes)
  console.log(form)
  // Grab the params from the URL and add to form as well for validation
  const data = { ...form, ...(match.params || {}) }
  const routeConfig = routes[path][method]

  console.log(data, path, match)
  let formConfig = (routeConfig || {}).form
  if (method === "get") formConfig = {}

  // Check the form based on route metadata
  // Create unified validators for client and server
  // The validations do not require async of database, just checking
  return { ...validate.checkFields(formConfig, data), ...(match.params || {}) }
}

// Shouldn't make any async requests
const canAccess = (method, url, user, form) => {
  const { path, match } = matchRoute(url, routes)
  const routeConfig = routes[path][method]

  // Check the user role and the middleware passing context to each
  // Context is used for things like passing the project through
  // User is already passed when creating the client
  return authorization.authorize(routeConfig || {}, user, form)
}

const checkRoute = (method, url, form, user) => {
  const formResult = validateForm(method, url, form)
  
  if (!canAccess(method, url, user, formResult)) return "You do not have access."
  
  if (formResult.errors) return "Invalid form"
}

const sendRequest = (siteHost, url, method, form, user, onSuccess, onError) => {
  console.log("SEND REQUEST", siteHost, url, method, form)
  const errors = checkRoute(method, url, form, user)
  if (errors) return onError(errors)

  // Add session key to Authorization header if it exists on the user
  const options = {}
  if (user && user.sessionKey) options.headers = { "Authorization": user.sessionKey }

  console.log((siteHost || "") + url, form, options)

  let promise = null
  if (method === "get") {
    // TODO add form as query params
    promise = axios[method]((siteHost || "") + url, options)
  } else {
    promise = axios[method]((siteHost || "") + url, form, options)
  }

  promise.then(getSuccessHandler(onSuccess)).catch(getErrorHandler(onError));
}

exports.Client = function Client(user, siteHost="") {
  var self = this;
  this.siteHost = siteHost;
  this.user = user;
  ["get", "post", "put", "delete"].forEach(method => {
    self[method] = (url) => self._createRequest(url, method)
  })

  this.setUser = (user) => { this.user = user }

  this._createRequest = (url, method) => {
    const { path, match } = matchRoute(url, routes)
    if (!path || !routes[path][method]) throw `${method} - ${path} route not found`

    return {
      canAccess: () => canAccess(method, url, this.user),
      validateForm: (form) => validateForm(method, url, form),
      sendRequest: (form, onSuccess, onError) => sendRequest(this.siteHost, url, method, form, this.user, onSuccess, onError)
    }
  }
}

const getErrorHandler = (onError) => {
  return (error) => { if (onError) onError(getErrorMsg(error)) }
}

const getSuccessHandler = (onSuccess) => {
  return (response) => { if (onSuccess) onSuccess(response.data) }
}

function getErrorMsg(error) {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const { status, data, headers } = error.response;
    if (status >= 500) return `Error ${status}`;
    return data;
  } else if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    console.log(error.request);
    return "Request has timed out";
  } else {
    // Something happened in setting up the request that triggered an Error
    return error.message || "Unknown failure occurred prior to http request";
  }
}