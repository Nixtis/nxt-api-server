import { INxtDbElement } from './nxt-db-element.interface'
import { NxtDbWhere } from './nxt-db-where.class'

export class NxtDbJoin implements INxtDbElement {
    public static INNER_JOIN: number = 0
    public static LEFT_JOIN: number = 1

    private table: string
    private tableAlias: string
    private cols: string[]
    private on: NxtDbWhere
    private type: number

    constructor (table: string = '', tableAlias: string = '', cols: string[], on: NxtDbWhere = null, type: number = NxtDbJoin.INNER_JOIN) {
        this.table = table
        this.tableAlias = tableAlias
        this.cols = cols
        this.on = on
        this.type = type
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
     * @param condition {string}
     * @returns {NxtDbJoin}
     */
    public setTable (table: string): NxtDbJoin {
        this.table = table

        return this
    }

    /**
     * Retourne l'alias de la table
     * @returns {string}
     */
    public getTableAlias (): string {
        return this.tableAlias
    }

    /**
     * Set les colonnes de la table
     * @param condition {string}
     * @returns {NxtDbJoin}
     */
    public setTableAlias (tableAlias: string): NxtDbJoin {
        this.tableAlias = tableAlias

        return this
    }

    /**
     * Set l'alias de la table
     * @param condition {string[]}
     * @returns {NxtDbJoin}
     */
    public setCols (cols: string[]): NxtDbJoin {
        this.cols = cols

        return this
    }

    /**
     * Retourne les colonnes de la table
     * @returns {string[]}
     */
    public getCols (): string[] {
        return this.cols
    }

    /**
     * Retourne les colonnes de la table au format string SQL
     * @returns {string[]}
     */
    public getColsSQLString (): string {
        return this.cols.map((col: string): string => '`' + this.tableAlias + '`.`' + col + '`').join(', ')
    }

    /**
     * Retourne la condition du join
     * @returns {string}
     */
    public getOn (): NxtDbWhere {
        return this.on
    }

    /**
     * Set la condition du join
     * @param condition {string}
     * @returns {NxtDbJoin}
     */
    public setOn (on: NxtDbWhere): NxtDbJoin {
        this.on = on

        return this
    }

    /**
     * Retourne le type du join (INNER|LEFT)
     * @returns {number}
     */
    public getType (): number {
        return this.type
    }

    /**
     * Set le type du join
     * @param condition {number}
     * @returns {NxtDbJoin}
     */
    public setType (type: number): NxtDbJoin {
        this.type = type

        return this
    }

    /**
     * Retourne les la requête au format string SQL
     * @returns {string}
     */
    public toSQLString (): string {
        let sqlString: string = this.type === NxtDbJoin.INNER_JOIN ? 'INNER JOIN' : 'LEFT JOIN'
        sqlString += ' `' + this.table + '` ' + this.tableAlias + '`'
        sqlString += `ON ${this.on.toSQLString()}`

        return sqlString
    }
}
