/// <reference types="cypress" />
import { MatchImageSnapshotCommandOptionsType } from './command'

declare global {
  namespace Cypress {
    interface Chainable {
      matchImageSnapshot(nameOrOptions?: string | MatchImageSnapshotCommandOptionsType): void

      matchImageSnapshot(name: string, options: MatchImageSnapshotCommandOptionsType): void
    }
  }
}

export * from './command'
export * from './plugin'
