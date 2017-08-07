import { AWSAdvertising } from '../apis/aws-advertising/aws-advertising.class'
import { NxtDb } from '../nxt-db/nxt-db.class'
import { NxtOauth2 } from '../nxt-oauth2/nxt-oauth2.class'
import { NxtOrm } from '../nxt-orm/nxt-orm.class'
import { NxtValidator } from '../nxt-validation/nxt-validator.class'

export const injectableModules = [
    AWSAdvertising,
    NxtDb,
    NxtOauth2,
    NxtOrm,
    NxtValidator,
]
