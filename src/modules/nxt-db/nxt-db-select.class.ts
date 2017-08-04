import * as NxtDbDrivers from './drivers'

import { NxtDbJoin } from './nxt-db-join.class'
import { INxtDbQuery } from './nxt-db-query.interface'
import { NxtDbWhere } from './nxt-db-where.class'
import { NxtDb } from './nxt-db.class'

export class NxtDbSelect implements INxtDbQuery {
    private db: NxtDbDrivers.NxtDbDriver

    private cols: string[] = []
    private table: string = ''
    private tableAlias: string = ''
    private wheres: NxtDbWhere[] = []
    private joins: NxtDbJoin[] = []
    private order: string = ''
    private groupBy: string = ''
    private limit: string = ''

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
    public setTable (table: string, tableAlias: string): NxtDbSelect {
        this.tableAlias = tableAlias
        this.table = table

        return this
    }

    /**
     * Retourne les colonnes
     * @returns {string[]}
     */
    public getColumns (): string[] {
        return this.cols
    }

    /**
     * Set les colonnes
     * @param condition {string[]}
     * @returns {NxtDbSelect}
     */
    public setColumns (cols: string[]): NxtDbSelect {
        this.cols = cols

        return this
    }

    /**
     * Ajoute une condition where dans la requête
     * @param condition {string}
     * @param values {any}
     * @param combination {number}
     * @returns {NxtDbSelect}
     */
    public addWhere (condition: string, values: any[] = [], combination: number = NxtDbWhere.AND): NxtDbSelect {
        this.wheres.push(new NxtDbWhere(condition, values, combination))

        return this
    }

    /**
     * Set la condition de la requête
     * @param where {NxtDbWhere[]}
     * @returns {NxtDbSelect}
     */
    public setWhere (where: NxtDbWhere[]): NxtDbSelect {
        this.wheres = where

        return this
    }

    /**
     * Set l'order by
     * @param cols {string[]}
     * @param direction {number}
     * @returns {NxtDbSelect}
     */
    public setOrder (cols: string[], direction: number = NxtDb.ASC): NxtDbSelect {
        this.order = ' ORDER BY ' + cols.map((col: string) => NxtDbDrivers.NxtDbDriver.escapeId(col)).join(', ')
        this.order += direction === NxtDb.ASC ? ' ASC' : ' DESC'

        return this
    }

    /**
     * Get l'order by
     * @returns {string}
     */
    public getOrder (): string {
        return this.order
    }

    /**
     * Ajoute un join dans la requête
     * @returns {string}
     */
    public addJoin (table: string, aliasTable: string, on: NxtDbWhere, cols: string[] = [], type: number = NxtDb.INNER_JOIN): NxtDbSelect {
        this.joins.push(new NxtDbJoin(table, aliasTable, cols, on, type))

        return this
    }

    /**
     * Get le group by
     * @returns {string}
     */
    public getGroupBy () {
        return this.groupBy
    }

    /**
     * Set le group by
     * @param col {string}
     * @returns {NxtDbSelect}
     */
    public setGroupBy (col: string): NxtDbSelect {
        this.groupBy = ' GROUP BY ' + NxtDbDrivers.NxtDbDriver.escapeId(col)

        return this
    }

    /**
     * Get la limite
     * @returns {string}
     */
    public getLimit (): string {
        return this.limit
    }

    /**
     * Set la limite
     * @param from {number}
     * @param nb {number}
     * @returns {NxtDbSelect}
     */
    public setLimit (from: number, nb: number): NxtDbSelect {
        this.limit = ' LIMIT ' + from + ',' + nb

        return this
    }

    /**
     * Retourne toutes les valeurs de la requête
     * @returns {any[]}
     */
    public getVals (): any[] {
        const colsValues: string|string[] = this.cols.length ? this.cols : this.tableAlias + '.*'

        let results: any[] = []

        const colsJoinsValues: any[] = this.joins.map((join: NxtDbJoin): any[] => join.getCols())

        if (this.cols.length) {
            results = [ colsValues ]
        }

        if (colsJoinsValues.length) {
            results = [
                ...results,
                colsJoinsValues,
            ]
        }

        return results
    }

    /**
     * Retourne une promise avec le nombre de lignes pour la requête courrante
     * @returns {Promise<number>}
     */
    public getTotalRows (): Promise<number> {
        let sqlString: string = NxtDbDrivers.NxtDbDriver.format('SELECT COUNT(*) as ??', [ 'total_rows' ])
        sqlString += this.getFrom()
        sqlString += this.getJoinSQLString()
        sqlString += this.getWhereSQLString()
        sqlString += this.getGroupBy()
        sqlString += this.getOrder()
        sqlString += this.getLimit()

        return new Promise((resolve, reject) => {
            this.db.query(NxtDbDrivers.NxtDbDriver.format(sqlString, this.getVals()), (err, rows) => {
                if (!err) {
                    if (this.db instanceof NxtDbDrivers.NxtMysqlDriver) {
                        resolve(rows[0]['total_rows'])
                    } else {
                        resolve(parseInt(rows.rows[0]['total_rows'], 10))
                    }
                } else {
                    reject()

                    throw new Error('[SQL_ERROR: ' + err.code + ']: ' + err.message)
                }
            })
        })
    }

    /**
     * Execution de la requête courrante
     * @returns {Promise<any>}
     */
    public execute (): Promise<any> {
        const sqlString: string = this.toSQLString()

        return new Promise((resolve, reject) => {
            this.db.query(sqlString, (err, rows) => {
                if (!err) {
                    if (this.db instanceof NxtDbDrivers.NxtMysqlDriver) {
                        resolve(rows)
                    } else {
                        resolve(rows.rows)
                    }
                } else {
                    reject()

                    throw new Error('[SQL_ERROR: ' + err.code + ']: ' + err.message)
                }
            })
        })
    }

    /**
     * Retourne la requête au format string SQL
     * @returns {string}
     */
    public toSQLString (): string {
        let sqlString: string = 'SELECT'
        sqlString += this.getColsSQLString()
        sqlString += this.getFrom()
        sqlString += this.getJoinSQLString()
        sqlString += this.getWhereSQLString()
        sqlString += this.getGroupBy()
        sqlString += this.getOrder()
        sqlString += this.getLimit()

        return NxtDbDrivers.NxtDbDriver.format(sqlString, this.getVals())
    }

    /**
     * Retourne les colonnes au format string SQL
     * @returns {string}
     */
    private getColsSQLString (): string {
        if (this.table === '' || this.tableAlias === '') {
            throw new Error('[SQL_ERROR: no table]: You must set a table to your query')
        }

        let cols: string = this.cols.length ? '??' : NxtDbDrivers.NxtDbDriver.escapeId(this.tableAlias) + '.*'
        cols += this.joins.length ? ', ' + this.joins.map((join: NxtDbJoin): string => '??').join(', ') : ''

        return ' ' + cols
    }

    /**
     * Retourne le FROM au format string SQL
     * @returns {string}
     */
    private getFrom (): string {
        if (this.table === '' || this.tableAlias === '') {
            throw new Error('[SQL_ERROR: no table]: You must set a table to your query')
        }

        return ' FROM ' + NxtDbDrivers.NxtDbDriver.escapeId(this.table) + ' ' + NxtDbDrivers.NxtDbDriver.escapeId(this.tableAlias)
    }

    /**
     * Retourne les joins au format string SQL
     * @returns {string}
     */
    private getJoinSQLString (): string {
        return this.joins.length ? ' ' + this.joins.reduce((prev: string, join: NxtDbJoin) => join.toSQLString(), '') : ''
    }

    /**
     * Retourne les wheres au format string SQL
     * @returns {string}
     */
    private getWhereSQLString (): string {
        let results: string = ''

        if (this.wheres.length) {
            results = ' WHERE ' + this.wheres.reduce((prev: string, where: NxtDbWhere) => {
                let result: string = prev

                if (result !== '') {
                    result += where.getCombination() === NxtDbWhere.AND ? ' AND ' : ' OR '
                }

                result += where.toSQLString()

                return result
            }, '')
        }

        return results
    }
}
