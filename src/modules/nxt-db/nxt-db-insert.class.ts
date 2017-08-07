import * as NxtDbDrivers from './drivers'

import { NxtDbColumnValuePair } from './nxt-db-column-value-pair.interface'
import { INxtDbQuery } from './nxt-db-query.interface'

export class NxtDbInsert implements INxtDbQuery {
    private db: NxtDbDrivers.NxtDbDriver

    private table: string
    private columnsValuesPair: NxtDbColumnValuePair[] = []

    constructor (db: NxtDbDrivers.NxtDbDriver) {
        this.db = db
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
     * @returns {NxtDbSelect}
     */
    public setTable (table: string): NxtDbInsert {
        this.table = table

        return this
    }

    /**
     * Ajoute une entrée colonne/valeur
     * @param columnValuePair {NxtDbColumnValuePair}
     * @returns {NxtDbUpdate}
     */
    public addColumnValuePair (columnValuePair: NxtDbColumnValuePair): NxtDbInsert {
        this.columnsValuesPair = [ ...this.columnsValuesPair, columnValuePair ]

        return this
    }

    /**
     * Ajoute une entrée colonne/valeur
     * @param columnValuePair {NxtDbColumnValuePair[]}
     * @returns {NxtDbUpdate}
     */
    public setColumnsValuesPair (columnValuePair: NxtDbColumnValuePair[]): NxtDbInsert {
        this.columnsValuesPair = columnValuePair

        return this
    }

    /**
     * Retourne toutes les valeurs de la requête
     * @returns {any[]}
     */
    public getVals (): any[] {
        const colsValues: string[] = this.columnsValuesPair.map((row: NxtDbColumnValuePair) => row.column)
        const valsValues: string[] = this.columnsValuesPair.map((row: NxtDbColumnValuePair) => row.value)

        return [
            ...colsValues,
            ...valsValues,
        ]
    }

    /**
     * Execute la requête
     * @returns {Promise<any>}
     */
    public execute (): Promise<any> {
        let sqlString: string = ''

        try {
            sqlString = this.toSQLString()
        } catch (e) {
            return Promise.reject(e)
        }

        return new Promise((resolve, reject) => {
            this.db.query(sqlString, (err, rows) => {
                if (!err) {
                    if (this.db instanceof NxtDbDrivers.NxtPgsqlDriver) {
                        resolve({ insertId: rows.rows[0].id })
                    } else {
                        resolve(rows)
                    }
                } else {
                    reject(err)
                }
            })
        })
    }

    /**
     * Execute la requête
     * @returns {Promise<any>}
     */
    public toSQLString (): string {
        if (!this.table) {
            throw new Error('[SQL_INSERTION: No table] You must add a table to your query')
        }

        if (this.columnsValuesPair.length === 0) {
            throw new Error('[SQL_INSERTION: No column value pair] You must add at least a column with a value to your query')
        }

        let sqlString: string = 'INSERT INTO ' + this.table + '('
        // columns
        sqlString += this.columnsValuesPair.map((col: NxtDbColumnValuePair) => '??').join(', ')
        sqlString += ') VALUES('
        // values
        sqlString += this.columnsValuesPair.map((col: NxtDbColumnValuePair) => '?').join(', ')
        sqlString += ')'

        if (this.db instanceof NxtDbDrivers.NxtPgsqlDriver) {
            sqlString += ' RETURNING "id"'
        }

        return NxtDbDrivers.NxtDbDriver.format(sqlString, this.getVals())
    }
}
