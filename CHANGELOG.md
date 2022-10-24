# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [2.0.2](https://github.com/whazor/redux-observable-thunk/compare/2.0.1...v2.0.2) (2022-10-24)


### Bug Fixes

* bumping versions ([682aae6](https://github.com/whazor/redux-observable-thunk/commit/682aae6821cdbe6c7356edf620b3f0e5a2a10734))

## [2.0.1] - 2022-04-05

Add common js and esm build using tsup.

## [2.0.0-beta.0] - 2021-10-08

Support for rxjs 7.x, does not support 6.x anymore. Breaking change is that thunk requires `action` as input instead of `action.match`.

### Added

- Support for rxjs 7.x, redux-observable 2.0.x
- `filterActions` and `multiMatch` methods, great methods to filter on multiple actions with correct type analysis. Thanks @dykam for help with typescript generics. Works for all actions made by redux-toolkit, including our createThunkActions creator.

### Changed

- **Breaking**: thunk will now take `action` instead of `action.match` as parameter
- Thunk can also take `[action1, action2]` as parameter
- ReturnThunkType now also supports AsyncThunk from redux-toolkit


## [1.0.3] - 2021-03-22

Initial version.

### Added

- createThunkActions for creating a redux-observable thunk actions
- thunk for easy creation of a redux-observable thunk
- ReturnThunkType for retrieving all the optional types of a redux-observable thunk
