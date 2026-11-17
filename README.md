# Etas Development Kit

Reusable packages for Etas agent systems, written in Etas.

EDK builds on the standard library to provide reusable Etas packages. Start
with the algorithm package's graph, search, sorting, and collection helpers.
Package READMEs describe their APIs, with command-level verification recorded
in the test documentation.

Packages use ordinary Etas code and public standard-library facilities. They
follow the same type, effect, and host-permission rules as application code;
installing a package does not grant it access to external services.

Experimental. See [verification status](tests/package-status.md).

## Quickstart

Install the [Etas CLI](https://github.com/etas-project/etas#quickstart), then run
the algorithm package's smoke example. No API keys or network services are needed.

```sh
git clone https://github.com/etas-project/etas-edk.git
cd etas-edk
etas pkg update packages/edk-algorithm
etas check --all packages/edk-algorithm
etas run packages/edk-algorithm
```

`pkg update` resolves the package dependencies, `check --all` checks its targets,
and `run` executes the smoke entry. A successful run returns exit status `0`.
This example exercises pure algorithms without requiring a model provider.

To use EDK in your own application, add the relevant package to `etas.toml`.
Start with its package README rather than copying its internal smoke target.

## Documentation

- [Available packages](packages/README.md)
- [Tests and verification](tests/README.md)

[MIT](LICENSE-MIT) OR [Apache-2.0](LICENSE-APACHE)
