const Authorization = require('../authorization');

const randBetween = (min, max) => (min + Math.floor(Math.random() * (max-min + 1)))

const authorizers = { }
const defaultAuthorizer = new Authorization(authorizers)

test('undefined allow block returns false. No one is allowed.', () => {
	expect(defaultAuthorizer.authorize({}, null)).toBe(false);
})

test('defined allow block that is not an object throws an error', () => {
	const tests = ["", null, 1, [], 1.23]

	tests.forEach(t => {
		const route = { allow: t }
		expect(_ => defaultAuthorizer.authorize(route, null)).toThrow("Allow block should be an object {}");
	})
})

test('invalid handler throws an error', () => {
	const tests = ["", undefined, null, 1, [], 1.23, {}]
	const handlerName = "allowTestHandler"

	tests.forEach(t => {
		const authorizer = new Authorization({ [handlerName]: t})
		const route = { allow: { [handlerName]: [] } }
		expect(_ => authorizer.authorize(route, null)).toThrow();
	})
})

test('returns false when any handler is false or no handlers', () => {
	for (var i = 0; i < 100; i++) {
		const numHandlers = randBetween(0, 10)
		const handlers = { }
		const route = { allow: {} }

		if (numHandlers > 0) {
			const numFalse = randBetween(1, numHandlers)
			for (var h = 0; h < numHandlers; h++) {
				const name = `handler${h}`
				handlers[name] = (n => (() => n + 1 > numFalse))(h)
				route.allow[name] = []
			}
		}

		const authorizer = new Authorization(handlers)
		expect(authorizer.authorize(route, null)).toBe(false);
	}
})

test('args and user are passed to handlers and only called once', () => {
	const mockHandler = jest.fn((args, user) => true)
	const user = { id: "I am a user ID" }
	const args = ["I", "am", "unique", "args"]

	const authorizer = new Authorization({ mockHandler })
	authorizer.authorize({ allow: { mockHandler: args } }, user)

	expect(mockHandler.mock.calls.length).toBe(1);
	expect(mockHandler.mock.calls[0][0]).toBe(args);
	expect(mockHandler.mock.calls[0][1]).toBe(user);
})