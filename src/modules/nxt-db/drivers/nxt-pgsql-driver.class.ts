import * as pg from 'pg'

import { dbConfig } from '../../../config/db.config'

import { NxtDbDriver } from './nxt-db-driver.class'

export class NxtPgsqlDriver extends NxtDbDriver {
    private db: pg.Pool

    constructor () {
        super()

        this.engine = 'PostgreSQL'
        this.autoIncrement = 'SERIAL'

        this.informationSchema.characterMaximumLength = 'character_maximum_length'
        this.informationSchema.columnName = 'column_name'
        this.informationSchema.dataType = 'data_type'
        this.informationSchema.isNullable = 'is_nullable'
        this.informationSchema.isAutoIncrement = (dbColumn) => dbColumn.column_default && dbColumn.column_default.indexOf('nextval') > -1
        this.informationSchema.isBoolean = (dbColumn) => dbColumn.data_type === 'boolean'
        this.informationSchema.isDateTime = (dbColumn) => dbColumn.data_type === 'timestamp without time zone'
        this.informationSchema.isInteger = (dbColumn) => dbColumn.data_type === 'integer'
        this.informationSchema.isVarchar = (dbColumn) => dbColumn.data_type === 'character varying'

        this.db = new pg.Pool({
            database: dbConfig.database,
            host: dbConfig.host,
            password: dbConfig.password,
            port: dbConfig.port,
            user: dbConfig.user,
        })
    }

    public query (sql: string, valsOrCallback, callback?): void {
        if (valsOrCallback && Array.isArray(valsOrCallback)) {
            this.db.query(NxtDbDriver.format(sql, valsOrCallback), callback)
        } else {
            this.db.query(sql, valsOrCallback)
        }
    }
}
