# repattern Specification

Specification of an embeddable DSL for building JavaScript RegExp from declarative Scheme objects.

## Abstract

The repattern specification is an [embeddable DSL](https://en.wikipedia.org/wiki/Domain-specific_language) for building JavaScript regular expressions from declarative [`Scheme`](./src/content/spec/current/en.md#21-scheme) objects, which are converted into `RegExp` instances.

Schemes are a human-readable format for describing patterns, as an alternative to writing regular expressions by hand.

## License

- **Specification** (`src/content/spec/`) — [CC BY-SA 4.0](LICENSE-SPEC)
- **Website source code** — [MIT](LICENSE)