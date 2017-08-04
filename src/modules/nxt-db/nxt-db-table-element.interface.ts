import { INxtDbElement } from './nxt-db-element.interface'

export interface INxtDbTableElement extends INxtDbElement {
    getAddSQLString (): string
    getDropSQLString (): string
}
