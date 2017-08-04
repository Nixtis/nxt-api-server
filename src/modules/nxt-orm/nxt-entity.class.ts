import * as NxtRequest from '../nxt-request'
import { NxtField } from './nxt-field.decorator'
import { NxtOrmEnum } from './nxt-orm.enum'

export class NxtEntityClass {

    @NxtField({
        autoIncrement: true,
        key: NxtOrmEnum.PRIMARY_KEY,
        name: 'id',
        type: NxtOrmEnum.INT,
    })
    public id: number = null

    public _response: NxtRequest.NxtResponse = null
    public _ignored: string[] = [ '_ignored', '_response', '_dontShow' ]
    public _dontShow: string[] = []

    public getProps (): any {
        const props: any = {}

        Object.getOwnPropertyNames(this).forEach((prop: string) => {
            if (this._ignored.indexOf(prop) === -1) {
                if (this[prop] instanceof NxtEntityClass) {
                    props[prop] = this[prop].getProps()
                } else if (Array.isArray(this[prop])) {
                    props[prop] = this[prop].map((row) => row instanceof NxtEntityClass ? row.getProps() : row)
                } else {
                    props[prop] = this[prop]
                }
            }
        })

        return props
    }

    public getObjectToSend (): any {
        const obj: any = {}

        Object.getOwnPropertyNames(this.getProps()).forEach((prop: string) => {
            if (this._dontShow.indexOf(prop) === -1) {
                if (this[prop] instanceof NxtEntityClass) {
                    obj[prop] = this[prop].getObjectToSend()
                } else if (Array.isArray(this[prop])) {
                    obj[prop] = this[prop].map((row) => row instanceof NxtEntityClass ? row.getObjectToSend() : row)
                } else {
                    obj[prop] = this[prop]
                }
            }
        })

        return obj
    }

}
