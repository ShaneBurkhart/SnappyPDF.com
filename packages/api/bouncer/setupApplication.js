const yaml = require('js-yaml');
const fs   = require('fs');
const path = require('path');
const bouncerConfig = require('../config/bouncer.js');

const { sortPaths } = require('./util')

const Validator = require('./validate')
const Authorization = require('./authorization')

const authorization = new Authorization(bouncerConfig.authorizers || {})
const validate = new Validator(bouncerConfig.validators || {})

const routes = yaml.load(fs.readFileSync(path.resolve("./config/routes.yaml"), 'utf8'));
if (!routes || typeof routes !== "object") throw `routes.yaml is not found of is not an object`

const printError = (error) => {
	console.log("============================== ERROR ===================================")
	console.log()
	console.log(error)
	console.log()
	console.log("=======================================================================")
}

const errorWrapper = (fn) => {
	return (app) => {
		try { fn(app) } catch (e) { printError(e) }
	}
}

module.exports = errorWrapper((app) => {
	const routePaths = sortPaths(Object.keys(routes))

	const unimplementedRoutes = []

	routePaths.forEach((routePath) => {
		const metadata = routes[routePath]
		const methods = Object.keys(metadata)

		methods.forEach(method => {
			const route = metadata[method]
			const { action, form } = route
			let actionHandler 

			const actionParts = action.split(".")
			if (actionParts.length !== 2) throw `Invalid action format ${action}`

			const relativePath = "./controllers/" + actionParts[0]
			try {
				actionHandler = require(path.resolve(path.dirname(require.main.filename), relativePath))[actionParts[1]];
			} catch (e) {
				if (e.code === 'MODULE_NOT_FOUND') {
					unimplementedRoutes.push(`${routePath} - ${method.toUpperCase()} no action in ./controllers/${actionParts[0]}.js - exports.${actionParts[1]}`)
					return
				} else { throw e }
			}

			if (!actionHandler || typeof actionHandler !== 'function') {
				unimplementedRoutes.push(`${routePath} - ${method.toUpperCase()} no action in ./controllers/${actionParts[0]}.js - exports.${actionParts[1]}`)
				return
			}

			// TODO: Check for validate and authorizers are in config

			const validateMiddleware = (req, res, next) => {
				// Parameter > body > query
				const data = { ...(req.query || {}), ...(req.body || {}), ...(req.params || {}) }
				const formResult = validate.checkFields(form || {}, data)

				req.form = { ...formResult, ...(req.params || {}) }
				// TODO: remove the query body and params
				// TODO: Check for errors
				next()
			}
			
			const allowMiddleware = (req, res, next) => {
				console.log("Bouncer User", req.user ? req.user.toJSON() : null)
				if (authorization.authorize(route, req.user, req.form)) return next()
				res.sendStatus(401) 
			}

			// Validate input first so we can use the info in middlewares
			// Middlewares add things to the context
			// Allow does checks on context and user for access
			app[method](routePath, validateMiddleware, allowMiddleware, actionHandler)
		})
	})

	if (unimplementedRoutes.length) printError(unimplementedRoutes.join("\n"))
})
