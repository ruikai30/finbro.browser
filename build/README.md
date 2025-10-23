# Build Assets

This directory contains assets used during the build process.

## Icons

Place your application icons here:

- **icon.icns** - macOS icon (512x512 or higher)
- **icon.ico** - Windows icon (256x256 or higher)
- **icon.png** - Linux icon (512x512 PNG)

## Icon Requirements

### macOS (.icns)
- Use `iconutil` to convert PNG to ICNS
- Recommended size: 1024x1024

### Windows (.ico)
- Use an icon converter tool
- Include multiple sizes: 16x16, 32x32, 48x48, 256x256

### Linux (.png)
- Simple PNG file
- Recommended size: 512x512

## Creating Icons

You can use online tools like:
- [iConvert Icons](https://iconverticons.com/)
- [Cloudconvert](https://cloudconvert.com/png-to-ico)

Or command-line tools:
- ImageMagick: `convert icon.png -resize 256x256 icon.ico`
- iconutil (macOS): `iconutil -c icns icon.iconset`

## Placeholder

For development, the app will use default Electron icons if these files are missing.

