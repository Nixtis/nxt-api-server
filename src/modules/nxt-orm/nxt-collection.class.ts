import { NxtEntityClass } from './nxt-entity.class'

export class NxtCollectionClass<T extends NxtEntityClass> {

    constructor (
        public nbTotal: number = 0,
        public currentPage: number = 0,
        public nbPages: number = 0,
        public itemsPerPage: number = 0,
        public list: T[] = [],
    ) {}

    public getObjectToSend (): any {
        return {
            currentPage: this.currentPage,
            itemsPerPage: this.itemsPerPage,
            list: this.list.map((row: NxtEntityClass) => row.getObjectToSend()),
            nbPages: this.nbPages,
            nbTotal: this.nbTotal,
        }
    }

}
