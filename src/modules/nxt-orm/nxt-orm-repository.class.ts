import * as NxtValidation from '../../modules/nxt-validation'
import * as NxtRequest from '../nxt-request'
import { NxtCollectionClass } from './nxt-collection.class'
import { NxtEntityClass } from './nxt-entity.class'
import { NxtEntityParams, nxtGetEntity } from './nxt-entity.decorator'
import { NxtFieldParams, nxtGetField } from './nxt-field.decorator'
import { NxtOrmApp } from './nxt-orm.app'
import { NxtOrmEnum } from './nxt-orm.enum'

import { NxtDb, NxtDbColumnValuePair, NxtDbWhere } from '../nxt-db'

export class NxtOrmRepository<T extends NxtEntityClass> {

    public static getColDbName (entity: new() => NxtEntityClass, prop: string): string {
        const fieldParams: NxtFieldParams = nxtGetField(new entity(), prop)

        if (fieldParams.relation && fieldParams.relation !== NxtOrmEnum.MANY_TO_ONE) {
            throw new Error('[NxtOrmRepository: getColDbName]: The only authorized relation for find by is many to one')
        }

        if (fieldParams.name) {
            return fieldParams.name
        }

        const relEntityParams: NxtEntityParams = nxtGetEntity(fieldParams.type)

        return 'id_' + relEntityParams.table + '_' + NxtOrmApp.getRelationIndexClass(entity, prop, NxtOrmEnum.MANY_TO_ONE)
    }

    private entity
    private db: NxtDb = new NxtDb()

    constructor (entity) {
        this.entity = entity
    }

    public find (id: number|number[] = null, entity = this.entity, page: number = null, perPage: number = null, checkIfActive: boolean = false): Promise<T|NxtCollectionClass<T>> {
        const params: NxtEntityParams = nxtGetEntity(entity)
        const numTAlias: number = 0
        const tAlias: string = 't' + numTAlias

        const select = this.db.select()
            .setTable(params.table, tAlias)

        let where: NxtDbWhere[] = []

        if (id) {
            where.push(new NxtDbWhere('?? IN (?)', [ tAlias + '.id', id ]))
        }

        if (checkIfActive) {
            where = [
                ...where,
                ...this.getWhereActive(tAlias, entity),
            ]
        }

        if (where.length) {
            select.setWhere(where)
        }

        let nbTotal: number = null
        if (page && perPage) {
            select.setLimit((page - 1) * perPage, perPage)
        }

        return select
            .getTotalRows()
            .then((nbTot: number) => {
                nbTotal = nbTot

                return select.execute()
            })
            .then((results) => this.setRowsToEntity(entity, results), (err) => err)
            .then((entities: T[]) => {
                if (id === null || Array.isArray(id)) {
                    return new NxtCollectionClass<T>(
                        nbTotal,
                        page,
                        perPage ? nbTotal / perPage : null,
                        perPage,
                        entities,
                    )
                } else {
                    if (entities[0] === undefined) {
                        const response: T = new this.entity()

                        response._response = new NxtRequest.NxtResponse(NxtRequest.NxtResponse.HTTP_NOT_FOUND, {
                            details: 'This entity dosen\'t exists or has been deleted',
                            status: 404,
                            title: 'Not Found',
                        })

                        return response
                    }
                    return entities[0]
                }
            })
    }

    public findBy (colValPairs: NxtDbColumnValuePair[], entity = this.entity, page: number = null, perPage: number = null, checkIfActive: boolean = false): Promise<NxtCollectionClass<T>> {
        const params: NxtEntityParams = nxtGetEntity(entity)
        const numTAlias: number = 0
        const tAlias: string = 't' + numTAlias
        let where: NxtDbWhere[] = colValPairs.map((row: NxtDbColumnValuePair) => new NxtDbWhere(tAlias + '.' + NxtOrmRepository.getColDbName(entity, row.column) + ' = ?', [ row.value ], NxtDbWhere.AND))

        const select = this.db.select()
            .setTable(params.table, tAlias)

        let nbTotal: number = null

        if (page && perPage) {
            select.setLimit((page - 1) * perPage, perPage)
        }

        if (checkIfActive) {
            where = [
                ...where,
                ...this.getWhereActive(tAlias, entity),
            ]
        }

        return select
            .setWhere(where)
            .getTotalRows()
            .then((nbTot: number) => {
                nbTotal = nbTot

                return select.execute()
            })
            .then((results) => this.setRowsToEntity(entity, results))
            .then((entities: T[]) => new NxtCollectionClass<T>(
                nbTotal,
                page,
                perPage ? nbTotal / perPage : null,
                perPage,
                entities,
            ))
    }

    public insert (entityInstance: T, entity = this.entity): Promise<T> {
        // Vérification des formulaires
        const validator: NxtValidation.NxtValidator = new NxtValidation.NxtValidator()
        const errors = validator.validate(entityInstance)

        if (errors.length) {
            entityInstance._response = new NxtRequest.NxtResponse(NxtRequest.NxtResponse.HTTP_UNPROCESSABLE_ENTITY, {
                details: errors,
                status: 422,
                title: 'Unprocessable entity',
            })

            return Promise.resolve(entityInstance)
        }

        const params: NxtEntityParams = nxtGetEntity(entity)

        const propertiesNameEntity = Object.getOwnPropertyNames(entityInstance.getProps())

        const colValPairs: NxtDbColumnValuePair[] = propertiesNameEntity
            .map((prop: string) => {
                const fieldParams: NxtFieldParams = nxtGetField(entityInstance, prop)

                if (!fieldParams.nullable && entityInstance[prop] === null && prop !== 'id') {
                    throw new Error('[NxtOrmRepository: insert error]: The field "' + prop + '" must be setted')
                } else if (fieldParams.nullable && entityInstance[prop] === null) {
                    return {
                        column: fieldParams.name,
                        value: null,
                    }
                } else if (prop !== 'id') {
                    let value: any = entityInstance[prop]

                    if (fieldParams.type === NxtOrmEnum.JSON) {
                        value = JSON.stringify(entityInstance[prop])
                    }

                    if (fieldParams && fieldParams.name) {
                        return {
                            column: fieldParams.name,
                            value,
                        }
                    } else if (fieldParams && fieldParams.relation === NxtOrmEnum.MANY_TO_ONE && entityInstance[prop]) {
                        const distEntityParams: NxtEntityParams = nxtGetEntity(fieldParams.type)

                        return {
                            column: 'id_' + distEntityParams.table + '_' + NxtOrmApp.getRelationIndexClass(entity, prop, NxtOrmEnum.MANY_TO_ONE),
                            value: entityInstance[prop].id,
                        }
                    }
                }

                return null
            }).filter((colValPair: NxtDbColumnValuePair) => colValPair !== null)

        return this.db.insert()
            .setTable(params.table)
            .setColumnsValuesPair(colValPairs)
            .execute()
            .then((results) => {
                const manyToMany: any[] = propertiesNameEntity.map((prop: string) => {
                    const fieldParams: NxtFieldParams = nxtGetField(entityInstance, prop)

                    if (fieldParams && fieldParams.relation === NxtOrmEnum.MANY_TO_MANY) {
                        return { entity: fieldParams.type, values: entityInstance[prop].map((row) => row.id), prop }
                    }

                    return null
                }).filter((field: any) => field !== null)

                if (manyToMany.length) {
                    // recursive insert
                    return this.insertManyToMany(results.insertId, params.table, manyToMany, entity)
                        .then(() => results.insertId)
                }

                return results.insertId
            })
            .then((id) => this.find(id))
            .then((entityResponse: T) => {
                entityResponse._response = new NxtRequest.NxtResponse(NxtRequest.NxtResponse.HTTP_CREATED, entityResponse.getObjectToSend())

                return entityResponse
            })
    }

    public update (entityInstance: T, entity = this.entity): Promise<T> {
        const params: NxtEntityParams = nxtGetEntity(entity)
        const propertiesNameEntity = Object.getOwnPropertyNames(entityInstance)

        const colValPairs: NxtDbColumnValuePair[] = propertiesNameEntity
            .map((prop: string) => {
                const fieldParams: NxtFieldParams = nxtGetField(entityInstance, prop)

                if (fieldParams && fieldParams.name) {
                    return {
                        column: fieldParams.name,
                        value: entityInstance[prop],
                    }
                } else {
                    return null
                }
            }).filter((colValPair: NxtDbColumnValuePair) => colValPair !== null)

        return this.db.update()
            .setTable(params.table)
            .setColumnsValuesPair(colValPairs)
            .setWhere([ new NxtDbWhere('id = ?', [ entityInstance.id ]) ])
            .execute()
            .then(() => {
                entityInstance._response = new NxtRequest.NxtResponse(NxtRequest.NxtResponse.HTTP_OK, entityInstance.getObjectToSend())

                return entityInstance
            })
    }

    public delete (entityInstance: T, entity = this.entity): Promise<any> {
        const params: NxtEntityParams = nxtGetEntity(entity)

        if (!entityInstance.id) {
            return Promise.resolve(entityInstance)
        }

        return this.db.delete()
            .setTable(params.table)
            .where('id = ?')
            .values(entityInstance.id)
            .execute()
            .then(() => {
                entityInstance._response = new NxtRequest.NxtResponse(NxtRequest.NxtResponse.HTTP_NO_CONTENT, {})

                return entityInstance
            })
    }

    private insertManyToMany (id: number, table: string, manyToMany: any[], entity = this.entity): Promise<any> {
        const distEntityParams: NxtEntityParams = nxtGetEntity(manyToMany[0].entity)

        const colsValPair: NxtDbColumnValuePair[][] = manyToMany[0].values.map((value: any): NxtDbColumnValuePair[] => [
            { column: 'id_' + table, value: id },
            { column: 'id_' + distEntityParams.table, value },
        ])

        return this.insertManyToManyQueryExec(table + '_' + distEntityParams.table + '_' + NxtOrmApp.getRelationIndexClass(entity, manyToMany[0].prop, NxtOrmEnum.MANY_TO_MANY), colsValPair)
            .then(() => manyToMany.length > 1 ? this.insertManyToMany(id, table, manyToMany.slice(1)) : null)
    }

    private insertManyToManyQueryExec (table: string, colsValPair: NxtDbColumnValuePair[][]) {
        return this.db.insert()
            .setTable(table)
            .setColumnsValuesPair(colsValPair[0])
            .execute()
            .then(() => colsValPair.length > 1 ? this.insertManyToManyQueryExec(table, colsValPair.slice(1)) : null)
    }

    private setRowsToEntity (entity, rows: any[], entities: T[] = [], currentIndex: number = 0, propertiesNameEntity: string[] = null): Promise<T[]> {
        return new Promise((resolve, reject) => {
            if (currentIndex < rows.length) {
                if (entities.length === currentIndex) {
                    entities.push(new entity())
                }

                if (propertiesNameEntity === null) {
                    propertiesNameEntity = Object.getOwnPropertyNames(entities[currentIndex].getProps())
                }

                const fieldParams: NxtFieldParams = nxtGetField(entities[currentIndex], propertiesNameEntity[0])

                if (fieldParams !== undefined) {
                    if (typeof fieldParams.name === 'string') {
                        // Gère les JSON
                        if (fieldParams.type === NxtOrmEnum.JSON) {
                            entities[currentIndex][propertiesNameEntity[0]] = JSON.parse(rows[currentIndex][fieldParams.name])
                        } else {
                            entities[currentIndex][propertiesNameEntity[0]] = rows[currentIndex][fieldParams.name]
                        }

                        if (propertiesNameEntity.slice(1).length) {
                            this.setRowsToEntity(entity, rows, entities, currentIndex, propertiesNameEntity.slice(1))
                                .then((results) => {
                                    resolve(results)
                                })
                        } else {
                            currentIndex++
                            this.setRowsToEntity(entity, rows, entities, currentIndex)
                                .then((results) => {
                                    resolve(results)
                                })
                        }
                    } else if (fieldParams.relation !== undefined) {
                        const linkEntityParams: NxtEntityParams = nxtGetEntity(fieldParams.type)
                        const eParams: NxtEntityParams = nxtGetEntity(entity)

                        switch (fieldParams.relation) {
                            case NxtOrmEnum.MANY_TO_MANY:
                                const tAlias: string = 't'

                                this.db.select()
                                    .setTable(eParams.table + '_' + linkEntityParams.table + '_' + NxtOrmApp.getRelationIndexClass(entity, propertiesNameEntity[0], NxtOrmEnum.MANY_TO_MANY), tAlias)
                                    .setWhere([ new NxtDbWhere(tAlias + '.id_' + eParams.table + ' = ?', [ rows[currentIndex]['id'] ]) ])
                                    .execute()
                                    .then((results) => {
                                        this.find(results.map((row) => row['id_' + linkEntityParams.table]), fieldParams.type)
                                            .then((res) => {
                                                entities[currentIndex][propertiesNameEntity[0]] = res

                                                if (propertiesNameEntity.slice(1).length) {
                                                    this.setRowsToEntity(entity, rows, entities, currentIndex, propertiesNameEntity.slice(1))
                                                        .then((results) => {
                                                            resolve(results)
                                                        })
                                                } else {
                                                    currentIndex++
                                                    this.setRowsToEntity(entity, rows, entities, currentIndex)
                                                        .then((results) => {
                                                            resolve(results)
                                                        })
                                                }
                                            })
                                    })
                                break
                            case NxtOrmEnum.MANY_TO_ONE:
                                this.find(rows[currentIndex]['id_' + linkEntityParams.table + '_' + NxtOrmApp.getRelationIndexClass(entity, propertiesNameEntity[0], NxtOrmEnum.MANY_TO_ONE)], fieldParams.type)
                                    .then((res) => {
                                        entities[currentIndex][propertiesNameEntity[0]] = res

                                        if (propertiesNameEntity.slice(1).length) {
                                            this.setRowsToEntity(entity, rows, entities, currentIndex, propertiesNameEntity.slice(1))
                                                .then((results) => {
                                                    resolve(results)
                                                })
                                        } else {
                                            currentIndex++
                                            this.setRowsToEntity(entity, rows, entities, currentIndex)
                                                .then((results) => {
                                                    resolve(results)
                                                })
                                        }
                                    })
                                break
                            default:
                                reject()
                                throw new Error('[ENTITY: Configuration problem]: You must give a relation when type is another entity')
                        }
                    }
                } else {
                    resolve(entities)
                }
            } else {
                resolve(entities)
            }
        })
    }

    private getWhereActive (tAlias, entity): NxtDbWhere[] {
        const tempEntity = new entity()

        return Object.getOwnPropertyNames(tempEntity.getProps()).reduce((prev: NxtDbColumnValuePair[], curr: string) => {
            const fieldParams: NxtFieldParams = nxtGetField(tempEntity, curr)

            if (fieldParams && fieldParams.isStatuable && fieldParams.type === NxtOrmEnum.BOOLEAN && typeof tempEntity[curr] === 'boolean') {
                prev.push({
                    column: fieldParams.name,
                    value: true,
                })
            }

            return prev
        }, [])
        .map((colValPair: NxtDbColumnValuePair) => new NxtDbWhere('?? = ?', [ tAlias + '.' + colValPair.column, colValPair.value ]))
    }

}
