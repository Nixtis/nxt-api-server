import { NextFunction, Request, Response } from 'express'

import { NxtInject } from '../nxt-inject'
import * as NxtRequest from '../nxt-request'
import { NxtResponse } from '../nxt-request'

import { NxtOauthClient } from './nxt-oauth2-client.entity'
import { NxtOauth2 } from './nxt-oauth2.class'

@NxtInject([
    NxtOauth2,
])
export class NxtOauth2Service {

    constructor (
        private nxtOauth2: NxtOauth2,
    ) {}

    /**
     * Get a new token or refresh token
     * @param req {Request}
     * @param res {Response}
     * @param next {NextFunction}
     * @returns {Promise<NxtResponse>}
     */
    @NxtRequest.NxtRoute({
        method: NxtRequest.NxtRequestEnum.POST,
        path: '/',
    })
    public request (req: Request, res: Response, next: NextFunction): Promise<NxtResponse> {
        if (this.nxtOauth2.isGoodRequest(req.body)) {
            return this.nxtOauth2.checkClientCretentials(req.body.client_id, req.body.client_secret, req.body.grant_type)
                .then((nxtOauthClient: NxtOauthClient) => {
                    if (nxtOauthClient) {
                        switch (req.body.grant_type) {
                            case 'password':
                                return this.nxtOauth2.getToken(req.body.username, req.body.password, nxtOauthClient)
                            case 'refresh_token':
                                return this.nxtOauth2.refreshToken(req.body.refresh_token, nxtOauthClient)
                            default:
                                return new NxtResponse(NxtRequest.NxtResponse.HTTP_UNPROCESSABLE_ENTITY, {
                                    details: 'Invalid grant type',
                                    status: 422,
                                    title: 'Unprocessable entity',
                                })
                        }
                    }

                    return new NxtResponse(NxtRequest.NxtResponse.HTTP_UNAUTHORIZED, {
                        details: 'Invalid client cretentials',
                        status: 401,
                        title: 'Unauthorized',
                    })
                })
        }

        return Promise.resolve(
            new NxtResponse(NxtRequest.NxtResponse.HTTP_UNPROCESSABLE_ENTITY, {
                details: 'The body sent is not correct',
                status: 422,
                title: 'Unprocessable entity',
            }),
        )
    }

}
