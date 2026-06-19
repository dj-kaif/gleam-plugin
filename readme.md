# Gleam Language

Adds [Gleam](https://gleam.run) language support to Acode.

## Features (v1)

- Recognizes `.gleam` files automatically
- Basic syntax highlighting for:
  - Keywords (`pub`, `fn`, `let`, `case`, `import`, `type`, `use`, etc.)
  - Types and module names (`Result`, `List`, `MyType`)
  - Strings, numbers, comments (`//` and `/* */`)
  - Attributes (`@external`, `@deprecated`, `@target`)
  - Operators (`|>`, `->`, `<>`, `==`, etc.)

## Not included yet

These are planned for future versions:

- Autocomplete, hover info, go-to-definition, and diagnostics via the
  built-in `gleam lsp` language server
- A full grammar-based highlighter (current one is a simple tokenizer,
  not a parse tree)
- Code formatting via `gleam format`

## Requirements

- Acode version supporting the CodeMirror 6 editor engine (min version
  code 290+)

## Installation

Install from the Acode plugin marketplace by searching "Gleam Language".

## Feedback

Found a file or syntax pattern that doesn't highlight correctly? Open
an issue on the repository linked in the plugin listing or [click here to open the repo](https://github.com/dj-kaif/gleam-plugin.git).