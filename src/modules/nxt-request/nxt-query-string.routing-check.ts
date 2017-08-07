import { NextFunction, Request, Response } from 'express'

import { NxtInjectClass } from '../nxt-inject'
import { NxtQueryStringTypesEnum, NxtRouteParams } from '../nxt-request'

export function nxtQueryStringRoutingCheck (req: Request, res: Response, next: NextFunction, routeParams: NxtRouteParams, nxtInject: NxtInjectClass): Promise<boolean> {
    /**
     * Check for query string type validity
     */
    return new Promise((resolve, reject) => {
        if (routeParams.queryString !== undefined && routeParams.queryString.find((query) => req.params[query.name] === undefined) !== undefined) {
            reject()
            throw new Error('[nxtQueryStringRoutingCheck]: Cannot find query string')
        } else if (routeParams.queryString !== undefined) {
            const isQueryStringValid = routeParams.queryString.reduce((prev, curr) => {
                if (!prev) {
                    return false
                }

                return !(!req.params[curr.name] || (curr.type === NxtQueryStringTypesEnum.NUMBER && isNaN(req.params[curr.name])))
            }, true)

            if (!isQueryStringValid) {
                next()
                resolve(false)
                return
            }
        }

        resolve(true)
    })
}
