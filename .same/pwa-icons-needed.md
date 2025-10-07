# PWA Icons Required

The FitTracker PWA requires the following icon files in the `/public` directory:

## Required Icon Files:
- `icon-192x192.png` - 192x192 pixels (maskable/any purpose)
- `icon-256x256.png` - 256x256 pixels
- `icon-384x384.png` - 384x384 pixels
- `icon-512x512.png` - 512x512 pixels (main app icon)

## Icon Design Guidelines:
- **Theme**: Fitness/health related with modern gradient design
- **Colors**: Primary blue (#2563eb) to green (#10b981) gradient
- **Style**: Modern, minimalist with fitness symbols (dumbbell, heart, running person)
- **Background**: Can include subtle gradients matching app theme
- **Contrast**: High contrast for visibility on various backgrounds

## Temporary Solution:
For development/demo purposes, you can:
1. Use placeholder icons from any icon generator
2. Create simple colored squares with "FT" text
3. Use fitness-related emoji as temporary icons (💪, 🏃‍♂️, ❤️)

## Online Icon Generators:
- PWA Builder Icon Generator: https://www.pwabuilder.com/imageGenerator
- RealFaviconGenerator: https://realfavicongenerator.net/
- PWA Asset Generator: https://github.com/onderceylan/pwa-asset-generator

## Icon Specifications:
- Format: PNG (preferred) or JPEG
- Compression: Optimized for web
- Purpose: "any" for regular icons, "maskable" for adaptive icons
- Background: Can be transparent for certain sizes

The manifest.json file is already configured to use these icons with proper purpose attributes.
