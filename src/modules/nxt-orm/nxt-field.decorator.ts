const fieldMetadataKey = Symbol('field')

export function NxtField (params: NxtFieldParams) {
    return Reflect.metadata(fieldMetadataKey, params)
}

export function nxtGetField (target: any, propertyKey: string): NxtFieldParams {
    /*if (!Reflect.hasOwnMetadata(fieldMetadataKey, target, propertyKey)) {
        return null
    }*/

    return Reflect.getMetadata(fieldMetadataKey, target, propertyKey)
}

export interface NxtFieldParams {
    name?: string
    type: number|any
    length?: number
    relation?: number
    autoIncrement?: boolean
    key?: number
    nullable?: boolean
    enumType?: { name: string, values: string[] }
    isStatuable?: boolean
}
