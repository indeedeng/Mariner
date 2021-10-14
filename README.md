# Mariner

![OSS Lifecycle](https://img.shields.io/osslifecycle/indeedeng/Mariner.svg)
![GitHub version](https://img.shields.io/github/v/release/indeedeng/Mariner?color=informational)

## Introduction

A node.js library for analyzing open source library dependencies.

Mariner's goal is to help you to support the open source projects you rely upon by making it easy to get a list of the open issues in your dependencies.

Mariner takes an input list of GitHub repos, fetches details about them from GitHub,
and outputs a file containing a list of issues for each project.

NOTE: This library is in the experimental stage, so expect breaking changes
even if the version number does not indicate that.

### REST vs. GraphQL

The first couple alpha versions of Mariner only supported calls via GitHub's REST API. More
recently, we added the ability to invoke GitHub's GraphQL API. The GraphQL API is hundreds of
times faster, so the REST-related calls are now deprecated, and will be removed "soon". The
GraphQL approach is shown in the `runExample.ts` example.

## Getting Started Using Mariner

If you just want to USE Mariner, you don't need to do a git clone.
Instead, you'll create your own new node project, and install the oss-mariner package via npm:
`npm install oss-mariner`
You'll also need a GitHub token and a config file. (Keep reading for more info on these.)

### Step-by-step instructions for creating a project that uses Mariner

1. Create a new project folder and use `npm init` to make it a node project.
1. Copy the contents of `runExample.ts` into `index.js`.
    - <https://github.com/indeedeng/Mariner/blob/master/examples/runExample.ts>
1. In `index.js` comment out the existing line that imports mariner.
1. Also in `index.js`, uncomment the line saying how mariner would normally be imported.
1. Next, create a folder named `examples` and create two new files inside of it: `exampleData.json` and `config.json`. You can copy the contents of our examples into those new files or you can use the examples as a template for your own data and config choices. The `exampleData.json` should contain the repos that you're interested in getting issues from. For more info on the format of this file, look at[the Input File Format section](https://github.com/indeedeng/Mariner#input-file-format). More info on config.json can also be found [below](https://github.com/indeedeng/Mariner/blob/master/README.md#config.json-format) and the example files can be found here:
    - <https://github.com/indeedeng/Mariner/blob/master/examples/exampleData.json>
    - <https://github.com/indeedeng/Mariner/blob/master/examples/config.json>
1. Mariner supports TypeScript, but we don't have step-by-step instructions for the TypeScript example.
   For now, you can convert the runExample.ts example code to JavaScript:
    - Remove the `public` keywords from class members.
    - Remove the `implements Xxxx` from the FancyLogger class declaration.
    - Remove all the type declarations (like `: string`).
1. Run `npm install oss-mariner`
1. Add `"type": "module"` to `package.json` to allow using "import" rather than "require".
1. Get a GitHub token. [See instructions here](https://github.com/indeedeng/Mariner#token)
1. Store your GitHub token in your system's environment by running `export MARINER_GITHUB_TOKEN={Insert your GitHub token here}`. You will either have to do this once each time you restart your system, or else configure your system to do so automatically.  
1. Finally, run the application to find open issues in your dependencies, using the command `node index.js`.

### Optional: Generating Markdown

- You can generate markdown for use in Confluence/jira
- The generateConfluenceMarkdown() creates the markdown based on two parameters: `maxIssuesAge` and `issuesByDependency`
- `maxIssueAge` defaults to 30 days, anything over 30 days won't get written, You can edit this number.
- Square brackets and curly braces in issue titles will be replaced by parentheses.
- You can see an example of how to use in the `runExample.ts` file.
Example of confluenceMarkdown.md output:

```md
## Updated: February 22, 2021, 5:38 PM PST


h3. babel/babel
||*Title*||*Age*||
|[all the core-js imports are removed|https://github.com/babel/babel/issues/12545]|62&nbsp;days|


h3. facebook/jest
||*Title*||*Age*||
|[Lost of context between tests when using dynamic ESM import|https://github.com/facebook/jest/issues/10944]|72&nbsp;days|
```

- The `runExample.ts` example now demonstrates how to call this new function
  - <https://github.com/indeedeng/Mariner/blob/master/examples/runExample.ts>

### Config.json Format

You can use our example config options as written, or customize the fields if you choose.

- Every GitHub issue can have one or more labels attached to it. `labelsToSearch` is an array of the labels you'd like Mariner to search for in the issues it will return. The defaults in our example are ones that will make it easy for someone to make a first contribution to a repo.
- Make sure that your `inputFilePath` is accurate. If you followed the steps above and put `exampleData.json` into a top-level folder called `examples`, you won't have to change the value of this variable.
- `outputFilePath` is the place you'd like the results written to
- `daysAgoCreated` is for deciding how fresh you want the issues to be. If you only want issues that were created in the last week, then choose 7, for example.
- `numberOfReposPerCall`: we recommend not changing this number. Unless you're getting an error from GitHub that your query string is too long, in which case try a smaller number.

### Input File Format

The input file is a JSON file in the format:

- At the top level is a map/object, where each entry consists of a dependency as the key,
    and the number of projects that depend on that library as the value.
- Each dependency can be identified by a complete URL or just the owner/repo string.
- Example complete url: "https://api.github.com/repos/spring-projects/spring-framework": 19805,
- Example owner/repo strings: "square/retrofit": 5023,
- The project count value is mostly ignored, but is used by the "abbreviated" feature.
- See examples/exampleData.json for a complete example.

### Output File Format

The output file is a JSON file in the format:

```javascript
{
  "repository/name": [
    {
      "title": "Issue Title 1",
      "createdAt": "2020-10-16T01:07:36Z",
      "repositoryNameWithOwner": "repository/name",
      "url": "https://github.com/repository/name/issues/65",
      "updatedAt": "2020-10-16T01:07:36Z",
      "labels": [
        "Hacktoberfest",
        "good first issue"
      ]
    },
    {
      "title": "Issue Title 2",
      "createdAt": "2020-10-12T22:37:17Z",
      "repositoryNameWithOwner": "repository/name",
      "url": "https://github.com/repository/name/issues/58",
      "updatedAt": "2020-10-12T22:37:17Z",
      "labels": [
        "Hacktoberfest",
        "good first issue"
      ]
    }
  ],
  "respository/second_name": [
    {
      "title": "Issue 102",
      "createdAt": "2020-10-03T13:16:58Z",
      "repositoryNameWithOwner": "respository/second_name",
      "url": "https://github.com/respository/second_name/issues/12137",
      "updatedAt": "2020-10-03T13:16:58Z",
      "labels": [
        "claimed",
        "good first issue",
        "i: enhancement"
      ]
    }
  ],
}
```

Please note that only the first 100 labels per issue will be fetched. If a single issue has over 100 labels, these will be excluded without any errors or warnings.

## Token

To run Mariner, you must create a token. The GitHub token must be a valid personal access token.
It does not require any permissions beyond the default, so when you create it you can leave all
the boxes unchecked. Be careful not to share your token with anyone. If it gets exposed, revoke
it and create a replacement.
See <https://github.com/settings/tokens/new> for how to create a token.

### More details (possibly outdated)

Mariner can be called from Javascript or from Typescript. You can see an example here:
<https://github.com/indeedeng/Mariner/blob/master/examples/runOldCode.ts>

Mariner is in transition from the old way of accessing GitHub data (REST) to the new way (GraphQL)

To invoke mariner using the new GraphQL code, Invoke the finder(), passing the
appropiate parameters in finder.findIssues() you can see an example here:
<https://github.com/indeedeng/Mariner/blob/master/examples/runExample.ts>

If you are using the `examples/runOldCode.ts file`, (using the old REST code that is very slow)
invoke the DependencyDetailsRetriever.run() method, passing appropriate parameters. Please
see the [examples/runOldCode.ts](https://github.com/indeedeng/Mariner/blob/master/examples/runOldCode.ts) file
for more information.

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

Follow the instructions in examples/runExample.ts or examples/runOldCode.ts to configure the input and output files. NOTE: An example input file is included, in the examples directory.

Run `nvm use` to use the appropiate version of Node specified in the .nvmrc file.

Run `npm run build` to compile the code to Javascript.

Run `node dist/examples/runExample.js` (to use GraphQL) or `node dist/examples/runOldCode.ts` (to use REST calls), to run the example program. It requires internet access, since it calls the GitHub API. It will take a couple minutes to complete. Some of the output includes the word "ERROR", so don't panic.

Ensure to lint your code by running `npm run lint` before submitting any code for review. Either manually fix the errors or run `npm run lint:fix` to automatically fix any errors.

Husky is set up to run linting checks pre-commit which should prevent being able to commit linting errors; however, There is a [bug](https://github.com/typicode/husky/issues/639) in husky where occasionally the hooks won't run in an IDE.

## Local testing of the npm packaging

You should have local copies of both the oss-mariner project and the project that will include it.
In the oss-mariner project, run `npm link`. This will "publish" oss-mariner locally on your
computer. Then in the other project, run `npm link oss-mariner`.
This will replace the public npm version of oss-mariner with your local copy.
To undo run `npm unlink --no-save oss-mariner>` on your project’s directory to remove the local symlink.
To remove global symlink go to oss-mariner project and run `npm unlink`

## Project Maintainers

The [Open Source team at Indeed](https://opensource.indeedeng.io/), who can be reached at opensource@indeed.com.

## How to Publish

If you are a maintainer, you can follow these steps to publish a new version of the package:

1. Create a branch named "publish-x.y.z (x.y.z will be the version number)
1. Update the version number in package.json
1. Run `nvm use` to use the appropiate version of Node specified in the .nvmrc file
1. Run `npm install` to update package-lock.json
    - Search package-lock.json to be sure there are no references to 'nexus'
    - Make sure package-lock.json has the new version number
1. Run `npm run lint`, then run `npm test`, then run `npm run build` to make sure there are no errors
1. Commit and push the changes, create a PR, have it approved, and merge it into the main branch
1. Switch to main branch and pull the new changes
1. Login to npm if you haven’t already: `npm login`
1. Do a dry run to make sure the package looks good: `npm publish --dry-run`
1. Publish: `npm publish`
1. Verify that the new version appears at: <https://www.npmjs.com/package/oss-mariner>
1. Create a new GitHub release:
    1. On the project homepage, click on `Releases`
    1. Click the `Draft a new release` button
    1. Enter a release title like `v2.1.3`
    1. In the description list the major changes
    1. Click the `Publish release` button

## Code of Conduct

This project is governed by the [Contributor Covenant v 1.4.1](CODE_OF_CONDUCT.md).

## License

This project uses the [Apache 2.0](LICENSE) license.
