import * as NxtOrm from '../../modules/nxt-orm'

@NxtOrm.NxtEntity({
    table: 'home',
})
export class Home extends NxtOrm.NxtEntityClass {
    @NxtOrm.NxtField({
        name: 'text',
        type: NxtOrm.NxtOrmEnum.TEXT,
    })
    public text: string = ''
}
