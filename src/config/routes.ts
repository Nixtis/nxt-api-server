import { NxtOauth2Service } from '../modules/nxt-oauth2/nxt-oauth2.service'
import { HomeService } from '../services/home/home.service'

export const routes: Route[] = [
    {
        path: '/oauth',
        service: NxtOauth2Service,
    },
    {
        path: '/home',
        service: HomeService,
    },
]

export interface Route {
    path: string
    service: any
}
