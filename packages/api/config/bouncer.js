exports.authorizers = {
	anonymous: (args, user, form) => { return true },

	onlyAnonymous: (args, user, form) => { return !user },
	
	userRole: (args, user, form) => {
		if (user && args.includes('*')) return true
		return !!user && (args[0] || []).includes(user.role)
	},
	// Default should be redirecting to /login or sending a not logged in status code
	// What's the difference tbh. An API would consider a redirect as error imo.

	userProject: (args, user, form) => {
		const token = form["projectId"]
		return !!(user.UserProjects || []).find(item => {
			if (item.ProjectId === token && (args[0] || []).includes("*")) return true
			return item.ProjectId === token && (args[0] || []).includes(item.userRole)
		})
	},
	
	userProjects: (args, user, form) => {
		const projects = form["projects"] || []
		// Look for a project that doesn't pass
		return !projects.find(project => {
			return !(user.userProjects || []).find(item => {
				return item.projectId === project.id && (args[0] || []).includes(item.userRoles)
			})
		})
	}
}

exports.validators = {
	length: (name, args, value) => {
		const desiredLength = args[0]
		if (!desiredLength || desiredLength !== parseInt(desiredLength, 10)) {
			throw `${name}'s length is set to ${desiredLength} when it should be an integer`
		}
		if (value.length !== desiredLength) return `${name} is not ${args[0]} characters long`
	},

	pattern: (name, args, value) => {
		const regexPattern = args[0]
		if (!regexPattern || typeof regexPattern !== 'string') {
			throw `${name}'s pattern is set to ${regexPattern} when it should be a string`
		}
		const regex = new RegExp(regexPattern)
		if (!regex.test(value)) return `${name} isn't the correct format`
	}
}