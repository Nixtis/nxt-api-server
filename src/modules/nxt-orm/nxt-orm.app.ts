import { dbConfig } from '../../config/db.config'
import * as modulesEntities from '../../modules/entities'
import * as entities from '../../services'
import * as NxtDb from '../nxt-db'
import * as NxtOrm from './'
import { NxtEntityParams, nxtGetEntity, nxtIsEntity } from './nxt-entity.decorator'
import { NxtFieldParams, nxtGetField } from './nxt-field.decorator'

export class NxtOrmApp {

    /**
     * Retourne l'index correspondant aux occurrences du champ relationnel many to many
     * @param entity {new() => NxtOrm.NxtEntityClass}
     * @param propertyNameEntity {string}
     * @returns {number}
     */
    public static getRelationIndexClass (entity: new() => NxtOrm.NxtEntityClass, propertyNameEntity: string, relationType: number): number {
        const colParams: NxtFieldParams = nxtGetField(new entity(), propertyNameEntity)

        if (relationType !== NxtOrm.NxtOrmEnum.MANY_TO_MANY && relationType !== NxtOrm.NxtOrmEnum.MANY_TO_ONE) {
            throw new Error('[NxtOrmApp: getRelationIndexClass]: "relationType" is not valid')
        }

        if (!colParams.relation) {
            throw new Error('[NxtOrmApp: relation problem]: ' + propertyNameEntity + ' of ' + typeof new entity() + ' is not a relationned property')
        }

        return Object.getOwnPropertyNames(new entity())
            .reduce((prev, curr) => {
                const currColParams: NxtFieldParams = nxtGetField(new entity(), curr)

                return (currColParams && currColParams.type === colParams.type) ? [ ...prev, curr ] : prev
            }, [])
            .reduce((prev, curr, index) => (curr === propertyNameEntity) ? index + 1 : prev, 0)
    }

    private ready: boolean = false
    private action: string
    private db: NxtDb.NxtDb = new NxtDb.NxtDb()
    private actions: string[] = [ 'sync' ]
    private params: string[] = []

    constructor () {
        if (this.actions.indexOf(process.argv[3]) > -1) {
            this.action = process.argv[3]
            this.ready = true

            if (process.argv.length > 4) {
                process.argv.forEach((param: string, index: number) => {
                    if (index > 3) {
                        this.params.push(param)
                    }
                })
            }
        }
    }

    /**
     * Lancement de l'action
     * @returns {void}
     */
    public initiate () {
        switch (this.action) {
            case 'sync':
                const allEntitiesArray: Array<new() => NxtOrm.NxtEntityClass> = this.entitiesObjectToEntitiesArray({ ...entities, ...modulesEntities })

                // On lance la synchronisation des entities pour construire la BDD
                this.sync(allEntitiesArray, [])
                    .then((sqlQueries: NxtDb.INxtDbQuery[]) => this.handleSyncResults(sqlQueries))
                    .catch((err: Error) => {
                        console.log(err)

                        process.exit()
                    })
                break
            default:
                throw new Error('Warning: invalid argument, please read the doc if you need help: http://help.nxt')
        }
    }

    /**
     * Retourne true si les paramètres envoyés sont corrects
     * @returns {boolean}
     */
    public isReady (): boolean {
        return this.ready
    }

    /**
     * Transforme l'objet d'entities en array d'entities
     * @param allEntitiesObject {any}
     * @returns {Array<new() => NxtOrm.NxtEntityClass>}
     */
    private entitiesObjectToEntitiesArray (allEntitiesObject: any): Array<new() => NxtOrm.NxtEntityClass> {
        const allEntitiesArray: Array<new() => NxtOrm.NxtEntityClass> = []

        // On parcour l'objet pour ajouter chaque entities dans un array
        for (const ent in allEntitiesObject) {
            if (allEntitiesObject[ent].prototype instanceof NxtOrm.NxtEntityClass) {
                allEntitiesArray.push(allEntitiesObject[ent])
            }
        }

        return allEntitiesArray
    }

    /**
     * Récupère toutes les requêtes SQL du "sync" et soit les affiche soit les execute
     * @param sqlQueries {NxtDb.INxtDbQuery[]}
     * @returns {void}
     */
    private handleSyncResults (sqlQueries: NxtDb.INxtDbQuery[]) {
        if (sqlQueries.length) {
            // On récupère toutes les requêtes SQL au format string
            let sqlQueriesString: string = sqlQueries.map((sqlQuery: NxtDb.INxtDbQuery) => sqlQuery.toSQLString()).join('\n')

            if (this.params.indexOf('execute') > -1) {
                // On le paramètre "execute" a été renseigné alors on execute les requêtes SQL
                this.db.query(sqlQueriesString)
                    .then((results) => {
                        process.stdout.write(sqlQueries.length.toString() + ' queries executed' + '\n')

                        process.exit()
                    })
                    .catch((err) => {
                        throw new Error('[SQL_ERROR: ' + err.code + ']: ' + err.message + '\n' + sqlQueriesString)
                    })
            } else {
                // Sinon on affiche simplement les requêtes
                process.stdout.write(sqlQueries.length.toString() + ' queries:' + '\n')
                process.stdout.write(sqlQueriesString + '\n')

                process.exit()
            }
        } else {
            process.stdout.write('There is no queries to execute' + '\n')

            process.exit()
        }
    }

    /**
     * Lance la synchronisation des entities pour construire la BDD de manière récursive
     * @param ent {NxtOrm.NxtEntityClass[]}
     * @param eProps {string[]}
     * @param sqlQueries {NxtDb.INxtDbQuery[]}
     * @returns {Promise<NxtDb.INxtDbQuery[]>}
     */
    private sync (ent: Array<new() => NxtOrm.NxtEntityClass>, sqlQueries: NxtDb.INxtDbQuery[]): Promise<NxtDb.INxtDbQuery[]> {
        if (nxtIsEntity(ent[0])) {
            // Si le décorateur NxtEntity a bien été renseigné on crée la table si elle n'existe pas déjà
            return this.createTableIfNotExists(ent[0], sqlQueries)
                .then((results: NxtDb.INxtDbQuery[]) => ent.slice(1).length ? this.sync(ent.slice(1), results) : results)
        }

        // S'il n'y a pas le décorateur mais qu'il reste des entities à parcourir on passe à l'entity suivante, sinon on ferme la récursion
        return ent.slice(1).length ? this.sync(ent.slice(1), sqlQueries) : new Promise ((resolve, reject) => resolve(sqlQueries))
    }

    /**
     * Crée une table si elle n'existe pas
     * @param entity {new() => NxtOrm.NxtEntityClass}
     * @param sqlQueries {NxtDb.INxtDbQuery[]}
     * @returns {Promise<NxtDb.INxtDbQuery[]>}
     */
    private createTableIfNotExists (entity: new() => NxtOrm.NxtEntityClass, sqlQueries: NxtDb.INxtDbQuery[]): Promise<NxtDb.INxtDbQuery[]> {
        const eParams: NxtEntityParams = nxtGetEntity(entity)

        // On vérifie si l'ajout de la table n'a pas déjà été ajouté dans la requête finale
        const tableFound: NxtDb.INxtDbQuery = sqlQueries.find((sqlQuery: NxtDb.INxtDbQuery) => (sqlQuery instanceof NxtDb.NxtDbCreateTable && sqlQuery.getTable() === eParams.table))

        if (!tableFound) {
            const whereCombination: string[] = dbConfig.driver === 'mysql' ? [ 'table_schema', dbConfig.database ] : [ 'table_schema', 'public' ]
            // Si on ne l'a pas dans notre requête finale on vérifie si elle n'existe pas déjà dans la base de donnée
            return this.db.select()
                .setTable('information_schema.tables', 't')
                .setWhere([ new NxtDb.NxtDbWhere('?? = ? AND ?? = ?', [ ...whereCombination, 'table_name', eParams.table ]) ])
                .execute()
                .then((results) => {
                    return this.handleCreateTableIfNotExistsResults(results, entity, sqlQueries)
                }, (err) => {
                    throw new Error('[SQL_ERROR: ' + err.code + ']: ' + err.message)
                })
        }

        return Promise.resolve(sqlQueries)
    }

    /**
     * Crée la table si elle n'existe pas ou gère les colonnes (ajoute, modifie ou supprime) en fonction des resultats obtenus dans "createTableIfNotExists"
     * @param results {any}
     * @param entity {new() => NxtOrm.NxtEntityClass}
     * @param sqlQueries {NxtDb.INxtDbQuery[]}
     * @returns {Promise<NxtDb.INxtDbQuery[]>}
     */
    private handleCreateTableIfNotExistsResults (results, entity: new() => NxtOrm.NxtEntityClass, sqlQueries: NxtDb.INxtDbQuery[]): Promise<NxtDb.INxtDbQuery[]> {
        const eParams: NxtEntityParams = nxtGetEntity(entity)
        const entityInstance = new entity()
        const propertiesNameEntity: string[] = Object.getOwnPropertyNames(entityInstance.getProps())

        if (results.length) {
            // On liste tous les champs de la table, on supprime ceux en trop et on ajoute ceux qu'il faut ajouter
            return this.dropColumnsIfNotExistInEntity(eParams.table, entity, sqlQueries)
                .then((results: NxtDb.INxtDbQuery[]) => this.createColumnsIfNotExists(entity, propertiesNameEntity, results))
        }

        // La table n'existe pas, on crée la table et les champs
        return this.createTable(entity, propertiesNameEntity, sqlQueries)
    }

    /**
     * Supprime les colonnes en trop dans une table de la BDD
     * @param table {string}
     * @param entity {new() => NxtOrm.NxtEntityClass}
     * @param sqlQueries {NxtDb.INxtDbQuery[]}
     * @returns {Promise<NxtDb.INxtDbQuery[]>}
     */
    private dropColumnsIfNotExistInEntity (table: string, entity: new() => NxtOrm.NxtEntityClass, sqlQueries: NxtDb.INxtDbQuery[]): Promise<NxtDb.INxtDbQuery[]> {
        // On récupère la liste des colonnes de la table
        const whereCombination: string[] = dbConfig.driver === 'mysql' ? [ 'table_schema', dbConfig.database ] : [ 'table_schema', 'public' ]
        return this.db.select()
            .setTable('information_schema.columns', 'c')
            .setWhere([ new NxtDb.NxtDbWhere('?? = ? AND ?? = ?', [ ...whereCombination, 'table_name', table ]) ])
            .execute()
            .then((results) => this.handleDropColumnsIfNotExistInEntityResults(table, results, entity, sqlQueries), (err) => {
                throw new Error('[SQL_ERROR: ' + err.code + ']: ' + err.message)
            })
    }

    /**
     * Ajoute les alter table drop dans les "sqlQueries" en fonction des résultats obtenus dans "dropColumnsIfNotExistInEntity"
     * @param table {string}
     * @param results {any}
     * @param entity {new() => NxtOrm.NxtEntityClass}
     * @param sqlQueries {NxtDb.INxtDbQuery[]}
     * @returns {NxtDb.INxtDbQuery[]}
     */
    private handleDropColumnsIfNotExistInEntityResults (table: string, results: any, entity: new() => NxtOrm.NxtEntityClass, sqlQueries: NxtDb.INxtDbQuery[]): NxtDb.INxtDbQuery[] {
        const entityInstance = new entity()
        const propertiesNameEntity: string[] = Object.getOwnPropertyNames(entityInstance.getProps())

        const alters: NxtDb.NxtDbAlterTable[] = results.reduce((prev: NxtDb.NxtDbAlterTable[], curr): NxtDb.NxtDbAlterTable[] => {
            // On vérifie si la colonne de la table existe dans l'entity
            const isPresent: boolean = propertiesNameEntity.reduce((prevBool: boolean, prop): boolean => {
                const colParams: NxtFieldParams = nxtGetField(entityInstance, prop)

                if (colParams && typeof colParams.name === 'string' && (colParams.name === curr[this.db.getDriver().informationSchema.columnName])) {
                    // Cas d'une colonne normale
                    prevBool = true
                } else if (colParams && typeof colParams.name !== 'string' && colParams.relation === NxtOrm.NxtOrmEnum.MANY_TO_ONE) {
                    // Cas d'une colonne liée à une autre table (FK)
                    const linkEntityParams: NxtEntityParams = nxtGetEntity(colParams.type)

                    if (curr[this.db.getDriver().informationSchema.columnName] === 'id_' + linkEntityParams.table + '_' + NxtOrmApp.getRelationIndexClass(entity, prop, NxtOrm.NxtOrmEnum.MANY_TO_ONE)) {
                        prevBool = true
                    }
                }

                return prevBool
            }, false)

            // Si la colonne n'est pas présente on ajoute l'alter table drop dans les "sqlQueries"
            if (!isPresent) {
                const alterTable: NxtDb.NxtDbAlterTable = this.db.alterTable()
                    .setTable(table)
                    .setTableElement(new NxtDb.NxtDbColumn(curr[this.db.getDriver().informationSchema.columnName], null, null, null, null, this.db.getDriver()))
                    .setAction(NxtDb.NxtDbAlterTable.DROP)

                prev.push(alterTable)
            }

            return prev
        }, [])

        return [ ...sqlQueries, ...alters ]
    }

    /**
     * Création d'une table
     * @param entity {new() => NxtOrm.NxtEntityClass}
     * @param propertiesNameEntity {string[]}
     * @param sqlQueries {NxtDb.INxtDbQuery[]}
     * @returns {Promise<NxtDb.INxtDbQuery[]>}
     */
    private createTable (entity: new() => NxtOrm.NxtEntityClass, propertiesNameEntity: string[], sqlQueries: NxtDb.INxtDbQuery[]): Promise<NxtDb.INxtDbQuery[]> {
        const eParams: NxtEntityParams = nxtGetEntity(entity)
        const createTable: NxtDb.NxtDbCreateTable = this.db.createTable().setTable(eParams.table)

        return this.getColSQLCodeForCreateTable(createTable, entity, propertiesNameEntity, sqlQueries)
    }

    /**
     * Ajout des colonnes pour la table "tableObject" donnée en paramètres
     * @param tableObject {NxtDb.NxtDbCreateTable}
     * @param entity {new() => NxtOrm.NxtEntityClass}
     * @param propertiesNameEntity {string[]}
     * @param sqlQueries {NxtDb.INxtDbQuery[]}
     * @returns {Promise<NxtDb.INxtDbQuery[]>}
     */
    private getColSQLCodeForCreateTable (tableObject: NxtDb.NxtDbCreateTable, entity: new() => NxtOrm.NxtEntityClass, propertiesNameEntity: string[], sqlQueries: NxtDb.INxtDbQuery[]): Promise<NxtDb.INxtDbQuery[]> {
        const colParams: NxtFieldParams = nxtGetField(new entity(), propertiesNameEntity[0])

        if (colParams && typeof colParams.name === 'string') {
            // Si ce sont des champs SQL classiques on ajoute la ligne dans la query

            // On vérifie bien que s'il s'agit d'un ENUM on lui donne l'objet enumType
            let enumType: NxtDb.NxtDbEnumType = null
            if (colParams.type === NxtOrm.NxtOrmEnum.ENUM && colParams.enumType) {
                enumType = new NxtDb.NxtDbEnumType(colParams.enumType.name, colParams.enumType.values)
            }

            const col: NxtDb.NxtDbColumn = new NxtDb.NxtDbColumn(colParams.name, colParams.type, colParams.length, colParams.nullable, colParams.autoIncrement, this.db.getDriver(), enumType)

            tableObject.setColumns([ ...tableObject.getColumns(), col ])

            // On ajoute un index si nécessaire
            if (colParams.key) {
                tableObject.setIndexes([
                    ...tableObject.getIndexes(),
                    new NxtDb.NxtDbIndex([ col ], colParams.key),
                ])
            }

            if (propertiesNameEntity.slice(1).length) {
                return this.getColSQLCodeForCreateTable(tableObject, entity, propertiesNameEntity.slice(1), sqlQueries)
            }

            sqlQueries.push(tableObject)
        } else if (colParams) {
            // Si ce sont des champs liés à une autre entity on ajoute selon les cas (MANY_TO_MANY, MANY_TO_ONE, etc.) le champ id_[nom_table] + une FK ou alors on crée une table de jointure avec les id_[nom_table] et les FKs en vérifiant bien que les tables existent (recursion sur createTableIfNotExists)
            return this.createTableIfNotExists(colParams.type, sqlQueries)
                .then((results: NxtDb.INxtDbQuery[]) => {
                    const linkEntityParams: NxtEntityParams = nxtGetEntity(colParams.type)
                    const eParams: NxtEntityParams = nxtGetEntity(entity)
                    let tmpTable: NxtDb.NxtDbCreateTable = null

                    switch (colParams.relation) {
                        case NxtOrm.NxtOrmEnum.MANY_TO_MANY:
                            // On crée une nouvelle table avec en FK les ID des tables
                            tmpTable = this.createManyToManyTable(entity, propertiesNameEntity[0])
                            break
                        case NxtOrm.NxtOrmEnum.MANY_TO_ONE:
                            // On crée la colonne FK "id_[nom_table]"
                            tableObject
                                .setColumns([
                                    ...tableObject.getColumns(),
                                    new NxtDb.NxtDbColumn('id_' + linkEntityParams.table + '_' + NxtOrmApp.getRelationIndexClass(entity, propertiesNameEntity[0], NxtOrm.NxtOrmEnum.MANY_TO_ONE), NxtOrm.NxtOrmEnum.INT, null, false, false, this.db.getDriver()),
                                ])
                                .setForeignKeys([
                                    ...tableObject.getForeignKeys(),
                                    new NxtDb.NxtDbForeignKey('id_' + linkEntityParams.table + '_' + NxtOrmApp.getRelationIndexClass(entity, propertiesNameEntity[0], NxtOrm.NxtOrmEnum.MANY_TO_ONE), 'fk_' + eParams.table + '_to_' + linkEntityParams.table + '_' + NxtOrmApp.getRelationIndexClass(entity, propertiesNameEntity[0], NxtOrm.NxtOrmEnum.MANY_TO_ONE), { colName: 'id', db: dbConfig.database, table: linkEntityParams.table }, NxtDb.NxtDb.RESTRICT, NxtDb.NxtDb.CASCADE),
                                ])
                            break
                        case NxtOrm.NxtOrmEnum.ONE_TO_MANY:
                            // TODO: Ajouter la colonne dans l'autre table si nécessaire
                            throw new Error('[ENTITY: Configuration problem]: One to many relation is not implemented yet')
                        default:
                            throw new Error('[ENTITY: Configuration problem]: You must give a relation when type is another entity')
                    }

                    if (propertiesNameEntity.slice(1).length) {
                        return this.getColSQLCodeForCreateTable(tableObject, entity, propertiesNameEntity.slice(1), results)
                            .then((results: NxtDb.INxtDbQuery[]) => tmpTable !== null ? [ ...results, tmpTable ] : results)
                    }

                    return tmpTable !== null ? [ ...results, tableObject, tmpTable ] : [ ...results, tableObject ]
                })
        }

        return Promise.resolve(sqlQueries)
    }

    /**
     * Ajout des requêtes de creation des tables de liaison Many To Many
     * @param entity {new() => NxtOrm.NxtEntityClass}
     * @param propertyNameEntity {string}
     * @returns {NxtDb.NxtDbCreateTable}
     */
    private createManyToManyTable (entity: new() => NxtOrm.NxtEntityClass, propertyNameEntity: string): NxtDb.NxtDbCreateTable {
        const colParams: NxtFieldParams = nxtGetField(new entity(), propertyNameEntity)
        const linkEntityParams: NxtEntityParams = nxtGetEntity(colParams.type)
        const eParams: NxtEntityParams = nxtGetEntity(entity)

        const indexTable: number = NxtOrmApp.getRelationIndexClass(entity, propertyNameEntity, NxtOrm.NxtOrmEnum.MANY_TO_MANY)

        const colsTable: NxtDb.NxtDbColumn[] = [
            new NxtDb.NxtDbColumn('id_' + eParams.table, NxtOrm.NxtOrmEnum.INT, null, false, false, this.db.getDriver()),
            new NxtDb.NxtDbColumn('id_' + linkEntityParams.table, NxtOrm.NxtOrmEnum.INT, null, false, false, this.db.getDriver()),
        ]

        const indexes: NxtDb.NxtDbIndex[] = [
            new NxtDb.NxtDbIndex(colsTable, NxtOrm.NxtOrmEnum.PRIMARY_KEY),
        ]

        const mToMForeignKeys: NxtDb.NxtDbForeignKey[] = [
            new NxtDb.NxtDbForeignKey('id_' + eParams.table, 'fk_' + eParams.table + '_' + linkEntityParams.table + '_to_' + eParams.table + '_' + indexTable, { colName: 'id', db: dbConfig.database, table: eParams.table }, NxtDb.NxtDb.CASCADE, NxtDb.NxtDb.CASCADE),
            new NxtDb.NxtDbForeignKey('id_' + linkEntityParams.table, 'fk_' + eParams.table + '_' + linkEntityParams.table + '_to_' + linkEntityParams.table + '_' + indexTable, { colName: 'id', db: dbConfig.database, table: linkEntityParams.table }, NxtDb.NxtDb.CASCADE, NxtDb.NxtDb.CASCADE),
        ]

        return this.db.createTable()
            .setTable(eParams.table + '_' + linkEntityParams.table + '_' + indexTable)
            .setColumns(colsTable)
            .setIndexes(indexes)
            .setForeignKeys(mToMForeignKeys)
    }

    /**
     * Ajout d'une colonne dans une table si elle n'existe pas ou modification de celle-ci si elle est différente
     * @param entity {new() => NxtOrm.NxtEntityClass}
     * @param propertiesNameEntity {string[]}
     * @param sqlQueries {NxtDb.INxtDbQuery[]}
     * @returns {Promise<NxtDb.INxtDbQuery[]>}
     */
    private createColumnsIfNotExists (entity: new() => NxtOrm.NxtEntityClass, propertiesNameEntity: string[], sqlQueries: NxtDb.INxtDbQuery[]): NxtDb.INxtDbQuery[] | Promise<NxtDb.INxtDbQuery[]> {
        const eParams: NxtEntityParams = nxtGetEntity(entity)
        const colParams: NxtFieldParams = nxtGetField(new entity(), propertiesNameEntity[0])

        if (colParams) {
            // On vérifie si l'alter table n'existe pas déjà dans "sqlQueries"
            const alterTableFound: NxtDb.INxtDbQuery = sqlQueries.find((sqlQuery: NxtDb.INxtDbQuery) => {
                if (sqlQuery instanceof NxtDb.NxtDbAlterTable) {
                    const tableElement: NxtDb.INxtDbTableElement = sqlQuery.getTableElement()

                    return tableElement instanceof NxtDb.NxtDbColumn && sqlQuery.getTable() === eParams.table && tableElement.name === colParams.name
                }

                return false
            })

            if (!alterTableFound && colParams !== undefined) {
                if (typeof colParams.name === 'string') {

                    return this.getSQLColumnTable(entity, propertiesNameEntity, sqlQueries)
                } else if (colParams.type !== undefined) {
                    return this.getSQLColumnWithRelationTable(entity, propertiesNameEntity, sqlQueries)
                }
            }
        }

        return sqlQueries
    }

    /**
     * Récupère les alter table pour les colonnes "normales"
     * @param entity {new() => NxtOrm.NxtEntityClass}
     * @param propertiesNameEntity {string[]}
     * @param sqlQueries {NxtDb.INxtDbQuery[]}
     * @return {Promise<NxtDb.INxtDbQuery[]>}
     */
    private getSQLColumnTable (entity: new() => NxtOrm.NxtEntityClass, propertiesNameEntity: string[], sqlQueries: NxtDb.INxtDbQuery[]): Promise<NxtDb.INxtDbQuery[]> {
        const eParams: NxtEntityParams = nxtGetEntity(entity)
        const colParams: NxtFieldParams = nxtGetField(new entity(), propertiesNameEntity[0])

        if (colParams) {
            const whereCombination: string[] = dbConfig.driver === 'mysql' ? [ 'table_schema', dbConfig.database ] : [ 'table_schema', 'public' ]

            return this.db.select()
                .setTable('information_schema.columns', 'c')
                .setWhere([ new NxtDb.NxtDbWhere('?? = ? AND ?? = ? AND ?? = ?', [ ...whereCombination, 'table_name', eParams.table, 'column_name', colParams.name ]) ])
                .execute()
                .then((results) => {
                    if (!results.length) {
                        // Création des champs
                        // On vérifie bien que s'il s'agit d'un ENUM on lui donne l'objet enumType
                        let enumType: NxtDb.NxtDbEnumType = null
                        if (colParams.type === NxtOrm.NxtOrmEnum.ENUM && colParams.enumType) {
                            enumType = new NxtDb.NxtDbEnumType(colParams.enumType.name, colParams.enumType.values)
                        }

                        const column: NxtDb.NxtDbColumn = new NxtDb.NxtDbColumn(colParams.name, colParams.type, colParams.length, colParams.nullable, colParams.autoIncrement, this.db.getDriver(), enumType)
                        const alterTable: NxtDb.NxtDbAlterTable = this.db.alterTable()
                            .setTable(eParams.table)
                            .setTableElement(column)
                            .setAction(NxtDb.NxtDbAlterTable.ADD)

                        sqlQueries.push(alterTable)
                    } else if (!this.isSameColumn(colParams, results[0])) {
                        // On vérifie que la colonne est bien la même (type)

                        // On vérifie bien que s'il s'agit d'un ENUM on lui donne l'objet enumType
                        let enumType: NxtDb.NxtDbEnumType = null
                        if (colParams.type === NxtOrm.NxtOrmEnum.ENUM && colParams.enumType) {
                            enumType = new NxtDb.NxtDbEnumType(colParams.enumType.name, colParams.enumType.values)
                        }
                        const column: NxtDb.NxtDbColumn = new NxtDb.NxtDbColumn(colParams.name, colParams.type, colParams.length, colParams.nullable, colParams.autoIncrement, this.db.getDriver(), enumType)
                        const alterTable: NxtDb.NxtDbAlterTable = this.db.alterTable()
                            .setTable(eParams.table)
                            .setTableElement(column)
                            .setAction(NxtDb.NxtDbAlterTable.MODIFY)

                        sqlQueries.push(alterTable)
                    }

                    return propertiesNameEntity.length > 1 ? this.createColumnsIfNotExists(entity, propertiesNameEntity.slice(1), sqlQueries) : sqlQueries
                }, (err) => {
                    throw new Error('[SQL_ERROR: ' + err.code + ']: ' + err.message)
                })
        }

        return Promise.resolve(sqlQueries)
    }

    /**
     * Récupère les alter table pour les colonnes relationnelles (ou crée les tables Many To Many)
     * @param entity {new() => NxtOrm.NxtEntityClass}
     * @param propertiesNameEntity {string[]}
     * @param sqlQueries {NxtDb.INxtDbQuery[]}
     * @returns {Promise<NxtDb.INxtDbQuery[]>}
     */
    private getSQLColumnWithRelationTable (entity: new() => NxtOrm.NxtEntityClass, propertiesNameEntity: string[], sqlQueries: NxtDb.INxtDbQuery[]): Promise<NxtDb.INxtDbQuery[]> {
        const eParams: NxtEntityParams = nxtGetEntity(entity)
        const colParams: NxtFieldParams = nxtGetField(new entity(), propertiesNameEntity[0])

        if (colParams) {
            const linkEntityParams: NxtEntityParams = nxtGetEntity(colParams.type)

            const whereCombination: string[] = dbConfig.driver === 'mysql' ? [ 'table_schema', dbConfig.database ] : [ 'table_schema', 'public' ]

            let where: NxtDb.NxtDbWhere = null
            if (colParams.relation === NxtOrm.NxtOrmEnum.MANY_TO_MANY) {
                where = new NxtDb.NxtDbWhere('?? = ?', [ 'table_name', eParams.table + '_' + linkEntityParams.table + '_' + NxtOrmApp.getRelationIndexClass(entity, propertiesNameEntity[0], NxtOrm.NxtOrmEnum.MANY_TO_MANY) ], NxtDb.NxtDbWhere.AND, [])
            } else {
                where = new NxtDb.NxtDbWhere('?? = ? AND ?? = ?', [ 'column_name', 'id_' + linkEntityParams.table + '_' + NxtOrmApp.getRelationIndexClass(entity, propertiesNameEntity[0], NxtOrm.NxtOrmEnum.MANY_TO_ONE), 'table_name', eParams.table ], NxtDb.NxtDbWhere.AND)
            }

            return this.db.select()
                .setTable('information_schema.columns', 'c')
                .setWhere([
                    new NxtDb.NxtDbWhere('?? = ?', whereCombination, NxtDb.NxtDbWhere.AND, [ where ]),
                ])
                .execute()
                .then((results) => {
                    if (!results.length) {
                        return this.createTableIfNotExists(colParams.type, sqlQueries)
                            .then((results: NxtDb.INxtDbQuery[]) => {
                                let tmpTable: NxtDb.NxtDbCreateTable = null
                                let alterTableCol: NxtDb.NxtDbAlterTable = null
                                let alterTableFK: NxtDb.NxtDbAlterTable = null

                                // Ajout de la clé étrangère
                                switch (colParams.relation) {
                                    case NxtOrm.NxtOrmEnum.MANY_TO_MANY:
                                        // On crée une nouvelle table avec en FK les ID des tables
                                        tmpTable = this.createManyToManyTable(entity, propertiesNameEntity[0])
                                        break
                                    case NxtOrm.NxtOrmEnum.MANY_TO_ONE:
                                        const column = new NxtDb.NxtDbColumn('id_' + linkEntityParams.table + '_' + NxtOrmApp.getRelationIndexClass(entity, propertiesNameEntity[0], NxtOrm.NxtOrmEnum.MANY_TO_ONE), NxtOrm.NxtOrmEnum.INT, null, false, false, this.db.getDriver())
                                        const foreignKey: NxtDb.NxtDbForeignKey = new NxtDb.NxtDbForeignKey('id_' + linkEntityParams.table + '_' + NxtOrmApp.getRelationIndexClass(entity, propertiesNameEntity[0], NxtOrm.NxtOrmEnum.MANY_TO_ONE), 'fk_' + eParams.table + '_to_' + linkEntityParams.table + '_' + NxtOrmApp.getRelationIndexClass(entity, propertiesNameEntity[0], NxtOrm.NxtOrmEnum.MANY_TO_ONE), { colName: 'id', db: dbConfig.database, table: linkEntityParams.table }, NxtDb.NxtDb.RESTRICT, NxtDb.NxtDb.CASCADE)

                                        alterTableCol = this.db.alterTable()
                                            .setTable(eParams.table)
                                            .setTableElement(column)
                                            .setAction(NxtDb.NxtDbAlterTable.ADD)

                                        alterTableFK = this.db.alterTable()
                                            .setTable(eParams.table)
                                            .setTableElement(foreignKey)
                                            .setAction(NxtDb.NxtDbAlterTable.ADD)
                                        break
                                    default:
                                        throw new Error('[ENTITY: Configuration problem]: You must give a relation when type is another entity')
                                }

                                if (alterTableCol !== null && alterTableFK) {
                                    results.push(alterTableCol)
                                    results.push(alterTableFK)
                                }

                                if (tmpTable !== null) {
                                    results.push(tmpTable)
                                }

                                return propertiesNameEntity.length > 1 ? this.createColumnsIfNotExists(entity, propertiesNameEntity.slice(1), results) : results
                            })
                    }

                    return propertiesNameEntity.length > 1 ? this.createColumnsIfNotExists(entity, propertiesNameEntity.slice(1), sqlQueries) : sqlQueries
                }, (err) => {
                    throw new Error('[SQL_ERROR: ' + err.code + ']: ' + err.message)
                })
        }

        return Promise.resolve(sqlQueries)
    }

    /**
     * Vérifie si la colonne d'une table correspond bien à l'attribut de son entity
     * @param colParams {NxtFieldParams}
     * @param dbColumn {any}
     * @returns {boolean}
     */
    private isSameColumn (colParams: NxtFieldParams, dbColumn: any): boolean {
        // Auto increment
        if ((!this.db.getDriver().informationSchema.isAutoIncrement(dbColumn) && colParams.autoIncrement) || (this.db.getDriver().informationSchema.isAutoIncrement(dbColumn) && !colParams.autoIncrement)) {
            return false
        }

        // Length
        if (colParams.length && dbColumn[this.db.getDriver().informationSchema.characterMaximumLength] !== colParams.length) {
            return false
        }

        // Nullable
        if ((colParams.nullable && dbColumn[this.db.getDriver().informationSchema.isNullable] === 'NO') || (!colParams.nullable && dbColumn[this.db.getDriver().informationSchema.isNullable] === 'YES')) {
            return false
        }

        // Type
        if (
            (colParams.type === NxtOrm.NxtOrmEnum.BOOLEAN && !this.db.getDriver().informationSchema.isBoolean(dbColumn))
            || (colParams.type === NxtOrm.NxtOrmEnum.CHAR && dbColumn[this.db.getDriver().informationSchema.dataType] !== 'char')
            || (colParams.type === NxtOrm.NxtOrmEnum.DATETIME && !this.db.getDriver().informationSchema.isDateTime(dbColumn))
            || (colParams.type === NxtOrm.NxtOrmEnum.INT && !this.db.getDriver().informationSchema.isInteger(dbColumn))
            || (colParams.type === NxtOrm.NxtOrmEnum.TEXT && dbColumn[this.db.getDriver().informationSchema.dataType] !== 'text')
            || (colParams.type === NxtOrm.NxtOrmEnum.VARCHAR && !this.db.getDriver().informationSchema.isVarchar(dbColumn))
        ) {
            return false
        }

        return true
    }

}
