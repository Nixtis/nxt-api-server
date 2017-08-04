const entityMetadataKey = Symbol('entity')

export function NxtEntity (params: NxtEntityParams) {
    return (target) => {
        Reflect.defineMetadata(entityMetadataKey, params, target)
    }
}

export function nxtIsEntity (target): boolean {
    return Reflect.hasOwnMetadata(entityMetadataKey, target)
}

export function nxtGetEntity (target: any): NxtEntityParams {
    if (!nxtIsEntity(target)) {
        throw new Error('Entity must be decorated with Entity decorator')
    }

    return Reflect.getMetadata(entityMetadataKey, target)
}

export interface NxtEntityParams {
    repository?: any
    table: string
}
