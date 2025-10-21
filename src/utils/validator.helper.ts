type ValidatorSchema = {
  [field: string]: {
    required?: boolean
    type?: 'string' | 'number' | 'boolean'
    minLength?: number
    maxLength?: number
    custom?: (value: any) => boolean | string
  }
}

type ValidatorResponse = {
  success: boolean
  errors: string[]
  value?: any
  message: string
}

export const ValidatorSchema: { [schema: string]: ValidatorSchema } = {
  createNews: {
    title: { required: true, type: 'string' },
    // shortDesc: { required: true, type: 'string' },
    category: { required: true, type: 'string' },
  },
  createCategory: {
    title: { required: true, type: 'string' },
  },
  updateCategory: {
    title: { required: true, type: 'string' },
  },
  createUser: {
    username: { required: true, type: 'string' },
    password: { required: true, type: 'string' },
    role: { required: true, type: 'string' },
  },
  createPeople: {
    name: { required: true, type: 'string' },
  },
  createRole: {
    name: { required: true, type: 'string' },
  },
}

export class ValidatorHelper {
  public static isCorrectType = (value: unknown, expected: 'string' | 'number' | 'boolean'): boolean => {
    if (typeof value !== expected) {
      return false
    }
    return true
  }

  public static isEmpty = (value: 'string' | 'number' | 'boolean') => {
    const isString = this.isCorrectType(value, 'string')
    if (isString) {
      return !value.trim()
    }
    if (value === undefined || value === null) {
      return true
    }
    return false
  }

  public static minLength = (value: any, length: number): boolean => {
    const isString = this.isCorrectType(value, 'string')
    if (isString && value.length < length) {
      return true
    }
    return false
  }

  public static scan = (data: any, schema: ValidatorSchema): ValidatorResponse => {
    const errors: string[] = []
    const sanitized: Record<string, any> = {}

    for (const key in schema) {
      const rules = schema[key]
      const value = data[key]
      const isRequired = ValidatorHelper.isEmpty(value)
      const isString = this.isCorrectType(value, 'string')
      if (rules.required && isRequired) {
        errors.push(`${key} is required`)
        continue
      }

      if (isRequired) continue

      if (rules.type && typeof value !== rules.type) {
        errors.push(`${key} must be of type ${rules.type}`)
        continue
      }

      if (isString) {
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`${key} must be at least ${rules.minLength} characters`)
        }

        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${key} must be at most ${rules.maxLength} characters`)
        }
      }

      if (rules.custom) {
        const result = rules.custom(value)
        if (result !== true) {
          const isResultString = this.isCorrectType(result, 'string')
          errors.push(isResultString ? result.toString() : `${key} is invalid`)
        }
      }

      sanitized[key] = value
    }

    return {
      success: errors.length === 0,
      errors,
      message: errors.join(', '),
      value: errors.length === 0 ? sanitized : undefined,
    }
  }
}
