const Validator = require('../validate');

const randBetween = (min, max) => (min + Math.floor(Math.random() * (max-min + 1)))

test('returns a form with only the field names from metadata', () => {
	const validator = new Validator()

	for (var i = 0; i < 100; i++) {
		const numFields = randBetween(0, 50)
		const formMetadata = {}
		const formData = {}

		if (numFields > 0) {
			const numIncludedFields = randBetween(1, numFields) 

			for(var f = 0; f < numFields; f++) {
				const name = `field${f}`

				if (f <= numIncludedFields) formMetadata[name] = {}
				formData[name] = true
			}
		}

		const formResult = validator.checkFields(formMetadata, formData)
		expect(Object.keys(formResult)).toStrictEqual(Object.keys(formMetadata))
	}
})

test('undefined form block returns empty form', () => {
	const validator = new Validator({})
	expect(validator.checkFields(undefined, { ignoredData: "test" })).toStrictEqual({});
})

test('defined form block that is not an object throws an error', () => {
	const validator = new Validator({})
	const tests = ["", null, 1, [], 1.23]

	tests.forEach(t => {
		expect(_ => validator.checkFields(t, {})).toThrow("Form block should be an object {}");
	})
})

test('invalid handler throws an error', () => {
	const tests = ["", undefined, null, 1, [], 1.23, {}]
	const handlerName = "validateTestHandler"

	tests.forEach(t => {
		const validator = new Validator({ [handlerName]: t })
		expect(_ => {
			validator.checkFields({ name: { [handlerName]: [] } }, { name: "test_name" })
		}).toThrow("handler");
	})
})

test('all validator errors are added to errors', () => {
	for (var i = 0; i < 100; i++) {
		const numHandlers = randBetween(1, 10)
		const numErrored = randBetween(1, numHandlers)
		const handlers = { }
		const formMetadata = { fieldName: {} }

		for (var h = 0; h < numHandlers; h++) {
			const name = `handler${h}`
			handlers[name] = (n => (() => n + 1 > numErrored ? undefined : "Error" ))(h)
			formMetadata.fieldName[name] = []
		}

		const validator = new Validator(handlers)
		const formResult = validator.checkFields(formMetadata, { fieldName: "asdfasdf" })
		expect(Object.keys(formResult.errors.fieldName).length).toBe(numErrored);
	}
})

// Object and array are reserved but the rest are custom functions in validator
test('can only be blank when optional is true', () => {
	const handlers = { }
	const validator = new Validator(handlers)
	const BLANKS = [undefined, null, ""]

	BLANKS.forEach(b => {
		const formMetadata = { fieldName: { } }
		const r = validator.checkFields(formMetadata, { fieldName: b })
		expect(r.errors).not.toBe(undefined)
		expect(r.fieldName).toBe(undefined)
	})

	BLANKS.forEach(b => {
		const formMetadata = { fieldName: { optional: true } }
		const r = validator.checkFields(formMetadata, { fieldName: b })
		expect(r.errors).toBe(undefined)
		expect(r.fieldName).toBe(undefined)
	})

	BLANKS.forEach(b => {
		const formMetadata = { fieldName: { default: b } }
		const r = validator.checkFields(formMetadata, { fieldName: b })
		expect(r.errors).not.toBe(undefined)
		expect(r.fieldName).toBe(undefined)
	})

	BLANKS.forEach(b => {
		const formMetadata = { fieldName: { optional: true, default: b } }
		const r = validator.checkFields(formMetadata, { fieldName: b })
		expect(r.errors).toBe(undefined)
		expect(r.fieldName).toBe(undefined)
	})
})

test.todo('when optional, only run handler if value exists')
// Random depth with error check
test.todo('object key recursively checks objects')
// Random length of array
test.todo('arrayOf key checks all items in the array')

test('name, args and value are passed to handlers and only called once', () => {
	const mockHandler = jest.fn((name, args, value) => undefined)
	const name = "Field name"
	const value = "test value"
	const args = ["I", "am", "unique", "args"]

	const validator = new Validator({ mockHandler })
	validator.checkFields({ fieldName: { mockHandler: args } }, { fieldName: value })

	expect(mockHandler.mock.calls.length).toBe(1);
	expect(mockHandler.mock.calls[0][0]).toBe(name);
	expect(mockHandler.mock.calls[0][1]).toBe(args);
	expect(mockHandler.mock.calls[0][2]).toBe(value);
})

test('name metadata value overrides field name', () => {
	const mockHandler = jest.fn((name, args, value) => undefined)
	const name = "Alternative display name"
	const value = "test value"
	const args = ["I", "am", "unique", "args"]

	const validator = new Validator({ mockHandler })
	validator.checkFields({ fieldName: { name, mockHandler: args } }, { fieldName: value })

	expect(mockHandler.mock.calls.length).toBe(1);
	expect(mockHandler.mock.calls[0][0]).toBe(name);
	expect(mockHandler.mock.calls[0][1]).toBe(args);
	expect(mockHandler.mock.calls[0][2]).toBe(value);
})