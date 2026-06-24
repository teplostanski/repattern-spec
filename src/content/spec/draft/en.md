---
title: "repattern Specification (draft)"
description: "Specification of an embeddable DSL for building JavaScript RegExp from declarative Scheme objects."
locale: en
version: draft
draft: true
---

# repattern Specification (draft)

Specification of an embeddable DSL for building JavaScript RegExp from declarative Scheme objects.

**Languages:** [Russian](/ru/draft/)

**Versions:** draft (this page), [current](/), [1.0.0-beta](/1.0.0-beta/)

## Abstract

The repattern specification is an [embeddable DSL](https://en.wikipedia.org/wiki/Domain-specific_language) for building JavaScript regular expressions from declarative [`Scheme`](#21-scheme) objects, which are converted into `RegExp` instances.

<!--The specification defines the `createRegExp` and `sanitizeScheme` tools for working with schemes, as well as the structure of the schemes themselves. -->
Schemes are a human-readable format for describing patterns, as an alternative to writing regular expressions by hand.

> [!NOTE]
> To use this specification effectively, you should understand regular expression terminology and how they work, since schemes describe the same concepts in a declarative format.

## Table of Contents

1. [Terms](#1-terms)
    1. [Scheme](#11-scheme)
    2. [Atom](#12-atom)
    3. [Sequencer](#13-sequencer)
    4. [Atom-sequencer](#14-atom-sequencer)
    5. [Params object `params`](#15-params-object-params)
2. [Types](#2-types)
    1. [`Scheme`](#21-scheme)
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

### 1.1. Scheme

A scheme is an array (sequencer) of objects (atoms) that describes the structure of a regular expression in a declarative format. Each element of a scheme (atom) represents one logical step of the pattern.

**Simple example:**

```javascript
const scheme = [
  { lineStart: true },
  { zeroOrMore: [{ charIn: 'a-z' }] },
  { lineEnd: true }
];
// Result: /^[a-z]*$/
```

**Example: email address validation**

Regular expression:

```
/^(?:[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-])+@[a-zA-Z0-9](?:(?:[a-zA-Z0-9-]){0,61}[a-zA-Z0-9])?
(?:\.[a-zA-Z0-9](?:(?:[a-zA-Z0-9-]){0,61}[a-zA-Z0-9])?)+$/
```

This regular expression validates email addresses according to RFC 5322.

Scheme describing this regular expression:

```javascript
const scheme = [
  { lineStart: true }, // ^
  { repeat: [ // (?: ... )+
      { charIn: 'a-zA-Z0-9.!#$%&\'*+/=?^_`{|}~-' } // [a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]
    ]
  },
  { exactly: '@' }, // @
  { charIn: 'a-zA-Z0-9' }, // [a-zA-Z0-9]
  { maybe: [ // (?: ... )?
      { repeat: [ // (?: ... ){0,61}
          { charIn: 'a-zA-Z0-9-' }, // [a-zA-Z0-9-]
          { params: { times: [0, 61] } }
        ]
      },
      { charIn: 'a-zA-Z0-9' } // [a-zA-Z0-9]
    ]
  },
  { repeat: [ // (?: ... )+
      { exactly: '.' }, // .
      { charIn: 'a-zA-Z0-9' }, // [a-zA-Z0-9]
      { maybe: [ // (?: ... )?
          { repeat: [ // (?: ... ){0,61}
              { charIn: 'a-zA-Z0-9-' }, // [a-zA-Z0-9-]
              { params: { times: [0, 61] } }
            ]
          },
          { charIn: 'a-zA-Z0-9' } // [a-zA-Z0-9]
        ]
      },
    ]
  },
  { lineEnd: true }, // $
]
```

### 1.2. Atom

An atom is the smallest unit of a scheme, describing one logical step of the pattern
(anchor, character class, quantified sequence, alternation, and so on).

An atom is an object with exactly one key that defines the type of step.
The value of that key may only be:

- a string;
- a number or an array of two numbers (only for the `times` parameter; see [Params object `params`](#15-params-object-params));
- a boolean;
- an array of atoms (sequencer), or for [`anyOf`](#331-anyof), an array of anonymous sequencers.

The value of an atom cannot be another atom or an arbitrary object.

Any object encountered in a scheme is treated as an atom,
**except the special params object `params`, which is not considered an atom
and does not describe a separate pattern step** (see [Params object `params`](#15-params-object-params)).

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

A sequencer is an array of atoms that combines several sub-patterns into a sequence.
The order of atoms in a sequencer corresponds to their order in the resulting regular expression.

**Types of sequencers**
A scheme has three types of sequencers, differing by context and allowed contents:

- Root sequencer — the top-level array of the scheme.
  Contains only atoms.

- Atom-sequencer — an atom whose value is a sequencer (see [Atom-sequencer](#14-atom-sequencer)).

- Anonymous sequencer — a sequencer without a name, found only inside the atom-sequencer [`anyOf`](#331-anyof).
  Used to describe alternative branches and may contain only atoms.

### 1.4. Atom-sequencer

An **atom-sequencer** is an atom whose value is a sequencer (an array of atoms) or, for [`anyOf`](#331-anyof), an array of sequencers.
It describes a sequence of sub-patterns: nested atoms are interpreted in array order and correspond to concatenation of sub-patterns inside one grouping construct.

An atom-sequencer always acts as a wrapper over sub-patterns, equivalent to one of the regular expression groups:

- non-capturing `(?: … )`
- capturing `( … )`
- named `(?<name> … )`

By default, an atom-sequencer creates a **non-capturing** group `(?: … )` as the wrapper (except [`grouped`](#321-grouped)).
The wrapper type can be changed with the [`group`](#group) parameter in the `params` object.

[**Atom-sequencers:**](#3-atom-sequencers)

- [`repeat`](#311-repeat)
- [`zeroOrMore`](#312-zeroormore)
- [`maybe`](#313-maybe)
- [`grouped`](#321-grouped)
- [`anyOf`](#331-anyof)

### 1.5. Params object `params`

The **`params` object** is a service element for setting parameters of an atom-sequencer.
It is not considered a scheme atom, does not participate in the sub-pattern sequence, and does not affect the execution order of nested atoms.
The `params` object must be placed **at the end** of the atom-sequencer array and is interpreted as metadata for the parent atom-sequencer.

#### Parameters

#### `times`

Sets an exact repetition count or a range.

Applies **_only_** to the [`repeat`](#311-repeat) quantifier.

```typescript
times?: number | [number] | [number, number];
```

| Value        | Equivalent  | Description                    |
| ------------ | ----------- | ------------------------------ |
| `n`          | `{n}`       | exactly `n` repetitions        |
| `[min]`      | `{min,}`    | from `min` to infinity         |
| `[min, max]` | `{min,max}` | repetition range               |

> If the `times` parameter is omitted, the `+` quantifier is used (repeat 1 or more times).

#### `lazy`

Lazy quantifier flag.

`true` makes the quantifier lazy (`*?`, `{n,}?`); `false` disables the flag. Applies to all quantifiers: [`repeat`](#311-repeat), [`zeroOrMore`](#312-zeroormore), [`maybe`](#313-maybe).

```typescript
lazy?: boolean;
```

#### `group`

Defines the type of grouping construct:

  - `false`: non-capturing group `(?: … )`
  - `true`: capturing group `( … )`
  - `"<name>"`: named group `(?<name> … )`

```typescript
group?: boolean | string;
```

#### `optionally`

Flag that makes the group optional.

Applies **_only_** to [`anyOf`](#331-anyof) alternation.

```typescript
optionally?: boolean;
```

#### Usage context

The `params` object may appear only inside atom-sequencers.

#### Parameter to atom-sequencer mapping:

| Parameter    | Atom-sequencer                                                                                              |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| `times`      | [`repeat`](#311-repeat)                                                                                         |
| `lazy`       | [`repeat`](#311-repeat), [`zeroOrMore`](#312-zeroormore), [`maybe`](#313-maybe)                                           |
| `group`      | [`repeat`](#311-repeat), [`zeroOrMore`](#312-zeroormore), [`maybe`](#313-maybe), [`grouped`](#321-grouped), [`anyOf`](#331-anyof) |
| `optionally` | [`anyOf`](#331-anyof)                                                                                           |

---

## 2. Types

This section describes TypeScript types for working with schemes.

### 2.1. `Scheme`

The scheme type — root sequencer containing only atoms.

```typescript
type Scheme = Atom[];
```

### 2.2. `Atom`

An atom is the smallest unit of a scheme. Union of all atom types.

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

Atom-sequencers that accept a sequencer (or, for [`anyOf`](#331-anyof), an array of sequencers) with the corresponding parameter types.

```typescript
type AtomSequencer =
  | { repeat: RepeatSequence }
  | { zeroOrMore: ZeroOrMoreSequence }
  | { maybe: MaybeSequence }
  | { grouped: GroupedSequence }
  | { anyOf: AnyOfSequence };
  
type RepeatSequence = [...Atom[], { params: RepeatParams }?] | Atom[];

type ZeroOrMoreSequence = [...Atom[], { params: ZeroOrMoreParams }?] | Atom[];

type MaybeSequence = [...Atom[], { params: MaybeParams }?] | Atom[];

type GroupedSequence = [...Atom[], { params: GroupedParams }?] | Atom[];

type AnyOfSequence = [...Atom[][], { params: AnyOfParams }?] | Atom[][];
```

### 2.4. `Params`

Parameter types for atom-sequencers. Each atom-sequencer has its own set of allowed parameters.

```typescript
type Params = RepeatParams | ZeroOrMoreParams | MaybeParams | GroupedParams | AnyOfParams;

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

**`repeat`** — Creates a group with a repetition quantifier.
Combines sub-patterns and allows repeating them with a given multiplicity.

#### Supported parameters

The `params` object may contain (see [Params object `params`](#15-params-object-params)):

- [`times`](#times) — without this parameter, equivalent to `+` (1 or more times);
- [`lazy`](#lazy) — default `false`;
- [`group`](#group) — default `false` (non-capturing group `(?: … )`).

#### Examples

```javascript
const scheme = [
  { repeat: [
      { charIn: 'a-z' },
      { params: { times: [0, 3], lazy: true } }
    ]
  },
];
// Result: /(?:[a-z]){0,3}?/

const scheme = [
  { repeat: [
      { exactly: 'foo' },
      { params: { group: 'word' } }
    ]
  },
];
// Result: /(?<word>foo)+/
```

### 3.1.2. `zeroOrMore`

- Type: [AtomSequencer](#23-atomsequencer)
- Equivalent: `*`

**`zeroOrMore`** — Creates a group with the `*` quantifier.
Repeats the sub-pattern **zero or more times**.

#### Supported parameters

The `params` object may contain (see [Params object `params`](#15-params-object-params)):

- [`lazy`](#lazy) — default `false`;
- [`group`](#group) — default `false` (non-capturing group `(?: … )`).

#### Examples

```javascript
const scheme = [
  { zeroOrMore: [
      { exactly: 'foo' }
    ]
  }
];
// Result: /(?:foo)*/

const scheme = [
  { zeroOrMore: [
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

**`maybe`** — Creates a group with the `?` quantifier (repeat the sub-pattern **zero or one time**).
Makes the sub-pattern **optional**.

#### Supported parameters

The `params` object may contain (see [Params object `params`](#15-params-object-params)):

- [`lazy`](#lazy) — default `false`;
- [`group`](#group) — default `false` (non-capturing group `(?: … )`).

#### Examples

```javascript
const scheme = [
  { maybe: [
      { exactly: 'foo' }
    ]
  }
];
// Result: /(?:foo)?/

const scheme = [
  { maybe: [
      { charIn: 'A-Z' },
      { params: { group: 'opt', lazy: true } }
    ]
  },
];
// Result: /(?<opt>[A-Z])??/
```

> [!NOTE]
> For [`anyOf`](#331-anyof) with deeply nested alternation branches, prefer the [`optionally`](#optionally) parameter over wrapping in [`maybe`](#313-maybe) to avoid excessive nesting.

---

### 3.2. _Group_

### 3.2.1. `grouped`

- Type: [AtomSequencer](#23-atomsequencer)
- Equivalent: `(...)`, `(?:...)`, `(?<name>...)`

**`grouped`** — Creates a grouping construct.
Combines several sub-patterns into one logical group.

#### Supported parameters

The `params` object may contain (see [Params object `params`](#15-params-object-params)):

- [`group`](#group) — default `true` (capturing group `( … )`).

#### Examples

```javascript
const scheme = [
  { grouped: [
      { exactly: 'foo' },
      { charIn: 'A-Z' }
    ]
  }
]
// Result: /(foo[A-Z])/

const scheme = [
  { grouped: [
      { exactly: 'bar' },
      { params: { group: false } }
    ]
  }
]
// Result: /(?:bar)/

const scheme = [
  { grouped: [
      { exactly: 'buzz' },
      { params: { group: 'word' } }
    ]
  }
]
// Result: /(?<word>buzz)/
```

---

### 3.3. _Alternation_

### 3.3.1. `anyOf`

- Type: [AtomSequencer](#23-atomsequencer)
- Equivalent: `|`

**`anyOf`** — Creates **alternation** (_choice operator_).
Combines several alternation branches, at least one of which must match.

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
> To create optional alternation, use the [`optionally`](#optionally) parameter instead of wrapping `anyOf` in [`maybe`](#313-maybe) to avoid excessive nesting.

#### Examples

```javascript
const scheme = [
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

**`lineStart`** — Start-of-line anchor.

Accepts a boolean: `true` enables the anchor, `false` ignores the atom.

```javascript
{ lineStart: true } // ^
```

### 4.1.2. `lineEnd`

- Type: [Atom](#22-atom)
- Equivalent: `$`

**`lineEnd`** — End-of-line anchor.

Accepts a boolean: `true` enables the anchor, `false` ignores the atom.

```javascript
{ lineEnd: true } // $
```

---

### 4.2. _Literals and special characters_

### 4.2.1. `exactly`

- Type: [Atom](#22-atom)

**`exactly`** — Matches an exact sequence of characters (literal).

Accepts a string that will be escaped and used as-is in the regular expression.

```javascript
{ exactly: 'foo' } // foo
{ exactly: '.' } // \.
{ exactly: '(' } // \(
```

### 4.2.2. `anyChar`

- Type: [Atom](#22-atom)
- Equivalent: `.`

**`anyChar`** — Matches any character except newline characters.

```javascript
{ anyChar: true } // .
```

### 4.2.3. `tab`

- Type: [Atom](#22-atom)
- Equivalent: `\t`

**`tab`** — Tab character.

```javascript
{ tab: true } // \t
```

### 4.2.4. `lineFeed`

- Type: [Atom](#22-atom)
- Equivalent: `\n`

**`lineFeed`** — Line feed character.

```javascript
{ lineFeed: true } // \n
```

### 4.2.5. `carriageReturn`

- Type: [Atom](#22-atom)
- Equivalent: `\r`

**`carriageReturn`** — Carriage return character.

```javascript
{ carriageReturn: true } // \r
```

---

### 4.3. _Character sets_

### 4.3.1. `charIn`

- Type: [Atom](#22-atom)
- Equivalent: `[ ... ]`

**`charIn`** — Character class matching any character from the specified set.

Accepts a string describing the character set in a format analogous to regular expression character classes (ranges, escaped characters, and so on).

```javascript
{ charIn: 'a-z' } // [a-z]
{ charIn: 'a-zA-Z0-9' } // [a-zA-Z0-9]
{ charIn: 'abc' } // [abc]
```

### 4.3.2. `charNotIn`

- Type: [Atom](#22-atom)
- Equivalent: `[^ ...]`

**`charNotIn`** — Negated character class matching any character **not** in the specified set.

Accepts a string describing the character set in a format analogous to regular expression character classes.

```javascript
{ charNotIn: 'a-z' } // [^a-z]
{ charNotIn: '0-9' } // [^0-9]
```

---

### 4.4. _Group references_

### 4.4.1. `referenceTo`

- Type: [Atom](#22-atom)
- Equivalent: `\k<name>`, `\N`

**`referenceTo`** — Reference to a captured group.

Accepts:
- **number** — reference to a group by number (`\N`)
- **string** — reference to a named group (`\k<name>`)

```javascript
{ referenceTo: 1 } // \1
{ referenceTo: 'name' } // \k<name>
```

---

### 4.5. _Unicode properties_

### 4.5.1. `unicodeProps`

- Type: [Atom](#22-atom)
- Equivalent: `\p{...}`

**`unicodeProps`** — Matches characters based on Unicode properties.

Accepts a string containing everything that can be passed to `\p{...}` in a regular expression (for example, `Letter`, `Number`, `Script=Latin`, and so on).

```javascript
{ unicodeProps: 'Letter' } // \p{Letter}
{ unicodeProps: 'Script=Latin' } // \p{Script=Latin}
```

---

### 4.6. _Character classes_

Character classes are atoms that take a `boolean` value.
Unlike anchors, where `false` ignores the atom, for character classes `false` creates the negated version of the class (for example, `\D` instead of `\d`, `\W` instead of `\w`).

### 4.6.1. `digit`

- Type: [Atom](#22-atom)
- Equivalent: `\d`, `\D`

**`digit`** — Character class matching decimal digits.

Accepts a boolean: `true` matches any decimal digit (0-9), `false` matches any character that is not a decimal digit.

```javascript
{ digit: true } // \d
{ digit: false } // \D
```

### 4.6.2. `word`

- Type: [Atom](#22-atom)
- Equivalent: `\w`, `\W`

**`word`** — Character class matching word characters.

Accepts a boolean: `true` matches Latin letters (A-Z, a-z), decimal digits (0-9), and underscore (`_`); `false` matches any character that is not a word character.

```javascript
{ word: true } // \w
{ word: false } // \W
```

### 4.6.3. `whitespace`

- Type: [Atom](#22-atom)
- Equivalent: `\s`, `\S`

**`whitespace`** — Character class matching whitespace characters.

Accepts a boolean: `true` matches whitespace characters, `false` matches any character that is not whitespace.

```javascript
{ whitespace: true } // \s
{ whitespace: false } // \S
```

### 4.6.4. `boundary`

- Type: [Atom](#22-atom)
- Equivalent: `\b`, `\B`

**`boundary`** — Word boundary anchor.

Accepts a boolean: `true` matches a word boundary, `false` matches a position that is not a word boundary.

```javascript
{ boundary: true } // \b
{ boundary: false } // \B
```
