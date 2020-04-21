# Mariner

![OSS Lifecycle](https://img.shields.io/osslifecycle/indeedeng/Mariner.svg)

A node.js library for analyzing open source library dependencies.

Mariner takes an input list of dependencies, fetches details about them from GitHub, 
and outputs a file containing funding information for each project owner, and a list 
of issues for each project.

## Getting Started

Run ```npm ci``` to install the libraries used in the project. Read more about [npm ci here.](https://blog.npmjs.org/post/171556855892/introducing-npm-ci-for-faster-more-reliable)

## Getting Help

The [Open Source team at Indeed](https://opensource.indeedeng.io/), who can be reached at opensource@indeed.com. 

## How To Contribute

Read the Code of Conduct and Contact the Maintainers before making any changes or a PR. 
If an issue doesn’t already exist that describes the change you want to make, we recommend 
creating one. If an issue does exist, please comment on it saying that you are starting to 
work on it, to avoid duplicating effort. 

## Project Maintainers

The [Open Source team at Indeed](https://opensource.indeedeng.io/), who can be reached at opensource@indeed.com.

## How to Publish

1. If you are a maintainer, you can follow these steps to publish a new version of the package:
1. Be sure the version number in package.json is correct
1. Login to npm if you haven’t already: npm login
1. Do a dry run to make sure the package looks good: npm publish --dry-run
1. Publish: npm publish
1. Verify: https://www.npmjs.com/package/oss-mariner

## Code of Conduct
This project is governed by the [Contributor Covenant v 1.4.1](CODE_OF_CONDUCT.md). 

## License
This project uses the [Apache 2.0](LICENSE) license.
