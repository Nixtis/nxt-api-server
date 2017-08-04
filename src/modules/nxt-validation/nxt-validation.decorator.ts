const validationMetadataKey = Symbol('validation')

export function NxtValidation (params: NxtValidationParams) {
    return Reflect.metadata(validationMetadataKey, params)
}

export function nxtGetValidation (target: any, propertyKey: string): NxtValidationParams {
    /*if (!Reflect.hasOwnMetadata(fieldMetadataKey, target, propertyKey)) {
        return null
    }*/

    return Reflect.getMetadata(validationMetadataKey, target, propertyKey)
}

export interface NxtValidationParams {
    type: number|RegExp
    allowEmpty?: boolean
    length?: number
    min?: number
    max?: number
    errorMsg?: string
    pattern?: any
}
