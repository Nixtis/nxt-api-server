import { INxtDbElement } from './nxt-db-element.interface'

export interface INxtDbQuery extends INxtDbElement {
    getTable (): string
    execute (): Promise<any>
}
