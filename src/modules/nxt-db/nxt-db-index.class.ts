import * as NxtDbDrivers from './drivers'

import { NxtOrmEnum } from '../nxt-orm'
import { NxtDbColumn } from './nxt-db-column.class'
import { INxtDbTableElement } from './nxt-db-table-element.interface'

export class NxtDbIndex implements INxtDbTableElement {
    public columns: NxtDbColumn[]
    public type: number

    constructor (columns: NxtDbColumn[], type: number) {
        this.columns = columns
        this.type = type
    }

    /**
     * Retourne la requête au format string SQL
     * @returns {string}
     */
    public toSQLString (): string {
        return `    ${this.getAddSQLString()}`
    }

    /**
     * Retourne la requête au format string SQL pour l'ALTER TABLE ADD
     * @returns {string}
     */
    public getAddSQLString () {
        const columnsString: string[] = this.columns.map((col: NxtDbColumn) => col.name)

        return NxtDbDrivers.NxtDbDriver.format(`${this.getTypeSQLString()} (??)`, [ columnsString ])
    }

    /**
     * Retourne la requête au format string SQL pour l'ALTER TABLE DROP
     * @returns {string}
     */
    public getDropSQLString (): string {
        return `INDEX ${this.getTypeSQLString()}`
    }

    /**
     * Retourne le type format string SQL
     * @returns {string}
     */
    private getTypeSQLString (): string {
        switch (this.type) {
            case NxtOrmEnum.PRIMARY_KEY:
                return 'PRIMARY KEY'
            case NxtOrmEnum.UNIQUE:
                return 'UNIQUE'
            default:
                throw new Error('[NxtDbIndex: Unknown type]: The type given is not correct')
        }
    }
}
