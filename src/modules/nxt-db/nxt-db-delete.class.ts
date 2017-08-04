import * as NxtDbDrivers from './drivers'

import { INxtDbQuery } from './nxt-db-query.interface'
import { NxtDbWhere } from './nxt-db-where.class'

export class NxtDbDelete implements INxtDbQuery {
    private db: NxtDbDrivers.NxtDbDriver

    private table: string
    private whereString: string = ''
    private vals: any[] = []

    constructor (db: NxtDbDrivers.NxtDbDriver) {
        this.db = db
    }

    public getTable (): string {
        return this.table
    }

    public setTable (table: string): NxtDbDelete {
        this.table = table

        return this
    }

    public where (condition: string, combination: number = NxtDbWhere.AND): NxtDbDelete {
        if (this.whereString !== '') {
            this.whereString += combination === NxtDbWhere.AND ? ' AND' : ' OR'
        }

        this.whereString += ' ' + condition

        return this
    }

    public values (value): NxtDbDelete {
        if (Array.isArray(value)) {
            this.vals = [ ...this.vals, ...value ]
        } else {
            this.vals.push(value)
        }

        return this
    }

    public execute (): Promise<any> {
        const sqlString: string = this.toSQLString()
        const values: any[] = [ ...this.vals ]

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

    public toSQLString (): string {
        if (!this.table) {
            throw new Error('[SQL_INSERTION: No table] You must add a table to your query')
        }

        let sqlString: string = 'DELETE FROM ' + this.table

        if (this.whereString !== '') {
            sqlString += ' WHERE' + this.whereString
        }

        return sqlString
    }
}
