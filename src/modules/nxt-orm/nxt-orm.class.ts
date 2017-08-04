import { NxtEntityClass } from './nxt-entity.class'
import { NxtEntityParams, nxtGetEntity } from './nxt-entity.decorator'
import { NxtOrmRepository } from './nxt-orm-repository.class'

export class NxtOrm {
    public getRepository<T extends NxtEntityClass> (target): NxtOrmRepository<T> {
        const params: NxtEntityParams = nxtGetEntity(target)

        return params.repository !== undefined ? new params.repository() : new NxtOrmRepository<T>(target)
    }
}
