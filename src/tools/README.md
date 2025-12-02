# Security Scanner

The SecurityScanner provides automated vulnerability detection for project dependencies using the [OSV.dev](https://osv.dev) API.

## Features

- **Multi-Ecosystem Support**: npm, PyPI, Go, Cargo, Maven, Packagist, RubyGems, NuGet
- **Comprehensive File Parsing**: Automatically discovers and parses dependency files
- **Structured Reports**: Returns detailed vulnerability information with severity levels
- **CVE Identification**: Includes CVE IDs, CVSS scores, and fix recommendations
- **Resilient API Access**: Implements retry logic and batch processing
- **Human-Readable Output**: Formatted reports for easy review

## Supported Dependency Files

| Ecosystem | Files |
|-----------|-------|
| npm | `package.json`, `package-lock.json` |
| Python | `requirements.txt`, `Pipfile`, `Pipfile.lock` |
| Rust | `Cargo.toml`, `Cargo.lock` |
| Go | `go.mod`, `go.sum` |
| Java/Maven | `pom.xml`, `build.gradle` |
| PHP | `composer.json` |
| Ruby | `Gemfile`, `Gemfile.lock` |
| .NET | `*.csproj` |

## Usage

### Basic Scan

```typescript
import { SecurityScanner } from '@adverant/nexus-cursor-plugin';

const scanner = new SecurityScanner('/path/to/project');
const result = await scanner.scan();

console.log(`Found ${result.totalVulnerabilities} vulnerabilities`);
console.log(`Critical: ${result.severityCounts.CRITICAL}`);
console.log(`High: ${result.severityCounts.HIGH}`);
```

### Formatted Report

```typescript
import { SecurityScanner } from '@adverant/nexus-cursor-plugin';

const scanner = new SecurityScanner('/path/to/project');
const result = await scanner.scan();

// Generate human-readable report
const report = SecurityScanner.formatScanResult(result);
console.log(report);
```

### Example Output

```
═══════════════════════════════════════════════════════
         SECURITY VULNERABILITY SCAN REPORT
═══════════════════════════════════════════════════════

Project: /path/to/project
Scanned: 2025-12-02T19:00:00.000Z
Duration: 12.45s

─────────────────────────────────────────────────────
  SUMMARY
─────────────────────────────────────────────────────
Total Dependencies:        42
Vulnerable Dependencies:   3
Total Vulnerabilities:     5

Severity Breakdown:
  CRITICAL: 1
  HIGH:     2
  MEDIUM:   2
  LOW:      0
  UNKNOWN:  0

─────────────────────────────────────────────────────
  VULNERABILITIES
─────────────────────────────────────────────────────

📦 lodash@4.17.0 (npm)
   File: package.json

   🔴 [CRITICAL] GHSA-jf85-cpcp-j695
      Prototype Pollution in lodash
      CVSS: 9.8
      CVEs: CVE-2019-10744
      Fixed in: 4.17.12
      References:
        - https://github.com/advisories/GHSA-jf85-cpcp-j695
        - https://nvd.nist.gov/vuln/detail/CVE-2019-10744
```

## API Reference

### SecurityScanner

#### Constructor

```typescript
constructor(projectPath: string)
```

Creates a new SecurityScanner instance.

**Parameters:**
- `projectPath` - Absolute path to the project directory to scan

#### Methods

##### scan()

```typescript
async scan(): Promise<ScanResult>
```

Scans the project for security vulnerabilities.

**Returns:** `Promise<ScanResult>` - Detailed scan results

**Throws:** `Error` if scan fails

##### formatScanResult()

```typescript
static formatScanResult(result: ScanResult): string
```

Formats a scan result into a human-readable report.

**Parameters:**
- `result` - The scan result to format

**Returns:** `string` - Formatted report text

### Types

#### ScanResult

```typescript
interface ScanResult {
  timestamp: Date;
  projectPath: string;
  totalDependencies: number;
  vulnerableDependencies: number;
  totalVulnerabilities: number;
  severityCounts: Record<Severity, number>;
  reports: VulnerabilityReport[];
  scanDuration: number;
}
```

#### VulnerabilityReport

```typescript
interface VulnerabilityReport {
  dependency: Dependency;
  vulnerabilities: Vulnerability[];
}
```

#### Vulnerability

```typescript
interface Vulnerability {
  id: string;
  summary: string;
  details?: string;
  severity: Severity;
  cvss?: number;
  cveIds: string[];
  affectedVersions: string[];
  fixedVersions: string[];
  references: string[];
  publishedAt?: string;
  modifiedAt?: string;
}
```

#### Dependency

```typescript
interface Dependency {
  name: string;
  version: string;
  ecosystem: Ecosystem;
  filePath: string;
  lineNumber?: number;
}
```

#### Severity

```typescript
type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
```

#### Ecosystem

```typescript
type Ecosystem =
  | 'npm'
  | 'PyPI'
  | 'Go'
  | 'crates.io'
  | 'Maven'
  | 'Packagist'
  | 'RubyGems'
  | 'NuGet';
```

## OSV.dev API

The SecurityScanner uses the [OSV.dev API](https://osv.dev) for vulnerability data. This API:

- Is free and doesn't require authentication
- Provides comprehensive vulnerability data
- Covers multiple ecosystems
- Returns structured JSON responses
- Includes CVE IDs, CVSS scores, and fix information

### API Endpoint

```
POST https://api.osv.dev/v1/query
```

### Request Format

```json
{
  "package": {
    "name": "lodash",
    "ecosystem": "npm"
  },
  "version": "4.17.0"
}
```

## Implementation Details

### Dependency Discovery

The scanner automatically discovers dependency files by searching for known patterns:
- Uses glob patterns to find files
- Ignores common directories (`node_modules`, `vendor`, `dist`, `build`)
- Deduplicates discovered files
- Supports nested project structures

### Parsing Strategy

Each dependency file type has a custom parser:
- **JSON files**: Uses `JSON.parse()` with error handling
- **Text files**: Uses regex patterns to extract dependencies
- **XML files**: Uses simple regex-based XML parsing
- **TOML-like files**: Uses regex patterns for TOML-style syntax

### API Resilience

The scanner implements several strategies for API resilience:
- **Batch Processing**: Processes dependencies in batches of 10
- **Retry Logic**: Retries failed requests up to 3 times with exponential backoff
- **Rate Limiting**: Small delays between batches (100ms)
- **Timeout**: 30-second timeout per request
- **Error Handling**: Graceful degradation on API errors

### Version Cleaning

Version strings are cleaned to extract pure semver versions:
- Removes `^`, `~`, `>=`, `<=` operators
- Extracts `major.minor.patch` format
- Handles complex version specifications

## Error Handling

The SecurityScanner handles errors gracefully:

```typescript
try {
  const result = await scanner.scan();
} catch (error) {
  // Scanner logs errors via pino
  console.error('Scan failed:', error);
}
```

Errors are logged with structured data including:
- Dependency name and version
- File path and line number (if available)
- Error type and message
- Retry attempts

## Performance Considerations

- **Batch Size**: 10 dependencies per batch (configurable)
- **Rate Limiting**: 100ms delay between batches
- **Timeout**: 30s per API request
- **Retry Delay**: Exponential backoff (1s, 2s, 3s)

For large projects with 100+ dependencies:
- Typical scan time: 10-30 seconds
- API requests: ~10-15 batches
- Memory usage: Minimal (streaming parsers)

## Limitations

1. **Version Ranges**: Only exact versions are queried (not ranges)
2. **Indirect Dependencies**: Only direct dependencies are scanned
3. **Private Packages**: OSV.dev only covers public packages
4. **API Rate Limits**: Respects OSV.dev rate limits via delays

## Future Enhancements

- [ ] Support for indirect/transitive dependencies
- [ ] Batch query API support (if OSV.dev adds it)
- [ ] Caching of vulnerability data
- [ ] Integration with CI/CD pipelines
- [ ] Custom severity thresholds
- [ ] Exclude/ignore list for known false positives
- [ ] Export formats (JSON, CSV, SARIF)
- [ ] Remediation suggestions with upgrade paths

## See Also

- [OSV.dev Documentation](https://osv.dev/docs/)
- [OSV Schema](https://ossf.github.io/osv-schema/)
- [Example Usage](../../examples/security-scan-example.ts)
