import * as NxtDbDrivers from './drivers'

import { INxtDbTableElement } from './nxt-db-table-element.interface'
import { NxtDb } from './nxt-db.class'

export class NxtDbForeignKey implements INxtDbTableElement {
    public colName: string
    public symbol: string
    public references: { colName: string, db: string, table: string }
    public onDelete: number
    public onUpdate: number

    constructor (colName: string, symbol: string, references: { colName: string, db: string, table: string }, onDelete: number, onUpdate: number) {
        this.colName = colName
        this.symbol = symbol
        this.references = references
        this.onDelete = onDelete
        this.onUpdate = onUpdate
    }

    public toSQLString () {
        return `    ${this.getAddSQLString()}`
    }

    public getAddSQLString () {
        const onDelete: string = this.getReferenceOption(this.onDelete)
        const onUpdate: string = this.getReferenceOption(this.onUpdate)

        return `CONSTRAINT ${NxtDbDrivers.NxtDbDriver.escapeId(this.symbol)}
        FOREIGN KEY (${NxtDbDrivers.NxtDbDriver.escapeId(this.colName)})
        REFERENCES ${NxtDbDrivers.NxtDbDriver.escapeId(this.references.table)} (${NxtDbDrivers.NxtDbDriver.escapeId(this.references.colName)})
        ON DELETE ${onDelete}
        ON UPDATE ${onUpdate}`
    }

    public getDropSQLString (): string {
        return `CONSTRAINT ${NxtDbDrivers.NxtDbDriver.escapeId(this.symbol)}`
    }

    private getReferenceOption (referenceOption: number): string {
        switch (this.onDelete) {
            case NxtDb.CASCADE:
                return 'CASCADE'
            case NxtDb.NO_ACTION:
                return 'NO ACTION'
            case NxtDb.RESTRICT:
                return 'RESTRICT'
            case NxtDb.SET_DEFAULT:
                return 'SET DEFAULT'
            case NxtDb.SET_NULL:
                return 'SET NULL'
            default:
                throw new Error('[ForeignKeySQL: Reference option error]: The reference given is not correct')
        }
    }
}
