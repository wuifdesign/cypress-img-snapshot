/// <reference types="jest" />
declare const global: {
  Cypress: any
  cy: any
}
declare const Cypress: any
declare const cy: any

global.Cypress = {
  env: () => undefined,
  log: () => null,
  config: () => '/cypress/screenshots',
  Commands: {
    add: jest.fn()
  },
  mocha: {
    getRunner: () => ({
      suite: {
        ctx: {
          test: ''
        }
      }
    })
  }
}

global.cy = {
  get: () => ({
    then: () => Promise.resolve()
  }),
  log: () => null,
  viewport: () => null,
  clock: () => null,
  wrap: (subject: any) => ({
    ...subject,
    as: () => null
  })
}

const { matchImageSnapshotCommand, addMatchImageSnapshotCommand } = require('./command')

const defaultOptions = {
  failureThreshold: 0,
  failureThresholdType: 'pixel'
}

const boundMatchImageSnapshot = matchImageSnapshotCommand(defaultOptions).bind({
  test: 'snap'
})
const subject = { screenshot: jest.fn() }
const commandOptions = {
  failureThreshold: 10
}

describe('command', () => {
  it('should pass options through', () => {
    cy.task = jest.fn().mockResolvedValue({ pass: true })

    boundMatchImageSnapshot(subject, commandOptions)

    expect(cy.task).toHaveBeenCalledWith(
      'Matching image snapshot',
      {
        options: {
          clockDate: new Date(Date.UTC(2019, 1, 1)),
          failureThreshold: 10,
          failureThresholdType: 'pixel',
          snapshotSizes: [
            [375, 667],
            [1280, 800]
          ]
        },
        screenshotsFolder: '/cypress/screenshots',
        updateSnapshots: false
      },
      { log: false }
    )

    expect(cy.task).toBeCalledTimes(4)
  })

  it('should pass', () => {
    cy.task = jest.fn().mockResolvedValue({ pass: true })

    expect(boundMatchImageSnapshot(subject, commandOptions)).resolves.not.toThrow()
  })

  it('should fail', () => {
    cy.task = jest.fn().mockResolvedValue({
      pass: false,
      added: false,
      updated: false,
      diffRatio: 0.1,
      diffPixelCount: 10,
      diffOutputPath: 'cheese'
    })

    cy.get = jest.fn().mockResolvedValue(['Error'])

    expect(boundMatchImageSnapshot(subject, commandOptions)).rejects.toThrow('Error')
  })

  it('should add command', () => {
    Cypress.Commands.add.mockReset()
    addMatchImageSnapshotCommand()
    expect(Cypress.Commands.add).toHaveBeenCalledWith(
      'matchImageSnapshot',
      { prevSubject: ['optional', 'element', 'window', 'document'] },
      expect.any(Function)
    )
    expect(Cypress.Commands.add).toBeCalledTimes(1)
  })

  it('should add command with options', () => {
    Cypress.Commands.add.mockReset()
    addMatchImageSnapshotCommand({ failureThreshold: 0.1 })
    expect(Cypress.Commands.add).toHaveBeenCalledWith(
      'matchImageSnapshot',
      { prevSubject: ['optional', 'element', 'window', 'document'] },
      expect.any(Function)
    )
    expect(Cypress.Commands.add).toBeCalledTimes(1)
  })
})

export {}
