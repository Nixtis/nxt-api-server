import { nxtGetInject } from './nxt-inject.decorator'

export class NxtInjectClass {

    private injectableModulesInstancied: Array<{ key: any, value: any }>

    constructor (injectableModules) {
        this.injectableModulesInstancied = [
            { key: NxtInjectClass, value: this },
            ...this.createModuleInstance([ ...injectableModules ])
        ]
    }

    public createInstance (target) {
        const inject = nxtGetInject(target)

        if (inject) {
            const modulesToInject = inject.map((mod) => {
                const moduleToInject = this.getInstance(mod)

                if (moduleToInject) {
                    return moduleToInject
                }

                throw new Error('[NxtInjectClass: DI error]: module ' + mod.toString() + ' does not exists in injectableModules')
            })

            return new target(...modulesToInject)
        }

        return new target()
    }

    public getInstance (target) {
        return this.injectableModulesInstancied.find((instanciedModule) => instanciedModule.key === target).value
    }

    private createModuleInstance (targets: any[], results: Array<{ key: any, value: any }> = []): Array<{ key: any, value: any }> {
        const target = targets[0]

        if (results.find((instanciedModule) => instanciedModule.key === target)) {
            return targets.length > 1 ? this.createModuleInstance(targets.splice(1), results) : results
        }

        const inject = nxtGetInject(target)

        if (inject) {
            const modulesToInject = inject.map((mod) => {
                let moduleToInject = results.find((instanciedModule) => instanciedModule.key === mod)

                if (!moduleToInject) {
                    results = this.createModuleInstance([ mod ], results)

                    moduleToInject = results.find((instanciedModule) => instanciedModule.key === mod)
                }

                if (!moduleToInject) {
                    throw new Error('[NxtInjectClass: DI error]: module ' + mod.toString() + ' does not exists in injectableModules')
                }

                return moduleToInject.value
            })

            if (targets.length > 1) {
                return this.createModuleInstance(targets.splice(1), [ ...results, { key: target, value: new target(...modulesToInject) } ])
            }

            return [
                ...results,
                {
                    key: target,
                    value: new target(...modulesToInject),
                },
            ]
        }

        if (targets.length > 1) {
            return this.createModuleInstance(targets.splice(1), [ ...results, { key: target, value: new target() }])
        }

        return [
            ...results,
            {
                key: target,
                value: new target(),
            },
        ]
    }
}
