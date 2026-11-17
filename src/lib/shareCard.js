// Branded "BNC Partner Program" share card (1200 x 630, the size social apps
// use for link previews). With a code it shows the partner's referral code;
// without one it is the generic card (public/og/partner-program.jpg).
const W = 1200;
const H = 630;
const RED = '#DC2626';
const INK = '#1D1D1F';
const MUTED = '#6E6E73';
const FONT = '"Geist", "Poppins", system-ui, -apple-system, "Segoe UI", sans-serif';

const loadImage = (src) => new Promise((resolve) => {
  const im = new Image();
  im.onload = () => resolve(im);
  im.onerror = () => resolve(null);
  im.src = src;
});

// bounding box of the visible (non-transparent, non-white) pixels of an image
const trimBox = (im) => {
  try {
    const c = document.createElement('canvas');
    c.width = im.naturalWidth; c.height = im.naturalHeight;
    const g = c.getContext('2d');
    g.drawImage(im, 0, 0);
    const { data, width, height } = g.getImageData(0, 0, c.width, c.height);
    let x0 = width, y0 = height, x1 = -1, y1 = -1;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        if (data[i + 3] > 16 && !(data[i] > 245 && data[i + 1] > 245 && data[i + 2] > 245)) {
          if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
      }
    }
    return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  } catch {
    return { x: 0, y: 0, w: im.naturalWidth, h: im.naturalHeight };
  }
};

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

export async function drawShareCard(canvas, { code = '', site = 'partners.bncglobal.in', logo = '/Photas/aaf68a14-dda6-4743-824f-5bc2592df449.png' } = {}) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  try {
    await Promise.all(['800 60px "Geist"', '600 22px "Geist"'].map((f) => document.fonts.load(f)));
  } catch { /* ignore: falls back to system font */ }

  // background: white with a soft red glow on the right
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(1010, 300, 20, 1010, 300, 520);
  glow.addColorStop(0, 'rgba(220,38,38,0.16)');
  glow.addColorStop(1, 'rgba(220,38,38,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // network motif on the right: rings, nodes and links
  const nodes = [[1010, 300, 16], [880, 170, 9], [1130, 160, 8], [1150, 430, 10], [890, 450, 8], [1010, 520, 7], [800, 310, 7]];
  ctx.strokeStyle = 'rgba(220,38,38,0.35)';
  ctx.lineWidth = 2;
  nodes.slice(1).forEach(([x, y]) => { ctx.beginPath(); ctx.moveTo(1010, 300); ctx.lineTo(x, y); ctx.stroke(); });
  [70, 150, 230].forEach((r, i) => {
    ctx.beginPath(); ctx.arc(1010, 300, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(220,38,38,${0.22 - i * 0.06})`; ctx.stroke();
  });
  nodes.forEach(([x, y, r], i) => {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = i === 0 ? RED : INK; ctx.fill();
  });

  // left red accent bar
  ctx.fillStyle = RED;
  ctx.fillRect(0, 0, 10, H);

  // logo
  const im = await loadImage(logo);
  const box = im && trimBox(im);
  if (box) {
    const h = 58;
    ctx.drawImage(im, box.x, box.y, box.w, box.h, 72, 64, (box.w / box.h) * h, h);
  } else {
    ctx.fillStyle = INK; ctx.font = `800 44px ${FONT}`; ctx.fillText('bnc', 72, 110);
  }

  // text
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = RED;
  ctx.font = `700 20px ${FONT}`;
  ctx.fillText('B N C   G L O B A L   P A R T N E R   P R O G R A M', 72, 192);

  ctx.fillStyle = INK;
  ctx.font = `800 60px ${FONT}`;
  ctx.fillText('Become a partner with', 72, 268);
  ctx.fillText('BNC Global Consultech', 72, 338);

  ctx.fillStyle = MUTED;
  ctx.font = `500 26px ${FONT}`;
  ctx.fillText('Join the BNC Global Partner League across 42 countries.', 72, 392);

  // referral code box (or a call to action when there is no code)
  if (code) {
    roundRect(ctx, 72, 436, 470, 112, 22);
    ctx.fillStyle = INK; ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = `600 18px ${FONT}`;
    ctx.fillText('MY REFERRAL CODE', 104, 478);
    ctx.fillStyle = '#ffffff';
    ctx.font = `800 44px ${FONT}`;
    ctx.fillText(code.split('').join(' '), 104, 528);
  } else {
    roundRect(ctx, 72, 452, 330, 76, 38);
    ctx.fillStyle = INK; ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 26px ${FONT}`;
    ctx.fillText('Apply as a partner  →', 104, 499);
  }

  ctx.fillStyle = MUTED;
  ctx.font = `600 22px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.fillText(site, W - 60, H - 46);
  ctx.textAlign = 'left';
  return canvas;
}

export const shareCardBlob = async (code) => {
  const canvas = document.createElement('canvas');
  await drawShareCard(canvas, { code });
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
};
