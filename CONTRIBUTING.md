# Contributing to Hugo DocFind

Thank you for your interest in contributing!

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Install [Hugo](https://gohugo.io/) (extended version recommended)
4. Install [DocFind](https://github.com/microsoft/docfind)

## Development

```bash
cd exampleSite
hugo server
```

In another terminal, run the build script to generate search assets:

```bash
# Windows
..\bin\build.bat

# Mac/Linux
../bin/build_search.sh
```

## Pull Requests

1. Create a feature branch from `main`
2. Make your changes
3. Test with the exampleSite
4. Submit a PR with a clear description

## Code Style

- Use consistent indentation (2 spaces for HTML/CSS, 4 for JS)
- Keep commits focused and atomic
- Write clear commit messages

## Reporting Issues

Please include:
- Hugo version (`hugo version`)
- OS and browser details
- Steps to reproduce
- Expected vs actual behavior
