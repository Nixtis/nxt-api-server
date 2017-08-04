import { NxtEntityClass } from '../nxt-orm/nxt-entity.class'
import { NxtEntity } from '../nxt-orm/nxt-entity.decorator'
import { NxtField } from '../nxt-orm/nxt-field.decorator'
import { NxtOrmEnum } from '../nxt-orm/nxt-orm.enum'

@NxtEntity({
    table: 'oauth_client',
})
export class NxtOauthClient extends NxtEntityClass {
    @NxtField({
        length: 255,
        name: 'secret',
        type: NxtOrmEnum.VARCHAR,
    })
    public secret: string = ''

    @NxtField({
        name: 'allowed_grant_types',
        type: NxtOrmEnum.JSON,
    })
    public allowedGrantTypes: string[] = []

    @NxtField({
        length: 255,
        name: 'name',
        type: NxtOrmEnum.VARCHAR,
    })
    public name: string = ''
}
