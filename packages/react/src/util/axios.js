import React, { useRef } from 'react';
import axios from 'axios';

// import routes from '../../config/routes.yaml';
// import { pathToRegexp, match, parse, compile } from "path-to-regexp"

// if (!routes || typeof routes !== "object") throw `routes.yaml is not found of is not an object`

// const matchRoute = (path) => {
//   const paths = Object.keys(routes)
//   for (var p in paths) { 
//     const m = match(p)(path)
//     if (m) return { route: routes[path], match: m }
//   }
//   throw `${path} route not found`
// }

// How will we do this client side

// I think we could implement the middleware both client and server side
// Server side is easy. How do we access what we need client side and pass it

// const [ canAccessForm, validateForm, sendRequest ] = useEndpoint("/api/projects/:project_access_token/add_user")

// How do we allow for components to be exported in Storybook as well

// I don't think we need any hooks, just http methods and a validate() and can()

export const get = (url, onSuccess, onError) => {
  axios.get(url)
  .then(function (response) {
    onSuccess(response.data);
  })
  .catch(function (error) {
    const errorMsg = getErrorMsg(error)
    onError(errorMsg);
  });
}

export const post = (url, options, onSuccess, onError) => {
  axios.post(url, options)
  .then(function (response) {
    onSuccess(response.data);
  })
  .catch(function (error) {
    const errorMsg = getErrorMsg(error)
    onError(errorMsg);
  });
}

export const put = (url, options, onSuccess, onError) => {
  axios.put(url, options)
  .then(function (response) {
    onSuccess(response.data);
  })
  .catch(function (error) {
    const errorMsg = getErrorMsg(error)
    onError(errorMsg);
  });
}

export const patch = (url, options, onSuccess, onError) => {
  axios.patch(url, options)
  .then(function (response) {
    onSuccess(response.data);
  })
  .catch(function (error) {
    const errorMsg = getErrorMsg(error)
    onError(errorMsg);
  });
}

export const $delete = (url, options, onSuccess, onError) => {
  axios.delete(url, { data: options || {} })
  .then(function (response) {
    onSuccess(response.data);
  })
  .catch(function (error) {
    const errorMsg = getErrorMsg(error)
    onError(errorMsg);
  });
}

export function getErrorMsg(error) {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const { status, data, headers } = error.response;
    if (status >= 500) return `Error ${status}`;
    if (data.startsWith("<!DOCTYPE")) return `Server responded with an "Error ${status}"`
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