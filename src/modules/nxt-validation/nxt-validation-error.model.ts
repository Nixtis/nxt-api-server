export class NxtValidationError {
    public field: string = ''
    public msg: string = ''

    constructor (field: string, msg: string) {
        this.field = field
        this.msg = msg
    }
}
