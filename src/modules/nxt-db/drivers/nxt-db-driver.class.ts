import * as mysql from 'mysql'

import { dbConfig } from '../../../config/db.config'

export abstract class NxtDbDriver {
    public static format (sql: string, values: any[], driver: string = dbConfig.driver): string {
        if (values == null) {
            return sql
        }

        if (!(values instanceof Array || Array.isArray(values))) {
            values = [values]
        }

        let chunkIndex        = 0
        const placeholdersRegex = /\?\??/g
        let result            = ''
        let valuesIndex       = 0
        let match

        while (valuesIndex < values.length && (match = placeholdersRegex.exec(sql))) {
            const value = match[0] === '??'
                ? NxtDbDriver.escapeId(values[valuesIndex], false, driver)
                : mysql.escape(values[valuesIndex]).replace(/\\"/g, '"')

            result += sql.slice(chunkIndex, match.index) + value
            chunkIndex = placeholdersRegex.lastIndex
            valuesIndex++
        }

        if (chunkIndex === 0) {
            // Nothing was replaced
            return sql
        }

        if (chunkIndex < sql.length) {
            return result + sql.slice(chunkIndex)
        }

        return result
    }

    public static escapeId (value: string, forbidQualified: boolean = false, driver: string = dbConfig.driver): string {
        if (driver === 'mysql') {
            if (Array.isArray(value)) {
                let sql = ''

                for (let i = 0; i < value.length; i++) {
                    sql += (i === 0 ? '' : ', ') + this.escapeId(value[i], forbidQualified)
                }

                return value.map((val) => this.escapeId(val, forbidQualified)).join(', ')
            }

            if (forbidQualified) {
                return '`' + String(value).replace(/`/g, '``') + '`'
            }

            return '`' + String(value).replace(/`/g, '``').replace(/\./g, '`.`') + '`'
        } else if (driver === 'pgsql') {
            if (Array.isArray(value)) {
                let sql = ''

                for (let i = 0; i < value.length; i++) {
                    sql += (i === 0 ? '' : ', ') + this.escapeId(value[i], forbidQualified)
                }

                return value.map((val) => this.escapeId(val, forbidQualified)).join(', ')
            }

            if (forbidQualified) {
                return '"' + String(value).replace(/"/g, '""') + '"'
            }

            return '"' + String(value).replace(/"/g, '""').replace(/\./g, '"."') + '"'
        }
    }

    public engine: string
    public autoIncrement: string
    public informationSchema: SqlInformationSchemaColunms = new SqlInformationSchemaColunms()

    public abstract query (sql: string, vals, callback?): void
}

class SqlInformationSchemaColunms {
    public columnName: string
    public characterMaximumLength: string
    public isNullable: string
    public dataType: string
    public isAutoIncrement: any
    public isBoolean: any
    public isDateTime: any
    public isInteger: any
    public isVarchar: any
}
