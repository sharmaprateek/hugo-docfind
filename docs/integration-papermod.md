
# Hugo DocFind Integration Guide: PaperMod

A detailed guide for integrating [hugo-docfind](https://github.com/sharmaprateek/hugo-docfind) with Hugo sites, particularly those using the **PaperMod** theme.

> [!NOTE]
> This guide complements the official module README with real-world integration details and troubleshooting.

## Prerequisites

- Hugo Extended (v0.112+)
- Go installed (for Hugo modules)
- PowerShell (Windows) or Bash (macOS/Linux)

---

## Step 1: Initialize Hugo Modules

If your project doesn't have a `go.mod` file yet:

```bash
hugo mod init github.com/YOUR_USERNAME/YOUR_SITE_NAME
```

> [!WARNING]
> If you already have the module import in `hugo.toml` before initializing, you'll get an error. Temporarily comment out the `[module]` section first, run `hugo mod init`, then uncomment.

---

## Step 2: Configure hugo.toml

Add these sections to your `hugo.toml`:

```toml
[module]
  [[module.imports]]
    path = "github.com/sharmaprateek/hugo-docfind"

[outputs]
  home = ["HTML", "RSS", "SearchIndex"]

[outputFormats.SearchIndex]
  mediaType = "application/json"
  baseName = "search"
  isPlainText = true
  notAlternative = true

[markup.goldmark.parser]
  attribute = true
  autoHeadingID = true
```

Then fetch the module:

```bash
hugo mod get github.com/sharmaprateek/hugo-docfind
```

---

## Step 3: Add Partials (PaperMod Theme)

PaperMod provides extension hooks. **Do NOT edit files inside `themes/PaperMod/`** — use Hugo's layout override system instead.

### 3.1 Add CSS (extend_head.html)

Edit or create `layouts/partials/extend_head.html`:

```html
<!-- Your existing content -->
{{- partial "docfind/head.html" . -}}

<style>
/* ... your existing overrides ... */
</style>
```

### 3.2 Add Scripts (extend_footer.html)

Create `layouts/partials/extend_footer.html`:

```html
{{- partial "docfind/scripts.html" . -}}
```

### 3.3 Add Search Widget (header.html override)

Copy the theme's header to your layouts so you can customize it:

**Windows (PowerShell)**:
```powershell
Copy-Item "themes\PaperMod\layouts\partials\header.html" "layouts\partials\header.html"
```

**macOS / Linux**:
```bash
mkdir -p layouts/partials
cp themes/PaperMod/layouts/partials/header.html layouts/partials/header.html
```

Edit `layouts/partials/header.html` and add before `</header>`:

```html
    </nav>
    {{- partial "docfind/search-expandable.html" . -}}
</header>
```

---

## Step 4: Download Build Scripts

The build scripts are **not included** in the Hugo module. You must download them manually.

**1. Create bin directory**:

*Windows (PowerShell)*:
```powershell
New-Item -ItemType Directory -Path bin -Force
```

*macOS / Linux*:
```bash
mkdir -p bin
```

**2. Download Scripts**:
Download the scripts from the [repo's bin directory](https://github.com/sharmaprateek/hugo-docfind/tree/main/bin) and place them in your new `bin/` folder.

Your `bin/` directory should contain:
- `build.bat` (Windows)
- `build_search.ps1` (Windows PowerShell script)
- `build_search.sh` (macOS/Linux Shell script)

---

## Step 5: Build the Search Index

### Development (with hugo server running)

**Windows**:
```powershell
# Terminal 1: Start Hugo server
hugo server

# Terminal 2: Run build script
.\bin\build.bat
```

**macOS / Linux**:
```bash
# Terminal 1: Start Hugo server
hugo server

# Terminal 2: Run build script (make executable first)
chmod +x bin/build_search.sh
./bin/build_search.sh
```

### Production (static build)

**Windows**:
```powershell
.\bin\build.bat
```

**macOS / Linux**:
```bash
./bin/build_search.sh
```

The script will:
1. Install DocFind binary if missing
2. Fetch `search.json` from server (or run `hugo --minify`)
3. Generate assets in `static/docfind/`

---

## Troubleshooting

### Module Not Found on Init

**Symptom**: `module "github.com/..." not found` when running `hugo mod init`.

**Solution**: Comment out the `[module]` section in `hugo.toml`, run init, then uncomment and run `hugo mod get`.

### Search Not Working

1. Verify `search.json` is generated: visit `http://localhost:1313/search.json`
2. Check `static/docfind/` contains WASM/JS files after running build script
3. Ensure all three partials are included (head, scripts, search widget)

---

## Maintenance: How to Update

Since this project uses **vendoring** (files stored in `_vendor/`), updating requires an extra step:

1. **Fetch the latest update**:
   ```powershell
   hugo mod get -u github.com/sharmaprateek/hugo-docfind
   ```

2. **Update the vendor directory** (Important!):
   ```powershell
   hugo mod vendor
   ```
   *If you skip this, Hugo will keep using the old files from `_vendor/`.*

3. **Rebuild local search assets**:
   *   Windows: `.\bin\build.bat`
   *   macOS/Linux: `./bin/build_search.sh`

