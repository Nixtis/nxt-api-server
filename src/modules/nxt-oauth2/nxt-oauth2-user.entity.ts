import * as NxtOrm from '../nxt-orm'
import * as NxtValidation from '../nxt-validation'

@NxtOrm.NxtEntity({
    table: 'oauth_user',
})
export class NxtOauthUser extends NxtOrm.NxtEntityClass {
    @NxtOrm.NxtField({
        key: NxtOrm.NxtOrmEnum.UNIQUE,
        length: 100,
        name: 'username',
        type: NxtOrm.NxtOrmEnum.VARCHAR,
    })
    @NxtValidation.NxtValidation({
        allowEmpty: false,
        length: 100,
        type: NxtValidation.NxtValidator.STRING,
    })
    public username: string = ''

    @NxtOrm.NxtField({
        length: 255,
        name: 'password',
        type: NxtOrm.NxtOrmEnum.VARCHAR,
    })
    @NxtValidation.NxtValidation({
        allowEmpty: false,
        length: 255,
        type: NxtValidation.NxtValidator.STRING,
    })
    public password: string = ''

    @NxtOrm.NxtField({
        name: 'roles',
        type: NxtOrm.NxtOrmEnum.JSON,
    })
    public roles: string[] = []

    @NxtOrm.NxtField({
        isStatuable: true,
        name: 'status',
        type: NxtOrm.NxtOrmEnum.BOOLEAN,
    })
    public status: boolean = false

    constructor () {
        super()

        this._dontShow = [ 'password' ]
    }
}
