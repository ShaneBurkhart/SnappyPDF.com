module.exports = function Authorization(authorizers) {
	this.authorize = (route, user, form) => {
		const { allow } = route

		if (allow === undefined) return false
		// Check if the allow block is a plain object
		if (!allow || Object.getPrototypeOf(allow) !== Object.prototype) throw "Allow block should be an object {}"

		const permissions = Object.keys(allow).map(allowName => {
			const handler = authorizers[allowName]
			if (handler === undefined) throw `Allow handler ${allowName} is not defined in your config`
			if (typeof handler !== 'function') throw `Authorization handler ${allowName} is not a function`

			return handler(allow[allowName], user, form)
		})

		return !!permissions.length && !permissions.includes(false)
	}
}