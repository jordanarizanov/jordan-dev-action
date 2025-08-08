# LOCI GitHub Action

**Line of Code Insights (LOCI) GitHub Action** provides two main modes:

- `upload`: Uploads built binaries to the LOCI backend for analysis.
- `insights`: Retrieves function-level insights from the LOCI backend.

---

## Usage

Here’s a typical workflow example showing how to use this action:

```yaml
name: Example LOCI Workflow

on:
  push:
  workflow_dispatch:

jobs:
  loci:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout project
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Build binaries
        run: |
          cmake -B build
          make -C build

      - name: LOCI Upload
        id: loci-upload
        uses: auroralabs-mkd/loci-action@v1
        env:
          LOCI_BACKEND_URL: ${{ secrets.LOCI_BACKEND_URL }}
          LOCI_API_KEY: ${{ secrets.LOCI_API_KEY }}
        with:
          mode: upload
          binaries: |
            ./build/bin/app
            ./build/lib/lib.so
          project: MyProject

      - name: LOCI Insights
        uses: auroralabs-mkd/loci-action@v1
        env:
          LOCI_BACKEND_URL: ${{ secrets.LOCI_BACKEND_URL }}
          LOCI_API_KEY: ${{ secrets.LOCI_API_KEY }}
        with:
          mode: insights
          project: MyProject
          version: ${{ steps.loci-upload.outputs.version }}
```

	
> ⚠️ Ensure that your **LOCI_BACKEND_URL** and **LOCI_API_KEY** are set as GitHub Secrets before using this action.