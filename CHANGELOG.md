# Changelog

## [6.0.0](https://github.com/ChainSafe/discv5/compare/v5.1.2...v6.0.0) (2026-03-16)


### ⚠ BREAKING CHANGES

* refresh dependencies ([#324](https://github.com/ChainSafe/discv5/issues/324))
* Convert `buffer` usage to `Uint8Array` ([#306](https://github.com/ChainSafe/discv5/issues/306))
* update libp2p deps ([#295](https://github.com/ChainSafe/discv5/issues/295))
* remove broadcastTalkReq ([#282](https://github.com/ChainSafe/discv5/issues/282))
* update dependencies ([#273](https://github.com/ChainSafe/discv5/issues/273))
* add pluggable enr crypto interface ([#266](https://github.com/ChainSafe/discv5/issues/266))

### Features

* add pluggable enr crypto interface ([#266](https://github.com/ChainSafe/discv5/issues/266)) ([3475758](https://github.com/ChainSafe/discv5/commit/347575898d62443fb83f3cb263cd524b490b6282))
* constrain usage of Buffer in enr package ([#286](https://github.com/ChainSafe/discv5/issues/286)) ([5351f87](https://github.com/ChainSafe/discv5/commit/5351f87ed7cd6cb28524359080fe516be544d1c1))
* Convert `buffer` usage to `Uint8Array` ([#306](https://github.com/ChainSafe/discv5/issues/306)) ([1cdc424](https://github.com/ChainSafe/discv5/commit/1cdc424bca9efa8c260276514460f42b2e2593dd))
* create separate enr package ([#267](https://github.com/ChainSafe/discv5/issues/267)) ([2fa061b](https://github.com/ChainSafe/discv5/commit/2fa061bded9bdc5a2383b02db42cb08f8330ac00))
* **enr:** add quic support ([#293](https://github.com/ChainSafe/discv5/issues/293)) ([31d54c9](https://github.com/ChainSafe/discv5/commit/31d54c92466b4623c871b7eb3e1b41ea7af5e34d))
* refresh dependencies ([#324](https://github.com/ChainSafe/discv5/issues/324)) ([1780af6](https://github.com/ChainSafe/discv5/commit/1780af659a704f9ae83e45e36faafb472f159615))
* remove broadcastTalkReq ([#282](https://github.com/ChainSafe/discv5/issues/282)) ([1b70558](https://github.com/ChainSafe/discv5/commit/1b70558163bd48d7063a227c9816c74fc76247d7))
* replace bcrypto ([#302](https://github.com/ChainSafe/discv5/issues/302)) ([e6af632](https://github.com/ChainSafe/discv5/commit/e6af632b6ee268fb1d6d41395faf1261a4794f1f))
* type safe metric labels ([#278](https://github.com/ChainSafe/discv5/issues/278)) ([acb4792](https://github.com/ChainSafe/discv5/commit/acb479222617f72aae1e9fc35e943eecc5b0ca06))
* update libp2p deps ([#295](https://github.com/ChainSafe/discv5/issues/295)) ([ead057d](https://github.com/ChainSafe/discv5/commit/ead057d4a56b05003f4e683db669f18b84a5e2f7))
* use ethereum-cryptography for enr crypto ([#285](https://github.com/ChainSafe/discv5/issues/285)) ([50cee57](https://github.com/ChainSafe/discv5/commit/50cee57f90a88307463b90c68f4800b6d7cb793f))


### Bug Fixes

* @libp2p/crypto publicKey creation ([#297](https://github.com/ChainSafe/discv5/issues/297)) ([992fc70](https://github.com/ChainSafe/discv5/commit/992fc70d2b91ecc9f0284f124b7035a8adca39b2))
* allow dual stack to use the same port ([#316](https://github.com/ChainSafe/discv5/issues/316)) ([bba43cf](https://github.com/ChainSafe/discv5/commit/bba43cfbe4a2ec2f3643853101febb7ea3d1646e))
* allow IPv4 and IPv6 to bind to the same port in dual-stack mode ([#318](https://github.com/ChainSafe/discv5/issues/318)) ([fe2e35e](https://github.com/ChainSafe/discv5/commit/fe2e35eb629a468c3cc986914e1f000b9b4f8691))
* BigInt conversion bug ([#308](https://github.com/ChainSafe/discv5/issues/308)) ([585eece](https://github.com/ChainSafe/discv5/commit/585eecefb578d53edd2f288f32de18675ea589e5))
* coerce Buffers in bcrypto crypto ([#275](https://github.com/ChainSafe/discv5/issues/275)) ([67971f7](https://github.com/ChainSafe/discv5/commit/67971f727270e7e616e140ea726c67ce889c218f))
* delete the first connected index when remove last node from bucket ([#269](https://github.com/ChainSafe/discv5/issues/269)) ([70ab967](https://github.com/ChainSafe/discv5/commit/70ab96760ea205a60a7529666178e0db4c04baf4))
* **enr:** prevent RangeError crash on malformed ENR port values ([#333](https://github.com/ChainSafe/discv5/issues/333)) ([3ffc7c6](https://github.com/ChainSafe/discv5/commit/3ffc7c6a46fb1fb03ff120a72f225d2fae3c374b))
* fix benchmarking ([#281](https://github.com/ChainSafe/discv5/issues/281)) ([da1461b](https://github.com/ChainSafe/discv5/commit/da1461b4ea586a3bdf084b950c949fc844b67468))
* improve error handling ([#284](https://github.com/ChainSafe/discv5/issues/284)) ([594166c](https://github.com/ChainSafe/discv5/commit/594166c1f82e497cd1c2a630dfa5ba46e93d0990))
* leading zeros stripped from request id ([#312](https://github.com/ChainSafe/discv5/issues/312)) ([c6a8739](https://github.com/ChainSafe/discv5/commit/c6a87395dd7b42cb39ffb68e0c570b63d1a80dab))
* SessionService should send challenge even with active challenge ([#311](https://github.com/ChainSafe/discv5/issues/311)) ([62c1054](https://github.com/ChainSafe/discv5/commit/62c10546174844bc014ed7ead8a184aa39872f3c))
* should not respond to oversized id ([#313](https://github.com/ChainSafe/discv5/issues/313)) ([a9dd2d4](https://github.com/ChainSafe/discv5/commit/a9dd2d4076743c64e78350972aa35ed784790e6c))
* update dependencies ([#273](https://github.com/ChainSafe/discv5/issues/273)) ([f44d428](https://github.com/ChainSafe/discv5/commit/f44d428bdb39cf469d4d22ffef09a0958381a4c3))
* update libp2p crypto ([#287](https://github.com/ChainSafe/discv5/issues/287)) ([d318cac](https://github.com/ChainSafe/discv5/commit/d318cac154c96348fe2e02bbecc668be390114b1))
* update lockfile ([#288](https://github.com/ChainSafe/discv5/issues/288)) ([ae750eb](https://github.com/ChainSafe/discv5/commit/ae750eb394bc5729cd32e4131fd6a0a9f511b8c2))
* use per-family vote pools for dual-stack ENR auto-discovery ([#334](https://github.com/ChainSafe/discv5/issues/334)) ([1198de5](https://github.com/ChainSafe/discv5/commit/1198de540be9e56b7ded6d6954e903ecb4a57d71))
