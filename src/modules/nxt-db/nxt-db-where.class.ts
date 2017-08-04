import * as NxtDbDrivers from './drivers'

import { INxtDbElement } from './nxt-db-element.interface'

export class NxtDbWhere implements INxtDbElement {
    public static AND: number = 0
    public static OR: number = 1

    private condition: string
    private wheres: NxtDbWhere[]
    private values: any[]
    private combination: number

    constructor (condition: string|NxtDbWhere = '', values: any[] = [], combination: number = NxtDbWhere.AND, wheres: NxtDbWhere[] = []) {
        this.condition = typeof condition === 'string' ? condition : condition.toSQLString()
        this.values = values
        this.combination = combination
        this.wheres = wheres
    }

    /**
     * Retourne la condition string
     * @returns {string}
     */
    public getCondition (): string {
        return this.condition
    }

    /**
     * Set la condition string
     * @param condition {string|NxtDbWhere}
     * @returns {NxtDbWhere}
     */
    public setCondition (condition: string|NxtDbWhere = ''): NxtDbWhere {
        this.condition = typeof condition === 'string' ? condition : condition.toSQLString()

        return this
    }

    /**
     * Retourne les wheres
     * @returns {NxtDbWhere[]}
     */
    public getWheres (): NxtDbWhere[] {
        return this.wheres
    }

    /**
     * Set les wheres
     * @param wheres {NxtDbWhere[]}
     * @returns {NxtDbWhere}
     */
    public setWheres (wheres: NxtDbWhere[]): NxtDbWhere {
        this.wheres = wheres

        return this
    }

    /**
     * Retourne les values array
     * @returns {any[]}
     */
    public getValues (): any[] {
        const values: any[] = this.wheres.map((where: NxtDbWhere): any[] => [ ...where.getValues() ])

        return [ ...this.values, ...[].concat.apply([], values) ]
    }

    /**
     * Set les values array
     * @param values {any[]}
     * @returns {NxtDbWhere}
     */
    public setValues (values: any[]): NxtDbWhere {
        this.values = values

        return this
    }

    /**
     * Retourne la combination
     * @returns {number}
     */
    public getCombination (): number {
        return this.combination
    }

    /**
     * Set la combination
     * @param combination {number}
     * @returns {NxtDbWhere}
     */
    public setCombination (combination: number): NxtDbWhere {
        this.combination = combination

        return this
    }

    /**
     * Retourne la string SQL de cette requête where
     * @returns {string}
     */
    public toSQLString (): string {
        const conditions: string = this.wheres.reduce((prev: string, where: NxtDbWhere): string => {
            const combination: string = where.combination === NxtDbWhere.AND ? 'AND' : 'OR'

            return `${prev} ${combination} ${where.toSQLString()}`
        }, '')

        return NxtDbDrivers.NxtDbDriver.format(`(${this.condition}${conditions})`, this.values)
    }
}
