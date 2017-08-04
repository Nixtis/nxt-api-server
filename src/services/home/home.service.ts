import { NextFunction, Request, Response } from 'express'

import * as NxtRequest from '../../modules/nxt-request'

import { Home } from './home.entity'

export class HomeService {

    @NxtRequest.NxtRoute({
        method: NxtRequest.NxtRequestEnum.GET,
        path: '/',
    })
    public getHome (req: Request, res: Response, next: NextFunction): Home {
        const homeEntity: Home = new Home()

        homeEntity.text = 'Hello world!'

        return homeEntity
    }

}
