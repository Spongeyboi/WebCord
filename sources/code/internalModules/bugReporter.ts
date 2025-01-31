/**
 * crash.ts – funtion/s to report a bug on GitHub.
 */

import { app, shell } from "electron";
import * as newGithubIssueUrl from "new-github-issue-url";
import { appInfo } from "../main/clientProperties";
import fetch from "electron-fetch";

/**
 * Generates a link to new GitHub issue, based on `bug_report.md`
 * and current hardware / software configuration. This makes it
 * easy to aquire needed details (except screenshot, because of
 * the lack of the GitHub support to do that via the CDN or using
 * 'base64' images).
 */
export async function createGithubIssue(): Promise<void> {

    /* Fetch issue template in markdown. */

    let markdownBody: string;
    {
        const arrayBody: Array<string> = [];
        arrayBody.push("**Note:** This issue was automatically generated by WebCord.");
        const markdownBugTemplate = await (await fetch('https://raw.githubusercontent.com/' + appInfo.repository.name + '/master/.github/ISSUE_TEMPLATE/bug_report.md')).text();

        /* Loop through all lines and edit properties according to OS specification. */

        for (const line of markdownBugTemplate.split('\n')) {
            let tempEdited: string = line, newValue: null | string = null;
            if (line.includes('Platform:'))
                newValue = '`' + process.platform + '`';
            if (line.includes('Architecture:'))
                newValue = '`' + process.arch + '`';
            if (line.includes('Electron version:'))
                newValue = '`' + 'v' + process.versions.electron + '`';
            if (line.includes('Application version:'))
                newValue = '`' + 'v' + app.getVersion() + '`';
            if (newValue !== null)
                tempEdited = line.replace(line.substr(line.indexOf(':') + 2), newValue);
            /* Do not push GitHub's template information */
            if (!tempEdited.match(/---|name:|title:|about:|assignees:|labels:/))
                arrayBody.push(tempEdited);
        }
        markdownBody = arrayBody.join('\n');
    }

    /* Generate template URL. */

    const githubIssueUrl = new URL(
        newGithubIssueUrl({
            repoUrl: 'https://github.com/' + appInfo.repository.name,
            body: markdownBody,
            assignee: 'SpacingBat3',
            labels: ['bug'],
            template: 'bug_report.md'
        })
    );

    /* Verify origin and open URL in default browser. */

    if (githubIssueUrl.origin === "https://github.com")
        shell.openExternal(githubIssueUrl.href);
}