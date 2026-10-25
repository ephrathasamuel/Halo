const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');

/**
 * Utility to parse hex color to [r, g, b]
 */
function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Linear interpolation between two RGB colors
 */
function lerpRgb(c1, c2, t) {
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * t),
    Math.round(c1[1] + (c2[1] - c1[1]) * t),
    Math.round(c1[2] + (c2[2] - c1[2]) * t),
  ];
}

/**
 * Generate a rich textured gradient JPEG image.
 */
function createPlaceholderImage({
  width,
  height,
  color1, // [r, g, b]
  color2, // [r, g, b]
  accentColor = [212, 175, 55], // Gold accent
  pattern = 'gradient',
}) {
  const frameData = Buffer.alloc(width * height * 4);

  const cx = width / 2;
  const cy = height / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Diagonal gradient factor (0 to 1)
      const diag = (x / width) * 0.6 + (y / height) * 0.4;
      let rgb = lerpRgb(color1, color2, diag);

      // Vignette effect (subtle darkening towards corners)
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) / maxDist;
      const vignette = 1 - Math.pow(dist, 2) * 0.35;

      rgb[0] = Math.round(rgb[0] * vignette);
      rgb[1] = Math.round(rgb[1] * vignette);
      rgb[2] = Math.round(rgb[2] * vignette);

      // Geometric accent border or badge
      const borderSize = 4;
      const isBorder =
        x < borderSize ||
        x >= width - borderSize ||
        y < borderSize ||
        y >= height - borderSize;

      if (isBorder) {
        rgb = lerpRgb(rgb, accentColor, 0.4);
      }

      // Center decorative badge / subtle circle
      const centerDist = Math.sqrt(dx * dx + dy * dy);
      if (pattern === 'logo' && centerDist < Math.min(width, height) * 0.32) {
        // Inner circle
        const ringDist = Math.abs(centerDist - Math.min(width, height) * 0.3);
        if (ringDist < 3) {
          rgb = accentColor;
        } else if (centerDist < Math.min(width, height) * 0.3) {
          rgb = lerpRgb(rgb, accentColor, 0.25);
        }
      }

      frameData[idx] = Math.min(255, Math.max(0, rgb[0]));
      frameData[idx + 1] = Math.min(255, Math.max(0, rgb[1]));
      frameData[idx + 2] = Math.min(255, Math.max(0, rgb[2]));
      frameData[idx + 3] = 255;
    }
  }

  const raw = { data: frameData, width, height };
  return jpeg.encode(raw, 88).data;
}

// Master image catalog matching seed data references
const IMAGES = [
  // --- Providers ---
  {
    path: 'public/images/providers/b-light-logo.jpg',
    width: 256,
    height: 256,
    color1: hexToRgb('#1E1E24'),
    color2: hexToRgb('#2D2A1C'),
    accentColor: hexToRgb('#D4AF37'),
    pattern: 'logo',
  },
  {
    path: 'public/images/providers/b-light-cover.jpg',
    width: 800,
    height: 400,
    color1: hexToRgb('#18181F'),
    color2: hexToRgb('#4A3E1B'),
    accentColor: hexToRgb('#D4AF37'),
  },
  {
    path: 'public/images/providers/merkato-frames-logo.jpg',
    width: 256,
    height: 256,
    color1: hexToRgb('#1B4332'),
    color2: hexToRgb('#2D6A4F'),
    accentColor: hexToRgb('#74C69D'),
    pattern: 'logo',
  },
  {
    path: 'public/images/providers/merkato-frames-cover.jpg',
    width: 800,
    height: 400,
    color1: hexToRgb('#081C15'),
    color2: hexToRgb('#2D6A4F'),
    accentColor: hexToRgb('#95D5B2'),
  },
  {
    path: 'public/images/providers/kazanchis-logo.jpg',
    width: 256,
    height: 256,
    color1: hexToRgb('#240046'),
    color2: hexToRgb('#7B2D8B'),
    accentColor: hexToRgb('#C77DFF'),
    pattern: 'logo',
  },
  {
    path: 'public/images/providers/kazanchis-cover.jpg',
    width: 800,
    height: 400,
    color1: hexToRgb('#10002B'),
    color2: hexToRgb('#5A189A'),
    accentColor: hexToRgb('#E0AAFF'),
  },
  {
    path: 'public/images/providers/gear-garage-logo.jpg',
    width: 256,
    height: 256,
    color1: hexToRgb('#3D0C02'),
    color2: hexToRgb('#C0392B'),
    accentColor: hexToRgb('#E74C3C'),
    pattern: 'logo',
  },
  {
    path: 'public/images/providers/gear-garage-cover.jpg',
    width: 800,
    height: 400,
    color1: hexToRgb('#1A0502'),
    color2: hexToRgb('#922B21'),
    accentColor: hexToRgb('#F1948A'),
  },
  {
    path: 'public/images/providers/habesha-logo.jpg',
    width: 256,
    height: 256,
    color1: hexToRgb('#4A235A'),
    color2: hexToRgb('#E67E22'),
    accentColor: hexToRgb('#F39C12'),
    pattern: 'logo',
  },
  {
    path: 'public/images/providers/habesha-cover.jpg',
    width: 800,
    height: 400,
    color1: hexToRgb('#2C1B10'),
    color2: hexToRgb('#BA4A00'),
    accentColor: hexToRgb('#F8C471'),
  },
  {
    path: 'public/images/providers/pixel-nest-logo.jpg',
    width: 256,
    height: 256,
    color1: hexToRgb('#154360'),
    color2: hexToRgb('#3498DB'),
    accentColor: hexToRgb('#85C1E9'),
    pattern: 'logo',
  },
  {
    path: 'public/images/providers/pixel-nest-cover.jpg',
    width: 800,
    height: 400,
    color1: hexToRgb('#0E2F44'),
    color2: hexToRgb('#2874A6'),
    accentColor: hexToRgb('#AED6F1'),
  },

  // --- Listings ---
  {
    path: 'public/images/listings/b-light-studio-1.jpg',
    width: 640,
    height: 440,
    color1: hexToRgb('#EAECEE'),
    color2: hexToRgb('#ABB2B9'),
    accentColor: hexToRgb('#D4AF37'),
  },
  {
    path: 'public/images/listings/b-light-studio-2.jpg',
    width: 640,
    height: 440,
    color1: hexToRgb('#2C3E50'),
    color2: hexToRgb('#4A6572'),
    accentColor: hexToRgb('#D4AF37'),
  },
  {
    path: 'public/images/listings/b-light-camera.jpg',
    width: 640,
    height: 440,
    color1: hexToRgb('#17202A'),
    color2: hexToRgb('#34495E'),
    accentColor: hexToRgb('#D4AF37'),
  },
  {
    path: 'public/images/listings/b-light-led.jpg',
    width: 640,
    height: 440,
    color1: hexToRgb('#FAD7A0'),
    color2: hexToRgb('#2E4053'),
    accentColor: hexToRgb('#F39C12'),
  },
  {
    path: 'public/images/listings/b-light-audio.jpg',
    width: 640,
    height: 440,
    color1: hexToRgb('#212F3D'),
    color2: hexToRgb('#5D6D7E'),
    accentColor: hexToRgb('#58D68D'),
  },
  {
    path: 'public/images/listings/b-light-wedding.jpg',
    width: 640,
    height: 440,
    color1: hexToRgb('#512E5F'),
    color2: hexToRgb('#B7950B'),
    accentColor: hexToRgb('#F4D03F'),
  },
  {
    path: 'public/images/listings/merkato-loft.jpg',
    width: 640,
    height: 440,
    color1: hexToRgb('#EDBB99'),
    color2: hexToRgb('#A04000'),
    accentColor: hexToRgb('#FADBD8'),
  },
  {
    path: 'public/images/listings/merkato-backdrop.jpg',
    width: 640,
    height: 440,
    color1: hexToRgb('#D5D8DC'),
    color2: hexToRgb('#A3E4D7'),
    accentColor: hexToRgb('#48C9B0'),
  },
  {
    path: 'public/images/listings/kazanchis-podcast.jpg',
    width: 640,
    height: 440,
    color1: hexToRgb('#2E1A47'),
    color2: hexToRgb('#5B2C6F'),
    accentColor: hexToRgb('#BB8FCE'),
  },
  {
    path: 'public/images/listings/kazanchis-mic.jpg',
    width: 640,
    height: 440,
    color1: hexToRgb('#1C2833'),
    color2: hexToRgb('#34495E'),
    accentColor: hexToRgb('#AF7AC5'),
  },
  {
    path: 'public/images/listings/gear-lens.jpg',
    width: 640,
    height: 440,
    color1: hexToRgb('#0B5345'),
    color2: hexToRgb('#117864'),
    accentColor: hexToRgb('#48C9B0'),
  },
  {
    path: 'public/images/listings/gear-drone.jpg',
    width: 640,
    height: 440,
    color1: hexToRgb('#1B4F72'),
    color2: hexToRgb('#5499C7'),
    accentColor: hexToRgb('#AED6F1'),
  },
  {
    path: 'public/images/listings/gear-tripod.jpg',
    width: 640,
    height: 440,
    color1: hexToRgb('#212F3D'),
    color2: hexToRgb('#34495E'),
    accentColor: hexToRgb('#E74C3C'),
  },
  {
    path: 'public/images/listings/gear-vintage.jpg',
    width: 640,
    height: 440,
    color1: hexToRgb('#4A235A'),
    color2: hexToRgb('#7E5109'),
    accentColor: hexToRgb('#DC7633'),
  },
  {
    path: 'public/images/listings/habesha-wedding.jpg',
    width: 640,
    height: 440,
    color1: hexToRgb('#78281F'),
    color2: hexToRgb('#D4AC0D'),
    accentColor: hexToRgb('#F7DC6F'),
  },
  {
    path: 'public/images/listings/habesha-corporate.jpg',
    width: 640,
    height: 440,
    color1: hexToRgb('#1A5276'),
    color2: hexToRgb('#2E4053'),
    accentColor: hexToRgb('#5DADE2'),
  },
  {
    path: 'public/images/listings/pixel-studio.jpg',
    width: 640,
    height: 440,
    color1: hexToRgb('#E5E8E8'),
    color2: hexToRgb('#BDC3C7'),
    accentColor: hexToRgb('#3498DB'),
  },
  {
    path: 'public/images/listings/pixel-rooftop.jpg',
    width: 640,
    height: 440,
    color1: hexToRgb('#7D3C98'),
    color2: hexToRgb('#D35400'),
    accentColor: hexToRgb('#F39C12'),
  },

  // --- Portfolio ---
  {
    path: 'public/images/portfolio/b-light-wedding-1.jpg',
    width: 640,
    height: 440,
    color1: hexToRgb('#641E16'),
    color2: hexToRgb('#B7950B'),
    accentColor: hexToRgb('#F1C40F'),
  },
  {
    path: 'public/images/portfolio/b-light-fashion-1.jpg',
    width: 640,
    height: 440,
    color1: hexToRgb('#17202A'),
    color2: hexToRgb('#6C3483'),
    accentColor: hexToRgb('#D4AF37'),
  },
  {
    path: 'public/images/portfolio/b-light-corporate-1.jpg',
    width: 640,
    height: 440,
    color1: hexToRgb('#1B2631'),
    color2: hexToRgb('#2E86C1'),
    accentColor: hexToRgb('#AED6F1'),
  },
  {
    path: 'public/images/portfolio/b-light-music-1.jpg',
    width: 640,
    height: 440,
    color1: hexToRgb('#4A0E4E'),
    color2: hexToRgb('#0E0B16'),
    accentColor: hexToRgb('#E83A82'),
  },
  {
    path: 'public/images/portfolio/b-light-engagement-1.jpg',
    width: 640,
    height: 440,
    color1: hexToRgb('#145A32'),
    color2: hexToRgb('#F39C12'),
    accentColor: hexToRgb('#A9DFBF'),
  },
  {
    path: 'public/images/portfolio/habesha-wedding-1.jpg',
    width: 640,
    height: 440,
    color1: hexToRgb('#6E2C00'),
    color2: hexToRgb('#D4AC0D'),
    accentColor: hexToRgb('#F9E79F'),
  },
  {
    path: 'public/images/portfolio/habesha-corporate-1.jpg',
    width: 640,
    height: 440,
    color1: hexToRgb('#154360'),
    color2: hexToRgb('#21618C'),
    accentColor: hexToRgb('#5DADE2'),
  },
  {
    path: 'public/images/portfolio/commercial.jpg',
    width: 640,
    height: 440,
    color1: hexToRgb('#1C2833'),
    color2: hexToRgb('#7B7D7D'),
    accentColor: hexToRgb('#D4AF37'),
  },
];

console.log(`Generating ${IMAGES.length} local placeholder images...`);

IMAGES.forEach((item) => {
  const dir = path.dirname(item.path);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const jpegBuffer = createPlaceholderImage(item);
  fs.writeFileSync(item.path, jpegBuffer);
  console.log(`✓ Created: ${item.path} (${item.width}x${item.height}, ${jpegBuffer.length} bytes)`);
});

console.log('All local placeholder images generated successfully.');
