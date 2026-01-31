# Hugo DocFind Module

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Seamless integration of [Microsoft DocFind](https://github.com/microsoft/docfind) for Hugo sites.

**Author**: [Prateek Sharma](https://www.sharmaprateek.com)

## Features
- **High Performance**: WebAssembly-based client-side search.
- **Easy Integration**: Drop-in partials for search UI.
- **Zero Config**: Automatically generates the required search index.
- **Smart Build**: Works with `hugo server` or static builds.

## Installation

1.  **Add Module**:
    In your `hugo.toml`:
    ```toml
    [module]
      [[module.imports]]
        path = "github.com/sharmaprateek/hugo-docfind"
    ```

2.  **Configure Output**:
    Enable the `SearchIndex` output format for your home page:
    ```toml
    [outputs]
      home = ["HTML", "RSS", "SearchIndex"]

    [outputFormats.SearchIndex]
      mediaType = "application/json"
      baseName = "search"
      isPlainText = true
      notAlternative = true
    ```

3.  **Add Partials**:
    Inside your templates (e.g., `baseof.html` or a sidebar partial):
    
    *Add Styles (Head)*:
    ```html
    {{ partial "docfind/head.html" . }}
    ```
    
    *Add Search Bar (Option A: Inline Block)*:
    ```html
    {{ partial "docfind/search.html" . }}
    ```

    *Add Search Bar (Option B: Navbar Widget)*:
    This is best for headers/navbars. It renders a magnifier icon that expands on click.
    ```html
    {{ partial "docfind/search-expandable.html" . }}
    ```
    
    *Add Scripts (Footer)*:
    ```html
    {{ partial "docfind/scripts.html" . }}
    ```

## Troubleshooting

### Windows: TLS/SSL Errors
If you encounter `Could not create SSL/TLS secure channel` when running the build script:
- The script automatically enforces TLS 1.2 (`[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12`).
- Ensure your PowerShell is running as Administrator if permissions are an issue.

## Design Decisions
- **Smart Wrapper**: The build scripts (`build.bat`, `build_search.ps1`) automatically detect if `hugo server` is running to fetch fresh content, or fall back to a static build.

## How Indexing Works
`docfind` is a **keyword search engine**, not a generic full-text search engine. It optimizes for speed and index size by:
1.  **Stopwords**: Common words (e.g., "hello", "the", "is") are ignored.
2.  **Keyword Extraction**: It uses RAKE (Rapid Automatic Keyword Extraction) to select only the top ~8 most relevant keywords from the body content.
3.  **Title/Category**: These fields are indexed more heavily.

If a word isn't showing up, it's likely a stopword or not considered a "keyword" by the extraction algorithm.

## Usage

### Development
1.  Run `hugo server` in one terminal.
2.  Run the build script to generate/update the index:
    *   **Windows**: Double-click `bin\build.bat` or run `.\bin\build.bat` in terminal.
    *   **Mac/Linux**: `./bin/build_search.sh`
    
    *You only need to rerun this when you add/edit content.*

### Production
The build script handles the full build process if the server isn't running.
```bash
./bin/build.bat  # Windows
./bin/build_search.sh # Linux/Mac
```
This will build your site into `public/` and generate the search assets in `static/docfind/`.

## Testing

Run the automated test suite to validate the module (requires Node.js):

```bash
# Run all 17 tests
npm test

# Run specific test suites
npm run test:build   # Hugo build validation
npm run test:json    # search.json output validation  
npm run test:html    # HTML partial rendering

# Or use shell scripts directly
./test/test.sh       # Mac/Linux
test\test.bat        # Windows
```

**Test coverage:**
| Suite | Validates |
|-------|-----------|
| Build | Hugo compiles without errors |
| JSON | Valid structure, required fields, relative URLs |
| HTML | CSS, inputs, widgets, scripts, accessibility |
| Assets | WASM/JS files exist in static/docfind/ |

## License

[MIT](LICENSE)

