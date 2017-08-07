import * as NxtDbDrivers from './drivers'

import { dbConfig } from '../../config/db.config'

import { NxtDbAlterTable } from './nxt-db-alter-table.class'
import { NxtDbCreateTable } from './nxt-db-create-table.class'
import { NxtDbDelete } from './nxt-db-delete.class'
import { NxtDbInsert } from './nxt-db-insert.class'
import { NxtDbSelect } from './nxt-db-select.class'
import { NxtDbUpdate } from './nxt-db-update.class'

export class NxtDb {
    public static LEFT_JOIN: number = 2
    public static INNER_JOIN: number = 3
    public static ASC: number = 4
    public static DESC: number = 5
    public static CASCADE: number = 6
    public static SET_NULL: number = 7
    public static RESTRICT: number = 8
    public static NO_ACTION: number = 9
    public static SET_DEFAULT: number = 10

    private db: NxtDbDrivers.NxtDbDriver

    constructor () {
        switch (dbConfig.driver) {
            case 'mysql':
                this.db = new NxtDbDrivers.NxtMysqlDriver()
                break
            case 'pgsql':
                this.db = new NxtDbDrivers.NxtPgsqlDriver()
                break
            default:
                throw new Error('[NxtDb: Bad driver given]: the driver given in the configuration file is not correct')
        }
    }

    /**
     * Execute une requête SQL à partir d'une string
     * @param sqlQueryString {string}
     * @param vals {any[]}
     * @returns {Promise<any>}
     */
    public query (sqlQueryString: string, vals: any[] = []): Promise<any> {
        return new Promise((resolve, reject) => {
            this.db.query(sqlQueryString, vals, (err, results) => {
                if (!err) {
                    resolve(results)
                } else {
                    reject(err)
                }
            })
        })
    }

    /**
     * Crée une requête SQL SELECT
     * @returns {NxtDbSelect}
     */
    public select (): NxtDbSelect {
        return new NxtDbSelect(this.db)
    }

    /**
     * Crée une requête SQL INSERT
     * @returns {NxtDbInsert}
     */
    public insert (): NxtDbInsert {
        return new NxtDbInsert(this.db)
    }

    /**
     * Crée une requête SQL UPDATE
     * @returns {NxtDbUpdate}
     */
    public update (): NxtDbUpdate {
        return new NxtDbUpdate(this.db)
    }

    /**
     * Crée une requête SQL DELETE
     * @returns {NxtDbDelete}
     */
    public delete (): NxtDbDelete {
        return new NxtDbDelete(this.db)
    }

    /**
     * Crée une requête SQL CREATE TABLE
     * @returns {NxtDbCreateTable}
     */
    public createTable (): NxtDbCreateTable {
        return new NxtDbCreateTable(this.db)
    }

    /**
     * Crée une requête SQL ALTER TABLE
     * @returns {NxtDbAlterTable}
     */
    public alterTable (): NxtDbAlterTable {
        return new NxtDbAlterTable(this.db)
    }

    /**
     * Retourne le driver de la DB
     * @returns {NxtDbDrivers.NxtDbDriver}
     */
    public getDriver (): NxtDbDrivers.NxtDbDriver {
        return this.db
    }
}
