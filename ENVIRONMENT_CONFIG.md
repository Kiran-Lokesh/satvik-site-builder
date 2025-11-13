# Environment Configuration

The frontend now supports environment-based background colors to help visually distinguish between different environments.

## Environment Types

- **local**: Local development environment (blue-tinted background)
- **test**: Test/QA environment (yellow-tinted background)  
- **prod**: Production environment (default warm cream background)

## Visual Differences

Each environment has distinct visual styling to help you quickly identify which environment you're in:

### Background Colors
- **Local**: Blue-tinted background (`hsl(210 50% 95%)`)
- **Test**: Yellow-tinted background (`hsl(45 50% 95%)`)
- **Prod**: Warm cream background (`hsl(48 56% 98%)`) - the existing default

### Header Colors
- **Local**: Light blue header
- **Test**: Light yellow header
- **Prod**: Golden header (original accent color)

### Environment Badge
- A colored badge in the top-right corner shows "ENV: LOCAL" (blue) or "ENV: TEST" (yellow)
- **No badge is shown in production** to keep the UI clean for end users

## Setting the Environment

### Option 1: Using NPM Scripts (Easiest)

Use the convenient npm scripts that have been added to `package.json`:

```bash
# Run in local environment (blue-tinted background)
npm run dev:local

# Run in test environment (yellow-tinted background)
npm run dev:test

# Run in production environment (default cream background)
npm run dev

# Build for specific environments
npm run build:local
npm run build:test
npm run build:prod
```

### Option 2: Using Environment Variables

Create a `.env` file in the `satvik-site-builder` directory:

```bash
# For local development
VITE_ENVIRONMENT=local
VITE_DATA_SOURCE=local

# For test environment
VITE_ENVIRONMENT=test
VITE_DATA_SOURCE=backend

# For production
VITE_ENVIRONMENT=prod
VITE_DATA_SOURCE=backend
```

### Option 3: Using Vite Environment-Specific Files

You can also create environment-specific files:

- `.env.local` - Used during local development
- `.env.test` - Used for test builds
- `.env.production` - Used for production builds

Example `.env.local`:
```bash
VITE_ENVIRONMENT=local
VITE_DATA_SOURCE=local
```

### Option 4: Command Line

You can also set the environment variable when running the build:

```bash
# For local
VITE_ENVIRONMENT=local npm run dev

# For test
VITE_ENVIRONMENT=test npm run build

# For production (default)
VITE_ENVIRONMENT=prod npm run build
```

## How It Works

1. The `getEnvironment()` function in `src/lib/config.ts` reads the `VITE_ENVIRONMENT` variable
2. On app startup, `App.tsx` applies a CSS class to the body element (e.g., `env-local`, `env-test`, `env-prod`)
3. The CSS in `src/index.css` defines different `--surface` color values for each environment
4. If no environment is specified, it defaults to `prod` for safety

## Verifying the Environment

When the app starts, check the console log:

```
🌍 Environment: LOCAL
```

You should also see a subtle color difference in the background based on the environment.

## Customizing Colors

### Background Colors

To adjust the environment-specific background colors, edit the CSS in `src/index.css`:

```css
/* Environment-specific background colors */
body.env-local {
  background-color: hsl(210 50% 95%) !important; /* Blue-tinted */
}

body.env-test {
  background-color: hsl(45 50% 95%) !important; /* Yellow-tinted */
}

body.env-prod {
  background-color: hsl(48 56% 98%) !important; /* Cream */
}
```

### Header Colors

To adjust the header colors, edit `src/components/Header.tsx`:

```typescript
const headerBgClass = 
  env === 'local' ? 'bg-blue-200/80' :
  env === 'test' ? 'bg-yellow-200/80' :
  'bg-accent'; // prod
```

The HSL format is: `hue saturation% lightness%`
- **Hue**: 0-360 (color wheel position)
- **Saturation**: 0-100% (color intensity)
- **Lightness**: 0-100% (brightness)

