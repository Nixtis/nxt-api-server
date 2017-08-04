const routeMetadataKey = Symbol('route')

export function NxtRoute (params: NxtRouteParams) {
    return Reflect.metadata(routeMetadataKey, params)
}

export function nxtGetRoute (target: any, propertyKey: string) {
    /*if (!Reflect.hasOwnMetadata(fieldMetadataKey, target, propertyKey)) {
        return null
    }*/

    return Reflect.getMetadata(routeMetadataKey, target, propertyKey)
}

export interface NxtRouteParams {
    path: string
    method: number
    roleAccess?: string[]
    queryString?: Array<{ name: string, type: number }>
}
