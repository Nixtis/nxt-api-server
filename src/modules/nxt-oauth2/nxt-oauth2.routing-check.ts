import { NextFunction, Request, Response } from 'express'

import { NxtInjectClass } from '../nxt-inject'
import { NxtResponse, NxtRouteParams } from '../nxt-request'
import * as NxtOauth2 from './'

export function oauth2RoutingCheck (req: Request, res: Response, next: NextFunction, routeParams: NxtRouteParams, nxtInjectClass: NxtInjectClass): Promise<boolean> {
    // Check if control access is needed
    if (routeParams.roleAccess && Array.isArray(routeParams.roleAccess) && routeParams.roleAccess.length) {
        const nxtOauth2: NxtOauth2.NxtOauth2 = nxtInjectClass.getInstance(NxtOauth2.NxtOauth2)

        return nxtOauth2.getCurrentUser(req)
            .then((user: NxtOauth2.NxtOauthUser) => {
                if (user && nxtOauth2.isRoleGranted(user.roles, routeParams.roleAccess)) {
                    return true
                }

                if (user && !nxtOauth2.isRoleGranted(user.roles, routeParams.roleAccess)) {
                    res
                        .status(NxtResponse.HTTP_FORBIDDEN)
                        .send({
                            details: 'You don\'t have the rights to access this content',
                            status: 403,
                            title: 'Forbidden',
                        })
                }

                res
                    .status(NxtResponse.HTTP_UNAUTHORIZED)
                    .send({
                        details: 'You have to log to access this content',
                        status: 401,
                        title: 'Unauthorized',
                    })

                return false
            })
    } else {
        return Promise.resolve(true)
    }
}
