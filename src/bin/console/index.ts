require('source-map-support').install()

import 'reflect-metadata'

import { NxtOrmApp } from '../../modules/nxt-orm/nxt-orm.app'

let mod: any = null

switch (process.argv[2]) {
    case 'nxt-orm':
        mod = new NxtOrmApp()
        break
    default:
        process.stdout.write('Warning: invalid argument, please read the doc if you need help: http://help.nxt' + '\n')
}

if (mod !== null && mod.isReady()) {
    mod.initiate()
}
