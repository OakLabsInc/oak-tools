# oak-tools

![npm](https://img.shields.io/npm/v/oak-tools.svg) ![license](https://img.shields.io/npm/l/oak-tools.svg) ![github-issues](https://img.shields.io/github/issues/OakLabsInc/oak-tools.svg)

Helpful utilities for developing oak applications

![nodei.co](https://nodei.co/npm/oak-tools.png?downloads=true&downloadRank=true&stars=true)

![](https://david-dm.org/OakLabsInc/oak-tools/status.svg)
![](https://david-dm.org/OakLabsInc/oak-tools/dev-status.svg)

## Install

`npm install --save oak-tools`

## Scripts

 - **npm run coverage** : `node node_modules/.bin/istanbul cover node_modules/.bin/tape test/*.js || true`
 - **npm run coveralls** : `npm run-script coverage && node node_modules/.bin/coveralls < coverage/lcov.info && rm -rf coverage/ || true`
 - **npm run readme** : `node ./node_modules/.bin/node-readme`
 - **npm run test** : `node_modules/.bin/standard && find test/*.js | xargs -n 1 node | node_modules/.bin/tap-difflet`

## Dependencies

Package | Version | Dev
--- |:---:|:---:
[msgpack5](https://www.npmjs.com/package/msgpack5) | 3.4.1 | ✖
[pino](https://www.npmjs.com/package/pino) | 3.0.5 | ✖
[ws](https://www.npmjs.com/package/ws) | 1.1.1 | ✖
[coveralls](https://www.npmjs.com/package/coveralls) | 2.11.14 | ✔
[istanbul](https://www.npmjs.com/package/istanbul) | 0.4.2 | ✔
[node-readme](https://www.npmjs.com/package/node-readme) | 0.1.9 | ✔
[standard](https://www.npmjs.com/package/standard) | 8.5.0 | ✔
[tap-difflet](https://www.npmjs.com/package/tap-difflet) | 0.4.0 | ✔
[tape](https://www.npmjs.com/package/tape) | 4.6.0 | ✔


## Contributing

Contributions welcome; Please submit all pull requests against the master branch. If your pull request contains JavaScript patches or features, you should include relevant unit tests. Thanks!

## Authors

 - [Flynn Joffray](http://github.com/nucleardreamer) - <nucleardreamer@gmail.com>
 - [Nir Ziv](http://github.com/nirziv) - <nir@oaklabs.is>

## License

 - **MIT** : http://opensource.org/licenses/MIT
