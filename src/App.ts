import * as bodyParser from 'body-parser'
import * as express from 'express'
import * as logger from 'morgan'

import { routes } from './config/routes'
import * as NxtRequest from './modules/nxt-request'

// Creates and configures an ExpressJS web server.
class App {
    // ref to Express instance
    public express: express.Application

    // Run configuration methods on the Express instance.
    constructor () {
        this.express = express()
        this.middleware()
        this.routes()
    }

    // Configure Express middleware.
    private middleware (): void {
        this.express.use((req, res, next) => {
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE')
            res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')

            if (req.method === 'OPTIONS') {
                res.sendStatus(200)
            } else {
                next()
            }
        })

        this.express.use(logger('dev'))
        this.express.use(bodyParser.json())
        this.express.use(bodyParser.urlencoded({ extended: false }))
    }

    // Configure API endpoints.
    private routes (): void {
        /**
         * This is just to get up and running, and to make sure what we've got is
         * working so far. This function will change when we start to add more
         * API endpoints
         */
        const nxtRequest = new NxtRequest.NxtRequest(routes, this.express)

        // placeholder route handler
        nxtRequest.getRoutes().forEach((row: NxtRequest.NxtUsedRoute) => {
            this.express.use(row.path, row.router)
        })

        this.express.use((req, res, next) => {
            res.status(404).send({
                details: 'This entity dosen\'t exists or has been deleted',
                status: 404,
                title: 'Not Found',
            })
        })
  }

}

export default new App().express
