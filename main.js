const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const bwipjs = require('bwip-js');
const PDFDocument = require('pdfkit');
const SVGtoPDF = require('svg-to-pdfkit');
const sharp = require('sharp');

const DOT_RADIUS = 3;

function escapeXml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function safeFilePart(s) {
  return String(s).replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
}

function forceSvgSize(svg, sizePx) {
  const size = Number(sizePx);
  if (!Number.isFinite(size) || size <= 0) return svg;

  let out = svg.replace(/\swidth="[^"]*"/, '').replace(/\sheight="[^"]*"/, '');
  out = out.replace(/<svg\b/, `<svg width="${size}" height="${size}"`);
  return out;
}

function getUserDataFile() {
  return path.join(app.getPath('userData'), 'settings.json');
}

function loadSettingsSafe() {
  try {
    const p = getUserDataFile();
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function saveSettingsSafe(obj) {
  try {
    fs.writeFileSync(getUserDataFile(), JSON.stringify(obj, null, 2), 'utf8');
  } catch {
    // ignore
  }
}

function generateBaseSvg(opts) {
  const { payload, useGs1, scale, padding, finalSize } = opts;

  const baseSvgRaw = bwipjs.toSVG({
    bcid: useGs1 ? 'gs1dotcode' : 'dotcode',
    text: String(payload ?? '').trim(),
    scale: Number(scale) || 4,
    padding: Number(padding) || 10,
  });

  return forceSvgSize(baseSvgRaw, finalSize);
}

function extractGridFromBaseSvg(baseSvg) {
  const dMatch = baseSvg.match(/<path[^>]*\sd="([^"]+)"[^>]*\/>/);
  if (!dMatch) {
    throw new Error('No se encontró <path d="..."/> en el SVG base.');
  }
  const d = dMatch[1];

  const re = /M\s*([0-9.]+)\s*([0-9.]+)\s*C/g;
  const dots = [];
  let m;

  while ((m = re.exec(d)) !== null) {
    const xLeft = parseFloat(m[1]);
    const y = parseFloat(m[2]);
    dots.push({ x: xLeft + DOT_RADIUS, y });
  }

  if (!dots.length) {
    throw new Error('No se detectaron dots en el símbolo.');
  }

  const xs = [...new Set(dots.map(p => p.x))].sort((a, b) => a - b);
  const ys = [...new Set(dots.map(p => p.y))].sort((a, b) => a - b);
  const dotSet = new Set(dots.map(p => `${p.x}_${p.y}`));

  const dx = xs.length > 1 ? (xs[1] - xs[0]) : 6;
  const dy = ys.length > 1 ? (ys[1] - ys[0]) : 6;

  return { xs, ys, dotSet, dx, dy };
}

function expandGrid(xs, ys, dx, dy, outerCols, outerRows) {
  const cols = Math.max(0, Number(outerCols) || 0);
  const rows = Math.max(0, Number(outerRows) || 0);

  let newXs = [...xs];
  let newYs = [...ys];

  if (cols > 0) {
    const firstX = xs[0];
    const lastX = xs[xs.length - 1];
    const extraLeft = [];
    const extraRight = [];

    for (let i = cols; i >= 1; i--) extraLeft.push(firstX - (dx * i));
    for (let i = 1; i <= cols; i++) extraRight.push(lastX + (dx * i));

    newXs = [...extraLeft, ...xs, ...extraRight];
  }

  if (rows > 0) {
    const firstY = ys[0];
    const lastY = ys[ys.length - 1];
    const extraTop = [];
    const extraBottom = [];

    for (let i = rows; i >= 1; i--) extraTop.push(firstY - (dy * i));
    for (let i = 1; i <= rows; i++) extraBottom.push(lastY + (dy * i));

    newYs = [...extraTop, ...ys, ...extraBottom];
  }

  return { xs: newXs, ys: newYs };
}

function fontFaceCss(fontObj) {
  if (!fontObj?.dataUrl || !fontObj?.family) return '';
  const format = fontObj.format || 'truetype';
  return `
@font-face {
  font-family: '${fontObj.family}';
  src: url('${fontObj.dataUrl}') format('${format}');
  font-weight: normal;
  font-style: normal;
}
`.trim();
}

function injectDefsAndStyle(svg, cssText) {
  if (!cssText?.trim()) return svg;
  const styleBlock = `<defs><style><![CDATA[\n${cssText}\n]]></style></defs>`;
  return svg.replace(/<svg\b([^>]*)>/, (m) => `${m}${styleBlock}`);
}

function addOuterFrameToBaseSvg(baseSvg, opts) {
  const { xs, ys, dotSet, dx, dy } = extractGridFromBaseSvg(baseSvg);
  const ex = expandGrid(xs, ys, dx, dy, opts.outerCols, opts.outerRows);
  const bgColor = opts.style?.bgColor ?? '#ffffff';

  const x0 = ex.xs[0] - dx / 2;
  const y0 = ex.ys[0] - dy / 2;
  const width = (ex.xs[ex.xs.length - 1] - ex.xs[0]) + dx;
  const height = (ex.ys[ex.ys.length - 1] - ex.ys[0]) + dy;

  let overlay = `<rect x="${x0}" y="${y0}" width="${width}" height="${height}" fill="${bgColor}"/>`;
  overlay += `<g fill="#000000">`;

  for (const y of ys) {
    for (const x of xs) {
      if (dotSet.has(`${x}_${y}`)) {
        overlay += `<circle cx="${x}" cy="${y}" r="${DOT_RADIUS}"/>`;
      }
    }
  }

  overlay += `</g>`;

  const out = baseSvg
    .replace(/viewBox="[^"]*"/, `viewBox="${x0} ${y0} ${width} ${height}"`)
    .replace(/<path[^>]*\/>/, overlay);

  return forceSvgSize(out, opts.finalSize);
}

function buildReplacedSvgAdvanced(baseSvg, opts) {
  const {
    replaceText,
    emptyCellText,
    repeatReplaceText,
    fillFullGrid,
    singleGridTextMode,
    singleGridText,

    dotFontSize,
    emptyFontSize,
    dotFontFamily,
    emptyFontFamily,

    useEmbeddedFonts,
    dotEmbeddedFont,
    emptyEmbeddedFont,

    dotTextStrokeWidth,
    emptyTextStrokeWidth,
    dotTextStrokeColor,
    emptyTextStrokeColor,
    textStrokeJoin,

    useImages,
    dotUseImage,
    emptyUseImage,
    dotImage,
    emptyImage,
    dotImageScale,
    emptyImageScale,
    dotImageFit,
    emptyImageFit,
    dotImageRotate,
    emptyImageRotate,
    dotImageOpacity,
    emptyImageOpacity,

    style,
    showGrid,
  } = opts;

  const bgColor = style?.bgColor ?? '#ffffff';
  const dotColor = style?.dotColor ?? '#000000';
  const emptyColor = style?.emptyColor ?? '#999999';
  const gridColor = style?.gridColor ?? '#c8c8c8';

  const grid = extractGridFromBaseSvg(baseSvg);
  const expanded = expandGrid(grid.xs, grid.ys, grid.dx, grid.dy, opts.outerCols, opts.outerRows);

  const xs = expanded.xs;
  const ys = expanded.ys;
  const dotSet = grid.dotSet;
  const dx = grid.dx;
  const dy = grid.dy;

  const mainChars = [...String(replaceText ?? '').trim()];
  const emptyChars = [...String(emptyCellText ?? '').trim()];
  const singleChars = [...String(singleGridText ?? '').trim()];

  const dotFS = Number(dotFontSize) || 5;
  const emptyFS = Number(emptyFontSize) || 4;

  const dotFF = (useEmbeddedFonts && dotEmbeddedFont?.family)
    ? dotEmbeddedFont.family
    : (dotFontFamily || 'monospace');

  const emptyFF = (useEmbeddedFonts && emptyEmbeddedFont?.family)
    ? emptyEmbeddedFont.family
    : (emptyFontFamily || 'monospace');

  const dotSW = Math.max(0, Number(dotTextStrokeWidth) || 0);
  const emptySW = Math.max(0, Number(emptyTextStrokeWidth) || 0);
  const dotSC = dotTextStrokeColor || dotColor;
  const emptySC = emptyTextStrokeColor || emptyColor;
  const join = textStrokeJoin || 'round';

  const dotImgScale = Number(dotImageScale) || 1.0;
  const emptyImgScale = Number(emptyImageScale) || 1.0;
  const imgWdot = dx * dotImgScale;
  const imgHdot = dy * dotImgScale;
  const imgWempty = dx * emptyImgScale;
  const imgHempty = dy * emptyImgScale;
  const dotPAR = `xMidYMid ${dotImageFit || 'meet'}`;
  const emptyPAR = `xMidYMid ${emptyImageFit || 'meet'}`;
  const dotRot = Number(dotImageRotate) || 0;
  const emptyRot = Number(emptyImageRotate) || 0;
  const dotOp = Math.min(1, Math.max(0, Number(dotImageOpacity) || 1));
  const emptyOp = Math.min(1, Math.max(0, Number(emptyImageOpacity) || 1));

  let css = '';
  if (useEmbeddedFonts) {
    css += fontFaceCss(dotEmbeddedFont) + '\n' + fontFaceCss(emptyEmbeddedFont);
  }

  let svgWithFonts = injectDefsAndStyle(baseSvg, css);

  const x0 = xs[0] - dx / 2;
  const y0 = ys[0] - dy / 2;
  const width = (xs[xs.length - 1] - xs[0]) + dx;
  const height = (ys[ys.length - 1] - ys[0]) + dy;

  svgWithFonts = svgWithFonts.replace(/viewBox="[^"]*"/, `viewBox="${x0} ${y0} ${width} ${height}"`);

  let overlay = `<rect x="${x0}" y="${y0}" width="${width}" height="${height}" fill="${bgColor}"/>`;

  if (showGrid) {
    overlay += `<g fill="none" stroke="${gridColor}" stroke-width="0.35">`;
    for (let x = x0; x <= x0 + width + 0.001; x += dx) {
      overlay += `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y0 + height}"/>`;
    }
    for (let y = y0; y <= y0 + height + 0.001; y += dy) {
      overlay += `<line x1="${x0}" y1="${y}" x2="${x0 + width}" y2="${y}"/>`;
    }
    overlay += `</g>`;
  }

  let dotIdx = 0;
  let emptyIdx = 0;
  let allIdx = 0;
  let content = '';

  for (const y of ys) {
    for (const x of xs) {
      const isDot = dotSet.has(`${x}_${y}`);

      if (!fillFullGrid && !isDot) continue;

      if (useImages) {
        if (isDot && (dotUseImage !== false) && dotImage?.dataUrl) {
          const ix = x - imgWdot / 2;
          const iy = y - imgHdot / 2;
          const tf = dotRot ? ` transform="rotate(${dotRot} ${x} ${y})"` : '';
          content += `<image x="${ix}" y="${iy}" width="${imgWdot}" height="${imgHdot}" href="${dotImage.dataUrl}" preserveAspectRatio="${dotPAR}" opacity="${dotOp}"${tf}/>`;
          continue;
        }

        if (!isDot && (emptyUseImage !== false) && emptyImage?.dataUrl) {
          const ix = x - imgWempty / 2;
          const iy = y - imgHempty / 2;
          const tf = emptyRot ? ` transform="rotate(${emptyRot} ${x} ${y})"` : '';
          content += `<image x="${ix}" y="${iy}" width="${imgWempty}" height="${imgHempty}" href="${emptyImage.dataUrl}" preserveAspectRatio="${emptyPAR}" opacity="${emptyOp}"${tf}/>`;
          continue;
        }
      }

      let ch = '';

      if (singleGridTextMode) {
        if (singleChars.length) {
          ch = singleChars[allIdx % singleChars.length];
          allIdx++;
        }
      } else if (isDot) {
        if (mainChars.length) {
          ch = repeatReplaceText !== false
            ? mainChars[dotIdx % mainChars.length]
            : (dotIdx < mainChars.length ? mainChars[dotIdx] : '');
        }
        dotIdx++;
      } else {
        if (emptyChars.length) {
          ch = emptyChars[emptyIdx % emptyChars.length];
        }
        emptyIdx++;
      }

      const fs = isDot ? dotFS : emptyFS;
      const fill = isDot ? dotColor : emptyColor;
      const ff = isDot ? dotFF : emptyFF;
      const sw = isDot ? dotSW : emptySW;
      const sc = isDot ? dotSC : emptySC;

      const strokeAttrs = sw > 0
        ? ` stroke="${sc}" stroke-width="${sw}" paint-order="stroke fill" stroke-linejoin="${join}"`
        : '';

      content += `<text x="${x}" y="${y}" fill="${fill}" font-size="${fs}" font-family="${escapeXml(ff)}" text-anchor="middle" dominant-baseline="middle"${strokeAttrs}>${escapeXml(ch)}</text>`;
    }
  }

  overlay += `<g>${content}</g>`;
  return forceSvgSize(svgWithFonts.replace(/<path[^>]*\/>/, overlay), opts.finalSize);
}

function addLegendToSvg(svg, payload, opts) {
  if (!opts.printPayloadLegend) return svg;

  const legendFontSize = Math.max(4, Number(opts.legendFontSize) || 14);
  const legendMargin = Math.max(0, Number(opts.legendMargin) || 12);

  const vb = svg.match(/viewBox="([^"]+)"/);
  if (!vb) return svg;

  const [x, y, w, h] = vb[1].split(/\s+/).map(Number);
  const extraH = legendFontSize + legendMargin * 2;

  svg = svg.replace(/viewBox="[^"]*"/, `viewBox="${x} ${y} ${w} ${h + extraH}"`);

  const legendY = y + h + legendMargin + legendFontSize * 0.8;
  const legendX = x + w / 2;
  const legend = `<text x="${legendX}" y="${legendY}" fill="#000000" font-size="${legendFontSize}" font-family="Arial" text-anchor="middle">${escapeXml(payload)}</text>`;

  return svg.replace(/<\/svg>\s*$/, `${legend}</svg>`);
}

async function renderSvgs(opts) {
  if (!opts?.payload?.trim()) {
    throw new Error('El payload está vacío.');
  }

  let baseSvg = generateBaseSvg(opts);
  if (opts.outerOnBase) {
    baseSvg = addOuterFrameToBaseSvg(baseSvg, opts);
  }

  let replacedSvg = buildReplacedSvgAdvanced(baseSvg, opts);
  replacedSvg = addLegendToSvg(replacedSvg, opts.payload, opts);

  return { baseSvg, replacedSvg };
}

function incrementPayloadNumericEnd(payload, step, index) {
  const m = String(payload).match(/^(.*?)(\d+)$/);
  if (!m) {
    throw new Error('El payload inicial debe terminar en dígitos para modo "numeric-end".');
  }

  const prefix = m[1];
  const digits = m[2];
  const width = digits.length;
  const startNum = parseInt(digits, 10);
  const value = startNum + (index * step);

  return prefix + String(value).padStart(width, '0');
}

function incrementPayloadNumericSlice(payload, sliceStart, sliceLength, step, index) {
  const text = String(payload);
  const start = Number(sliceStart);
  const length = Number(sliceLength);

  if (!Number.isInteger(start) || start < 0) {
    throw new Error('Slice inicio inválido.');
  }
  if (!Number.isInteger(length) || length <= 0) {
    throw new Error('Slice longitud inválida.');
  }
  if (start + length > text.length) {
    throw new Error('El bloque numérico interno se sale del payload.');
  }

  const before = text.slice(0, start);
  const block = text.slice(start, start + length);
  const after = text.slice(start + length);

  if (!/^\d+$/.test(block)) {
    throw new Error('El bloque seleccionado en "numeric-slice" no es numérico.');
  }

  const startNum = parseInt(block, 10);
  const value = startNum + (index * step);

  return before + String(value).padStart(length, '0') + after;
}

function incrementPayloadParts(prefix, numberStart, width, suffix, step, index) {
  const startNum = Number(numberStart);
  const w = Number(width);

  if (!Number.isFinite(startNum) || startNum < 0) {
    throw new Error('Número inicial inválido en modo "parts".');
  }
  if (!Number.isFinite(w) || w <= 0) {
    throw new Error('Ancho numérico inválido en modo "parts".');
  }

  const value = startNum + (index * step);
  return `${prefix || ''}${String(value).padStart(w, '0')}${suffix || ''}`;
}

function buildSequence(opts) {
  const count = Math.max(1, Number(opts.sequenceCount) || 1);
  const step = Math.max(1, Number(opts.sequenceStep) || 1);
  const strategy = opts.sequenceStrategy || 'numeric-end';
  const out = [];

  for (let i = 0; i < count; i++) {
    let payload;

    if (strategy === 'numeric-end') {
      payload = incrementPayloadNumericEnd(opts.sequenceStart || opts.payload, step, i);
    } else if (strategy === 'numeric-slice') {
      payload = incrementPayloadNumericSlice(
        opts.sequenceStart || opts.payload,
        opts.sequenceSliceStart,
        opts.sequenceSliceLength,
        step,
        i
      );
    } else if (strategy === 'parts') {
      payload = incrementPayloadParts(
        opts.sequencePrefix,
        opts.sequenceNumberStart,
        opts.sequenceWidth,
        opts.sequenceSuffix,
        step,
        i
      );
    } else {
      throw new Error(`Modo de secuencia no soportado: ${strategy}`);
    }

    out.push(payload);
  }

  return out;
}

async function svgToPngBuffer(svg, dpi) {
  return await sharp(Buffer.from(svg), { density: Number(dpi) || 300 })
    .png()
    .toBuffer();
}

async function svgToTiff1BitBuffer(svg, dpi) {
  return await sharp(Buffer.from(svg), { density: Number(dpi) || 300 })
    .flatten({ background: '#ffffff' })
    .threshold(128)
    .tiff({ compression: 'ccittfax4' })
    .toBuffer();
}

async function saveSequenceOutput(opts) {
  const format = opts.outputFormat || 'pdf';
  const dpi = Number(opts.outputDpi) || 300;
  const prefix = (opts.outputPrefix || 'dotcode').trim() || 'dotcode';

  const payloads = opts.sequenceMode ? buildSequence(opts) : [opts.payload];

  if (!opts.outDir?.trim()) {
    throw new Error('No se ha seleccionado carpeta de salida.');
  }

  if (format === 'pdf') {
    const outputPath = path.join(opts.outDir, `${prefix}.pdf`);
    const doc = new PDFDocument({ autoFirstPage: false });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    for (const payload of payloads) {
      const renderOpts = { ...opts, payload };
      const { replacedSvg } = await renderSvgs(renderOpts);

      const sizePx = Number(opts.finalSize) || 300;
      const extraLegend = opts.printPayloadLegend ? 24 : 0;
      const pt = sizePx * 72 / dpi;

      doc.addPage({ size: [pt, pt + extraLegend], margin: 0 });
      SVGtoPDF(doc, replacedSvg, 0, 0, {
        width: pt,
        height: pt + extraLegend,
        preserveAspectRatio: 'xMidYMid meet'
      });
    }

    doc.end();

    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    return { outputPath };
  }

  if (format === 'png') {
    const dir = path.join(opts.outDir, `${prefix}_png`);
    fs.mkdirSync(dir, { recursive: true });

    for (let i = 0; i < payloads.length; i++) {
      const payload = payloads[i];
      const renderOpts = { ...opts, payload };
      const { replacedSvg } = await renderSvgs(renderOpts);
      const png = await svgToPngBuffer(replacedSvg, dpi);

      const base = opts.includePayloadInFilename
        ? `${prefix}_${safeFilePart(payload)}`
        : `${prefix}_${String(i + 1).padStart(4, '0')}`;

      fs.writeFileSync(path.join(dir, `${base}.png`), png);
    }

    return { outputPath: dir };
  }

  if (format === 'tiff1') {
    const dir = path.join(opts.outDir, `${prefix}_tiff1`);
    fs.mkdirSync(dir, { recursive: true });

    for (let i = 0; i < payloads.length; i++) {
      const payload = payloads[i];
      const renderOpts = { ...opts, payload };
      const { replacedSvg } = await renderSvgs(renderOpts);
      const tiff = await svgToTiff1BitBuffer(replacedSvg, dpi);

      const base = opts.includePayloadInFilename
        ? `${prefix}_${safeFilePart(payload)}`
        : `${prefix}_${String(i + 1).padStart(4, '0')}`;

      fs.writeFileSync(path.join(dir, `${base}.tif`), tiff);
    }

    return { outputPath: dir };
  }

  throw new Error(`Formato no soportado: ${format}`);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('choose-folder', async () => {
  const r = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory']
  });
  if (r.canceled || !r.filePaths?.[0]) return null;
  return r.filePaths[0];
});

ipcMain.handle('choose-image', async () => {
  const r = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'] }]
  });
  if (r.canceled || !r.filePaths?.[0]) return null;

  const filePath = r.filePaths[0];
  const name = path.basename(filePath);
  const buf = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase().replace('.', '');

  const mime =
    ext === 'png' ? 'image/png' :
    ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
    ext === 'webp' ? 'image/webp' :
    ext === 'gif' ? 'image/gif' :
    ext === 'svg' ? 'image/svg+xml' :
    'application/octet-stream';

  return {
    name,
    dataUrl: `data:${mime};base64,${buf.toString('base64')}`
  };
});

ipcMain.handle('choose-font', async () => {
  const r = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Fonts', extensions: ['ttf', 'otf', 'woff', 'woff2'] }]
  });
  if (r.canceled || !r.filePaths?.[0]) return null;

  const filePath = r.filePaths[0];
  const name = path.basename(filePath);
  const buf = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase().replace('.', '');

  const mime =
    ext === 'ttf' ? 'font/ttf' :
    ext === 'otf' ? 'font/otf' :
    ext === 'woff' ? 'font/woff' :
    ext === 'woff2' ? 'font/woff2' :
    'application/octet-stream';

  const format =
    ext === 'ttf' ? 'truetype' :
    ext === 'otf' ? 'opentype' :
    ext === 'woff' ? 'woff' :
    ext === 'woff2' ? 'woff2' :
    'truetype';

  const family = `EMB_${name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]+/g, '_')}`;

  return {
    name,
    family,
    dataUrl: `data:${mime};base64,${buf.toString('base64')}`,
    format
  };
});

ipcMain.handle('load-settings', async () => loadSettingsSafe());

ipcMain.handle('save-settings', async (_evt, settings) => {
  saveSettingsSafe(settings);
  return { ok: true };
});

ipcMain.handle('render', async (_evt, opts) => {
  return await renderSvgs(opts);
});

ipcMain.handle('save-svgs', async (_evt, opts) => {
  if (!opts?.outDir?.trim()) {
    throw new Error('No se ha seleccionado carpeta de salida.');
  }

  const { baseSvg, replacedSvg } = await renderSvgs(opts);

  const basePath = path.join(opts.outDir, 'dotcode.svg');
  const replacedName = opts.includePayloadInFilename
    ? `dotcode_reemplazado_${safeFilePart(opts.payload)}.svg`
    : 'dotcode_reemplazado.svg';
  const replacedPath = path.join(opts.outDir, replacedName);

  fs.writeFileSync(basePath, baseSvg, 'utf8');
  fs.writeFileSync(replacedPath, replacedSvg, 'utf8');

  return { ok: true, basePath, replacedPath };
});

ipcMain.handle('save-sequence', async (_evt, opts) => {
  return await saveSequenceOutput(opts);
});