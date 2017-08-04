import * as mysql from 'mysql'

import { dbConfig } from '../../../config/db.config'

import { NxtDbDriver } from './nxt-db-driver.class'

export class NxtMysqlDriver extends NxtDbDriver {
    private db: mysql.IConnection

    constructor () {
        super()

        this.engine = 'InnoDB'
        this.autoIncrement = 'AUTO_INCREMENT'

        this.informationSchema.characterMaximumLength = 'CHARACTER_MAXIMUM_LENGTH'
        this.informationSchema.columnName = 'COLUMN_NAME'
        this.informationSchema.dataType = 'DATA_TYPE'
        this.informationSchema.isNullable = 'IS_NULLABLE'
        this.informationSchema.isAutoIncrement = (dbColumn) => dbColumn.EXTRA === 'auto_increment'
        this.informationSchema.isBoolean = (dbColumn) => dbColumn.DATA_TYPE === 'tinyint'
        this.informationSchema.isDateTime = (dbColumn) => dbColumn.DATA_TYPE === 'datetime'
        this.informationSchema.isInteger = (dbColumn) => dbColumn.DATA_TYPE === 'int'
        this.informationSchema.isVarchar = (dbColumn) => dbColumn.DATA_TYPE === 'varchar'

        this.db = mysql.createConnection({
            database: dbConfig.database,
            host: dbConfig.host,
            multipleStatements: true,
            password: dbConfig.password,
            port: dbConfig.port,
            user: dbConfig.user,
        })
    }

    public query (sql: string, valsOrCallback, callback?): void {
        if (callback && Array.isArray(valsOrCallback)) {
            this.db.query(NxtDbDriver.format(sql, valsOrCallback), callback)
        } else {
            this.db.query(sql, valsOrCallback)
        }
    }
}
