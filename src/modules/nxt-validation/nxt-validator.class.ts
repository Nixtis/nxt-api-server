import * as NxtOrm from '../../modules/nxt-orm'
import { NxtValidationError } from './nxt-validation-error.model'
import { nxtGetValidation, NxtValidationParams } from './nxt-validation.decorator'

export class NxtValidator {
    public static STRING: number = 0
    public static NUMBER: number = 1
    public static BOOLEAN: number = 2
    public static JSON: number = 3
    public static ARRAY: number = 4

    public validate (entity: NxtOrm.NxtEntityClass): NxtValidationError[] {
        const errors: NxtValidationError[] = []

        Object.getOwnPropertyNames(entity).forEach((prop: string) => {
            const validation: NxtValidationParams = nxtGetValidation(entity, prop)

            if (validation) {
                if (validation.type === NxtValidator.STRING) {
                    if (!this.isGoodString(entity[prop], validation.allowEmpty, validation.length)) {
                        errors.push(new NxtValidationError(prop, validation.errorMsg || prop + ' is not a valid string'))
                    }
                } else if (validation.type === NxtValidator.NUMBER) {
                    if (this.isGoodNumber(entity[prop], validation.min, validation.max)) {
                        errors.push(new NxtValidationError(prop, validation.errorMsg || prop + ' is not a valid number'))
                    }
                } else if (validation.type === NxtValidator.BOOLEAN) {
                    if (!this.isGoodBoolean(entity[prop])) {
                        errors.push(new NxtValidationError(prop, validation.errorMsg || prop + ' should be a boolean'))
                    }
                } else if (validation.type === NxtValidator.JSON) {
                    if (!this.isGoodJSON(entity[prop], validation.pattern)) {
                        errors.push(new NxtValidationError(prop, validation.errorMsg || prop + ' is not a valid json'))
                    }
                } else if (validation.type === NxtValidator.ARRAY) {
                    if (!this.isGoodArray(entity[prop], validation.pattern)) {
                        errors.push(new NxtValidationError(prop, validation.errorMsg || prop + ' is not a valid array'))
                    }
                } else if (validation.type instanceof RegExp) {
                    if (!validation.type.test(entity[prop])) {
                        errors.push(new NxtValidationError(prop, validation.errorMsg || prop + ' is not valid'))
                    }
                }
            }
        })

        return errors
    }

    private isGoodString (field: any, allowEmpty: boolean = true, length: number = 0): boolean {
        return !((!allowEmpty && !field) || (length && length < field.length))
    }

    private isGoodNumber (field: any, min: number = 0, max: number = 0): boolean {
        return !(isNaN(field) || (min && field < min) || (max && field > max))
    }

    private isGoodBoolean (field: any): boolean {
        return field === true || field === false
    }

    private isGoodJSON (field: any, pattern: any): boolean {
        if (!(field instanceof Object)) {
            return false
        }

        return Object.getOwnPropertyNames(pattern)
            .reduce((prev: boolean, curr: string) => {
                return !(!prev || field[curr] === undefined || (pattern[curr].type === NxtValidator.STRING && !this.isGoodString(field[curr], pattern[curr].allowEmpty, pattern[curr].length)))
            }, true)
    }

    private isGoodArray (field: any[], pattern: any): boolean {
        if (!Array.isArray(field)) {
            return false
        }

        return field
            .reduce((prev, curr) => this.isGoodJSON(curr, pattern), true)
    }
}
