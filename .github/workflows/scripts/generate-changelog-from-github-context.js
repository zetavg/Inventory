/**
 * generate-changelog-from-github-context.js
 *
 * Usage: node generate-changelog-from-github-context.js "$GITHUB_CONTEXT"
 *        (With env "GITHUB_CONTEXT: ${{ toJSON(github) }}")
 */

const { execSync } = require('child_process');
const https = require('https');

// Get the third argument, which should be the JSON string
const githubContextJson = process.argv[2];

const gh = JSON.parse(githubContextJson);

(async () => {
  switch (gh.event_name) {
    case 'push': {
      const lines = [];
      // gh.ref will be like "refs/heads/main"
      const [, , ...branchNameParts] = gh.ref.split('/');
      const branchName = branchNameParts.join('/');
      lines.push(`Build of branch "${branchName}"`);
      lines.push('');
      gh.event.commits.forEach(commit => {
        lines.push(
          ` • [${commit.id.slice(0, 8)}] ${commit.message} (${[
            commit.author.username || commit.author.name,
            commit.committer.username || commit.committer.name,
          ]
            .filter((value, index, arr) => {
              return arr.indexOf(value) === index;
            })
            .join(', ')})`,
        );
      });

      return lines.join('\n');
    }

    case 'release': {
      const lines = [];

      lines.push(gh.event.release.name);
      lines.push('');

      if (gh.event.release.body) {
        lines.push(markdownToText(gh.event.release.body));
        lines.push('');
      }

      lines.push(`See the full release note at ${gh.event.release.html_url}`);

      return lines.join('\n');
    }

    case 'pull_request': {
      const lines = [];
      lines.push(
        `Build for PR #${gh.event.pull_request.number}: ${gh.event.pull_request.title} (by ${gh.event.pull_request.user.login}) [${gh.event.pull_request.base.ref} ← ${gh.event.pull_request.head.ref}]`,
      );
      lines.push('');
      const prSummary =
        gh.event.pull_request.body && getSummary(gh.event.pull_request.body);
      lines.push(prSummary ? prSummary : '(No description provided)');

      lines.push('');
      const commits = getCommitsBetween(
        gh.event.pull_request.base.sha,
        gh.event.pull_request.head.sha,
      );
      commits.forEach(commit => {
        lines.push(` • [${commit.hash.slice(0, 8)}] ${commit.message}`);
      });

      lines.push('');
      lines.push(`View pull request: ${gh.event.pull_request.html_url}`);
      return lines.join('\n');
    }

    case 'workflow_dispatch': {
      const lines = [];
      const branchName = gh.event.inputs.branch;
      const notes = gh.event.inputs.notes;
      const triggeredBy = gh.event.sender.login;

      if (branchName.startsWith('pr/')) {
        const prNumber = branchName.slice(3);
        const prDetails = await fetchPRDetails(prNumber);
        lines.push(
          `Build for PR #${prNumber}: ${prDetails.title} (PR by ${prDetails.user.login}, build triggered by ${triggeredBy}) [${prDetails.base.ref} ← ${prDetails.head.ref}]`,
        );
        if (notes) {
          lines.push(`Notes: ${notes}`);
        }

        lines.push('');
        const prSummary = prDetails.body && getSummary(prDetails.body);
        lines.push(prSummary ? prSummary : '(No description provided)');

        lines.push('');
        const commits = getCommitsBetween(
          prDetails.base.sha,
          prDetails.head.sha,
        );
        commits.forEach(commit => {
          lines.push(` • [${commit.hash.slice(0, 8)}] ${commit.message}`);
        });

        lines.push('');
        lines.push(`View pull request: ${prDetails.html_url}`);
        return lines.join('\n');
      }

      lines.push(
        `GitHub manual build on "${branchName}", triggered by ${triggeredBy}`,
      );
      if (notes) {
        lines.push(`Notes: ${notes}`);
      }

      const commitHash = executeCommand('git rev-parse HEAD');
      const commitMessage = executeCommand('git log -1 --pretty=%B');
      const commitAuthor = executeCommand('git log -1 --pretty=%an');
      const commitCommitter = executeCommand('git log -1 --pretty=%an');
      lines.push(
        `Last commit: [${commitHash.slice(0, 8)}] ${commitMessage} (${[
          commitAuthor,
          commitCommitter,
        ]
          .filter((value, index, arr) => {
            return arr.indexOf(value) === index;
          })
          .join(', ')})`,
      );

      return lines.join('\n');
    }

    default: {
      const lines = [];
      // gh.ref will be like "refs/heads/main"
      const [, , ...branchNameParts] = gh.ref.split('/');
      const branchName = branchNameParts.join('/');
      if (gh.event_name === 'schedule') {
        lines.push(`Scheduled build on branch "${branchName}"`);
      } else {
        lines.push(`Build on branch "${branchName}"`);
      }
      lines.push('');

      const commitHash = executeCommand('git rev-parse HEAD');
      const commitMessage = executeCommand('git log -1 --pretty=%B');
      const commitAuthor = executeCommand('git log -1 --pretty=%an');
      const commitCommitter = executeCommand('git log -1 --pretty=%an');
      lines.push(
        `Last commit: [${commitHash.slice(0, 8)}] ${commitMessage} (${[
          commitAuthor,
          commitCommitter,
        ]
          .filter((value, index, arr) => {
            return arr.indexOf(value) === index;
          })
          .join(', ')})`,
      );

      return lines.join('\n');
    }
  }
})().then(changelog => {
  const footer = `
---

Inventory

 • GitHub: ${gh.event.repository.html_url}
  `;

  console.log(changelog.trim() + '\n' + footer);
});

function executeCommand(command) {
  const output = execSync(command, { encoding: 'utf-8', cwd: __dirname });
  return output.trim();
}

function getCommitsBetween(startSHA, endSHA) {
  // Get the commits between startSHA and endSHA
  // Here, %H will fetch the commit hash and %s will fetch the commit message.
  const commits = executeCommand(
    `git log --pretty=format:"%H:%s" ${startSHA}..${endSHA}`,
  );

  const commitsArray = commits.split('\n');
  return commitsArray.map(arr => {
    const parts = arr.split(':', 2);
    return {
      hash: parts[0],
      message: parts[1],
    };
  });
}

function getSummary(markdownString) {
  const lines = markdownString
    .trim()
    .split('\n')
    .map(line => line.trim())
    .filter(line => !!line);
  const firstNonTitleLine = lines.find(line => !line.startsWith('#'));

  if (firstNonTitleLine) {
    const hasMoreLines = lines.indexOf(firstNonTitleLine) < lines.length - 1;
    return `${firstNonTitleLine}${hasMoreLines ? ' [...]' : ''}`;
  }

  return '';
}

function markdownToText(markdownString) {
  const lines = markdownString
    .trim()
    .split('\n')
    .map(line => line.trim())
    .map(line => {
      // Remove '#' characters from headings
      line = line.replace(/^#+\s*/, '');

      // Replace '*' bullet points with ' • '
      line = line.replace(/^\*\s+/, ' • ');

      // Remove single inline code backticks (leaving triple backticks intact)
      line = line.replace(/([^`])`([^`]+)`([^`])/g, '$1$2$3');

      // Remove inline bold and italics
      line = line.replace(/[_*]{1,2}(.+?)[_*]{1,2}/g, '$1');

      // Remove inline links, keep link text only
      line = line.replace(/\[(.+?)\]\(.+?\)/g, '$1');

      // Remove inline images, keep alt text only
      line = line.replace(/!\[(.*?)\]\(.+?\)/g, '$1');

      // Remove block quotes markers
      line = line.replace(/^>\s*/, '');

      return line;
    });

  return lines.join('\n').replace(/\n{3,}/g, '\n\n');
}

function fetchPRDetails(prNumber) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: new URL(gh.api_url).hostname,
      path: `/repos/${gh.repository}/pulls/${prNumber}`,
      method: 'GET',
      headers: {
        Authorization: `token ${gh.token}`,
        'User-Agent': 'node/https',
      },
    };

    const req = https.request(options, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        resolve(JSON.parse(data));
      });
    });

    req.on('error', error => {
      reject(error);
    });

    req.end();
  });
}
