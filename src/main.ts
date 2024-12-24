import * as core from '@actions/core'

export async function run() {
  try {
    const buildStatus = core.getInput('result')
    const webhookURL = core.getInput('webhook-url', { required: true })
    const mention = core.getMultilineInput('mention')
    const refName = process.env['GITHUB_REF_NAME'] || ''
    const buildNumber = process.env['GITHUB_RUN_NUMBER'] || '-1'
    const commitSha = process.env['GITHUB_SHA'] || ''
    const commitMessage = core.getInput('commit-message')
    const actor = process.env['GITHUB_ACTOR'] || ''
    const buildLink =
      process.env['GITHUB_SERVER_URL'] +
      '/' +
      process.env['GITHUB_REPOSITORY'] +
      '/actions/runs/' +
      process.env['GITHUB_RUN_NUMBER']

    let statusMessage = ''
    if (buildStatus === 'success') {
      statusMessage = '🟢OK'
    } else if (buildStatus === 'failure') {
      statusMessage = '🔴FAIL'
    } else {
      statusMessage = buildStatus
    }

    const content = `\
${statusMessage} ${refName}#${buildNumber} ${commitSha.substring(0, 6)}
${commitMessage}
  by ${actor}
${buildLink}
`

    // https://developer.work.weixin.qq.com/document/path/91770
    // spell-checker: word msgtype
    const resp = await fetch(webhookURL, {
      method: 'POST',
      body: JSON.stringify({
        msgtype: 'text',
        text: {
          content,
          mentioned_list: mention
        }
      })
    })
    if (resp.status === 200) {
      const body = (await resp.json()) as { errcode: number; errmsg: string }
      if (body.errcode) {
        core.setFailed(JSON.stringify(body))
      } else {
        core.info(JSON.stringify(body))
      }
    } else {
      core.setFailed(
        JSON.stringify({
          status: resp.status,
          body: await resp.text()
        })
      )
    }
  } catch (err) {
    core.setFailed(err instanceof Error ? err : String(err))
  }
}
