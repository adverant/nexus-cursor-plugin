#!/usr/bin/env node
/**
 * Example: Security Scanner Usage
 *
 * This example demonstrates how to use the SecurityScanner to scan
 * a project for known vulnerabilities using the OSV.dev API.
 *
 * Usage:
 *   npx tsx examples/security-scan-example.ts [project-path]
 */

import { SecurityScanner } from '../src/tools/security-scanner.js';
import path from 'path';

async function main() {
  const projectPath =
    process.argv[2] || path.resolve(process.cwd(), '..', 'Adverant-Nexus');

  console.log('🔍 Starting Security Scan...');
  console.log(`📁 Project: ${projectPath}`);
  console.log('');

  try {
    const scanner = new SecurityScanner(projectPath);
    const result = await scanner.scan();

    // Display formatted report
    console.log(SecurityScanner.formatScanResult(result));

    // Exit with appropriate code
    if (result.totalVulnerabilities > 0) {
      if (result.severityCounts.CRITICAL > 0) {
        console.error('❌ CRITICAL vulnerabilities found! Please fix immediately.');
        process.exit(2);
      } else if (result.severityCounts.HIGH > 0) {
        console.warn('⚠️  HIGH severity vulnerabilities found! Please address soon.');
        process.exit(1);
      } else {
        console.log('⚠️  Some vulnerabilities found, but none are critical.');
        process.exit(0);
      }
    } else {
      console.log('✅ No vulnerabilities found!');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Security scan failed:', error);
    process.exit(1);
  }
}

main();
