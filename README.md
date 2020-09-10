# Mariner

![OSS Lifecycle](https://img.shields.io/osslifecycle/indeedeng/Mariner.svg)

A node.js library for analyzing open source library dependencies.

Mariner takes an input list of dependencies, fetches details about them from GitHub,
and outputs a file containing funding information for each project owner, and a list
of issues for each project.

NOTE: This library is in the experimental stage, so expect breaking changes
even if the version number does not indicate that.

## Getting Started Using Mariner

If you just want to USE Mariner, you don't need to do a git clone.
Instead, create your own new node project, and install the oss-mariner package via npm:
`npm install oss-mariner`

Mariner can be called from Javascript or from Typescript. You can see an example here:
https://github.com/indeedeng/Mariner/blob/master/src/indexExample.ts

In your code, invoke the DependencyDetailsRetriever.run() method, passing appropriate parameters:

```
const ddr = new DependencyDetailsRetriever();
const githubToken = Process.env.GITHUB_TOKEN;   // from an environment variable
const inputFilePath = '<full path to your input file>';
const outputFilePath = '<full path to the file that ddr should create>';
const abbreviated = false;  // OPTIONAL; default is false; true will exclude some dependencies
ddr.run(githubToken, inputFilePath, outputFilePath, abbreviated);

```

The GitHub token must be a valid personal access token. It does not require any permissions beyond
the default, so when you create it you can leave all the boxes unchecked. Be careful not to
share your token with anyone. If it gets exposed, revoke it and create a replacement.
See https://github.com/settings/tokens/new for how to create a token.

The input file is a JSON file in the format:

-   At the top level is a map/object, where each entry consists of a dependency URL as the key,
    and the number of projects that depend on that library as the value.
-   Example: "https://api.github.com/repos/spring-projects/spring-framework": 19805,
-   The project count value is mostly ignored, but is used by the "abbreviated" feature.
-   See exampleData/mini.json for a complete example.

The output file is a JSON file in the format:

-   (We'll add a definition of the format later.
    For now, you can look at exampleData/analysisOutputRaw.json after running the app)

We don't recommend using the `abbreviated` feature.
It will omit entries that have fewer than a hard-coded number of projects that depend on them.

## Getting Help

The [Open Source team at Indeed](https://opensource.indeedeng.io/), who can be reached at opensource@indeed.com.

## How To Contribute

Read the Code of Conduct and Contact the Maintainers before making any changes or a PR.
If an issue doesn’t already exist that describes the change you want to make, we recommend
creating one. If an issue does exist, please comment on it saying that you are starting to
work on it, to avoid duplicating effort.

## Getting Started Developing Mariner

Clone the repository from GitHub.

Run `npm ci` to install the libraries used in the project. Read more about [npm ci here.](https://blog.npmjs.org/post/171556855892/introducing-npm-ci-for-faster-more-reliable)

Follow the instructions in indexExample.ts to configure the input and output files.
NOTE that an example input file is included, in the exampleData directory.

Run `npm run build` to compile the code to Javascript.

Run `node dist/indexExample.js` to run the example program. It requires internet access,
since it calls the GitHub API. It will take a couple minutes to complete.
Some of the output includes the word "ERROR", so don't panic.

## Local testing of the npm packaging

You should have local copies of both the oss-mariner project and the project that will include it.
In the oss-mariner project, run `npm link`. This will "publish" oss-mariner locally on your
computer. Then in the other project, run `npm link oss-mariner`.
This will replace the public npm version of oss-mariner with your local copy.

## Project Maintainers

The [Open Source team at Indeed](https://opensource.indeedeng.io/), who can be reached at opensource@indeed.com.

## How to Publish

If you are a maintainer, you can follow these steps to publish a new version of the package:

1. Be sure the version number in package.json is correct
1. Run `npm install` to update package-lock.json
1. Run `npm run build` and `npm run lint` to make sure there are no errors
1. Submit and merge a PR to bump the version number
1. Login to npm if you haven’t already: `npm login`
1. Do a dry run to make sure the package looks good: `npm publish --dry-run`
1. Publish: `npm publish`
1. Verify: https://www.npmjs.com/package/oss-mariner

## Code of Conduct

This project is governed by the [Contributor Covenant v 1.4.1](CODE_OF_CONDUCT.md).

## License

This project uses the [Apache 2.0](LICENSE) license.
