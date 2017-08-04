import * as NxtOrm from '../nxt-orm'
import { NxtOauthClient } from './nxt-oauth2-client.entity'
import { NxtOauthUser } from './nxt-oauth2-user.entity'

@NxtOrm.NxtEntity({
    table: 'oauth_refresh_token',
})
export class NxtOauthRefreshToken extends NxtOrm.NxtEntityClass {
    @NxtOrm.NxtField({
        relation: NxtOrm.NxtOrmEnum.MANY_TO_ONE,
        type: NxtOauthUser,
    })
    public user: NxtOauthUser = null

    @NxtOrm.NxtField({
        length: 255,
        name: 'refresh_token',
        type: NxtOrm.NxtOrmEnum.VARCHAR,
    })
    public refreshToken: string = ''

    @NxtOrm.NxtField({
        name: 'refresh_token_expires',
        type: NxtOrm.NxtOrmEnum.DATETIME,
    })
    public refreshTokenExpires: Date = null

    @NxtOrm.NxtField({
        relation: NxtOrm.NxtOrmEnum.MANY_TO_ONE,
        type: NxtOauthClient,
    })
    public client: NxtOauthClient = null
}
