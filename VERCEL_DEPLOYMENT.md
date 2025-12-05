# Vercel Deployment Configuration

## Build Configuration

This project uses Vite and builds to the `dist` directory by default. The build script is configured as:

```json
"build": "vite build --config config/vite.config.ts --outDir dist"
```

## Vercel Project Settings

For Vercel to correctly deploy this project, ensure the following settings in your Vercel project dashboard:

1. **Framework Preset**: Select "Vite" (or "Other" if Vite is not available)
2. **Build Command**: `npm run build` (or leave empty for auto-detection)
3. **Output Directory**: `dist` (this is critical - Vercel should auto-detect this for Vite projects, but verify it's set correctly)
4. **Install Command**: `npm install` (default)

## Common Issues and Solutions

### Missing public directory error

If you encounter "Missing public directory" error:

1. Verify that the **Output Directory** in Vercel project settings is set to `dist`
2. Ensure the build command completes successfully and generates files in the `dist` directory
3. Check that `vercel.json` doesn't conflict with the output directory setting

### Build script issues

The build script explicitly specifies the output directory:
- Build command: `vite build --config config/vite.config.ts --outDir dist`
- This ensures consistent output location regardless of Vite config

### Verifying Build Output

To verify the build works locally:

```bash
npm install
npm run build
ls -la dist  # Should show built files
```

## Configuration Files

- `vercel.json`: Contains routing, headers, and environment configuration
- `package.json`: Contains build scripts and dependencies
- `config/vite.config.ts`: Main Vite configuration (outputs to `dist`)

## Notes

- The `public` directory contains static assets that are copied to the output directory during build
- The build output goes to `dist`, which is what Vercel serves
- Vercel should auto-detect Vite projects and configure `dist` as the output directory automatically
