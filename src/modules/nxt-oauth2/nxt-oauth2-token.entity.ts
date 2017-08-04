import * as NxtOrm from '../nxt-orm'
import { NxtOauthClient } from './nxt-oauth2-client.entity'
import { NxtOauthUser } from './nxt-oauth2-user.entity'

@NxtOrm.NxtEntity({
    table: 'oauth_token',
})
export class NxtOauthToken extends NxtOrm.NxtEntityClass {
    @NxtOrm.NxtField({
        relation: NxtOrm.NxtOrmEnum.MANY_TO_ONE,
        type: NxtOauthUser,
    })
    public user: NxtOauthUser = null

    @NxtOrm.NxtField({
        length: 255,
        name: 'token',
        type: NxtOrm.NxtOrmEnum.VARCHAR,
    })
    public token: string = ''

    @NxtOrm.NxtField({
        name: 'token_expires',
        type: NxtOrm.NxtOrmEnum.DATETIME,
    })
    public tokenExpires: Date = null

    @NxtOrm.NxtField({
        relation: NxtOrm.NxtOrmEnum.MANY_TO_ONE,
        type: NxtOauthClient,
    })
    public client: NxtOauthClient = null
}
