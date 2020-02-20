import * as path from 'path'
import * as exec from '@actions/exec'
import * as io from '@actions/io'
import {getVersion, gitTagExists} from '../src/version'
import * as fs from 'fs'

const testTag = 'TEST-TAG'

describe('version', () => {
  const remotePath = path.join(__dirname, 'remote')
  const localPath = path.join(__dirname, 'local')

  beforeAll(async () => {
    await io.mkdirP(remotePath)
    await io.mkdirP(localPath)
    fs.writeFileSync(path.join(remotePath, 'index.txt'), 'data')

    await exec.exec('git', ['init'], {cwd: remotePath})
    await exec.exec('git', ['add', 'index.txt'], {cwd: remotePath})
    await exec.exec('git', ['commit', '-m', 'test'], {cwd: remotePath})
    await exec.exec('git', ['tag', testTag], {cwd: remotePath})

    await exec.exec('git', ['init'], {cwd: localPath})
    await exec.exec('git', ['remote', 'add', 'origin', remotePath], {
      cwd: localPath
    })
  })

  afterAll(async () => {
    await io.rmRF(localPath)
    await io.rmRF(remotePath)
  })

  it('can validate that git tag exists in remote', async () => {
    const exists = await gitTagExists(testTag, localPath)
    expect(exists).toBeTruthy()
  })

  it('fails to validate when git tag does not exist in remote', async () => {
    const exists = await gitTagExists('NOT-REAL-TAG', localPath)
    expect(exists).toBeFalsy()
  })

  it('find version in file', async () => {
    const version = await getVersion(path.join(__dirname, 'version.txt'), 'v')
    expect(version).toBe('v1.0.0')
  })

  it('find version in multi-line file', async () => {
    const version = await getVersion(
      path.join(__dirname, 'multi-line-version.txt'),
      'v'
    )
    expect(version).toBe('v1.0.0')
  })

  it('to error when file does not exist', async () => {
    expect.assertions(1)
    await expect(
      getVersion(path.join(__dirname, 'not-real-path.txt'))
    ).rejects.toThrow()
  })

  it('to error when file is empty', async () => {
    expect.assertions(1)
    await expect(
      getVersion(path.join(__dirname, 'empty-version.txt'))
    ).rejects.toThrow()
  })
})
