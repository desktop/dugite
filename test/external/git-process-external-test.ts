import * as chai from 'chai'
import { dirname } from 'path'
import { default as findGit, Git } from 'find-git-exec'
const expect = chai.expect

import { GitProcess } from '../../lib'
import { verify } from '../helpers'

const temp = require('temp').track()

describe('git-process [with external Git executable]', () => {

    let git: Git | undefined

    before(async () => {
        git = await findGit()
        if (!git || !git.path || !git.execPath) {
            git = undefined
        } else {
            const { path, execPath } = git
            // Set the environment variable to be able to use an external Git.
            process.env.GIT_EXEC_PATH = execPath
            process.env.LOCAL_GIT_DIRECTORY = dirname(dirname(path))
        }
    })

    beforeEach(async function () {
        if (!git) {
            console.warn(`External Git was not found on the host system.`)
            this.skip()
        }
    })

    describe('clone', () => {
        it('returns exit code when successful', async function () {
            const testRepoPath = temp.mkdirSync('desktop-git-clone-valid-external')
            const result = await GitProcess.exec(['clone', '--', 'https://github.com/TypeFox/find-git-exec.git', '.'], testRepoPath)
            verify(result, r => {
                expect(r.exitCode).to.equal(0)
            })
        })
    })
})