import { Application, NextFunction, Request, Response, Router } from 'express'

import { Route } from '../../config/routes'
import * as NxtRoutingCheck from '../../config/routing-checks'
import * as NxtInject from '../nxt-inject'
import { injectableModules } from '../nxt-inject/nxt-injectable-modules'
import * as NxtOrm from '../nxt-orm'
import { NxtRequestEnum } from './nxt-request.enum'
import { NxtResponse } from './nxt-response.class'
import { nxtGetRoute, NxtRouteParams } from './nxt-route.decorator'

export class NxtRequest {
    private express: Application
    private routes: NxtUsedRoute[] = []
    private nxtInject: NxtInject.NxtInjectClass =  new NxtInject.NxtInjectClass(injectableModules)

    constructor (routes: Route[], express: Application) {
        this.express = express

        routes.forEach((route) => {
            // Instancie les service en injectant les modules
            const entity = this.nxtInject.createInstance(route.service)
            const router: Router = Router()

            Object.getOwnPropertyNames(entity.__proto__).forEach((prop: string) => {
                const routeParams: NxtRouteParams = nxtGetRoute(entity, prop)

                if (routeParams) {
                    switch (routeParams.method) {
                        case NxtRequestEnum.GET:
                            router.get(routeParams.path, (req: Request, res: Response, next: NextFunction) => this.checkRoutingAndProceed(req, res, next, routeParams, entity, prop))
                            break
                        case NxtRequestEnum.POST:
                            router.post(routeParams.path, (req: Request, res: Response, next: NextFunction) => this.checkRoutingAndProceed(req, res, next, routeParams, entity, prop))
                            break
                        case NxtRequestEnum.PUT:
                            router.put(routeParams.path, (req: Request, res: Response, next: NextFunction) => this.checkRoutingAndProceed(req, res, next, routeParams, entity, prop))
                            break
                        case NxtRequestEnum.PATCH:
                            router.patch(routeParams.path, (req: Request, res: Response, next: NextFunction) => this.checkRoutingAndProceed(req, res, next, routeParams, entity, prop))
                            break
                        case NxtRequestEnum.DELETE:
                            router.delete(routeParams.path, (req: Request, res: Response, next: NextFunction) => this.checkRoutingAndProceed(req, res, next, routeParams, entity, prop))
                            break
                        case NxtRequestEnum.OPTIONS:
                            router.options(routeParams.path, (req: Request, res: Response, next: NextFunction) => this.checkRoutingAndProceed(req, res, next, routeParams, entity, prop))
                            break
                        default:
                            throw new Error('[ROUTE: no method] You must add a valid method for your route')
                    }
                }
            })

            this.routes = [ ...this.routes, { path: route.path, router } ]
        })
    }

    public getRoutes (): NxtUsedRoute[] {
        return this.routes
    }

    private routingCheck (props: string[], req: Request, res: Response, next: NextFunction, routeParams: NxtRouteParams): Promise<boolean> {
        return NxtRoutingCheck[props[0]](req, res, next, routeParams, this.nxtInject)
            .then((value: boolean) => {
                if (!value) {
                    return false
                }

                if (props.length > 1) {
                    return this.routingCheck(props.slice(1), req, res, next, routeParams)
                }

                return true
            })
    }

    private checkRoutingAndProceed (req: Request, res: Response, next: NextFunction, routeParams: NxtRouteParams, entity, prop: string) {
        /**
         * Routing check
         */
        const props: string[] = Object.getOwnPropertyNames(NxtRoutingCheck)
            .filter((prop: string) => prop !== '__esModule')

        this.routingCheck(props, req, res, next, routeParams)
            .then((value: boolean) => {
                if (value) {
                    this.executeMethodService(req, res, next, routeParams, entity, prop)
                }
            })
            .catch((err) => {
                console.error(err)

                res
                    .status(NxtResponse.HTTP_INTERNAL_SERVER_ERROR)
                    .send({})
            })
    }

    private executeMethodService (req: Request, res: Response, next: NextFunction, routeParams: NxtRouteParams, entity, prop: string) {
        const response = entity[prop](req, res, next)
        let respToSend: NxtResponse

        if (response instanceof Promise) {
            response.then((resp) => {
                respToSend = this.getResponseToSend(resp)

                res
                    .status(respToSend.getHttpStatusCode())
                    .send(respToSend.getBody())
            })
            .catch((err) => {
                console.error(err)

                res
                    .status(NxtResponse.HTTP_INTERNAL_SERVER_ERROR)
                    .send({
                        details: err,
                        status: 500,
                        title: 'Internal Server Error',
                    })
            })
        } else {
            respToSend = this.getResponseToSend(response)

            res
                .status(respToSend.getHttpStatusCode())
                .send(respToSend.getBody())
        }
    }

    private getResponseToSend (resp): NxtResponse {
        let respToSend: NxtResponse

        if (resp instanceof NxtResponse) {
            respToSend = resp
        } else if (resp instanceof NxtOrm.NxtEntityClass) {
            if (resp._response) {
                respToSend = resp._response
            } else {
                respToSend = new NxtResponse(200, resp.getObjectToSend())
            }
        } else if (resp instanceof NxtOrm.NxtCollectionClass) {
            respToSend = new NxtResponse(200, resp.getObjectToSend())
        } else if (Array.isArray(resp)) {
            respToSend = new NxtResponse(200, resp.map((row) => row instanceof NxtOrm.NxtEntityClass ? row.getObjectToSend() : row))
        } else {
            respToSend = new NxtResponse(200, resp)
        }

        return respToSend
    }
}

export interface NxtUsedRoute {
    path: string
    router: Router
}
