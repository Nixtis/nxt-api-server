export class NxtResponse {
    public static HTTP_OK: number = 200
    public static HTTP_CREATED: number = 201
    public static HTTP_ACCEPTED: number = 202
    public static HTTP_NO_CONTENT: number = 204

    public static HTTP_BAD_REQUEST: number = 400
    public static HTTP_UNAUTHORIZED: number = 401
    public static HTTP_PAYMENT_REQUIRED: number = 402
    public static HTTP_FORBIDDEN: number = 403
    public static HTTP_NOT_FOUND: number = 404
    public static HTTP_METHOD_NOT_ALLOWED: number = 405
    public static HTTP_CONFLICT: number = 409
    public static HTTP_UNPROCESSABLE_ENTITY: number = 422

    public static HTTP_INTERNAL_SERVER_ERROR: number = 500

    private httpStatusCode: number
    private body: any

    constructor (httpStatusCode: number, body: any) {
        this.httpStatusCode = httpStatusCode
        this.body = body
    }

    public getHttpStatusCode (): number {
        return this.httpStatusCode
    }

    public getBody (): number {
        return this.body
    }
}
