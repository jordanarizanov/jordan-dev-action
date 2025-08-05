# jordan GitHub Action

Line of Code Insights (jordan) GitHub Action for analyzing and uploading binary files to get function insights.

## Features

- **Upload Mode**: Upload binary files to jordan for analysis
- **Insights Mode**: Retrieve function insights from previously uploaded projects
- **Secure**: Uses GitHub Secrets for API token management
- **Flexible**: Supports multiple binary files and project versions

## Usage

### Basic Upload Example

```yaml
name: Upload to jordan
on: [push]
jobs:
  upload:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Upload to jordan
        uses: your-username/loci-dev-action@v1.0.0
        with:
          mode: upload
          project: my-project
          version: v1.0.0
          binaries: |
            build/app
            build/lib
          api-token: ${{ secrets.LOCI_API_TOKEN }}
```

### Basic Insights Example

```yaml
name: Get jordan Insights
on: [workflow_dispatch]
jobs:
  insights:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Get jordan Insights
        uses: your-username/loci-dev-action@v1.0.0
        with:
          mode: insights
          project: my-project
          version: v1.0.0
          api-token: ${{ secrets.LOCI_API_TOKEN }}
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `mode` | Mode to run: `upload` or `insights` | Yes | - |
| `project` | Name of the project | Yes | - |
| `version` | Version of the project | Yes | - |
| `binaries` | Paths to binaries (newline-separated, upload mode only) | No* | - |
| `api-token` | jordan API token for authentication | Yes | - |
| `requirements-file` | Path to requirements.txt | No | `requirements.txt` |

*Required for upload mode

## Security Best Practices

### 1. API Token Management

**✅ DO:**
- Store your jordan API token as a GitHub Secret
- Use `${{ secrets.jordan_API_TOKEN }}` in your workflow
- Never hardcode tokens in your workflow files

**❌ DON'T:**
- Commit API tokens to your repository
- Use environment variables that might be exposed
- Share your API token publicly

### 2. Repository Security

```yaml
# In your workflow file
- name: Upload to jordan
  uses: your-username/jordan-dev-action@v1.0.0
  with:
    mode: upload
    project: ${{ github.repository }}
    version: ${{ github.sha }}
    binaries: |
      build/app
    api-token: ${{ secrets.jordan_API_TOKEN }}  # ✅ Secure
```

### 3. Setting Up GitHub Secrets

1. Go to your repository settings
2. Navigate to "Secrets and variables" → "Actions"
3. Click "New repository secret"
4. Name: `jordan_API_TOKEN`
5. Value: Your jordan API token

## Advanced Usage

### Multiple Binary Files

```yaml
- name: Upload Multiple Binaries
  uses: your-username/jordan-dev-action@v1.0.0
  with:
    mode: upload
    project: my-project
    version: v1.0.0
    binaries: |
      build/app
      build/lib/lib1.so
      build/lib/lib2.so
      dist/package.tar.gz
    api-token: ${{ secrets.jordan_API_TOKEN }}
```

### Conditional Upload

```yaml
- name: Upload to jordan
  if: github.ref == 'refs/heads/main'
  uses: your-username/jordan-dev-action@v1.0.0
  with:
    mode: upload
    project: ${{ github.repository }}
    version: ${{ github.sha }}
    binaries: |
      build/app
    api-token: ${{ secrets.jordan_API_TOKEN }}
```

## Publishing Your Action

### 1. Create a Release

```bash
git tag v1.0.0
git push origin v1.0.0
```

### 2. Create a GitHub Release

1. Go to your repository on GitHub
2. Click "Releases" → "Create a new release"
3. Choose the tag you just created
4. Add release notes
5. Publish the release

### 3. Users Can Then Use

```yaml
- uses: your-username/jordan-dev-action@v1.0.0
```

## Development

### Local Testing

```bash
# Install dependencies
npm install

# Build the action
npm run build
```

### Structure

```
jordan-dev-action/
├── action.yml              # Main action definition
├── .github/actions/        # Reusable action components
│   ├── common/            # Common setup
│   ├── upload/            # Upload functionality
│   └── insights/          # Insights functionality
├── examples/              # Usage examples
└── README.md             # This file
```

## License

[Choose your license here]

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
- Create an issue in this repository
- Check the [jordan documentation](https://your-jordan-docs-url)