import { NxtDb } from '../nxt-db/nxt-db.class'
import { NxtInject } from '../nxt-inject'
import { NxtValidator } from '../nxt-validation/nxt-validator.class'
import { NxtEntityClass } from './nxt-entity.class'
import { NxtEntityParams, nxtGetEntity } from './nxt-entity.decorator'
import { NxtOrmRepository } from './nxt-orm-repository.class'

@NxtInject([
    NxtDb,
    NxtValidator,
])
export class NxtOrm {

    constructor (
        private db: NxtDb,
        private nxtValidator: NxtValidator,
    ) {}

    public getRepository<T extends NxtEntityClass> (target): NxtOrmRepository<T> {
        const params: NxtEntityParams = nxtGetEntity(target)

        return params.repository !== undefined ? new params.repository() : new NxtOrmRepository<T>(this.db, this.nxtValidator, target)
    }
}
