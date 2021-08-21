const RESERVED_WORDS = ['name', 'optional', 'default', 'arrayOf', 'object']

    // TESTED - All validators have to pass without error
    // TESTED - Cannot be blank unless optional is true
    // When optional, only check validation if it exists
    // Object recursively checks the form
    // Array checks all items in the array match
    // Authorizers can take args just like validators
    // Only object or array can exist, not both
    // Custom validators return their error message or nothing for success
    // Default is used to set blank values and still validate
    // Everything not a reserved keyword is custom validator
    // TESTED - Display name is passed if it exists or the field name uncamel cased


module.exports = function Validator(validators) {
  const processFieldObject = (fieldName, fieldMetadata, value) => {
    if (typeof fieldMetadata.object !== 'object') {
      throw `${fieldName} 'object' property is not an object`
    }
    // Recursively call checks on an object
    return checkFields(fieldMetadata.object, value)
  }

  const processFieldArray = (fieldName, fieldMetadata, value) => {
    if (typeof fieldMetadata.arrayOf !== 'object') {
      throw `${fieldName} 'arrayOf' property is not an object`
    }
    if (!(value instanceof Array)) {
      throw `${fieldName} is not an array but has arrayOf property`
    }
    // Go over each item and make sure it matches
    return value.map((v, i) => checkField(`${fieldName}[${i}]`, fieldMetadata.arrayOf, v))
  }

  const processFieldCustomValidators = (fieldName, fieldMetadata, value) => {
    const validatorNames = Object.keys(fieldMetadata).filter(n => !RESERVED_WORDS.includes(n))
    if (!validatorNames.length) return []

    return validatorNames.map(validatorName => {
      const handler = validators[validatorName]
      if (handler === undefined) {
        throw `Form handler ${validatorName} for ${fieldName} is not defined in your config`
      }
      if (typeof handler !== 'function') {
        throw `Form handler ${validatorName} is not a function`
      }

      return handler(fieldName, fieldMetadata[validatorName], value)
    }).reduce((memo, e) => {
      if (e) memo.push(e)
      return memo
    }, [])
  }

  const checkField = (fieldName, fieldMetadata, fieldValue) => {
    let errors = []

    const defaultValue = fieldMetadata.default
    let value = fieldValue || defaultValue

    const isOptional = !!fieldMetadata.optional
    const isUndefined = value === undefined || value === null
    const isEmptyString = typeof value === 'string' && !value.length
    const isBlank = isUndefined || isEmptyString

    // Set blank to undefined
    if (isBlank) value = undefined

    // If we set value with default, then this is skipped
    if (!isOptional && isBlank) errors.push(`${fieldName} is blank`)

    // Only check the value if it exists
    if (!isBlank) {
      if (fieldMetadata.object) {
        value = processFieldObject(fieldName, fieldMetadata, value)
      } else if (fieldMetadata.arrayOf) {
        value = processFieldArray(fieldName, fieldMetadata, value)
      }

      errors = errors.concat(processFieldCustomValidators(fieldName, fieldMetadata, value) || [])
    }

    return [errors.length === 0 ? undefined : errors, value]
  }

	this.checkFields = (formMetdata, form) => {
    const outputForm = {}

    if (formMetdata === undefined) return outputForm
		if (!formMetdata || Object.getPrototypeOf(formMetdata) !== Object.prototype) {
      throw "Form block should be an object {}"
    }

    const fieldNames = Object.keys(formMetdata)

		fieldNames.forEach((fieldName) => {
      const fieldMetadata = formMetdata[fieldName]

      // Convert field name to something readable
      const nameResult = fieldName.replace(/([A-Z])/g, " $1").toLowerCase();
      const displayFieldName = fieldName.charAt(0).toUpperCase() + nameResult.slice(1);

      const name = fieldMetadata.name || displayFieldName
			const [errors, value] = checkField(name, fieldMetadata, form[fieldName])

			outputForm[fieldName] = value;
			if (errors) {
				if (!outputForm.errors) outputForm.errors = {}
				outputForm.errors[fieldName] = (outputForm.errors[fieldName] || []).concat(errors)
			}
		})

		return outputForm
	}
}