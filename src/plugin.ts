/// <reference types="cypress" />
import fs from 'fs-extra'
import path from 'path'
import pkgDir from 'pkg-dir'
import { MATCH, RECORD } from './constants'
// @ts-ignore
import { diffImageToSnapshot } from 'jest-image-snapshot/src/diff-snapshot'

type AfterScreenshotReturnObject = Cypress.AfterScreenshotReturnObject
type ConfigOptions = Cypress.ConfigOptions
type PluginEvents = Cypress.PluginEvents

type ImageDimensions = {
  receivedHeight: number
  receivedWidth: number
  baselineHeight: number
  baselineWidth: number
}

type SnapshotOptionsOptionsType = {
  failureThreshold: number
  failureThresholdType: 'percent' | 'pixel'
  customSnapshotsDir?: string
  customDiffDir?: string
}

type SnapshotOptionsType = ConfigOptions & {
  updateSnapshots?: boolean
  options?: SnapshotOptionsOptionsType
}

export type SnapshotResultType = {
  pass?: boolean
  added?: boolean
  updated?: boolean
  diffSize?: boolean
  imageDimensions?: ImageDimensions
  diffOutputPath?: string
  diffRatio?: number
  diffPixelCount?: number
  imgSrcString?: string
}

let snapshotOptions: SnapshotOptionsType = {}
let snapshotResult: SnapshotResultType = {}
let snapshotRunning = false
const kebabSnap = '-snap.png'
const dotSnap = '.snap.png'
const dotDiff = '.diff.png'

export const basePath = pkgDir.sync() || ''

export function matchImageSnapshotOptions() {
  return (options: SnapshotOptionsType = {}) => {
    snapshotOptions = options
    snapshotRunning = true
    return null
  }
}

export function matchImageSnapshotResult() {
  return () => {
    snapshotRunning = false
    return snapshotResult
  }
}

type MatchImageSnapshotPluginProps = {
  path: string
}

export function matchImageSnapshotPlugin({
  path: screenshotPath
}: MatchImageSnapshotPluginProps): void | AfterScreenshotReturnObject | Promise<AfterScreenshotReturnObject> {
  if (!snapshotRunning) {
    return undefined
  }

  const {
    screenshotsFolder,
    updateSnapshots,
    options: {
      failureThreshold = 0,
      failureThresholdType = 'pixel',
      customSnapshotsDir = null,
      customDiffDir = null,
      ...options
    } = {}
  } = snapshotOptions

  if (screenshotsFolder) {
    const receivedImageBuffer = fs.readFileSync(screenshotPath)
    fs.removeSync(screenshotPath)

    const { dir: screenshotDir, name } = path.parse(screenshotPath)

    // remove the cypress v5+ native retries suffix from the file name
    const snapshotIdentifier = name.replace(/ \(attempt [0-9]+\)/, '')

    const relativePath = path.relative(screenshotsFolder, screenshotDir)
    const snapshotsDir = customSnapshotsDir
      ? path.join(process.cwd(), customSnapshotsDir, relativePath)
      : path.join(screenshotsFolder, '..', 'snapshots', relativePath)

    const snapshotKebabPath = path.join(snapshotsDir, `${snapshotIdentifier}${kebabSnap}`)
    const snapshotDotPath = path.join(snapshotsDir, `${snapshotIdentifier}${dotSnap}`)

    const diffDir = customDiffDir
      ? path.join(process.cwd(), customDiffDir, relativePath)
      : path.join(snapshotsDir, '__diff_output__')
    const diffDotPath = path.join(diffDir, `${snapshotIdentifier}${dotDiff}`)

    if (fs.pathExistsSync(snapshotDotPath)) {
      fs.copySync(snapshotDotPath, snapshotKebabPath)
    }

    snapshotResult = {
      basePath,
      ...diffImageToSnapshot({
        snapshotsDir,
        diffDir,
        receivedImageBuffer,
        snapshotIdentifier,
        failureThreshold,
        failureThresholdType,
        updateSnapshot: updateSnapshots,
        ...options
      })
    }

    const { pass, added, updated, diffOutputPath } = snapshotResult

    if (diffOutputPath && !pass && !added && !updated) {
      fs.copySync(diffOutputPath, diffDotPath)
      fs.removeSync(diffOutputPath)
      fs.removeSync(snapshotKebabPath)
      snapshotResult.diffOutputPath = diffDotPath

      return {
        path: diffDotPath
      }
    }

    fs.copySync(snapshotKebabPath, snapshotDotPath)
    fs.removeSync(snapshotKebabPath)
    snapshotResult.diffOutputPath = snapshotDotPath

    return {
      path: snapshotDotPath
    }
  }

  return undefined
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function addMatchImageSnapshotPlugin(on: PluginEvents, config: ConfigOptions) {
  on('task', {
    [MATCH]: matchImageSnapshotOptions(),
    [RECORD]: matchImageSnapshotResult()
  })
  on('after:screenshot', matchImageSnapshotPlugin)
}
