import * as NxtDbDrivers from './drivers'

import { NxtOrmEnum } from '../nxt-orm'
import { NxtDbColumn } from './nxt-db-column.class'
import { INxtDbQuery } from './nxt-db-query.interface'
import { INxtDbTableElement } from './nxt-db-table-element.interface'

export class NxtDbAlterTable implements INxtDbQuery {
    public static ADD: number = 0
    public static DROP: number = 1
    public static MODIFY: number = 2

    private db: NxtDbDrivers.NxtDbDriver

    private table: string
    private tableElement: INxtDbTableElement
    private action: number

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
    public setTable (table: string): NxtDbAlterTable {
        this.table = table

        return this
    }

    /**
     * Retourne l'élément de la table à altérer
     * @returns {INxtDbTableElement}
     */
    public getTableElement (): INxtDbTableElement {
        return this.tableElement
    }

    /**
     * Set l'élément de la table à altérer
     * @param tableElement {INxtDbTableElement}
     * @returns {NxtDbAlterTable}
     */
    public setTableElement (tableElement: INxtDbTableElement): NxtDbAlterTable {
        this.tableElement = tableElement

        return this
    }

    /**
     * Retourne l'action à faire pour altérer la table
     * @returns {number}
     */
    public getAction (): number {
        return this.action
    }

    /**
     * Set l'action à faire pour altérer la table
     * @param action {number}
     * @returns {NxtDbAlterTable}
     */
    public setAction (action: number): NxtDbAlterTable {
        this.action = action

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
        let preSql: string = ''

        if (this.db instanceof NxtDbDrivers.NxtPgsqlDriver && this.tableElement instanceof NxtDbColumn && this.tableElement.type === NxtOrmEnum.ENUM) {
            const createTypeQuery: string = NxtDbDrivers.NxtDbDriver.format('CREATE TYPE ' + this.tableElement.enumType.name + ' AS ENUM (?);', [ this.tableElement.enumType.values ])
            preSql = `DROP TYPE IF EXISTS ${this.tableElement.enumType.name};
${createTypeQuery}
`
        }

        return preSql + NxtDbDrivers.NxtDbDriver.format(`ALTER TABLE ?? ${this.getActionSqlString()};`, [ this.getTable() ])
    }

    /**
     * Retourne la bonne action sur la colonne au format SQL
     * @returns {string}
     */
    private getActionSqlString (): string {
        switch (this.action) {
            case NxtDbAlterTable.ADD:
                return 'ADD ' + this.tableElement.getAddSQLString()
            case NxtDbAlterTable.DROP:
                return 'DROP ' + this.tableElement.getDropSQLString()
            case NxtDbAlterTable.MODIFY:
                return 'MODIFY ' + this.tableElement.getAddSQLString()
            default:
                throw new Error('[NxtDbAlterTable: no action error] No action has been setted')
        }
    }
}
