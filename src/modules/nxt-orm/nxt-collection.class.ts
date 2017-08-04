import { NxtEntityClass } from './nxt-entity.class'

export class NxtCollectionClass<T extends NxtEntityClass> {

    constructor (
        public nbTotal: number = 0,
        public currentPage: number = 0,
        public nbPages: number = 0,
        public itemsPerPage: number = 0,
        public list: T[] = null,
    ) {}

}
