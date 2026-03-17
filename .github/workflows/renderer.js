<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>DotCodeGUI Advanced</title>
  <style>
    body { font-family: system-ui, Arial; margin: 16px; }
    .app { display:grid; grid-template-columns: 560px 1fr; gap: 14px; }
    .panel { border:1px solid #ddd; border-radius: 12px; padding: 12px; overflow:auto; max-height: calc(100vh - 40px); }
    .row { margin: 10px 0; }
    label { display:block; margin-bottom: 6px; font-weight: 600; }
    input[type="text"], input[type="number"], textarea, select { width: 100%; padding: 9px; box-sizing: border-box; }
    textarea { height: 72px; resize: vertical; }
    .inline { display:flex; gap: 10px; align-items:center; flex-wrap: wrap; }
    .btn { padding: 9px 12px; cursor:pointer; border:1px solid #ccc; border-radius: 10px; background:#fafafa; }
    .btn:hover { background:#f2f2f2; }
    .muted { color:#666; font-size: 12.5px; }
    .status { white-space: pre-wrap; font-family: ui-monospace, Consolas, monospace; font-size: 12.5px; }
    .previewWrap { border:1px solid #ddd; border-radius: 12px; overflow:hidden; }
    .tabs { display:flex; border-bottom:1px solid #ddd; }
    .tab { flex:1; padding: 10px; cursor:pointer; text-align:center; background:#fafafa; }
    .tab.active { background:white; font-weight:700; }
    .preview { width:100%; height: calc(100vh - 80px); background:#fff; }
    .twoCol { display:grid; grid-template-columns: 1fr 1fr; gap:10px; }
    .threeCol { display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px; }
    .chip { display:flex; align-items:center; gap:8px; }
    .hr { height:1px; background:#eee; margin: 12px 0; }
    .metrics {
      display:grid;
      grid-template-columns: 1fr 1fr;
      gap:8px 16px;
      border:1px solid #eee;
      border-radius:10px;
      padding:10px;
      background:#fafafa;
      font-size:13px;
    }
    .metrics div span {
      color:#666;
      display:inline-block;
      min-width:130px;
    }
  </style>
</head>
<body>
  <h2>DotCodeGUI (Editor avanzado)</h2>

  <div class="app">
    <div class="panel">

      <div class="row">
        <label>Código a codificar (payload)</label>
        <input id="payload" type="text" value="AAA123456" />
        <div class="muted">GS1 requiere AIs con paréntesis, ej: (01)09506000134352(21)AAA123456</div>
      </div>

      <div class="row">
        <label>Texto en dots (replaceText)</label>
        <textarea id="replaceText">ENUNLUGARDELAMANCHADECUYONOMBRENOQUIEROACORDARMENOHAMUCHOVIVIAUNHIDALGO</textarea>
      </div>

      <div class="row">
        <label>Texto en celdas vacías (emptyCellText)</label>
        <input id="emptyCellText" type="text" value="·" />
      </div>

      <div class="row">
        <label>Modo “Texto único para todo el grid”</label>
        <div class="inline">
          <label class="chip"><input id="singleGridTextMode" type="checkbox" /> Activar</label>
        </div>
        <input id="singleGridText" type="text" value="ENUNLUGARDELAMANCHA" />
      </div>

      <div class="row">
        <label>Opciones</label>
        <div class="inline">
          <label class="chip"><input id="useGs1" type="checkbox" /> GS1</label>
          <label class="chip"><input id="repeatReplaceText" type="checkbox" checked /> Repetir texto dots</label>
          <label class="chip"><input id="fillFullGrid" type="checkbox" checked /> Rellenar toda la rejilla</label>
          <label class="chip"><input id="showGrid" type="checkbox" /> Mostrar rejilla</label>
        </div>
      </div>

      <div class="row">
        <label>Marco exterior de no-dots</label>
        <div class="threeCol">
          <div>
            <div class="muted">Filas arriba/abajo</div>
            <input id="outerRows" type="number" value="5" min="0" max="100" />
          </div>
          <div>
            <div class="muted">Columnas izquierda/derecha</div>
            <input id="outerCols" type="number" value="5" min="0" max="100" />
          </div>
          <div>
            <div class="muted">Aplicar también al base</div>
            <label class="chip" style="margin-top:10px;"><input id="outerOnBase" type="checkbox" checked /> Sí</label>
          </div>
        </div>
      </div>

      <div class="row">
        <label>Geometría física de la cuadrícula</label>

        <div class="threeCol">
          <div>
            <div class="muted">Tamaño de celda (mm)</div>
            <input id="cellSizeMm" type="number" value="1.0" min="0.01" max="50" step="0.01" />
          </div>
          <div>
            <div class="muted">Ancho total cuadrícula (mm)</div>
            <input id="gridWidthMm" type="number" value="0" min="0" max="1000" step="0.01" />
          </div>
          <div>
            <div class="muted">Alto total cuadrícula (mm)</div>
            <input id="gridHeightMm" type="number" value="0" min="0" max="1000" step="0.01" />
          </div>
        </div>

        <div class="muted" style="margin-top:6px;">
          Si ancho/alto total son 0, se usan filas/columnas × tamaño de celda.
        </div>
      </div>

      <div class="row">
        <label>Desplazamiento de dots dentro de la celda</label>

        <div class="threeCol">
          <div>
            <div class="muted">Offset X dot (mm)</div>
            <input id="dotOffsetXmm" type="number" value="0" min="-50" max="50" step="0.01" />
          </div>
          <div>
            <div class="muted">Offset Y dot (mm)</div>
            <input id="dotOffsetYmm" type="number" value="0" min="-50" max="50" step="0.01" />
          </div>
          <div>
            <div class="muted">Diámetro dot (fracción celda)</div>
            <input id="dotDiameterRatio" type="number" value="0.75" min="0.05" max="1.5" step="0.01" />
          </div>
        </div>

        <div class="muted" style="margin-top:6px;">
          0,0 = centro de la celda. Valores positivos desplazan a derecha/abajo.
        </div>
      </div>

      <div class="row">
        <label>Resumen geométrico</label>
        <div class="metrics">
          <div><span>Columnas totales:</span> <strong id="metricCols">-</strong></div>
          <div><span>Filas totales:</span> <strong id="metricRows">-</strong></div>
          <div><span>Ancho final (mm):</span> <strong id="metricWidthMm">-</strong></div>
          <div><span>Alto final (mm):</span> <strong id="metricHeightMm">-</strong></div>
          <div><span>Ancho final (px):</span> <strong id="metricWidthPx">-</strong></div>
          <div><span>Alto final (px):</span> <strong id="metricHeightPx">-</strong></div>
        </div>
      </div>

      <div class="row">
        <label>Tamaño / render</label>
        <div class="twoCol">
          <div>
            <div class="muted">Escala DotCode</div>
            <input id="scale" type="number" value="4" min="1" max="14" />
          </div>
          <div>
            <div class="muted">Padding</div>
            <input id="padding" type="number" value="10" min="0" max="80" />
          </div>
        </div>
        <div class="twoCol" style="margin-top:10px;">
          <div>
            <div class="muted">Tamaño final (px)</div>
            <input id="finalSize" type="number" value="300" min="100" max="3000" />
          </div>
          <div>
            <div class="muted">Font-size general</div>
            <input id="fontSize" type="number" value="5" min="1" max="80" />
          </div>
        </div>
        <div class="twoCol" style="margin-top:10px;">
          <div>
            <div class="muted">Font-size en dots</div>
            <input id="dotFontSize" type="number" value="5" min="1" max="80" />
          </div>
          <div>
            <div class="muted">Font-size en no-dots</div>
            <input id="emptyFontSize" type="number" value="4" min="1" max="80" />
          </div>
        </div>
      </div>

      <div class="hr"></div>

      <div class="row">
        <label>Fuentes del sistema</label>
        <div class="twoCol">
          <div>
            <div class="muted">Fuente dots</div>
            <select id="dotFontFamily">
              <option value="monospace" selected>monospace</option>
              <option value="Consolas">Consolas</option>
              <option value="Courier New">Courier New</option>
              <option value="Arial">Arial</option>
              <option value="Segoe UI">Segoe UI</option>
              <option value="Times New Roman">Times New Roman</option>
            </select>
          </div>
          <div>
            <div class="muted">Fuente no-dots</div>
            <select id="emptyFontFamily">
              <option value="monospace" selected>monospace</option>
              <option value="Consolas">Consolas</option>
              <option value="Courier New">Courier New</option>
              <option value="Arial">Arial</option>
              <option value="Segoe UI">Segoe UI</option>
              <option value="Times New Roman">Times New Roman</option>
            </select>
          </div>
        </div>
      </div>

      <div class="row">
        <label>Fuentes embebidas</label>
        <div class="inline">
          <label class="chip"><input id="useEmbeddedFonts" type="checkbox" /> Usar fuentes embebidas</label>
        </div>
        <div class="twoCol" style="margin-top:10px;">
          <div>
            <button class="btn" id="chooseDotFontFile">Elegir fuente dots…</button>
            <div class="muted" id="dotFontFileLabel">(ninguna)</div>
          </div>
          <div>
            <button class="btn" id="chooseEmptyFontFile">Elegir fuente no-dots…</button>
            <div class="muted" id="emptyFontFileLabel">(ninguna)</div>
          </div>
        </div>
      </div>

      <div class="row">
        <label>Contorno del texto</label>
        <div class="threeCol">
          <div>
            <div class="muted">Stroke dots</div>
            <input id="dotTextStrokeWidth" type="number" value="0" min="0" max="10" step="0.1" />
          </div>
          <div>
            <div class="muted">Stroke no-dots</div>
            <input id="emptyTextStrokeWidth" type="number" value="0" min="0" max="10" step="0.1" />
          </div>
          <div>
            <div class="muted">Join</div>
            <select id="textStrokeJoin">
              <option value="round" selected>round</option>
              <option value="miter">miter</option>
              <option value="bevel">bevel</option>
            </select>
          </div>
        </div>
        <div class="twoCol" style="margin-top:10px;">
          <div class="chip"><span>Color stroke dots</span><input id="dotTextStrokeColor" type="color" value="#000000"></div>
          <div class="chip"><span>Color stroke no-dots</span><input id="emptyTextStrokeColor" type="color" value="#999999"></div>
        </div>
      </div>

      <div class="hr"></div>

      <div class="row">
        <label>Imágenes en lugar de texto</label>
        <div class="inline">
          <label class="chip"><input id="useImages" type="checkbox" /> Sustituir por imágenes</label>
          <label class="chip"><input id="dotUseImage" type="checkbox" checked /> En dots</label>
          <label class="chip"><input id="emptyUseImage" type="checkbox" checked /> En no-dots</label>
        </div>

        <div class="twoCol" style="margin-top:10px;">
          <div>
            <button class="btn" id="chooseDotImage">Elegir imagen dots…</button>
            <div class="muted" id="dotImageLabel">(ninguna)</div>
          </div>
          <div>
            <button class="btn" id="chooseEmptyImage">Elegir imagen no-dots…</button>
            <div class="muted" id="emptyImageLabel">(ninguna)</div>
          </div>
        </div>

        <div class="twoCol" style="margin-top:10px;">
          <div>
            <div class="muted">Escala imagen dots</div>
            <input id="dotImageScale" type="number" value="1.0" min="0.1" max="5" step="0.1" />
          </div>
          <div>
            <div class="muted">Escala imagen no-dots</div>
            <input id="emptyImageScale" type="number" value="1.0" min="0.1" max="5" step="0.1" />
          </div>
        </div>

        <div class="twoCol" style="margin-top:10px;">
          <div>
            <div class="muted">Fit imagen dots</div>
            <select id="dotImageFit">
              <option value="meet" selected>contain (meet)</option>
              <option value="slice">cover (slice)</option>
            </select>
          </div>
          <div>
            <div class="muted">Fit imagen no-dots</div>
            <select id="emptyImageFit">
              <option value="meet" selected>contain (meet)</option>
              <option value="slice">cover (slice)</option>
            </select>
          </div>
        </div>

        <div class="twoCol" style="margin-top:10px;">
          <div>
            <div class="muted">Rotación imagen dots (°)</div>
            <input id="dotImageRotate" type="number" value="0" min="-360" max="360" step="1" />
          </div>
          <div>
            <div class="muted">Rotación imagen no-dots (°)</div>
            <input id="emptyImageRotate" type="number" value="0" min="-360" max="360" step="1" />
          </div>
        </div>

        <div class="twoCol" style="margin-top:10px;">
          <div>
            <div class="muted">Opacidad imagen dots</div>
            <input id="dotImageOpacity" type="number" value="1" min="0" max="1" step="0.05" />
          </div>
          <div>
            <div class="muted">Opacidad imagen no-dots</div>
            <input id="emptyImageOpacity" type="number" value="1" min="0" max="1" step="0.05" />
          </div>
        </div>
      </div>

      <div class="hr"></div>

      <div class="row">
        <label>Leyenda / nombres</label>
        <div class="inline">
          <label class="chip"><input id="includePayloadInFilename" type="checkbox" checked /> Añadir payload al nombre</label>
          <label class="chip"><input id="printPayloadLegend" type="checkbox" /> Imprimir payload debajo</label>
        </div>
        <div class="twoCol" style="margin-top:10px;">
          <div>
            <div class="muted">Tamaño leyenda</div>
            <input id="legendFontSize" type="number" value="14" min="4" max="72" />
          </div>
          <div>
            <div class="muted">Margen leyenda (px)</div>
            <input id="legendMargin" type="number" value="12" min="0" max="200" />
          </div>
        </div>
      </div>

      <div class="row">
        <label>Estilo</label>
        <div class="twoCol">
          <div class="chip"><span>Fondo</span><input id="bgColor" type="color" value="#ffffff"></div>
          <div class="chip"><span>Color dots</span><input id="dotColor" type="color" value="#000000"></div>
          <div class="chip"><span>Color no-dots</span><input id="emptyColor" type="color" value="#999999"></div>
          <div class="chip"><span>Color rejilla</span><input id="gridColor" type="color" value="#c8c8c8"></div>
        </div>
      </div>

      <div class="hr"></div>

      <div class="row">
        <label>Serie de DotCodes</label>
        <div class="inline">
          <label class="chip"><input id="sequenceMode" type="checkbox" /> Activar secuencia</label>
        </div>

        <div class="threeCol" style="margin-top:10px;">
          <div>
            <div class="muted">Modo de incremento</div>
            <select id="sequenceStrategy">
              <option value="numeric-end" selected>Numérico final</option>
              <option value="numeric-slice">Bloque numérico interno</option>
              <option value="parts">Prefijo + número + sufijo</option>
            </select>
          </div>
          <div>
            <div class="muted">Cantidad</div>
            <input id="sequenceCount" type="number" value="10" min="1" max="10000" />
          </div>
          <div>
            <div class="muted">Salto</div>
            <input id="sequenceStep" type="number" value="1" min="1" max="1000000" />
          </div>
        </div>

        <div class="twoCol" style="margin-top:10px;">
          <div>
            <div class="muted">Payload inicial</div>
            <input id="sequenceStart" type="text" value="AAA000001" />
          </div>
          <div>
            <div class="muted">Ancho numérico (modo parts)</div>
            <input id="sequenceWidth" type="number" value="6" min="1" max="30" />
          </div>
        </div>

        <div class="twoCol" style="margin-top:10px;">
          <div>
            <div class="muted">Slice inicio (modo numeric-slice)</div>
            <input id="sequenceSliceStart" type="number" value="4" min="0" max="999" />
          </div>
          <div>
            <div class="muted">Slice longitud</div>
            <input id="sequenceSliceLength" type="number" value="6" min="1" max="999" />
          </div>
        </div>

        <div class="twoCol" style="margin-top:10px;">
          <div>
            <div class="muted">Prefijo (modo parts)</div>
            <input id="sequencePrefix" type="text" value="AAA" />
          </div>
          <div>
            <div class="muted">Sufijo (modo parts)</div>
            <input id="sequenceSuffix" type="text" value="" />
          </div>
        </div>

        <div class="row" style="margin-top:10px;">
          <div class="muted">Número inicial (modo parts)</div>
          <input id="sequenceNumberStart" type="number" value="1" min="0" max="999999999" />
        </div>
      </div>

      <div class="row">
        <label>Salida</label>
        <div class="threeCol">
          <div>
            <div class="muted">Formato</div>
            <select id="outputFormat">
              <option value="pdf" selected>PDF vectorial</option>
              <option value="png">PNG</option>
              <option value="tiff1">TIFF 1 bit</option>
            </select>
          </div>
          <div>
            <div class="muted">Resolución (dpi)</div>
            <input id="outputDpi" type="number" value="300" min="72" max="2400" />
          </div>
          <div>
            <div class="muted">Prefijo archivo</div>
            <input id="outputPrefix" type="text" value="dotcode" />
          </div>
        </div>
      </div>

      <div class="row inline">
        <button class="btn" id="choose">Carpeta de salida…</button>
        <div class="muted" id="outDir">(sin seleccionar)</div>
      </div>

      <div class="row inline">
        <button class="btn" id="saveSvg">Guardar SVGs</button>
        <button class="btn" id="saveSequence">Generar secuencia</button>
      </div>

      <div class="row">
        <div class="status" id="status"></div>
      </div>
    </div>

    <div class="previewWrap">
      <div class="tabs">
        <div class="tab active" id="tabReplaced">Reemplazado</div>
        <div class="tab" id="tabBase">DotCode</div>
      </div>
      <iframe class="preview" id="previewFrame"></iframe>
    </div>
  </div>

  <script src="./renderer.js"></script>
</body>
</html>