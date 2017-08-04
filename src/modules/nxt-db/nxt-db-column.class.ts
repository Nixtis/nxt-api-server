import * as NxtDbDrivers from './drivers'

import { NxtOrmEnum } from '../nxt-orm'
import { NxtDbEnumType } from './nxt-db-enum-type.class'
import { INxtDbTableElement } from './nxt-db-table-element.interface'

export class NxtDbColumn implements INxtDbTableElement {
    public name: string
    public type: number
    public length: number
    public nullable: boolean
    public autoIncrement: boolean
    public enumType: NxtDbEnumType

    private db: NxtDbDrivers.NxtDbDriver

    constructor (name: string, type: number, length: number, nullable: boolean, autoIncrement: boolean, db: NxtDbDrivers.NxtDbDriver, enumType: NxtDbEnumType = null) {
        this.name = name
        this.type = type
        this.length = length
        this.nullable = nullable
        this.autoIncrement = autoIncrement
        this.enumType = enumType

        this.db = db
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
    public getAddSQLString (): string {
        const nullable: string = this.nullable ? 'NULL' : 'NOT NULL'
        const autoIncrement: string = this.autoIncrement ? this.db.autoIncrement : ''

        if (this.db instanceof NxtDbDrivers.NxtPgsqlDriver && this.autoIncrement) {
            return NxtDbDrivers.NxtDbDriver.format(`?? ${this.db.autoIncrement} ${nullable}`, [ this.name ])
        } else {
            return NxtDbDrivers.NxtDbDriver.format(`?? ${this.getTypeString()} ${nullable} ${autoIncrement}`, [ this.name ])
        }
    }

    /**
     * Retourne la requête au format string SQL pour l'ALTER TABLE DROP
     * @returns {string}
     */
    public getDropSQLString (): string {
        return NxtDbDrivers.NxtDbDriver.format('COLUMN ??', [ this.name ])
    }

    /**
     * Retourne le type format string SQL
     * @returns {string}
     */
    private getTypeString (): string {
        switch (this.type) {
            case NxtOrmEnum.BOOLEAN:
                return 'BOOLEAN'
            case NxtOrmEnum.CHAR:
                return this.length > 0 ? `CHAR(${this.length})` : 'CHAR'
            case NxtOrmEnum.FLOAT:
                return 'FLOAT'
            case NxtOrmEnum.INT:
                return this.length > 0 ? `INT(${this.length})` : 'INT'
            case NxtOrmEnum.JSON:
            case NxtOrmEnum.TEXT:
                return 'TEXT'
            case NxtOrmEnum.VARCHAR:
                return this.length > 0 ? `VARCHAR(${this.length})` : 'VARCHAR'
            case NxtOrmEnum.DATETIME:
                return this.db instanceof NxtDbDrivers.NxtMysqlDriver ? 'DATETIME' : 'TIMESTAMP'
            case NxtOrmEnum.ENUM:
                if (this.enumType !== null) {
                    return this.db instanceof NxtDbDrivers.NxtMysqlDriver ? NxtDbDrivers.NxtDbDriver.format('ENUM (?)', [ this.enumType.values ]) :  this.enumType.name
                }

                throw new Error('[ColumnSQL: Type error]: You must specify an enum type for your enum column')
            default:
                throw new Error('[ColumnSQL: Type error]: the type specified is not correct')
        }
    }
}
