// Square "Refer & Earn" share poster (1080 x 1080, best for WhatsApp chats and status).
// White card with soft red gradients. The photo is a swappable file (public/referral/card-photo.jpg); the logo, text,
// steps, contact details and the partner's own referral code are drawn here.
const S = 1080;
const RED = '#DC2626';
const INK = '#1D1D1F';
const FONT = '"Geist", "Poppins", system-ui, -apple-system, "Segoe UI", sans-serif';

export const POSTER_CONTACT = { phone: '+91 98105 75613', site: 'partners.bncglobal.in' };
const PHOTO = '/referral/card-photo.jpg';
const LOGO = '/Photas/aaf68a14-dda6-4743-824f-5bc2592df449.png';

const loadImage = (src) => new Promise((resolve) => {
  const im = new Image();
  im.onload = () => resolve(im);
  im.onerror = () => resolve(null);
  im.src = src;
});

const rr = (ctx, x, y, w, h, r) => {
  const [a, b, c, d] = Array.isArray(r) ? r : [r, r, r, r];
  ctx.beginPath();
  ctx.moveTo(x + a, y);
  ctx.arcTo(x + w, y, x + w, y + h, b);
  ctx.arcTo(x + w, y + h, x, y + h, c);
  ctx.arcTo(x, y + h, x, y, d);
  ctx.arcTo(x, y, x + w, y, a);
  ctx.closePath();
};

// visible area of the logo (it has empty margins)
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

// a few words per line inside a given width
const wrap = (ctx, text, maxW) => {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  words.forEach((w) => {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  });
  if (line) lines.push(line);
  return lines;
};

export async function drawReferralPoster(canvas, { code = '', maxPct = 5 } = {}) {
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');
  try {
    await Promise.all(['800 96px "Geist"', '600 24px "Geist"'].map((f) => document.fonts.load(f)));
  } catch { /* system font fallback */ }
  const [photo, logo] = await Promise.all([loadImage(PHOTO), loadImage(LOGO)]);

  // background: mostly white, with soft red gradient washes in the corners
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, S, S);
  [[0, 0, 520, 0.16], [S, 120, 460, 0.10], [S, S, 620, 0.18], [0, S, 420, 0.08]].forEach(([x, y, r, a]) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(220,38,38,${a})`);
    g.addColorStop(1, 'rgba(220,38,38,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
  });

  // eyebrow (top-left) + logo on a white pill (top-right)
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = RED;
  ctx.font = `700 20px ${FONT}`;
  ctx.fillText('B N C   G L O B A L   P A R T N E R   P R O G R A M', 64, 92);
  const box = logo && trimBox(logo);
  if (box) {
    const h = 46;
    const w = (box.w / box.h) * h;
    ctx.drawImage(logo, box.x, box.y, box.w, box.h, S - 64 - w, 58, w, h);
  }

  // headline
  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  ctx.font = `800 104px ${FONT}`;
  ctx.fillText('REFER & ', S / 2 - ctx.measureText('EARN').width / 2, 236);
  ctx.fillStyle = RED;
  ctx.fillText('EARN', S / 2 + ctx.measureText('REFER & ').width / 2, 236);
  ctx.fillStyle = '#6E6E73';
  ctx.font = `500 32px ${FONT}`;
  ctx.fillText(`“Earn up to ${maxPct}% on every project you refer”`, S / 2, 292);

  // photo panel
  const px = 64, py = 332, pw = S - 128, ph = 300;
  if (photo) {
    // draw on its own layer, then fade the left/right edges to transparent so it melts into the card
    const layer = document.createElement('canvas');
    layer.width = pw; layer.height = ph;
    const l = layer.getContext('2d');
    const sc = Math.max(pw / photo.naturalWidth, ph / photo.naturalHeight);
    const w = photo.naturalWidth * sc, h = photo.naturalHeight * sc;
    l.drawImage(photo, (pw - w) / 2, (ph - h) / 2, w, h);
    l.globalCompositeOperation = 'destination-in';
    const fade = l.createLinearGradient(0, 0, pw, 0);
    fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(0.07, '#000'); fade.addColorStop(0.93, '#000'); fade.addColorStop(1, 'rgba(0,0,0,0)');
    l.fillStyle = fade; l.fillRect(0, 0, pw, ph);
    // "multiply" makes the photo's white background vanish into the card, leaving only the hands
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(layer, px, py);
    ctx.globalCompositeOperation = 'source-over';
  }

  // "Start referring" pill on the photo's bottom edge
  const bw = 300, bh = 64, bx = S / 2 - bw / 2, by = py + ph - bh / 2;
  ctx.shadowColor = 'rgba(220,38,38,0.45)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
  rr(ctx, bx, by, bw, bh, bh / 2);
  ctx.fillStyle = RED; ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 26px ${FONT}`;
  ctx.fillText('START REFERRING  →', S / 2, by + 42);

  // how it works: 3 steps
  const sx = 64, sy = 712, sw = S - 128, sh = 168;
  ctx.shadowColor = 'rgba(15,23,42,0.10)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
  rr(ctx, sx, sy, sw, sh, [28, 8, 28, 8]);
  ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.strokeStyle = '#ECECF1'; ctx.lineWidth = 2; ctx.stroke();
  // vertical "HOW IT WORKS" tab
  rr(ctx, sx, sy, 58, sh, [28, 0, 0, 8]);
  ctx.fillStyle = INK; ctx.fill();
  ctx.save();
  ctx.translate(sx + 37, sy + sh / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 17px ${FONT}`;
  ctx.fillText('HOW IT WORKS', 0, 0);
  ctx.restore();

  const steps = [
    ['STEP 1', 'Register with my referral code'],
    ['STEP 2', 'Bring a client project'],
    ['STEP 3', `Earn up to ${maxPct}% of the project value`],
  ];
  const colW = (sw - 58) / 3;
  ctx.textAlign = 'left';
  steps.forEach(([tag, text], i) => {
    const cx = sx + 58 + i * colW + 30;
    ctx.font = `800 17px ${FONT}`;
    const tw = ctx.measureText(tag).width + 22;
    rr(ctx, cx, sy + 30, tw, 32, 6);
    ctx.fillStyle = i === 2 ? RED : INK; ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(tag, cx + 11, sy + 52);
    ctx.fillStyle = INK;
    ctx.font = `700 25px ${FONT}`;
    wrap(ctx, text, colW - 64).slice(0, 3).forEach((l, j) => ctx.fillText(l, cx, sy + 100 + j * 30));
    // chevron divider
    if (i < 2) {
      const dx = sx + 58 + (i + 1) * colW - 6;
      ctx.strokeStyle = '#D2D2D7'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(dx - 10, sy + 34); ctx.lineTo(dx + 8, sy + sh / 2); ctx.lineTo(dx - 10, sy + sh - 34); ctx.stroke();
    }
  });
  ctx.fillStyle = '#8E8E93';
  ctx.font = `500 15px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.fillText('Terms & conditions apply', sx + sw - 24, sy + sh - 16);

  // footer: contact + referral code
  const fy = 912;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#8E8E93';
  ctx.font = `600 18px ${FONT}`;
  ctx.fillText('CALL / WHATSAPP', 64, fy + 20);
  ctx.fillText('WEBSITE', 64, fy + 86);
  ctx.fillStyle = INK;
  ctx.font = `700 30px ${FONT}`;
  ctx.fillText(POSTER_CONTACT.phone, 64, fy + 56);
  ctx.fillText(POSTER_CONTACT.site, 64, fy + 122);

  const cw = 430, ch = 132, cx = S - 64 - cw, cy = fy - 6;
  const cg = ctx.createLinearGradient(cx, cy, cx + cw, cy + ch);
  cg.addColorStop(0, '#DC2626'); cg.addColorStop(1, '#EF4444');
  ctx.shadowColor = 'rgba(220,38,38,0.35)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 10;
  rr(ctx, cx, cy, cw, ch, [26, 8, 26, 8]);
  ctx.fillStyle = cg; ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `700 18px ${FONT}`;
  ctx.fillText('MY REFERRAL CODE', cx + 30, cy + 42);
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 52px ${FONT}`;
  ctx.fillText((code || '--------').split('').join(' '), cx + 30, cy + 104);
  return canvas;
}

export const referralPosterBlob = async (code, opts = {}) => {
  const canvas = document.createElement('canvas');
  await drawReferralPoster(canvas, { code, ...opts });
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
};
