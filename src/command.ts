/// <reference types="cypress" />
import { MATCH, RECORD } from './constants'
import { MatchImageSnapshotOptions } from 'jest-image-snapshot'
import getTestName from './utils/get-test-name'

const screenshotsFolder = Cypress.config('screenshotsFolder')
const updateSnapshots = Cypress.env('updateSnapshots') || false
const failOnSnapshotDiff = typeof Cypress.env('failOnSnapshotDiff') === 'undefined'

export type ImageSnapshotOptions = {
  clockDate?: Date | null
  snapshotSizes?: [number, number][]
}

export type MatchImageSnapshotCommandOptionsType =
  | ImageSnapshotOptions &
      MatchImageSnapshotOptions &
      Partial<Cypress.Loggable & Cypress.Timeoutable & Cypress.ScreenshotOptions>

export type MatchImageSnapshotCommandOptionsTypeWithSize = MatchImageSnapshotCommandOptionsType & {
  snapshotSizes: [number, number][]
}

export function matchImageSnapshotCommand(defaultOptions: MatchImageSnapshotCommandOptionsType) {
  return function matchImageSnapshot(
    subject: string,
    maybeName: string | MatchImageSnapshotCommandOptionsType,
    commandOptions?: MatchImageSnapshotCommandOptionsType
  ) {
    const name = typeof maybeName === 'string' ? maybeName : getTestName()
    const options: MatchImageSnapshotCommandOptionsTypeWithSize = {
      snapshotSizes: [
        [375, 667],
        [1280, 800]
      ],
      clockDate: new Date(Date.UTC(2019, 1, 1)),
      ...defaultOptions,
      ...((typeof maybeName === 'string' ? commandOptions : maybeName) || {})
    }

    if (options.clockDate) {
      cy.clock(options.clockDate.getTime(), { log: false })
    }

    cy.wrap([], { log: false }).as('errors')

    const viewportWidth = Cypress.config().viewportWidth
    const viewportHeight = Cypress.config().viewportHeight

    for (const [width, height] of options.snapshotSizes) {
      cy.task(
        MATCH,
        {
          screenshotsFolder,
          updateSnapshots,
          options
        },
        { log: false }
      )

      const screenshotName = `${name} (${width}x${height})`
      cy.log(`Checking image snapshot for "${screenshotName}"`)
      cy.viewport(width, height, { log: false })
      const target = subject ? cy.wrap(subject, { log: false }) : cy
      target.screenshot(screenshotName, {
        ...options,
        log: false
      })

      cy.task(RECORD, null, { log: false }).then((data: any) => {
        const { pass, added, updated, diffSize, imageDimensions, diffRatio, diffPixelCount, diffOutputPath } = data
        if (Object.keys(data).length > 0) {
          if (!pass && !added && !updated) {
            const relativeDiffOutputPath = diffOutputPath.replace(data.basePath, '')
            let message: string
            if (diffSize) {
              message = `Image size (${imageDimensions?.baselineWidth}x${imageDimensions?.baselineHeight}) different than saved snapshot size (${imageDimensions?.receivedWidth}x${imageDimensions?.receivedHeight}).\nSee diff for details: ${relativeDiffOutputPath}`
            } else {
              const diffSizeString = typeof diffRatio !== 'undefined' ? diffRatio * 100 : '???'
              message = `Image was ${diffSizeString}% different from saved snapshot with ${diffPixelCount} different pixels.\nSee diff for details: ${relativeDiffOutputPath}`
            }
            if (failOnSnapshotDiff) {
              cy.get<string[]>('@errors', { log: false }).then((errors) => {
                errors.push(message)
              })
            } else {
              Cypress.log({ message })
            }
          }
        }
      })
    }

    cy.viewport(viewportWidth, viewportHeight, { log: false })

    return cy.get<string[]>('@errors', { log: false }).then((errors) => {
      if (errors.length) {
        throw new Error(errors.join('\n\n'))
      }
    })
  }
}

export function addMatchImageSnapshotCommand(options: MatchImageSnapshotCommandOptionsType = {}) {
  Cypress.Commands.add(
    'matchImageSnapshot',
    { prevSubject: ['optional', 'element', 'window', 'document'] },
    matchImageSnapshotCommand(options)
  )
}
