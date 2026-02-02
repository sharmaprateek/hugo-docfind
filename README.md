# Hugo DocFind Module

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Seamless integration of [Microsoft DocFind](https://github.com/microsoft/docfind) for Hugo sites.

**Author**: [Prateek Sharma](https://www.sharmaprateek.com)

## Features
- **High Performance**: WebAssembly-based client-side search.
- **Easy Integration**: Drop-in partials for search UI.
- **Zero Config**: Automatically generates the required search index.
- **Smart Build**: Works with `hugo server` or static builds.

## Guides
- [PaperMod Integration Guide](docs/integration-papermod.md) - Detailed setup for Hugo PaperMod.


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

    [outputFormats.SearchIndex]
      mediaType = "application/json"
      baseName = "search"
      isPlainText = true
      notAlternative = true
    
    [outputs]
      home = ["HTML", "RSS", "SearchIndex"]

    # Required for Deep Linking (generates IDs for headings)
    [markup.goldmark.parser]
      attribute = true
      autoHeadingID = true
    ```



3.  **Add Partials**:
    Inside your templates (e.g., `baseof.html` or a sidebar partial):
    
    *Add Styles (Head)*:
    ```html
    {{ partial "docfind/head.html" . }}
    ```
    > [!TIP]
    > **Custom Styling**: The default styles are minimal. You may need to add your own CSS to match your site's theme (e.g., overriding colors, z-index, or font-family). You can do this by adding a `<style>` block or your own CSS file *after* the `docfind/head.html` partial.

    
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

4.  **Setup Build Scripts**:
    The build/indexing scripts are **not** automatically installed by Hugo modules. You must copy them manually:
    - Download `bin/build.bat` and `bin/build_search.ps1` (for Windows) or `bin/build_search.sh` (for Mac/Linux) from this repo.
    - Place them in a `bin/` folder in your project root.


## How to Update

To update the module:
1.  **Fetch Update**: `hugo mod get -u github.com/sharmaprateek/hugo-docfind`
2.  **Vendor (Optional)**: If you are using vendoring (recommended for stable builds), run `hugo mod vendor`.
3.  **Rebuild Index**: Run `.\bin\build.bat` to update local assets.

## Design Decisions
- **Smart Wrapper**: The build scripts (`build.bat`, `build_search.ps1`) automatically detect if `hugo server` is running to fetch fresh content, or fall back to a static build.

## How Indexing Works
`docfind` uses **Section-Level Indexing** to provide precise deep links. Instead of indexing entire pages, it breaks content down by `<h2>` headings.

### Architectural Improvements
1.  **Deep Linking**: Search results point directly to the relevant section (e.g., `/configuration/#advanced-settings`) rather than the top of the page.
2.  **Higher Relevance**: Long pages don't dilute search scores. If a keyword appears in a specific section, that section matches strongly.
3.  **No Dependencies**: Indexing happens entirely within Hugo templates using a "Double Split" technique—no external Node.js or Python scripts required.

### The "Double Split" Logic
The `index.searchindex.json` template parses content in two steps:
1.  **Split by `<h2`**: Identifies the start of a content chunk.
2.  **Split by `</h2>`**: Isolates the header (for extracting ID/Title) from the body content. 
This ensures HTML attributes don't leak into the searchable text.

Because of this specific logic, `docfind` is a **keyword search engine**, optimized for speed and structure over generic full-text matching. It uses RAKE (Rapid Automatic Keyword Extraction) on the client side to match user queries against these pre-indexed sections.

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
# Run all tests
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

