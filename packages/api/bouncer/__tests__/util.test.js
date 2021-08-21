const { matchRoute, sortPaths }= require('../util');

const randBetween = (min, max) => (min + Math.floor(Math.random() * (max-min + 1)))

const routes = {
	"/api/login": {
		get: {},
		post: {}
	},
	"/api/project": {
		get: {},
		post: {}
	},
	"/api/project/:id": {
		get: {},
	},
	"/api/project/create": {
		get: {},
	}
}

test('matchRoute finds the route and returns it with query parameters', () => {
	let match = matchRoute("/api/login", routes)
	expect(match).not.toBe(undefined)
	expect(match.path).toBe("/api/login")
	expect(match.match).not.toBe(undefined)
	expect(match.match.params).toEqual({})

	match = matchRoute("/api/project/3", routes)
	expect(match).not.toBe(undefined)
	expect(match.path).toBe("/api/project/:id")
	expect(match.match).not.toBe(undefined)
	expect(match.match.params.id).toBe(3 + '')
})

test('matchRoute throws an error if the path is not found', () => {
	expect(() => matchRoute("/route/not/defined", routes)).toThrow('not found')
})

test('matchRoute throws an error if routes is empty', () => {
	const tests = ["", null, 1, [], 1.23]

	tests.forEach(t => {
		expect(() => matchRoute("/route/not/defined", t)).toThrow('not defined')
	})
})

test('sort paths by parts then sort parts reverse alphabetic to put special characters last', () => {
	const paths = [
		'/api/project',
		'/api/project/:id',
		'/api/project/publish',
		'/api/project/:id/do-something',
		'/api/project/create',
		'/api/login',
	]

	expect(sortPaths(paths)).toEqual([
		'/api/project',
		'/api/login',
		'/api/project/publish',
		'/api/project/create',
		'/api/project/:id',
		'/api/project/:id/do-something',
	])
})
