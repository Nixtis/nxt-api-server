import { Request } from 'express'
import * as passwordHash from 'password-hash'
import * as uuid from 'uuid'

import { security } from '../../config/security'
import { NxtResponse } from '../../modules/nxt-request'
import { NxtDbColumnValuePair } from '../nxt-db'
import * as NxtOrm from '../nxt-orm'
import * as NxtValidation from '../nxt-validation'
import { NxtOauthClient } from './nxt-oauth2-client.entity'
import { NxtOauthRefreshToken } from './nxt-oauth2-refresh-token.entity'
import { NxtOauthToken } from './nxt-oauth2-token.entity'
import { NxtOauthUser } from './nxt-oauth2-user.entity'

export class NxtOauth2 {
    private orm: NxtOrm.NxtOrm = new NxtOrm.NxtOrm()
    private tokenExpiresIn: number = 3600
    private refreshTokenExpiresIn: number = 1209600

    /**
     * Returns the current user
     * @param req {Request}
     * @returns {Promise<NxtOauthUser>}
     */
    public getCurrentUser (req: Request): Promise<NxtOauthUser> {
        if (req.header('authorization') && /^Bearer .+$/.test(req.header('authorization'))) {
            const token: string = req.header('authorization').substr(7)

            return this.orm.getRepository(NxtOauthToken).findBy([ { column: 'token', value: token } ])
                .then((results: NxtOrm.NxtCollectionClass<NxtOauthToken>) => {
                    if (results.nbTotal) {
                        const now: Date = new Date()
                        return now.getTime() <= results.list[0].tokenExpires.getTime() ? results.list[0].user : null
                    }

                    return null
                })
        }

        return Promise.resolve(null)
    }

    /**
     * Returns true or false wether the user is connected or not
     * @param req {Request}
     * @returns {Promise<boolean>}
     */
    public isLogged (req: Request): Promise<boolean> {
        return this.getCurrentUser(req)
            .then((results: NxtOauthUser) => {
                if (results) {
                    return true
                }

                return false
            })
    }

    /**
     * Check if username/password are good
     * @param username {string}
     * @param password {string}
     * @returns {Promise<NxtOauthUser>}
     */
    public checkCretentials (username: string, password: string): Promise<NxtOauthUser> {
        return this.orm.getRepository(NxtOauthUser).findBy([ { column: 'username', value: username } ])
            .then((results: NxtOrm.NxtCollectionClass<NxtOauthUser>) => {
                if (results.nbTotal && passwordHash.verify(password, results.list[0].password)) {
                    return results.list[0]
                }

                return null
            })
    }

    /**
     * Check if client cretentials are good
     * @param clientName {string}
     * @param clientSecret {string}
     * @returns {Promise<NxtOauthClient>}
     */
    public checkClientCretentials (clientName: string, clientSecret: string, grantType: string): Promise<NxtOauthClient> {
        const nxtDbColumnValuePair: NxtDbColumnValuePair[] = [
            { column: 'name', value: clientName },
            { column: 'secret', value: clientSecret },
        ]

        return this.orm.getRepository(NxtOauthClient).findBy(nxtDbColumnValuePair)
            .then((results: NxtOrm.NxtCollectionClass<NxtOauthClient>) => {
                if (results.nbTotal && results.list[0].allowedGrantTypes.indexOf(grantType) > -1) {
                    return results.list[0]
                }

                return null
            })
    }

    /**
     * Check refresh token
     * @param {refreshToken}
     * @returns {Promise<boolean>}
     */
    public checkRefreshToken (refreshToken: string): Promise<NxtOauthRefreshToken> {
        const nxtDbColumnValuePair: NxtDbColumnValuePair[] = [
            { column: 'refreshToken', value: refreshToken },
        ]

        return this.orm.getRepository(NxtOauthRefreshToken).findBy(nxtDbColumnValuePair)
            .then((results: NxtOrm.NxtCollectionClass<NxtOauthRefreshToken>) => {
                if (results.nbTotal) {
                    const now: Date = new Date()
                    return now.getTime() <= results.list[0].refreshTokenExpires.getTime() ? results.list[0] : null
                }

                return null
            })
    }

    /**
     * Create a new token
     * @param nxtOauthUser {NxtOauthUser}
     * @param nxtOauthClient {NxtOauthClient}
     * @returns {Promise<NxtOauthToken>}
     */
    public generateNewToken (nxtOauthUser: NxtOauthUser, nxtOauthClient: NxtOauthClient): Promise<NxtOauthToken> {
        const token: string = uuid.v4()

        const nxtOautToken: NxtOauthToken = new NxtOauthToken()
        nxtOautToken.user = nxtOauthUser
        nxtOautToken.token = token
        nxtOautToken.tokenExpires = new Date()
        nxtOautToken.tokenExpires.setTime(nxtOautToken.tokenExpires.getTime() + (1000 * this.tokenExpiresIn))
        nxtOautToken.client = nxtOauthClient

        return this.orm.getRepository<NxtOauthToken>(NxtOauthToken)
            .insert(nxtOautToken)
    }

    /**
     * Create a new refresh token
     * @param nxtOauthUser {NxtOauthUser}
     * @param nxtOauthClient {NxtOauthClient}
     * @returns {Promise<NxtOauthRefreshToken>}
     */
    public generateNewRefreshToken (nxtOauthUser: NxtOauthUser, nxtOauthClient: NxtOauthClient): Promise<NxtOauthRefreshToken> {
        const refreshToken: string = uuid.v4()

        const nxtOauthRefreshToken: NxtOauthRefreshToken = new NxtOauthRefreshToken()
        nxtOauthRefreshToken.user = nxtOauthUser
        nxtOauthRefreshToken.refreshToken = refreshToken
        nxtOauthRefreshToken.refreshTokenExpires = new Date()
        nxtOauthRefreshToken.refreshTokenExpires.setTime(nxtOauthRefreshToken.refreshTokenExpires.getTime() + (1000 * this.refreshTokenExpiresIn))
        nxtOauthRefreshToken.client = nxtOauthClient

        return this.orm.getRepository<NxtOauthRefreshToken>(NxtOauthRefreshToken)
            .insert(nxtOauthRefreshToken)
    }

    /**
     * Create a new oauth user
     * @param username {string}
     * @param password {string}
     * @param roles {string[]}
     * @returns {Promise<NxtOauthUser>}
     */
    public createUser (username: string, password: string, roles: string[]): Promise<NxtOauthUser> {
        const user: NxtOauthUser = new NxtOauthUser()
        user.username = username
        user.password = password
        user.roles = roles

        // Vérification des formulaires
        const validator: NxtValidation.NxtValidator = new NxtValidation.NxtValidator()
        const errors = validator.validate(user)

        if (errors.length) {
            user._response = new NxtResponse(NxtResponse.HTTP_UNPROCESSABLE_ENTITY, {
                details: errors,
                status: 422,
                title: 'Unprocessable entity',
            })

            return Promise.resolve(user)
        }

        user.password = passwordHash.generate(password)

        const repository: NxtOrm.NxtOrmRepository<NxtOauthUser> = this.orm.getRepository<NxtOauthUser>(NxtOauthUser)

        return repository
            .findBy([ { column: 'username', value: username } ])
            .then((oauthUser: NxtOrm.NxtCollectionClass<NxtOauthUser>) => {
                if (oauthUser.nbTotal) {
                    oauthUser.list[0]._response = new NxtResponse(NxtResponse.HTTP_CONFLICT, {
                        details: 'Username already exists',
                        status: 409,
                        title: 'Conflict',
                    })

                    return oauthUser.list[0]
                }

                return repository.insert(user)
            })
    }

    /**
     * Verify if at least one of user roles are granted
     * @param userRoles {string[]}
     * @param accessRoles {string[]}
     * @returns {boolean}
     */
    public isRoleGranted (userRoles: string[], accessRoles: string[]): boolean {
        userRoles.forEach((userRole: string) => {
            if (!security.roles.find((role) => role.roleName === userRole)) {
                throw new Error('[OAUTH2: isRoleGranted]: User role "' + userRole + '" is not specified in the security configuration')
            }
        })

        accessRoles.forEach((accessRole: string) => {
            if (!security.roles.find((role) => role.roleName === accessRole)) {
                throw new Error('[OAUTH2: isRoleGranted]: Access role "' + accessRole + '" is not specified in the security configuration')
            }
        })

        // Check if user role is in the access role
        if (userRoles.find((userRole: string) => accessRoles.indexOf(userRole) > -1)) {
            return true
        }

        // Check is user role have access role in legacy
        const userRolesList: string[] = security.roles
            .filter((role) => userRoles.indexOf(role.roleName) > -1)
            .reduce((previous, current) => {
                current.legacy.forEach((currentLeg: string) => {
                    if (previous.indexOf(currentLeg) === -1) {
                        previous = [ ...previous, currentLeg ]
                    }
                })

                return previous
            }, [])

        if (userRolesList.length) {
            return this.isRoleGranted(userRolesList, accessRoles)
        }

        return false
    }

    /**
     * Insert a new token and refresh token
     * @param username {string}
     * @param password {string}
     * @returns {Promise<NxtResponse>}
     */
    public getToken (username: string, password: string, nxtOauthClient: NxtOauthClient): Promise<NxtResponse> {
        return this.checkCretentials(username, password)
            .then((nxtOauthUser: NxtOauthUser) => {
                if (nxtOauthUser !== null && nxtOauthUser.status) {
                    let nxtOautToken: NxtOauthToken

                    return this.generateNewToken(nxtOauthUser, nxtOauthClient)
                        .then((token: NxtOauthToken) => {
                            nxtOautToken = token

                            return this.generateNewRefreshToken(nxtOauthUser, nxtOauthClient)
                        })
                        .then((refresh: NxtOauthRefreshToken) => {
                            return new NxtResponse(NxtResponse.HTTP_OK, {
                                access_token: nxtOautToken.token,
                                expires_in: this.tokenExpiresIn,
                                refresh_token: refresh.refreshToken,
                                refresh_tokenExpires: this.refreshTokenExpiresIn,
                            })
                        })
                }

                if (nxtOauthUser !== null && !nxtOauthUser.status) {
                    return new NxtResponse(NxtResponse.HTTP_FORBIDDEN, {
                        details: 'User is not activated',
                        status: 403,
                        title: 'Forbidden',
                    })
                }

                return new NxtResponse(NxtResponse.HTTP_FORBIDDEN, {
                    details: 'Bad username or password',
                    status: 401,
                    title: 'Unauthorized',
                })
            })
    }

    /**
     * Get a new token from refresh token
     * @param refreshToken {string}
     * @returns {Promise<NxtResponse>}
     */
    public refreshToken (refreshToken: string, nxtOauthClient: NxtOauthClient): Promise<NxtResponse> {
        return this.checkRefreshToken(refreshToken)
            .then((nxtOauthRefreshToken: NxtOauthRefreshToken) => {
                if (nxtOauthRefreshToken) {
                    let nxtOautToken: NxtOauthToken

                    return this.generateNewToken(nxtOauthRefreshToken.user, nxtOauthClient)
                        .then((token: NxtOauthToken) => {
                            nxtOautToken = token

                            return this.generateNewRefreshToken(nxtOauthRefreshToken.user, nxtOauthClient)
                        })
                        .then((refresh: NxtOauthRefreshToken) => {
                            return new NxtResponse(NxtResponse.HTTP_OK, {
                                access_token: nxtOautToken.token,
                                expires_in: this.tokenExpiresIn,
                                refresh_token: refresh.refreshToken,
                                refresh_token_expires_in: this.refreshTokenExpiresIn,
                            })
                        })
                }

                return new NxtResponse(NxtResponse.HTTP_FORBIDDEN, {
                    details: 'Bad refresh token or expired',
                    status: 401,
                    title: 'Unauthorized',
                })
            })
    }

    /**
     * Verify if the body sent by the request is good
     * @param body {any}
     * @returns {boolean}
     */
    public isGoodRequest (body: any): boolean {
        return body.grant_type && body.client_secret && body.client_id && ((body.grant_type === 'password' && body.password && body.username) || (body.grant_type === 'refresh_token' && body.refresh_token))
    }
}
