import * as NxtDbDrivers from './drivers'

import { NxtOrmEnum } from '../nxt-orm'
import { NxtDbColumn } from './nxt-db-column.class'
import { NxtDbForeignKey } from './nxt-db-foreign-key.class'
import { NxtDbIndex } from './nxt-db-index.class'
import { INxtDbQuery } from './nxt-db-query.interface'

export class NxtDbCreateTable implements INxtDbQuery {
    private db: NxtDbDrivers.NxtDbDriver

    private table: string
    private columns: NxtDbColumn[] = []
    private indexes: NxtDbIndex[] = []
    private foreignKeys: NxtDbForeignKey[] = []
    private engine: string

    constructor (db: NxtDbDrivers.NxtDbDriver) {
        this.db = db
        this.engine = this.db.engine
    }

    /**
     * Retourne la table
     * @returns {string}
     */
    public getTable (): string {
        return this.table
    }

    /**
     * Set la table
     * @param table {string}
     * @param tableAlias {string}
     * @returns {NxtDbCreateTable}
     */
    public setTable (table: string): NxtDbCreateTable {
        this.table = table

        return this
    }

    /**
     * Retourne les colonnes
     * @returns {NxtDbColumn[]}
     */
    public getColumns (): NxtDbColumn[] {
        return this.columns
    }

    /**
     * Set les colonnes de la table à créer
     * @param columns {NxtDbColumn[]}
     * @returns {NxtDbCreateTable}
     */
    public setColumns (columns: NxtDbColumn[]): NxtDbCreateTable {
        this.columns = columns

        return this
    }

    /**
     * Retourne les index de la table à créer
     * @returns {NxtDbIndex[]}
     */
    public getIndexes (): NxtDbIndex[] {
        return this.indexes
    }

    /**
     * Set les index de la table à créer
     * @param indexes {NxtDbIndex[]}
     * @returns {NxtDbCreateTable}
     */
    public setIndexes (indexes: NxtDbIndex[]): NxtDbCreateTable {
        this.indexes = indexes

        return this
    }

    /**
     * Retourne les clés étrangères de la table à créer
     * @returns {NxtDbForeignKey[]}
     */
    public getForeignKeys (): NxtDbForeignKey[] {
        return this.foreignKeys
    }

    /**
     * Set les clés étrangères de la table à créer
     * @param foreignKeys {NxtDbForeignKey[]}
     * @returns {NxtDbCreateTable}
     */
    public setForeignKeys (foreignKeys: NxtDbForeignKey[]): NxtDbCreateTable {
        this.foreignKeys = foreignKeys

        return this
    }

    /**
     * Set le moteur utilisé pour créer la table
     * @param engine {string}
     * @returns {NxtDbCreateTable}
     */
    public setEngine (engine: string): NxtDbCreateTable {
        this.engine = engine

        return this
    }

    /**
     * Execute la requête
     * @returns {Promise<any>}
     */
    public execute (): Promise<any> {
        const sqlString: string = this.toSQLString()

        return new Promise((resolve, reject) => {
            this.db.query(sqlString, (err, rows) => {
                if (!err) {
                    resolve(rows)
                } else {
                    reject()

                    throw new Error(err)
                }
            })
        })
    }

    /**
     * Retourne la requête au format string SQL
     * @returns {string}
     */
    public toSQLString (): string {
        const primaries: NxtDbIndex = this.indexes.reduce((prev: NxtDbIndex, curr: NxtDbIndex) => {
            if (curr.type === NxtOrmEnum.PRIMARY_KEY) {
                if (prev === undefined) {
                    return curr
                }

                prev.columns = [
                    ...prev.columns,
                    ...curr.columns,
                ]
            }

            return prev
        }, undefined)

        const indexes: NxtDbIndex[] = [
            primaries,
            ...this.indexes.filter((index: NxtDbIndex) => index.type !== NxtOrmEnum.PRIMARY_KEY),
        ]

        const columnsString: string = this.columns.map((col: NxtDbColumn) => col.toSQLString()).join(',' + '\n')
        const keys: string = indexes.length ? ',' + '\n' + indexes.map((key: NxtDbIndex) => key.toSQLString()).join(',' + '\n') : ''
        const foreignKeys: string = this.foreignKeys.length ? ',' + '\n' + this.foreignKeys.map((fk: NxtDbForeignKey) => fk.toSQLString()).join(',' + '\n') : ''

        if (this.db instanceof NxtDbDrivers.NxtPgsqlDriver) {
             const preSql = this.columns.reduce((prev, curr) => {
                if (curr.type === NxtOrmEnum.ENUM) {
                    const createTypeQuery: string = NxtDbDrivers.NxtDbDriver.format('CREATE TYPE ' + curr.enumType.name + ' AS ENUM (?);', [ curr.enumType.values ])
                    prev += `DROP TYPE IF EXISTS ${curr.enumType.name};
${createTypeQuery}
`
                }

                return prev
            }, '')

            return preSql + NxtDbDrivers.NxtDbDriver.format(`CREATE TABLE ?? (
${columnsString}${keys}${foreignKeys}
);
`, [ this.table ])
        } else {
            return NxtDbDrivers.NxtDbDriver.format(`CREATE TABLE ?? (
${columnsString}${keys}${foreignKeys}
) ENGINE = ${this.engine};
`, [ this.table ])
        }
    }
}
