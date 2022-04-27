# 0.6.7 - (2022-01-20)

### Features

- Refresh implementation [#155](https://github.com/ChainSafe/discv5/pull/155)

# 0.6.6 - (2021-11-15)

### Features

- Bound AddrVotes data structure [#152](https://github.com/ChainSafe/discv5/pull/152)
- Add talkresp back [#149](https://github.com/ChainSafe/discv5/pull/149)

# 0.6.5 - (2021-11-04)

### Features

- Convert `broadcastTalkReq` to return promise [#136](https://github.com/ChainSafe/discv5/pull/136)
- Query multiple distance at once in lookups [#143](https://github.com/ChainSafe/discv5/pull/143)
- AddrVotes: Fix timeout map [#144](https://github.com/ChainSafe/discv5/pull/144)
- Cache enr node id [#147](https://github.com/ChainSafe/discv5/pull/147)
- Add lookup count metric [#138](https://github.com/ChainSafe/discv5/pull/138)
- Add findRandomNode method [#137](https://github.com/ChainSafe/discv5/pull/137)

# 0.6.4 - (2021-09-02)

### Chores

- Bump libp2p deps for uint8arrays@3.0.0 [#134](https://github.com/ChainSafe/discv5/pull/134)

# 0.6.3 - (2021-08-04)

### Chores

- Update multiaddr dep  ([611afd](https://github.com/ChainSafe/discv5/commit/611afd))

# 0.6.2 - (2021-07-27)

- Make searchInterval optional, handle infinity case ([079796](https://github.com/ChainSafe/discv5/commit/079796))
- Add metrics ([da78f5](https://github.com/ChainSafe/discv5/commit/da78f5))
- Add search interval to libp2p discovery module ([2e2f62](https://github.com/ChainSafe/discv5/commit/2e2f62))
- Optimize enr getLocationMultiaddr ([babb2a](https://github.com/ChainSafe/discv5/commit/babb2a))
- Optimize createPeerIdFromKeypair ([f534f5](https://github.com/ChainSafe/discv5/commit/f534f5))

# 0.6.1 - (2021-07-23)

### Features

- Add TALKREQ/TALKRESP support ([277c79](https://github.com/ChainSafe/discv5/commit/277c79))

# 0.6.0 - (2021-05-04)

### Chores

- Add strictNullChecks to tsconfig ([7f2d5e](https://github.com/ChainSafe/discv5/commit/7f2d5e))

### BREAKING CHANGES

- new multiaddr used with different API ([f0c70c](https://github.com/ChainSafe/discv5/commit/f0c70c))

# 0.5.1 - (2021-03-29)

### Chores

- Convert stray Uint8Array to Buffer ([4eb0fc](https://github.com/ChainSafe/discv5/commit/4eb0fc))
- Update bcrypto ([c6f08b](https://github.com/ChainSafe/discv5/commit/c6f08b))

# 0.5.0 - (2020-11-19)

### BREAKING CHANGES

- Initial discv5.1 update ([05ba82](https://github.com/ChainSafe/discv5/commit/05ba82))

# 0.4.2 - (2020-09-27)

### Bugfixes

- Fix multiaddr port after decoding ([d81ac3](https://github.com/ChainSafe/discv5/commit/d81ac3))

# 0.4.1 - (2020-09-22)

### Bugfixes

- New multiaddr 0.8.0: use toBytes() instead of toBuffer() ([f16aa1](https://github.com/ChainSafe/discv5/commit/f16aa1))

# 0.4.0 - (2020-09-08)

### Chores

- Update dependencies ([83657a](https://github.com/ChainSafe/discv5/commit/83657a))

### BREAKING CHANGES

- Refactor ENR multiaddr handling ([7cf6c8](https://github.com/ChainSafe/discv5/commit/7cf6c8))

# 0.3.2 - (2020-08-25)

### Bugfixes

- Fix ENR decoding bugs found with fuzzing ([96c9bb](https://github.com/ChainSafe/discv5/commit/96c9bb))

# 0.3.1 - (2020-08-14)

### Features

- Add lookupTimeout configuration ([db6289](https://github.com/ChainSafe/discv5/commit/db6289))

### Bugfixes

- Fix kad lookup bugs in NODES response ([d95ab4](https://github.com/ChainSafe/discv5/commit/d95ab4))

# 0.3.0 - (2020-08-07)

### Features

- Add enrUpdate config field ([62eaa1](https://github.com/ChainSafe/discv5/commit/62eaa1))
- Add IDiscv5Config configurability ([64fe01](https://github.com/ChainSafe/discv5/commit/64fe01))
- Add ENR getters/setters ([7dac2f](https://github.com/ChainSafe/discv5/commit/7dac2f))

### BREAKING CHANGES

- Discv5.create now has a single object param ([64fe01](https://github.com/ChainSafe/discv5/commit/64fe01))

# 0.2.7 - (2020-08-04)

### Features

- Emit to libp2p on "discovered" event ([dd76a9](https://github.com/ChainSafe/discv5/commit/dd76a9))

# 0.2.6 - (2020-08-03)

### Bugfixes

- Fix IPv4-as-IPv6 handling ([d8d0d1](https://github.com/ChainSafe/discv5/commit/d8d0d1))
- Fix ethemeral pubkey encoding ([a774fc](https://github.com/ChainSafe/discv5/commit/a774fc))

# 0.2.5 - (2020-07-06)

### Bugfixes

- Fix libp2p peer event ([489b89](https://github.com/ChainSafe/discv5/commit/489b89))

# 0.2.4 - (2020-06-24)

### Chores

- Add build to prepublishOnly script ([23f1c7](https://github.com/ChainSafe/discv5/commit/23f1c7))

# 0.2.3 - (2020-06-24) INVALID/DEPRECATED

### Bugfixes

- Add validations to ENR verification ([f5c53f](https://github.com/ChainSafe/discv5/commit/f5c53f))

## [0.7.0](https://github.com/ChainSafe/discv5/compare/v0.7.0...v0.7.0) (2022-04-27)


### ⚠ BREAKING CHANGES

* * Transport interface, debug log enabler, enr in talkreq/talkresp
* new multiaddr used with different API
* emitted peer event now emits a peer data object with id and multiaddrs instead of a peer-info

### Features

* configurable transport service and remote enr ([#169](https://github.com/ChainSafe/discv5/issues/169)) ([72aaa0b](https://github.com/ChainSafe/discv5/commit/72aaa0b46967cfa8cea1d4d76bebf96116440934))


### Bug Fixes

* add toNewUint8Array when decoding enr values ([65a1828](https://github.com/ChainSafe/discv5/commit/65a1828b3ad65255a4f7881ef6ae56630cd1830b))
* AddrVotes.best ([a3f2769](https://github.com/ChainSafe/discv5/commit/a3f2769d2c1bdad430a16a75b99ec02a96484290))
* decode message and add a test ([d64cee4](https://github.com/ChainSafe/discv5/commit/d64cee42001205340c8fa761a03cf12b8071cd86))
* decodeFindNode ([ac6c707](https://github.com/ChainSafe/discv5/commit/ac6c7070c6257d02f62f5a27028787b27ac06bd9))


### Miscellaneous

* add github actions and remove travis ([f03c9c0](https://github.com/ChainSafe/discv5/commit/f03c9c004ec4999333b2fff73700dcd169bf7b30))
* address review ([2efdecf](https://github.com/ChainSafe/discv5/commit/2efdecf68680db3d15af10d4ebadd9a4eae37515))
* automatic release ([#170](https://github.com/ChainSafe/discv5/issues/170)) ([88c1f7c](https://github.com/ChainSafe/discv5/commit/88c1f7cc1aca60a3ba4ddbabba5b743d8dbe29a6))
* lint and actions ([3702111](https://github.com/ChainSafe/discv5/commit/37021116767f23f972c44b4c6ace7512becab46a))
* **master:** release 0.7.0 ([#171](https://github.com/ChainSafe/discv5/issues/171)) ([84428d3](https://github.com/ChainSafe/discv5/commit/84428d3a9e34905ace61e9629bcea9d3c34bdff3))
* release 0.7.0 ([ba942e3](https://github.com/ChainSafe/discv5/commit/ba942e351cc00ed622bc3f45f0bc3bd760a94644))
* update dependencies ([d8d8a0a](https://github.com/ChainSafe/discv5/commit/d8d8a0a419b59496fa6b50357d19cc68a4beacc0))
* use ?? instead of || ([87e13d1](https://github.com/ChainSafe/discv5/commit/87e13d1488b2585cc3b092a5a0cc6608b6cf68d8))
* use new peer-discovery interface ([b04c1c6](https://github.com/ChainSafe/discv5/commit/b04c1c6b53471497c7611abfe132fcb63160b612))

## [0.7.0](https://github.com/ChainSafe/discv5/compare/v0.6.7...v0.7.0) (2022-04-27)


### ⚠ BREAKING CHANGES

* * Transport interface, debug log enabler, enr in talkreq/talkresp

### Features

* configurable transport service and remote enr ([#169](https://github.com/ChainSafe/discv5/issues/169)) ([72aaa0b](https://github.com/ChainSafe/discv5/commit/72aaa0b46967cfa8cea1d4d76bebf96116440934))


### Bug Fixes

* add toNewUint8Array when decoding enr values ([65a1828](https://github.com/ChainSafe/discv5/commit/65a1828b3ad65255a4f7881ef6ae56630cd1830b))
* decode message and add a test ([d64cee4](https://github.com/ChainSafe/discv5/commit/d64cee42001205340c8fa761a03cf12b8071cd86))


### Miscellaneous

* automatic release ([#170](https://github.com/ChainSafe/discv5/issues/170)) ([88c1f7c](https://github.com/ChainSafe/discv5/commit/88c1f7cc1aca60a3ba4ddbabba5b743d8dbe29a6))

## 0.2.2 - (2020-05-21)

### Bugfixes

- Fix startup bugs in libp2p compat ([55b2de](https://github.com/ChainSafe/discv5/commit/55b2de))

## 0.2.1 - (2020-05-07)

### Features

- allow enr input as a string ([840573](https://github.com/ChainSafe/discv5/commit/840573))

## 0.2.0 - (2020-04-24)

### Chores

- chore: use new peer-discovery interface ([9950fb](https://github.com/ChainSafe/discv5/commit/9950fb))

### BREAKING CHANGES

BREAKING CHANGE: emitted peer event now emits a peer data object with id and multiaddrs instead of a peer-info

## 0.1.3 - (2020-05-21)

### Bugfixes

- Fix startup bugs in libp2p compat ([ae97fa](https://github.com/ChainSafe/discv5/commit/ae97fa))

## 0.1.2 - (2020-05-07)

- allow enr input as a string ([852129](https://github.com/ChainSafe/discv5/commit/852129))

## 0.1.1 - (2020-04-10)

- add libp2p peer-discovery compatibility module ([1cf660](https://github.com/ChainSafe/discv5/commit/1cf660))

## 0.1.0 - (2020-04-06)

- initial release
