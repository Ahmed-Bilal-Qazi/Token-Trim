# Token Trim

A lightweight browser tool that compresses and bundles multiple code files into a single, token-efficient context file you can paste directly into any AI (Claude, ChatGPT, Gemini, etc.).

No install. No server. No dependencies. Just open `index.html`.

---

## Why

When you paste code into an AI, you're spending tokens on things the model doesn't need — comments explaining what a function does, empty lines, four-space indentation repeated hundreds of times, trailing whitespace. This tool strips all of that while keeping the code's logic and structure completely intact.

**Typical results:**
- Lightly commented code → 15–25% token reduction
- Heavily documented code (JSDoc, Python docstrings) → 40–60% token reduction

---

## Getting started

```
ai-context-packer/
├── index.html   ← open this in your browser
├── style.css
├── app.js
└── README.md
```

1. Download or clone the folder
2. Open `index.html` in any modern browser (Chrome, Firefox, Safari, Edge)
3. Drop your files in, configure options, hit **Pack & compress**
4. Copy or download the result and paste into your AI of choice

No build step, no `npm install`, no internet connection required after download.

---

## Output format

The tool uses XML-style tags, which models parse unambiguously. Each file is wrapped with its path and detected language:

```xml
<file_tree>
├── src/
│   ├── main.py
│   └── utils/
│       └── helpers.js
└── config.toml
</file_tree>

<file path="src/main.py" lang="python">
def add(a, b):
 return a + b
</file>

<file path="src/utils/helpers.js" lang="javascript">
function slugify(str) {
 return str.toLowerCase().replace(/\s+/g, '-');
}
</file>
```

XML is recommended by Anthropic for structured context and works well across all major models. It survives backtick collisions inside code and supports per-file metadata.

---

## Compression options

| Option | What it removes | Token impact |
|---|---|---|
| Strip comments | `//`, `#`, `/* */`, `<!-- -->`, Python `"""` docstrings, Lua `--[[` blocks | High |
| Remove blank lines | Empty and whitespace-only lines | Medium |
| Minimize indentation | Collapses 4-space or tab indentation to 1 space per level | Medium |
| Strip trailing whitespace | Invisible characters at the end of each line | Low |
| Include file tree | Adds a directory tree header (adds a few tokens, but helps the model navigate) | Slight increase |

All options are on by default. Comment stripping is smart — it won't remove a `//` or `#` character that lives inside a string literal.

---

## Supported languages

| Extension(s) | Language |
|---|---|
| `.py` | Python |
| `.js` | JavaScript |
| `.ts` | TypeScript |
| `.jsx` / `.tsx` | JSX / TSX |
| `.html` | HTML |
| `.css` / `.scss` | CSS / SCSS |
| `.json` | JSON |
| `.yaml` / `.yml` | YAML |
| `.sh` / `.bash` / `.zsh` / `.fish` | Bash |
| `.rs` | Rust |
| `.go` | Go |
| `.rb` | Ruby |
| `.java` | Java |
| `.c` / `.h` | C |
| `.cpp` / `.cc` | C++ |
| `.cs` | C# |
| `.php` | PHP |
| `.swift` | Swift |
| `.kt` | Kotlin |
| `.sql` | SQL |
| `.lua` | Lua |
| `.r` | R |
| `.toml` | TOML |
| `.xml` | XML |
| `.vue` | Vue |
| `.svelte` | Svelte |
| `.tf` | Terraform |
| `.ex` / `.exs` | Elixir |
| `.dart` | Dart |
| `.hs` | Haskell |
| `.clj` | Clojure |
| `.scala` | Scala |

Unknown extensions are included as-is with `lang="text"`.

---

## How to use the output

Paste the `.txt` contents at the start of your AI conversation with a brief instruction, for example:

```
Here is my codebase. Each file is wrapped in <file> tags with its path and language.
[paste output here]

Now help me refactor the authentication flow.
```

The model will understand the file boundaries and refer to individual files by path when answering.

---

## Privacy

All processing happens in your browser. Files are never uploaded anywhere. Nothing leaves your machine.

---

## File structure

```
index.html   Main markup and layout
style.css    All visual styles, light/dark mode via CSS variables
app.js       Compression engine, file tree builder, event handlers
```

`app.js` is split into clearly labelled sections:
- Language map
- Token estimation
- Compression engine (comment stripping, indent minimization)
- File tree builder
- State management
- Event handlers (drag & drop, generate, copy, download)

---

## Limitations

- Comment stripping is regex-based, not AST-based. It handles the vast majority of real-world cases but may occasionally over-strip in unusual edge cases (e.g. deeply nested multiline string literals that look like comments).
- Token count shown is an estimate (~4 characters per token). Actual count varies by model and tokenizer.
- No folder upload support yet — files must be selected individually or dragged in as a flat group.

---

## License

MIT — use it however you like.
