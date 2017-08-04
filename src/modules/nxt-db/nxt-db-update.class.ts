import * as NxtDbDrivers from './drivers'

import { NxtDbColumnValuePair } from './nxt-db-column-value-pair.interface'
import { INxtDbQuery } from './nxt-db-query.interface'
import { NxtDbWhere } from './nxt-db-where.class'

export class NxtDbUpdate implements INxtDbQuery {
    private db: NxtDbDrivers.NxtDbDriver

    private table: string
    private columnsValuesPair: NxtDbColumnValuePair[] = []
    private wheres: NxtDbWhere[] = []
    private vals: any[] = []

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
    public setTable (table: string): NxtDbUpdate {
        this.table = table

        return this
    }

    /**
     * Ajoute une entrée colonne/valeur
     * @param columnValuePair {NxtDbColumnValuePair}
     * @returns {NxtDbUpdate}
     */
    public addColumnValuePair (columnValuePair: NxtDbColumnValuePair): NxtDbUpdate {
        this.columnsValuesPair = [ ...this.columnsValuesPair, columnValuePair ]

        return this
    }

    /**
     * Ajoute une entrée colonne/valeur
     * @param columnValuePair {NxtDbColumnValuePair[]}
     * @returns {NxtDbUpdate}
     */
    public setColumnsValuesPair (columnValuePair: NxtDbColumnValuePair[]): NxtDbUpdate {
        this.columnsValuesPair = columnValuePair

        return this
    }

    /**
     * Ajoute une condition where dans la requête
     * @param condition {string}
     * @param values {any}
     * @param combination {number}
     * @returns {NxtDbSelect}
     */
    public addWhere (condition: string, values: any[] = [], combination: number = NxtDbWhere.AND): NxtDbUpdate {
        this.wheres.push(new NxtDbWhere(condition, values, combination))

        return this
    }

    /**
     * Set la condition de la requête
     * @param where {NxtDbWhere[]}
     * @returns {NxtDbSelect}
     */
    public setWhere (where: NxtDbWhere[]): NxtDbUpdate {
        this.wheres = where

        return this
    }

    /**
     * Retourne toutes les valeurs de la requête
     * @returns {any[]}
     */
    public getVals (): any[] {
        const colsValsValues: string[][] = this.columnsValuesPair.map((row: NxtDbColumnValuePair) => [ row.column, row.value ])

        return [
            ...[].concat.apply([], colsValsValues),
        ]
    }

    /**
     * Execute la requête
     * @returns {Promise<any>}
     */
    public execute (): Promise<any> {
        const sqlString: string = this.toSQLString()
        const values: any[] = [ ...this.columnsValuesPair.map((col: NxtDbColumnValuePair) => col.value), ...this.vals ]

        return new Promise((resolve, reject) => {
            this.db.query(sqlString, values, (err, rows) => {
                // this.db.end()

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
     * Retourne les la requête au format string SQL
     * @returns {string}
     */
    public toSQLString (): string {
        if (!this.table) {
            throw new Error('[SQL_INSERTION: No table] You must add a table to your query')
        }

        if (this.columnsValuesPair.length === 0) {
            throw new Error('[SQL_INSERTION: No column value pair] You must add at least a column with a value to your query')
        }

        let sqlString: string = 'UPDATE ' + this.table + ' SET '
        // set
        sqlString += this.columnsValuesPair.map((col: NxtDbColumnValuePair) => '?? = ?').join(', ')

        sqlString += this.getWhereSQLString()

        return NxtDbDrivers.NxtDbDriver.format(sqlString, this.getVals())
    }

    /**
     * Récupère la condition WHERE au format SQL
     * @returns {string}
     */
    private getWhereSQLString (): string {
        return this.wheres.length ? ' WHERE ' + this.wheres.reduce((prev: string, where: NxtDbWhere) => where.toSQLString(), '') : ''
    }
}
