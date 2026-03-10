const el = (id) => document.getElementById(id);

const payloadEl = el('payload');
const replaceEl = el('replaceText');
const emptyEl = el('emptyCellText');

const singleModeEl = el('singleGridTextMode');
const singleTextEl = el('singleGridText');

const useGs1El = el('useGs1');
const repeatEl = el('repeatReplaceText');
const fullGridEl = el('fillFullGrid');
const showGridEl = el('showGrid');

const outerRowsEl = el('outerRows');
const outerColsEl = el('outerCols');
const outerOnBaseEl = el('outerOnBase');

const scaleEl = el('scale');
const paddingEl = el('padding');
const finalSizeEl = el('finalSize');

const fontSizeEl = el('fontSize');
const dotFontSizeEl = el('dotFontSize');
const emptyFontSizeEl = el('emptyFontSize');

const dotFontFamilyEl = el('dotFontFamily');
const emptyFontFamilyEl = el('emptyFontFamily');

const useEmbeddedFontsEl = el('useEmbeddedFonts');
const dotFontFileLabelEl = el('dotFontFileLabel');
const emptyFontFileLabelEl = el('emptyFontFileLabel');

const dotTextStrokeWidthEl = el('dotTextStrokeWidth');
const emptyTextStrokeWidthEl = el('emptyTextStrokeWidth');
const dotTextStrokeColorEl = el('dotTextStrokeColor');
const emptyTextStrokeColorEl = el('emptyTextStrokeColor');
const textStrokeJoinEl = el('textStrokeJoin');

const useImagesEl = el('useImages');
const dotUseImageEl = el('dotUseImage');
const emptyUseImageEl = el('emptyUseImage');

const dotImageScaleEl = el('dotImageScale');
const emptyImageScaleEl = el('emptyImageScale');
const dotImageFitEl = el('dotImageFit');
const emptyImageFitEl = el('emptyImageFit');

const dotImageRotateEl = el('dotImageRotate');
const emptyImageRotateEl = el('emptyImageRotate');
const dotImageOpacityEl = el('dotImageOpacity');
const emptyImageOpacityEl = el('emptyImageOpacity');

const dotImageLabelEl = el('dotImageLabel');
const emptyImageLabelEl = el('emptyImageLabel');

const includePayloadInFilenameEl = el('includePayloadInFilename');
const printPayloadLegendEl = el('printPayloadLegend');
const legendFontSizeEl = el('legendFontSize');
const legendMarginEl = el('legendMargin');

const bgColorEl = el('bgColor');
const dotColorEl = el('dotColor');
const emptyColorEl = el('emptyColor');
const gridColorEl = el('gridColor');

const sequenceModeEl = el('sequenceMode');
const sequenceStrategyEl = el('sequenceStrategy');
const sequenceStartEl = el('sequenceStart');
const sequenceCountEl = el('sequenceCount');
const sequenceStepEl = el('sequenceStep');
const sequenceWidthEl = el('sequenceWidth');
const sequenceSliceStartEl = el('sequenceSliceStart');
const sequenceSliceLengthEl = el('sequenceSliceLength');
const sequencePrefixEl = el('sequencePrefix');
const sequenceSuffixEl = el('sequenceSuffix');
const sequenceNumberStartEl = el('sequenceNumberStart');

const outputFormatEl = el('outputFormat');
const outputDpiEl = el('outputDpi');
const outputPrefixEl = el('outputPrefix');

const outDirEl = el('outDir');
const statusEl = el('status');
const frame = el('previewFrame');

const tabReplaced = el('tabReplaced');
const tabBase = el('tabBase');

let outDir = null;
let activeView = 'replaced';
let lastSvgs = { baseSvg: null, replacedSvg: null };

let dotImage = null;
let emptyImage = null;
let dotEmbeddedFont = null;
let emptyEmbeddedFont = null;

function setStatus(msg) {
  statusEl.textContent = msg;
}

function setTab(view) {
  activeView = view;
  tabReplaced.classList.toggle('active', view === 'replaced');
  tabBase.classList.toggle('active', view === 'base');
  renderPreview();
}

tabReplaced.onclick = () => setTab('replaced');
tabBase.onclick = () => setTab('base');

function getOpts() {
  return {
    payload: payloadEl.value,
    replaceText: replaceEl.value,
    emptyCellText: emptyEl.value,

    singleGridTextMode: singleModeEl.checked,
    singleGridText: singleTextEl.value,

    useGs1: useGs1El.checked,
    repeatReplaceText: repeatEl.checked,
    fillFullGrid: fullGridEl.checked,
    showGrid: showGridEl.checked,

    outerRows: outerRowsEl.value,
    outerCols: outerColsEl.value,
    outerOnBase: outerOnBaseEl.checked,

    scale: scaleEl.value,
    padding: paddingEl.value,
    finalSize: finalSizeEl.value,

    fontSize: fontSizeEl.value,
    dotFontSize: dotFontSizeEl.value,
    emptyFontSize: emptyFontSizeEl.value,

    dotFontFamily: dotFontFamilyEl.value,
    emptyFontFamily: emptyFontFamilyEl.value,

    useEmbeddedFonts: useEmbeddedFontsEl.checked,
    dotEmbeddedFont,
    emptyEmbeddedFont,

    dotTextStrokeWidth: dotTextStrokeWidthEl.value,
    emptyTextStrokeWidth: emptyTextStrokeWidthEl.value,
    dotTextStrokeColor: dotTextStrokeColorEl.value,
    emptyTextStrokeColor: emptyTextStrokeColorEl.value,
    textStrokeJoin: textStrokeJoinEl.value,

    useImages: useImagesEl.checked,
    dotUseImage: dotUseImageEl.checked,
    emptyUseImage: emptyUseImageEl.checked,
    dotImage,
    emptyImage,
    dotImageScale: dotImageScaleEl.value,
    emptyImageScale: emptyImageScaleEl.value,
    dotImageFit: dotImageFitEl.value,
    emptyImageFit: emptyImageFitEl.value,
    dotImageRotate: dotImageRotateEl.value,
    emptyImageRotate: emptyImageRotateEl.value,
    dotImageOpacity: dotImageOpacityEl.value,
    emptyImageOpacity: emptyImageOpacityEl.value,

    includePayloadInFilename: includePayloadInFilenameEl.checked,
    printPayloadLegend: printPayloadLegendEl.checked,
    legendFontSize: legendFontSizeEl.value,
    legendMargin: legendMarginEl.value,

    style: {
      bgColor: bgColorEl.value,
      dotColor: dotColorEl.value,
      emptyColor: emptyColorEl.value,
      gridColor: gridColorEl.value,
    },

    sequenceMode: sequenceModeEl.checked,
    sequenceStrategy: sequenceStrategyEl.value,
    sequenceStart: sequenceStartEl.value,
    sequenceCount: sequenceCountEl.value,
    sequenceStep: sequenceStepEl.value,
    sequenceWidth: sequenceWidthEl.value,
    sequenceSliceStart: sequenceSliceStartEl.value,
    sequenceSliceLength: sequenceSliceLengthEl.value,
    sequencePrefix: sequencePrefixEl.value,
    sequenceSuffix: sequenceSuffixEl.value,
    sequenceNumberStart: sequenceNumberStartEl.value,

    outputFormat: outputFormatEl.value,
    outputDpi: outputDpiEl.value,
    outputPrefix: outputPrefixEl.value,
  };
}

function renderPreview() {
  const svg = activeView === 'base' ? lastSvgs.baseSvg : lastSvgs.replacedSvg;
  if (!svg) return;

  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  frame.src = url;

  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

let t = null;
function refreshPreviewDebounced() {
  clearTimeout(t);
  t = setTimeout(refreshPreviewNow, 250);
}

async function refreshPreviewNow() {
  try {
    setStatus('Renderizando vista previa...');
    const res = await window.api.render(getOpts());
    lastSvgs = res;
    setStatus('✅ Vista previa actualizada');
    renderPreview();
    window.api.saveSettings(getOpts());
  } catch (e) {
    setStatus(`❌ ${e.message || e}`);
  }
}

(async () => {
  const saved = await window.api.loadSettings();
  if (saved) {
    const map = {
      payload: payloadEl,
      replaceText: replaceEl,
      emptyCellText: emptyEl,
      singleGridText: singleTextEl,

      outerRows: outerRowsEl,
      outerCols: outerColsEl,

      scale: scaleEl,
      padding: paddingEl,
      finalSize: finalSizeEl,

      fontSize: fontSizeEl,
      dotFontSize: dotFontSizeEl,
      emptyFontSize: emptyFontSizeEl,

      dotFontFamily: dotFontFamilyEl,
      emptyFontFamily: emptyFontFamilyEl,

      dotTextStrokeWidth: dotTextStrokeWidthEl,
      emptyTextStrokeWidth: emptyTextStrokeWidthEl,
      dotTextStrokeColor: dotTextStrokeColorEl,
      emptyTextStrokeColor: emptyTextStrokeColorEl,
      textStrokeJoin: textStrokeJoinEl,

      dotImageScale: dotImageScaleEl,
      emptyImageScale: emptyImageScaleEl,
      dotImageFit: dotImageFitEl,
      emptyImageFit: emptyImageFitEl,
      dotImageRotate: dotImageRotateEl,
      emptyImageRotate: emptyImageRotateEl,
      dotImageOpacity: dotImageOpacityEl,
      emptyImageOpacity: emptyImageOpacityEl,

      legendFontSize: legendFontSizeEl,
      legendMargin: legendMarginEl,

      sequenceStrategy: sequenceStrategyEl,
      sequenceStart: sequenceStartEl,
      sequenceCount: sequenceCountEl,
      sequenceStep: sequenceStepEl,
      sequenceWidth: sequenceWidthEl,
      sequenceSliceStart: sequenceSliceStartEl,
      sequenceSliceLength: sequenceSliceLengthEl,
      sequencePrefix: sequencePrefixEl,
      sequenceSuffix: sequenceSuffixEl,
      sequenceNumberStart: sequenceNumberStartEl,

      outputFormat: outputFormatEl,
      outputDpi: outputDpiEl,
      outputPrefix: outputPrefixEl,
    };

    for (const [k, v] of Object.entries(saved)) {
      if (map[k] !== undefined && map[k] !== null && v !== undefined) {
        map[k].value = v;
      }
    }

    useGs1El.checked = !!saved.useGs1;
    repeatEl.checked = saved.repeatReplaceText !== false;
    fullGridEl.checked = saved.fillFullGrid !== false;
    showGridEl.checked = !!saved.showGrid;
    singleModeEl.checked = !!saved.singleGridTextMode;

    outerOnBaseEl.checked = saved.outerOnBase !== false;

    useEmbeddedFontsEl.checked = !!saved.useEmbeddedFonts;
    dotEmbeddedFont = saved.dotEmbeddedFont ?? null;
    emptyEmbeddedFont = saved.emptyEmbeddedFont ?? null;
    dotFontFileLabelEl.textContent = dotEmbeddedFont?.name ?? '(ninguna)';
    emptyFontFileLabelEl.textContent = emptyEmbeddedFont?.name ?? '(ninguna)';

    useImagesEl.checked = !!saved.useImages;
    dotUseImageEl.checked = saved.dotUseImage !== false;
    emptyUseImageEl.checked = saved.emptyUseImage !== false;
    dotImage = saved.dotImage ?? null;
    emptyImage = saved.emptyImage ?? null;
    dotImageLabelEl.textContent = dotImage?.name ?? '(ninguna)';
    emptyImageLabelEl.textContent = emptyImage?.name ?? '(ninguna)';

    includePayloadInFilenameEl.checked = saved.includePayloadInFilename !== false;
    printPayloadLegendEl.checked = !!saved.printPayloadLegend;

    sequenceModeEl.checked = !!saved.sequenceMode;

    if (saved.style) {
      bgColorEl.value = saved.style.bgColor ?? bgColorEl.value;
      dotColorEl.value = saved.style.dotColor ?? dotColorEl.value;
      emptyColorEl.value = saved.style.emptyColor ?? emptyColorEl.value;
      gridColorEl.value = saved.style.gridColor ?? gridColorEl.value;
    }
  }

  await refreshPreviewNow();
})();

const watchedIds = [
  'payload', 'replaceText', 'emptyCellText', 'singleGridText',
  'useGs1', 'repeatReplaceText', 'fillFullGrid', 'showGrid', 'singleGridTextMode',
  'outerRows', 'outerCols', 'outerOnBase',
  'scale', 'padding', 'finalSize', 'fontSize', 'dotFontSize', 'emptyFontSize',
  'dotFontFamily', 'emptyFontFamily', 'useEmbeddedFonts',
  'dotTextStrokeWidth', 'emptyTextStrokeWidth', 'dotTextStrokeColor', 'emptyTextStrokeColor', 'textStrokeJoin',
  'useImages', 'dotUseImage', 'emptyUseImage',
  'dotImageScale', 'emptyImageScale', 'dotImageFit', 'emptyImageFit',
  'dotImageRotate', 'emptyImageRotate', 'dotImageOpacity', 'emptyImageOpacity',
  'includePayloadInFilename', 'printPayloadLegend', 'legendFontSize', 'legendMargin',
  'bgColor', 'dotColor', 'emptyColor', 'gridColor',
  'sequenceMode', 'sequenceStrategy', 'sequenceStart', 'sequenceCount', 'sequenceStep',
  'sequenceWidth', 'sequenceSliceStart', 'sequenceSliceLength', 'sequencePrefix', 'sequenceSuffix', 'sequenceNumberStart',
  'outputFormat', 'outputDpi', 'outputPrefix'
];

for (const id of watchedIds) {
  const node = el(id);
  if (!node) continue;
  node.addEventListener('input', refreshPreviewDebounced);
  node.addEventListener('change', refreshPreviewDebounced);
}

el('choose').addEventListener('click', async () => {
  const folder = await window.api.chooseFolder();
  if (!folder) return;
  outDir = folder;
  outDirEl.textContent = outDir;
});

el('chooseDotImage').addEventListener('click', async () => {
  const r = await window.api.chooseImage();
  if (!r) return;
  dotImage = r;
  dotImageLabelEl.textContent = r.name;
  refreshPreviewDebounced();
});

el('chooseEmptyImage').addEventListener('click', async () => {
  const r = await window.api.chooseImage();
  if (!r) return;
  emptyImage = r;
  emptyImageLabelEl.textContent = r.name;
  refreshPreviewDebounced();
});

el('chooseDotFontFile').addEventListener('click', async () => {
  const r = await window.api.chooseFont();
  if (!r) return;
  dotEmbeddedFont = r;
  dotFontFileLabelEl.textContent = r.name;
  refreshPreviewDebounced();
});

el('chooseEmptyFontFile').addEventListener('click', async () => {
  const r = await window.api.chooseFont();
  if (!r) return;
  emptyEmbeddedFont = r;
  emptyFontFileLabelEl.textContent = r.name;
  refreshPreviewDebounced();
});

el('saveSvg').addEventListener('click', async () => {
  try {
    if (!outDir) throw new Error('Elige carpeta de salida primero.');
    setStatus('Guardando SVGs...');
    const res = await window.api.saveSvgs({ ...getOpts(), outDir });
    setStatus(`✅ Guardados:\n${res.basePath}\n${res.replacedPath}`);
  } catch (e) {
    setStatus(`❌ ${e.message || e}`);
  }
});

el('saveSequence').addEventListener('click', async () => {
  try {
    if (!outDir) throw new Error('Elige carpeta de salida primero.');
    setStatus('Generando secuencia...');
    const res = await window.api.saveSequence({ ...getOpts(), outDir });
    setStatus(`✅ Secuencia generada:\n${res.outputPath}`);
  } catch (e) {
    setStatus(`❌ ${e.message || e}`);
  }
});