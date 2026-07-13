---
title: 'repattern Specification 1.0.0-beta.0'
description: 'Specification of an embedded DSL for building JavaScript RegExp from declarative schemas.'
locale: en
version: 'current'
draft: false
---

# repattern Specification 1.0.0-beta.0

Specification of an embedded DSL for building JavaScript RegExp from declarative schemas.

**Languages:** [Russian](/ru/)

**Contribute:** GitHub [teplostanski/repattern-spec](https://github.com/teplostanski/repattern-spec) ([new issue](https://github.com/teplostanski/repattern-spec/issues/new), [open issues](https://github.com/teplostanski/repattern-spec/issues))

<!--**Versions:** draft (this page), [current](/), [1.0.0-beta](/1.0.0-beta/)-->

## Abstract

The repattern specification defines an [embedded DSL](https://en.wikipedia.org/wiki/Domain-specific_language) for building JavaScript regular expressions from declarative [`Schema`](#21-schema) objects that are converted into `RegExp` instances.

<!--The specification defines the `createRegExp` and `sanitizeSchema` tools for working with schemas, as well as the structure of the schemas themselves. -->

Schemas provide a human-readable way to describe patterns, as an alternative to writing regular expressions manually.

> [!NOTE]
> To use this specification effectively, you should be familiar with regular expression terminology and how regular expressions work, since schemas express the same concepts in a declarative form.

## Table of Contents

1. [Terms](#1-terms)
   1. [Schema](#11-schema)
   2. [Atom](#12-atom)
   3. [Sequencer](#13-sequencer)
   4. [Atom-sequencer](#14-atom-sequencer)
   5. [Params object `params`](#15-params-object-params)
2. [Types](#2-types)
   1. [`Schema`](#21-schema)
   2. [`Atom`](#22-atom)
   3. [`AtomSequencer`](#23-atomsequencer)
   4. [`Params`](#24-params)
3. [Atom-sequencers](#3-atom-sequencers)
   1. [_Quantifiers_](#31-quantifiers)
      1. [`repeat`](#311-repeat)
      2. [`zeroOrMore`](#312-zeroormore)
      3. [`maybe`](#313-maybe)
   2. [_Group_](#32-group)
      1. [`grouped`](#321-grouped)
   3. [_Alternation_](#33-alternation)
      1. [`anyOf`](#331-anyof)
4. [Atoms](#4-atoms)
   1. [_Anchors_](#41-anchors)
      1. [`lineStart`](#411-linestart)
      2. [`lineEnd`](#412-lineend)
   2. [_Literals and special characters_](#42-literals-and-special-characters)
      1. [`exactly`](#421-exactly)
      2. [`anyChar`](#422-anychar)
      3. [`tab`](#423-tab)
      4. [`lineFeed`](#424-linefeed)
      5. [`carriageReturn`](#425-carriagereturn)
   3. [_Character sets_](#43-character-sets)
      1. [`charIn`](#431-charin)
      2. [`charNotIn`](#432-charnotin)
   4. [_Group references_](#44-group-references)
      1. [`referenceTo`](#441-referenceto)
   5. [_Unicode properties_](#45-unicode-properties)
      1. [`unicodeProps`](#451-unicodeprops)
   6. [_Character classes_](#46-character-classes)
      1. [`digit`](#461-digit)
      2. [`word`](#462-word)
      3. [`whitespace`](#463-whitespace)
      4. [`boundary`](#464-boundary)

---

## 1. Terms

### 1.1. Schema

A schema is an array (sequencer) of objects (atoms) that describes a regular expression in a declarative form. Each element of the schema—an atom—represents one component of the pattern.

**Simple example:**

```javascript
const schema = [
  { lineStart: true },
  { zeroOrMore: [{ charIn: 'a-z' }] },
  { lineEnd: true },
];
// Result: /^[a-z]*$/
```

**Example: validating an email address**

Regular expression:

```
/^(?:[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-])+@[a-zA-Z0-9](?:(?:[a-zA-Z0-9-]){0,61}[a-zA-Z0-9])?
(?:\.[a-zA-Z0-9](?:(?:[a-zA-Z0-9-]){0,61}[a-zA-Z0-9])?)+$/
```

This regular expression validates email addresses according to RFC 5322.

The schema that describes this regular expression:

```javascript
const schema = [
  { lineStart: true }, // ^
  {
    repeat: [
      // (?: ... )+
      { charIn: "a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-" }, // [a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]
    ],
  },
  { exactly: '@' }, // @
  { charIn: 'a-zA-Z0-9' }, // [a-zA-Z0-9]
  {
    maybe: [
      // (?: ... )?
      {
        repeat: [
          // (?: ... ){0,61}
          { charIn: 'a-zA-Z0-9-' }, // [a-zA-Z0-9-]
          { params: { times: [0, 61] } },
        ],
      },
      { charIn: 'a-zA-Z0-9' }, // [a-zA-Z0-9]
    ],
  },
  {
    repeat: [
      // (?: ... )+
      { exactly: '.' }, // .
      { charIn: 'a-zA-Z0-9' }, // [a-zA-Z0-9]
      {
        maybe: [
          // (?: ... )?
          {
            repeat: [
              // (?: ... ){0,61}
              { charIn: 'a-zA-Z0-9-' }, // [a-zA-Z0-9-]
              { params: { times: [0, 61] } },
            ],
          },
          { charIn: 'a-zA-Z0-9' }, // [a-zA-Z0-9]
        ],
      },
    ],
  },
  { lineEnd: true }, // $
];
```

### 1.2. Atom

An atom is the smallest unit of a schema. It describes one component of the pattern
(an anchor, character class, quantified sequence, alternation, etc.).

An atom is an object with exactly one key that defines its type.
The value of that key may only be:

- a string;
- a number or an array of two numbers (only for the `times` parameter; see [Params object `params`](#15-params-object-params));
- a boolean;
- an array of atoms (a sequencer), or—for [`anyOf`](#331-anyof)—an array of anonymous sequencers.

An atom’s value cannot be another atom or an arbitrary object.

Any object that appears in a schema is treated as an atom,
**except the special `params` object, which is not an atom
and does not describe a pattern component of its own** (see [Params object `params`](#15-params-object-params)).

[**Atoms:**](#4-atoms)

- [lineStart](#411-linestart)
- [lineEnd](#412-lineend)
- [exactly](#421-exactly)
- [anyChar](#422-anychar)
- [tab](#423-tab)
- [lineFeed](#424-linefeed)
- [carriageReturn](#425-carriagereturn)
- [referenceTo](#441-referenceto)
- [charIn](#431-charin)
- [charNotIn](#432-charnotin)
- [unicodeProps](#451-unicodeprops)
- [digit](#461-digit)
- [word](#462-word)
- [whitespace](#463-whitespace)
- [boundary](#464-boundary)

### 1.3. Sequencer

A sequencer is an array of atoms that combines several subpatterns into a sequence.
The order of atoms in a sequencer matches their order in the resulting regular expression.

**Kinds of sequencers**

A schema defines three kinds of sequencers, depending on context and what they may contain:

- Root sequencer — the top-level array of the schema.
  Contains only atoms.

- Atom-sequencer — an atom whose value is a sequencer (see [Atom-sequencer](#14-atom-sequencer)).

- Anonymous sequencer — an unnamed sequencer that appears only inside the [`anyOf`](#331-anyof) atom-sequencer.
  It describes alternative branches and may contain only atoms.

### 1.4. Atom-sequencer

An **atom-sequencer** is an atom whose value is a sequencer (an array of atoms) or, for [`anyOf`](#331-anyof), an array of sequencers.
It describes a sequence of subpatterns: nested atoms are processed in array order and concatenate into a single group.

An atom-sequencer always wraps its subpatterns in a group equivalent to one of the following:

- non-capturing `(?: … )`
- capturing `( … )`
- named `(?<name> … )`

By default, an atom-sequencer creates a **non-capturing** group `(?: … )` (except [`grouped`](#321-grouped)).
You can change the group type with the [`group`](#group) parameter in the `params` object.

[**Atom-sequencers:**](#3-atom-sequencers)

- [`repeat`](#311-repeat)
- [`zeroOrMore`](#312-zeroormore)
- [`maybe`](#313-maybe)
- [`grouped`](#321-grouped)
- [`anyOf`](#331-anyof)

### 1.5. Params object `params`

The **`params` object** is metadata used to configure an atom-sequencer.
It is not a schema atom, does not take part in the subpattern sequence, and does not change the order of nested atoms.
The `params` object must appear **at the end** of the atom-sequencer array and is treated as metadata for the parent atom-sequencer.

#### Parameters

#### `times`

Specifies an exact repetition count or a range.

Applies **_only_** to the [`repeat`](#311-repeat) quantifier.

```typescript
times?: number | [number] | [number, number];
```

| Value        | Equivalent  | Description             |
| ------------ | ----------- | ----------------------- |
| `n`          | `{n}`       | exactly `n` repetitions |
| `[min]`      | `{min,}`    | from `min` to infinity  |
| `[min, max]` | `{min,max}` | repetition range        |

> If `times` is omitted, the `+` quantifier is used (one or more repetitions).

#### `lazy`

Enables a lazy (non-greedy) quantifier.

`true` makes the quantifier lazy (`*?`, `{n,}?`); `false` keeps the default greedy behavior. Applies to all quantifiers: [`repeat`](#311-repeat), [`zeroOrMore`](#312-zeroormore), [`maybe`](#313-maybe).

```typescript
lazy?: boolean;
```

#### `group`

Defines the type of group:

- `false`: non-capturing group `(?: … )`
- `true`: capturing group `( … )`
- `"<name>"`: named group `(?<name> … )`

```typescript
group?: boolean | string;
```

#### `optionally`

When `true`, makes the alternation group optional.

Applies **_only_** to [`anyOf`](#331-anyof) alternation.

```typescript
optionally?: boolean;
```

#### Usage context

The `params` object may appear only inside atom-sequencers.

#### Parameters by atom-sequencer:

| Parameter    | Atom-sequencer                                                                                                                    |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `times`      | [`repeat`](#311-repeat)                                                                                                           |
| `lazy`       | [`repeat`](#311-repeat), [`zeroOrMore`](#312-zeroormore), [`maybe`](#313-maybe)                                                   |
| `group`      | [`repeat`](#311-repeat), [`zeroOrMore`](#312-zeroormore), [`maybe`](#313-maybe), [`grouped`](#321-grouped), [`anyOf`](#331-anyof) |
| `optionally` | [`anyOf`](#331-anyof)                                                                                                             |

---

## 2. Types

This section describes the TypeScript types used with schemas.

### 2.1. `Schema`

A schema is a root sequencer that contains only atoms.

```typescript
type Schema = Atom[];
```

### 2.2. `Atom`

An atom is the smallest unit of a schema. In TypeScript, it is represented as a union of all atom types.

```typescript
type Atom = BooleanAtom | StringAtom | ReferenceToAtom | AtomSequencer;

type BooleanAtom =
  | { lineStart: boolean }
  | { lineEnd: boolean }
  | { digit: boolean }
  | { word: boolean }
  | { whitespace: boolean }
  | { boundary: boolean }
  | { anyChar: boolean }
  | { tab: boolean }
  | { lineFeed: boolean }
  | { carriageReturn: boolean };

type StringAtom =
  | { exactly: string }
  | { charIn: string }
  | { charNotIn: string }
  | { unicodeProps: string };

type ReferenceToAtom = { referenceTo: number | string };
```

### 2.3. `AtomSequencer`

These atom-sequencers accept a sequencer—or, for [`anyOf`](#331-anyof), an array of sequencers—along with the corresponding parameter types.

```typescript
type AtomSequencer =
  | { repeat: RepeatSequence }
  | { zeroOrMore: ZeroOrMoreSequence }
  | { maybe: MaybeSequence }
  | { grouped: GroupedSequence }
  | { anyOf: AnyOfSequence };

// params is the last array element when present
type RepeatSequence =
  | Atom[]
  | [...Atom[], { params: RepeatParams }];

type ZeroOrMoreSequence =
  | Atom[]
  | [...Atom[], { params: ZeroOrMoreParams }];

type MaybeSequence =
  | Atom[]
  | [...Atom[], { params: MaybeParams }];

type GroupedSequence =
  | Atom[]
  | [...Atom[], { params: GroupedParams }];

type AnyOfSequence =
  | Atom[][]
  | [...Atom[][], { params: AnyOfParams }];
```

### 2.4. `Params`

Parameter types for atom-sequencers. Each atom-sequencer has its own set of allowed parameters.

```typescript
type Params =
  | RepeatParams
  | ZeroOrMoreParams
  | MaybeParams
  | GroupedParams
  | AnyOfParams;

type RepeatParams = {
  times?: number | [number] | [number, number];
  lazy?: boolean;
  group?: boolean | string;
};

type ZeroOrMoreParams = {
  lazy?: boolean;
  group?: boolean | string;
};

type MaybeParams = {
  lazy?: boolean;
  group?: boolean | string;
};

type GroupedParams = {
  group?: boolean | string;
};

type AnyOfParams = {
  group?: boolean | string;
  optionally?: boolean;
};
```

---

## 3. Atom-sequencers

### 3.1. _Quantifiers_

### 3.1.1 `repeat`

- Type: [AtomSequencer](#23-atomsequencer)
- Equivalent: `{n}`, `{min,max}`, `{min,}`, `+`

**`repeat`** — Creates a grouped subpattern with a quantifier.
Groups subpatterns and repeats them according to `times` (or defaults to `+`).

#### Supported parameters

The `params` object may contain (see [Params object `params`](#15-params-object-params)):

- [`times`](#times) — when omitted, defaults to `+` (one or more times);
- [`lazy`](#lazy) — default `false`;
- [`group`](#group) — default `false` (non-capturing group `(?: … )`).

#### Examples

```javascript
const schema = [
  { repeat: [{ charIn: 'a-z' }, { params: { times: [0, 3], lazy: true } }] },
];
// Result: /(?:[a-z]){0,3}?/

const schema = [
  { repeat: [{ exactly: 'foo' }, { params: { group: 'word' } }] },
];
// Result: /(?<word>foo)+/
```

### 3.1.2. `zeroOrMore`

- Type: [AtomSequencer](#23-atomsequencer)
- Equivalent: `*`

**`zeroOrMore`** — Applies the `*` quantifier to a grouped subpattern.
Matches the subpattern **zero or more times**.

#### Supported parameters

The `params` object may contain (see [Params object `params`](#15-params-object-params)):

- [`lazy`](#lazy) — default `false`;
- [`group`](#group) — default `false` (non-capturing group `(?: … )`).

#### Examples

```javascript
const schema = [{ zeroOrMore: [{ exactly: 'foo' }] }];
// Result: /(?:foo)*/

const schema = [
  {
    zeroOrMore: [
      { charIn: 'a-z' },
      { params: { group: 'letters', lazy: true } },
    ],
  },
];
// Result: /(?<letters>[a-z]*?)/
```

### 3.1.3. `maybe`

- Type: [AtomSequencer](#23-atomsequencer)
- Equivalent: `?`

**`maybe`** — Applies the `?` quantifier to a grouped subpattern (**zero or one** match).
Makes the subpattern **optional**.

#### Supported parameters

The `params` object may contain (see [Params object `params`](#15-params-object-params)):

- [`lazy`](#lazy) — default `false`;
- [`group`](#group) — default `false` (non-capturing group `(?: … )`).

#### Examples

```javascript
const schema = [{ maybe: [{ exactly: 'foo' }] }];
// Result: /(?:foo)?/

const schema = [
  { maybe: [{ charIn: 'A-Z' }, { params: { group: 'opt', lazy: true } }] },
];
// Result: /(?<opt>[A-Z])??/
```

> [!NOTE]
> For deeply nested [`anyOf`](#331-anyof) alternation, prefer the [`optionally`](#optionally) parameter over wrapping in [`maybe`](#313-maybe) to avoid unnecessary nesting.

---

### 3.2. _Group_

### 3.2.1. `grouped`

- Type: [AtomSequencer](#23-atomsequencer)
- Equivalent: `(...)`, `(?:...)`, `(?<name>...)`

**`grouped`** — Creates a group.
Concatenates several subpatterns into a single group.

#### Supported parameters

The `params` object may contain (see [Params object `params`](#15-params-object-params)):

- [`group`](#group) — default `true` (capturing group `( … )`).

#### Examples

```javascript
const schema = [{ grouped: [{ exactly: 'foo' }, { charIn: 'A-Z' }] }];
// Result: /(foo[A-Z])/

const schema = [
  { grouped: [{ exactly: 'bar' }, { params: { group: false } }] },
];
// Result: /(?:bar)/

const schema = [
  { grouped: [{ exactly: 'buzz' }, { params: { group: 'word' } }] },
];
// Result: /(?<word>buzz)/
```

---

### 3.3. _Alternation_

### 3.3.1. `anyOf`

- Type: [AtomSequencer](#23-atomsequencer)
- Equivalent: `|`

**`anyOf`** — Creates **alternation** using the `|` operator.
Defines alternative branches, at least one of which must match.

#### Structure

The value of the `anyOf` key is an array of anonymous sequencers (alternation branches):

```javascript
{
  anyOf: [
    [ /* branch 1 */ ],
    [ /* branch 2 */ ],
    ...
  ]
}
```

#### Supported parameters

The `params` object may contain (see [Params object `params`](#15-params-object-params)):

- [`group`](#group) — default `false` (non-capturing group `(?: … )`);
- [`optionally`](#optionally) — default `false`.

> [!NOTE]
> To make an alternation optional, use the [`optionally`](#optionally) parameter instead of wrapping `anyOf` in [`maybe`](#313-maybe) to avoid unnecessary nesting.

#### Examples

```javascript
const schema = [
  {
    anyOf: [
      [{ charIn: '01' }, { digit: true }], // branch 1
      [{ exactly: '2' }, { charIn: '0-3' }], // branch 2
      { params: { group: 'hours' } },
    ],
  },
  { exactly: ':' },
  {
    grouped: [
      { charIn: '0-5' },
      { digit: true },
      { params: { group: 'minutes' } },
    ],
  },
];
// Result: /(?<hours>[01]\d|2[0-3]):(?<minutes>[0-5]\d)/

const str = '23:59 25:99 1:2';
const re = /(?<hours>[01]\d|2[0-3]):(?<minutes>[0-5]\d)/;
const result = str.match(re);

console.log(result);

/* Output:
[
  '23:59',
  '23',
  '59',
  index: 0,
  input: '23:59 25:99 1:2',
  groups: [Object: null prototype] { hours: '23', minutes: '59' }
]
*/
```

---

## 4. Atoms

### 4.1. _Anchors_

### 4.1.1. `lineStart`

- Type: [Atom](#22-atom)
- Equivalent: `^`

**`lineStart`** — Anchor matching the start of a line (`^`).

`true` emits the anchor; `false` omits the atom from the resulting pattern.

```javascript
{
  lineStart: true;
} // ^
```

### 4.1.2. `lineEnd`

- Type: [Atom](#22-atom)
- Equivalent: `$`

**`lineEnd`** — Anchor matching the end of a line (`$`).

`true` emits the anchor; `false` omits the atom from the resulting pattern.

```javascript
{
  lineEnd: true;
} // $
```

---

### 4.2. _Literals and special characters_

### 4.2.1. `exactly`

- Type: [Atom](#22-atom)

**`exactly`** — Matches a literal string.

Accepts a string that is escaped and inserted into the regular expression as-is.

```javascript
{
  exactly: 'foo';
} // foo
{
  exactly: '.';
} // \.
{
  exactly: '(';
} // \(
```

### 4.2.2. `anyChar`

- Type: [Atom](#22-atom)
- Equivalent: `.`

**`anyChar`** — Matches any character except line terminators.

```javascript
{
  anyChar: true;
} // .
```

### 4.2.3. `tab`

- Type: [Atom](#22-atom)
- Equivalent: `\t`

**`tab`** — Matches a tab character (`\t`).

```javascript
{
  tab: true;
} // \t
```

### 4.2.4. `lineFeed`

- Type: [Atom](#22-atom)
- Equivalent: `\n`

**`lineFeed`** — Matches a line feed character (`\n`).

```javascript
{
  lineFeed: true;
} // \n
```

### 4.2.5. `carriageReturn`

- Type: [Atom](#22-atom)
- Equivalent: `\r`

**`carriageReturn`** — Matches a carriage return character (`\r`).

```javascript
{
  carriageReturn: true;
} // \r
```

---

### 4.3. _Character sets_

### 4.3.1. `charIn`

- Type: [Atom](#22-atom)
- Equivalent: `[ ... ]`

**`charIn`** — Matches any character in the specified set.

Accepts a string that describes the character set using the same syntax as regular expression character classes (ranges, escapes, etc.).

```javascript
{
  charIn: 'a-z';
} // [a-z]
{
  charIn: 'a-zA-Z0-9';
} // [a-zA-Z0-9]
{
  charIn: 'abc';
} // [abc]
```

### 4.3.2. `charNotIn`

- Type: [Atom](#22-atom)
- Equivalent: `[^ ...]`

**`charNotIn`** — Matches any character **not** in the specified set (negated character class).

Accepts a string that describes the character set using the same syntax as regular expression character classes.

```javascript
{
  charNotIn: 'a-z';
} // [^a-z]
{
  charNotIn: '0-9';
} // [^0-9]
```

---

### 4.4. _Group references_

### 4.4.1. `referenceTo`

- Type: [Atom](#22-atom)
- Equivalent: `\k<name>`, `\N`

**`referenceTo`** — Inserts a backreference to a captured group.

Accepts:

- a **number** — numeric backreference by capture group index (`\N`);
- a **string** — named backreference (`\k<name>`).

```javascript
{
  referenceTo: 1;
} // \1
{
  referenceTo: 'name';
} // \k<name>
```

---

### 4.5. _Unicode properties_

### 4.5.1. `unicodeProps`

- Type: [Atom](#22-atom)
- Equivalent: `\p{...}`

**`unicodeProps`** — Matches characters by Unicode property.

Accepts any Unicode property expression supported in `\p{...}` (for example, `Letter`, `Number`, `Script=Latin`, etc.).

```javascript
{
  unicodeProps: 'Letter';
} // \p{Letter}
{
  unicodeProps: 'Script=Latin';
} // \p{Script=Latin}
```

---

### 4.6. _Character classes_

Character classes are atoms that take a `boolean` value.
Unlike anchors, where `false` omits the atom, for character classes `false` selects the negated class (for example, `\D` instead of `\d`, `\W` instead of `\w`).

### 4.6.1. `digit`

- Type: [Atom](#22-atom)
- Equivalent: `\d`, `\D`

**`digit`** — Matches decimal digits (`\d`) or non-digits (`\D`).

`true` matches a decimal digit (0–9); `false` matches a non-digit.

```javascript
{
  digit: true;
} // \d
{
  digit: false;
} // \D
```

### 4.6.2. `word`

- Type: [Atom](#22-atom)
- Equivalent: `\w`, `\W`

**`word`** — Matches word characters (`\w`) or non-word characters (`\W`).

`true` matches Latin letters (A–Z, a–z), decimal digits (0–9), and underscore (`_`); `false` matches a non-word character.

```javascript
{
  word: true;
} // \w
{
  word: false;
} // \W
```

### 4.6.3. `whitespace`

- Type: [Atom](#22-atom)
- Equivalent: `\s`, `\S`

**`whitespace`** — Matches whitespace (`\s`) or non-whitespace (`\S`).

`true` matches whitespace; `false` matches a non-whitespace character.

```javascript
{
  whitespace: true;
} // \s
{
  whitespace: false;
} // \S
```

### 4.6.4. `boundary`

- Type: [Atom](#22-atom)
- Equivalent: `\b`, `\B`

**`boundary`** — Word boundary assertion.

`true` matches a word boundary; `false` matches a position that is not a word boundary (`\B`).

```javascript
{
  boundary: true;
} // \b
{
  boundary: false;
} // \B
```
