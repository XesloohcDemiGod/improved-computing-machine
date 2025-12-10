# Sookti SAP Automator - Usage Guide

## Overview

Sookti SAP Automator is a production-ready Playwright-based automation framework for SAP systems. It provides modular automation capabilities for SAP WebGUI with intelligent orchestration, screenshot verification, and security compliance.

## Project Structure

```
sookti-sap-automator/
├── packages/
│   ├── ai-orchestrator/          # AI-powered task orchestration
│   ├── assistant-browser/        # Browser automation utilities
│   └── assistant-sap-playwright/ # SAP-specific Playwright implementation
├── demo-automation.ts            # Sample automation script
├── .env.local                    # Environment configuration (sensitive)
└── package.json                  # Workspace configuration
```

## Installation

```bash
# Install dependencies
npm install

# Build all packages
npm run build
```

## Configuration

Create a `.env.local` file with SAP system credentials:

```env
SAP_USERNAME=your_sap_user
SAP_PASSWORD=your_sap_password
SAP_GATEWAY_HOST=your_sap_gateway
SAP_GATEWAY_PORT=3200
SAP_CLIENT=100
OPENAI_API_KEY=your_openai_key
```

## Core Modules

### 1. ScreenshotModule

Captures and verifies screenshots for visual testing.

```typescript
import { ScreenshotModule } from '@improved-computing/assistant-browser';

const screenshot = new ScreenshotModule(page);
await screenshot.captureAndSave('transaction_MM01');
```

### 2. CloneStreamModule

Manages efficient resource streaming and cloning.

```typescript
import { CloneStreamModule } from '@improved-computing/assistant-browser';

const stream = new CloneStreamModule();
const cloned = await stream.clone(originalData);
```

### 3. Orchestrator (OrchestratorV2)

Orchestrates complex automation workflows with AI assistance.

```typescript
import { OrchestratorV2 } from '@improved-computing/assistant-browser';

const orchestrator = new OrchestratorV2(page, apiKey);
await orchestrator.executeWorkflow({
  id: 'create-po',
  description: 'Create Purchase Order in Fiori',
  steps: [
    { action: 'navigate', target: 'https://sap-system/fiori' },
    { action: 'click', selector: '[data-test-id="create-po"]' },
    // ... more steps
  ]
});
```

### 4. KeyboardNavigation

Provides SAP GUI keyboard navigation utilities.

```typescript
import { KeyboardNavigation } from '@improved-computing/assistant-browser';

const nav = new KeyboardNavigation(page);
await nav.pressKey('F8');  // Execute (SAP)
await nav.enterField('value');
```

### 5. SecurityCompliance

Ensures secure handling of credentials and sensitive data.

```typescript
import { SecurityCompliance } from '@improved-computing/assistant-browser';

const security = new SecurityCompliance();
const encrypted = await security.encrypt(sensitiveData);
```

## Running Automation

### Basic Example

```bash
# Run demo automation
npm run demo
```

### Custom Automation

Create a script in your project:

```typescript
import { chromium } from 'playwright';
import { Orchestrator } from '@improved-computing/assistant-browser';

async function runAutomation() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const orchestrator = new Orchestrator(page);
  
  // Navigate to SAP system
  await page.goto('https://your-sap-system');
  
  // Perform automation
  await orchestrator.execute({
    task: 'MM01', // Create Material in SAP
    data: {
      material: 'NEW-MAT-001',
      description: 'Test Material'
    }
  });
  
  await browser.close();
}

runAutomation();
```

## Testing

```bash
# Run tests for all packages
npm run test

# Run tests for specific package
npm run test -w packages/assistant-sap-playwright
```

## Advanced Features

### AI-Powered Orchestration

The AI Orchestrator can analyze SAP screens and suggest next steps:

```typescript
const recommendation = await orchestrator.analyzeScreen();
console.log(recommendation.suggestedActions);
```

### Screenshot Verification

Automatically verify visual consistency:

```typescript
const screenshot = new ScreenshotModule(page);
await screenshot.compare('baseline.png', 'current.png');
```

### Multi-System Support

Automation supports multiple SAP systems via environment configuration:

```typescript
// Configure per system in .env.local
SAP_SYSTEMS=sookti:dev,sookti:test,sookti:prod
```

## Troubleshooting

### Connection Issues

1. Verify SAP gateway host and port in `.env.local`
2. Check firewall rules allow outbound connections
3. Ensure VPN connection is active (if required)

### Timeout Errors

- Increase timeout in page.waitForNavigation()
- Check SAP system performance
- Verify network latency

### Authentication Failures

- Validate credentials in `.env.local`
- Check if SAP user is locked
- Verify two-factor authentication settings

## Performance Optimization

- Use headless mode for faster execution
- Parallelize independent tasks
- Cache frequently accessed data
- Monitor memory usage with large datasets

## Security Best Practices

✓ Never commit `.env.local` to version control
✓ Rotate credentials regularly
✓ Use least-privilege SAP user accounts
✓ Enable audit logging for all automation runs
✓ Encrypt sensitive data at rest and in transit

## API Documentation

Full API documentation is available in the `packages/` directory:

- `packages/assistant-browser/dist/` - Type definitions (.d.ts files)
- `packages/assistant-sap-playwright/dist/` - SAP-specific APIs
- `packages/ai-orchestrator/dist/` - Orchestration APIs

## Support and Contribution

For issues or contributions:

1. Check existing documentation
2. Review demo-automation.ts for examples
3. Examine type definitions for API contracts
4. Contact Sookti development team

## Version Information

- Framework Version: 1.0.0
- Playwright: 1.40.0+
- Node.js: 18.0.0+
- TypeScript: 5.0.0+

