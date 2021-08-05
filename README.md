# Cypress Img Snapshot

Based on [cypress-image-snapshot](https://github.com/jaredpalmer/cypress-image-snapshot).

Cypress Image Snapshot binds [jest-image-snapshot](https://github.com/americanexpress/jest-image-snapshot) image diffing logic to [Cypress.io](https://cypress.io) commands. **The goal is to catch visual regressions during integration tests.**

## Installation

```
npm i cypress-img-snapshot --save

yarn add cypress-img-snapshot
```

then add the following in your project's `<rootDir>/cypress/plugins/index.js`:

```ts
import { addMatchImageSnapshotPlugin } from 'cypress-img-snapshot/dist/plugin'

module.exports = (on, config) => {
  addMatchImageSnapshotPlugin(on, config)
}
```

and in `<rootDir>/cypress/support/commands.js` add:

```ts
import { addMatchImageSnapshotCommand } from 'cypress-img-snapshot/dist/command'

addMatchImageSnapshotCommand()
```

## Cypress GUI

When using `cypress open`, errors are displayed in the GUI 

**This isn't recommended as current client resolution and settings will influence the screenshots.**

## Cypress Run

For best results you should only take screenshot in headless mode. Otherwise, your client system (screen resolution) will influence the size of screenshot.

### Disable Screenshots for `cypress open`

Edit `support/commands.ts` file and add following to disable screenshots for `cypress open`.

```ts
Cypress.Commands.overwrite('matchImageSnapshot', (originalFn, subject, name, options) => {
  if (Cypress.browser.isHeadless) {
    return originalFn(subject, name, options)
  }
  return cy.log('No screenshot taken when headed')
})
```

### Increase Browser Size for Headless Browsers

Edit `plugins/index.ts` file and add following to start headless browsers with increased resolution.

```ts
module.exports = (on: PluginEvents, config: PluginConfigOptions) => {
  on('before:browser:launch', (browser, launchOptions) => {
    console.log('launching browser "%s" is headless? %s', browser.name, browser.isHeadless)

    const width = 1920
    const height = 1080

    console.log('setting the browser window size to %d x %d', width, height)

    if (browser.name === 'chrome' && browser.isHeadless) {
      launchOptions.args.push(`--window-size=${width},${height}`)

      // force screen to be non-retina and just use our given resolution
      launchOptions.args.push('--force-device-scale-factor=1')
      launchOptions.args.push('--cast-initial-screen-width=1600')
      launchOptions.args.push('--cast-initial-screen-height=900')
    }

    if (browser.name === 'electron' && browser.isHeadless) {
      // might not work on CI for some reason
      launchOptions.preferences.width = width
      launchOptions.preferences.height = height
    }

    if (browser.name === 'firefox' && browser.isHeadless) {
      launchOptions.args.push(`--width=${width}`)
      launchOptions.args.push(`--height=${height}`)
    }

    // IMPORTANT: return the updated browser launch options
    return launchOptions
  })
}
```

## Composite Image Diff

When an image diff fails, a composite image is constructed.

![Cypress Image Snapshot diff](./docs/diff.png)

## Syntax

```ts
// addMatchImageSnapshotPlugin
addMatchImageSnapshotPlugin(on, config)

// addMatchImageSnapshotCommand
addMatchImageSnapshotCommand()
addMatchImageSnapshotCommand(options)

// matchImageSnapshot
cy.matchImageSnapshot()
cy.matchImageSnapshot(name)
cy.matchImageSnapshot(options)
cy.matchImageSnapshot(name, options)
```

## Usage

### In your tests

```ts
describe('Login', () => {
  it('should be publicly accessible', () => {
    cy.visit('/login');

    // snapshot name will be the test title
    cy.matchImageSnapshot();

    // snapshot name will be the name passed in
    cy.matchImageSnapshot('login');

    // options object passed in
    cy.matchImageSnapshot(options);

    // match element snapshot
    cy.get('#login').matchImageSnapshot();
  });
});
```

## Options

- `customSnapshotsDir` : Path to the directory that snapshot images will be written to, defaults to `<rootDir>/cypress/snapshots`.
- `customDiffDir`: Path to the directory that diff images will be written to, defaults to a sibling `__diff_output__` directory alongside each snapshot.
- `snapshotSizes`: Sizes of screenshots to be generated. (default: `[[375, 667], [1280, 800]]`)
- `clockDate`: To set the clock to a specific date to get same screenshots each time. (default: `new Date(Date.UTC(2019, 1, 1))`)

Additionally, any options for [`cy.screenshot()`](https://docs.cypress.io/api/commands/screenshot.html#Arguments) and [jest-image-snapshot](https://github.com/americanexpress/jest-image-snapshot#optional-configuration) can be passed in the `options` argument to `addMatchImageSnapshotCommand` and `cy.matchImageSnapshot()`. The local options in `cy.matchImageSnapshot()` will overwrite the default options set in `addMatchImageSnapshot`.

For example, the default options we use in `<rootDir>/cypress/support/commands.js` are:

```ts
addMatchImageSnapshotCommand({
  snapshotSizes: [[375, 667], [1280, 800]], // sizes of screenshots
  clockDate: new Date(Date.UTC(2019, 1, 1)), // setting cy.clock()
  failureThreshold: 0.03, // threshold for entire image
  failureThresholdType: 'percent', // percent of image or number of pixels
  customDiffConfig: { threshold: 0.1 }, // threshold for each pixel
  capture: 'viewport', // capture viewport in screenshot
});
```

### Updating snapshots

Run Cypress with `--env updateSnapshots=true` in order to update the base image files for all of your tests.

### Preventing failures

Run Cypress with `--env failOnSnapshotDiff=false` in order to prevent test failures when an image diff does not pass.

## How it works

We really enjoy the diffing workflow of jest-image-snapshot and wanted to have a similar workflow when using Cypress. Because of this, under the hood we use some of jest-image-snapshot's internals and simply bind them to Cypress's commands and plugins APIs.

The workflow of `cy.matchImageSnapshot()` when running Cypress is:

1.  Take screenshots with `cy.screenshot()` named according to the current test.
2.  Check if saved snapshots exists in `<rootDir>/cypress/snapshots` and if so diff against that snapshots.
3.  If there is a resulting diff, save it to `<rootDir>/cypress/snapshots/__diff_output__`.

## Typescript

To support typing of `cy.matchImageSnapshot()` add the type to the `tsconfig.json`.

```json
{
  "compilerOptions": {
    "types": [
      "cypress-img-snapshot"
    ]
  }
}

```

## Troubleshooting

### ResizeObserver loop limit exceeded

you can safely ignore it in Cypress with the following code in `support/index.ts` or `commands.ts`.

```ts
Cypress.on('uncaught:exception', (err) => {
    // returning false here prevents Cypress from failing the test
    return !err.message.includes('ResizeObserver')
})
```
