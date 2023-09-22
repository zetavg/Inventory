/**
 * generate-changelog-from-github-context.js
 *
 * Usage: node generate-changelog-from-github-context.js "$GITHUB_CONTEXT"
 *        (With env "GITHUB_CONTEXT: ${{ toJSON(github) }}")
 */

const fs = require('fs');
const path = require('path');

// Get the third argument, which should be the JSON string
const githubContextJson = process.argv[2];
// Input branch
const inputBranch = process.argv[3];

const gh = JSON.parse(githubContextJson);

(async () => {
  let prNumber = null;
  if (
    gh.event_name === 'pull_request' ||
    gh.event_name === 'pull_request_target'
  ) {
    prNumber = gh.event.pull_request.number;
  } else if (inputBranch.startsWith('pr/')) {
    prNumber = parseInt(inputBranch.slice(3), 10);
  }

  if (!prNumber || isNaN(prNumber)) {
    return ['' || null];
  }

  const android_build_info = readInfo('android_build_info.json');
  const ios_appstore_upload_info_nightly = readInfo(
    'ios_appstore_upload_info_nightly.json',
  );
  const ios_appstore_upload_info_release = readInfo(
    'ios_appstore_upload_info_release.json',
  );

  const builds = [
    android_build_info &&
      `**Android APK**: Check the [artifacts of this run](${gh.server_url}/${gh.repository}/actions/runs/${gh.run_id}#artifacts) to download it (open it in web browser and scroll to the bottom for the "Artifacts" section).`,
    ios_appstore_upload_info_nightly &&
      `**iOS Nightly**: ${ios_appstore_upload_info_nightly.version} (${ios_appstore_upload_info_nightly.build_number}) has been uploaded to App Store Connect.`,
    ios_appstore_upload_info_release &&
      `**iOS Release**: ${ios_appstore_upload_info_release.version} (${ios_appstore_upload_info_release.build_number}) has been uploaded to App Store Connect.`,
  ].filter(n => !!n);

  if (builds.length <= 0) {
    return ['' || null];
  }

  return [
    [
      `⚒️ A [build](${gh.server_url}/${gh.repository}/actions/runs/${gh.run_id}) has been made for this PR. Check the details below to see how to get it. <details><summary>Details</summary>`,
      '',
      ...builds.map(build => `* ${build}`),
      ...(ios_appstore_upload_info_nightly || ios_appstore_upload_info_release
        ? [
            '',
            '> <small>',
            '> If you are in the Internal Developer group on TestFlight Nightly, the iOS builds should appear on TestFlight in a few minutes.',
            '> If you are not in the in the Internal Developer group and want to try the build, please contact a maintainer to get you set up.',
            '> </small>',
          ]
        : []),
      ...(gh.event_name === 'pull_request' ||
      gh.event_name === 'pull_request_target'
        ? [
            '',
            '**Tip**: Convert this PR to draft to disable these automatic builds.',
          ]
        : []),
      '',
      '</details>',
    ].join('\n'),
    prNumber,
  ];
})().then(([text, prNumber]) => {
  if (text && prNumber !== null) {
    console.log(
      `
pr-comment<<EOF
${text}
EOF
pr-number=${prNumber}
    `.trim(),
    );
  } else {
    console.log('');
  }
});

function readInfo(fileName) {
  try {
    const data = fs.readFileSync(
      path.join(__dirname, '..', '..', '..', fileName),
      'utf8',
    );
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}
