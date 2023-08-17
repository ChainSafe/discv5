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
- Fix ephemeral pubkey encoding ([a774fc](https://github.com/ChainSafe/discv5/commit/a774fc))

# 0.2.5 - (2020-07-06)

### Bugfixes

- Fix libp2p peer event ([489b89](https://github.com/ChainSafe/discv5/commit/489b89))

# 0.2.4 - (2020-06-24)

### Chores

- Add build to prepublishOnly script ([23f1c7](https://github.com/ChainSafe/discv5/commit/23f1c7))

# 0.2.3 - (2020-06-24) INVALID/DEPRECATED

### Bugfixes

- Add validations to ENR verification ([f5c53f](https://github.com/ChainSafe/discv5/commit/f5c53f))

## [5.1.1](https://github.com/ChainSafe/discv5/compare/v5.1.0...v5.1.1) (2023-08-17)


### Miscellaneous

* update release ci node version ([#260](https://github.com/ChainSafe/discv5/issues/260)) ([b64d064](https://github.com/ChainSafe/discv5/commit/b64d064d34a04bc2e8e9037bbed60a528f6dd2ac))

## [5.1.0](https://github.com/ChainSafe/discv5/compare/v5.0.1...v5.1.0) (2023-08-17)


### Features

* Add `util` to package exports ([#256](https://github.com/ChainSafe/discv5/issues/256)) ([9d10108](https://github.com/ChainSafe/discv5/commit/9d101087f93a7a123a4745792d005a2c226626c6))


### Miscellaneous

* update deps ([#258](https://github.com/ChainSafe/discv5/issues/258)) ([d3f75d5](https://github.com/ChainSafe/discv5/commit/d3f75d53714abb0265aad316fb338d1c459a454e))

## [5.0.1](https://github.com/ChainSafe/discv5/compare/v5.0.0...v5.0.1) (2023-08-10)


### Bug Fixes

* Add lru-cache to deps ([#253](https://github.com/ChainSafe/discv5/issues/253)) ([768199e](https://github.com/ChainSafe/discv5/commit/768199e712b57980edb0e3290207de2ea6caea1a))

## [5.0.0](https://github.com/ChainSafe/discv5/compare/v4.0.0...v5.0.0) (2023-07-11)


### ⚠ BREAKING CHANGES

* add IPv6 support ([#245](https://github.com/ChainSafe/discv5/issues/245))

### Features

* add IPv6 support ([#245](https://github.com/ChainSafe/discv5/issues/245)) ([4ccc10f](https://github.com/ChainSafe/discv5/commit/4ccc10ffdefe07577b52a2494d713cec348145d8))

## [4.0.0](https://github.com/ChainSafe/discv5/compare/v3.0.0...v4.0.0) (2023-05-17)


### ⚠ BREAKING CHANGES

* update deps ([#248](https://github.com/ChainSafe/discv5/issues/248))

### Miscellaneous

* update deps ([#248](https://github.com/ChainSafe/discv5/issues/248)) ([542ef33](https://github.com/ChainSafe/discv5/commit/542ef334be77b88f989fc09e02ddaaf3fc2fc0d8))

## [3.0.0](https://github.com/ChainSafe/discv5/compare/v2.1.1...v3.0.0) (2023-01-28)


### ⚠ BREAKING CHANGES

* refactor ENR ([#241](https://github.com/ChainSafe/discv5/issues/241))

### Features

* refactor ENR ([#241](https://github.com/ChainSafe/discv5/issues/241)) ([3ec067d](https://github.com/ChainSafe/discv5/commit/3ec067d978b9aa1512d3ca142fb9cfe4c9e89cec))

## [2.1.1](https://github.com/ChainSafe/discv5/compare/v2.1.0...v2.1.1) (2023-01-25)


### Bug Fixes

* delete signature on enr.delete ([#238](https://github.com/ChainSafe/discv5/issues/238)) ([3c30fc8](https://github.com/ChainSafe/discv5/commit/3c30fc83b293869f0f350ac6bc5b471a084d9566))

## [2.1.0](https://github.com/ChainSafe/discv5/compare/v2.0.0...v2.1.0) (2023-01-20)


### Features

* update peer-id dependencies ([#234](https://github.com/ChainSafe/discv5/issues/234)) ([7cb42a8](https://github.com/ChainSafe/discv5/commit/7cb42a8a63f2d298cab3650b7e89be0993739b8b))

## [2.0.0](https://github.com/ChainSafe/discv5/compare/v1.5.0...v2.0.0) (2023-01-14)


### ⚠ BREAKING CHANGES

* switch to metrics generator pattern ([#233](https://github.com/ChainSafe/discv5/issues/233))

### Features

* switch to metrics generator pattern ([#233](https://github.com/ChainSafe/discv5/issues/233)) ([1751192](https://github.com/ChainSafe/discv5/commit/1751192e32ffde419947504d4beb7fd626f808e2))


### Bug Fixes

* ensure our enr has signature in INodesMessage response ([#229](https://github.com/ChainSafe/discv5/issues/229)) ([71a917f](https://github.com/ChainSafe/discv5/commit/71a917f2d505d93c1c24044c820810cc9349ea1f))

## [1.5.0](https://github.com/ChainSafe/discv5/compare/v1.4.0...v1.5.0) (2022-11-29)


### Features

* expose find node and ping ([#226](https://github.com/ChainSafe/discv5/issues/226)) ([57fdbcc](https://github.com/ChainSafe/discv5/commit/57fdbcc81d87ef63c9f13e7cb7886c32f4616188))

## [1.4.0](https://github.com/ChainSafe/discv5/compare/v1.3.1...v1.4.0) (2022-11-08)


### Features

* drop is-ip by representing IPs internally as octets ([#214](https://github.com/ChainSafe/discv5/issues/214)) ([6c43151](https://github.com/ChainSafe/discv5/commit/6c431511cf41678e16bb796358f4630edbe457cf))

## [1.3.1](https://github.com/ChainSafe/discv5/compare/v1.3.0...v1.3.1) (2022-11-03)


### Bug Fixes

* revert limit to nodes response ([#222](https://github.com/ChainSafe/discv5/issues/222)) ([a628308](https://github.com/ChainSafe/discv5/commit/a6283082e069c0afac0e06cd7eb26e6b17ee5310))

## [1.3.0](https://github.com/ChainSafe/discv5/compare/v1.2.1...v1.3.0) (2022-11-02)


### Features

* limit nodes response to 16 packets ([#219](https://github.com/ChainSafe/discv5/issues/219)) ([6fdc96d](https://github.com/ChainSafe/discv5/commit/6fdc96de9418792e0920a9a5b4b53512e3b61183))


### Bug Fixes

* throw error when encoding/decoding PONG with invalid port ([#218](https://github.com/ChainSafe/discv5/issues/218)) ([cfc3c3c](https://github.com/ChainSafe/discv5/commit/cfc3c3cdae7a4672c8bb4b3990fd7963fea04c13))

## [1.2.1](https://github.com/ChainSafe/discv5/compare/v1.2.0...v1.2.1) (2022-11-02)


### Bug Fixes

* add more checks to handleFindNode ([#216](https://github.com/ChainSafe/discv5/issues/216)) ([b8a09bf](https://github.com/ChainSafe/discv5/commit/b8a09bf5e23ca66a9cfb496520a3955684be6be4))
* miscellaneous typos ([#215](https://github.com/ChainSafe/discv5/issues/215)) ([0a1c2b4](https://github.com/ChainSafe/discv5/commit/0a1c2b443520392dad15eea698b7481a3f5fd0c4))

## [1.2.0](https://github.com/ChainSafe/discv5/compare/v1.1.2...v1.2.0) (2022-10-28)


### Features

* Add IP based rate limiting ([#206](https://github.com/ChainSafe/discv5/issues/206)) ([122adbf](https://github.com/ChainSafe/discv5/commit/122adbf00734ab03bba7bc47abafafc69ca1ef23))


### Miscellaneous

* Commit package-lock for deterministic CI ([#208](https://github.com/ChainSafe/discv5/issues/208)) ([2c90b5e](https://github.com/ChainSafe/discv5/commit/2c90b5e3a9146d98489597eef0e71280269aef92))
* disable validateSingleCommit ([#213](https://github.com/ChainSafe/discv5/issues/213)) ([43a87ca](https://github.com/ChainSafe/discv5/commit/43a87ca01616d08c3549b630c7cd9e0a5f3f8a21))
* migrate to is-ip 4.0.0 ([#211](https://github.com/ChainSafe/discv5/issues/211)) ([e2cf4ac](https://github.com/ChainSafe/discv5/commit/e2cf4ac475c42c93fd7020715b16fc5b1fcc854c))
* remove breaking change introduced in [#206](https://github.com/ChainSafe/discv5/issues/206) ([#212](https://github.com/ChainSafe/discv5/issues/212)) ([7a95ca6](https://github.com/ChainSafe/discv5/commit/7a95ca6c500188c779cb05af77040ac42fc66490))

## [1.1.2](https://github.com/ChainSafe/discv5/compare/v1.1.1...v1.1.2) (2022-09-27)


### Miscellaneous

* bump multiaddr dependency to ^11.0.0 ([#203](https://github.com/ChainSafe/discv5/issues/203)) ([62fe0e2](https://github.com/ChainSafe/discv5/commit/62fe0e2b34b10971189869e77de785e6c8193e10))

## [1.1.1](https://github.com/ChainSafe/discv5/compare/v1.1.0...v1.1.1) (2022-06-29)


### Bug Fixes

* use ^ with @libp2p/interfaces dep ([#195](https://github.com/ChainSafe/discv5/issues/195)) ([67338bb](https://github.com/ChainSafe/discv5/commit/67338bb833f723e30bdcc24fe4c6ab2f70949c10))

## [1.1.0](https://github.com/ChainSafe/discv5/compare/v1.0.2...v1.1.0) (2022-06-26)


### Features

* Add `packet` to package.json `exports ([#192](https://github.com/ChainSafe/discv5/issues/192)) ([c4e7c33](https://github.com/ChainSafe/discv5/commit/c4e7c33f119dfde62a81dfca878195bb5cb2a726))

## [1.0.2](https://github.com/ChainSafe/discv5/compare/v1.0.1...v1.0.2) (2022-06-15)


### Miscellaneous

* update libp2p dependencies ([#190](https://github.com/ChainSafe/discv5/issues/190)) ([08f0aca](https://github.com/ChainSafe/discv5/commit/08f0aca77cac8a860633b30c2f86c64bd24bc75a))

## [1.0.1](https://github.com/ChainSafe/discv5/compare/v1.0.0...v1.0.1) (2022-06-14)


### Miscellaneous

* update libp2p dependencies ([#188](https://github.com/ChainSafe/discv5/issues/188)) ([8d79b87](https://github.com/ChainSafe/discv5/commit/8d79b873b4bd55a0c46251d64a5a12cb177f9bff))

## [1.0.0](https://github.com/ChainSafe/discv5/compare/v0.8.1...v1.0.0) (2022-06-09)


### ⚠ BREAKING CHANGES

* convert to esm only (#184)

### Features

* convert to esm only ([#184](https://github.com/ChainSafe/discv5/issues/184)) ([119f1eb](https://github.com/ChainSafe/discv5/commit/119f1ebd16701ef216afcf96e11fb402151b7695))


### Miscellaneous

* update release ci for 1.0 ([#187](https://github.com/ChainSafe/discv5/issues/187)) ([c9ac749](https://github.com/ChainSafe/discv5/commit/c9ac7499bed96a2ab3aa6e48c62ab7b4f0c628c1))

### [0.8.1](https://github.com/ChainSafe/discv5/compare/v0.8.0...v0.8.1) (2022-05-31)


### Bug Fixes

* Remove p2p portions of multiaddr in `nodeAddressToString` ([#182](https://github.com/ChainSafe/discv5/issues/182)) ([72cd0f5](https://github.com/ChainSafe/discv5/commit/72cd0f5372f2a49599783b495e43fec8fe0e6ade))

## [0.8.0](https://github.com/ChainSafe/discv5/compare/v0.7.1...v0.8.0) (2022-05-25)


### Features

* all unverified inbound sessions ([#180](https://github.com/ChainSafe/discv5/issues/180)) ([f2cc802](https://github.com/ChainSafe/discv5/commit/f2cc802fd7fb65c5fddfa4d375f9ac58b2af13f9))

### [0.7.1](https://github.com/ChainSafe/discv5/compare/v0.7.0...v0.7.1) (2022-05-12)


### Bug Fixes

* A more robust check for rinfo.family  ([#178](https://github.com/ChainSafe/discv5/issues/178)) ([7331fbc](https://github.com/ChainSafe/discv5/commit/7331fbcb81c998cdebe4e540b64d6a8c9f3c7ef3))


### Miscellaneous

* Bump peer-id dep to latest ([#174](https://github.com/ChainSafe/discv5/issues/174)) ([27bdd26](https://github.com/ChainSafe/discv5/commit/27bdd26b371d3d8c8e7e7bc442f53a27db20ba8e))

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
