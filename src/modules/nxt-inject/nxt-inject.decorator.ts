const injectMetadataKey = Symbol('inject')

export function NxtInject (params: any[]) {
    return Reflect.metadata(injectMetadataKey, params)
}

export function nxtGetInject (target: any): any[] {
    return Reflect.getMetadata(injectMetadataKey, target)
}
