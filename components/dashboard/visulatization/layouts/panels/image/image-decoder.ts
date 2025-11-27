import type {
  RawImageMessage,
  CompressedImageMessage,
  DecodedImage,
  ColorMode,
  ColorMapType,
  RotationAngle,
} from "./types";

// Turbo colormap (Google's improved rainbow colormap)
const TURBO_COLORMAP = [
  [0.18995, 0.07176, 0.23217],
  [0.19483, 0.08339, 0.26149],
  [0.19956, 0.09498, 0.29024],
  [0.20415, 0.10652, 0.31844],
  [0.2086, 0.11802, 0.34607],
  [0.21291, 0.12947, 0.37314],
  [0.21708, 0.14087, 0.39964],
  [0.22111, 0.15223, 0.42558],
  [0.225, 0.16354, 0.45096],
  [0.22875, 0.17481, 0.47578],
  [0.23236, 0.18603, 0.50004],
  [0.23582, 0.1972, 0.52373],
  [0.23915, 0.20833, 0.54686],
  [0.24234, 0.21941, 0.56942],
  [0.24539, 0.23044, 0.59142],
  [0.2483, 0.24143, 0.61286],
  [0.25107, 0.25237, 0.63374],
  [0.25369, 0.26327, 0.65406],
  [0.25618, 0.27412, 0.67381],
  [0.25853, 0.28492, 0.693],
  [0.26074, 0.29568, 0.71162],
  [0.2628, 0.30639, 0.72968],
  [0.26473, 0.31706, 0.74718],
  [0.26652, 0.32768, 0.76412],
  [0.26816, 0.33825, 0.7805],
  [0.26967, 0.34878, 0.79631],
  [0.27103, 0.35926, 0.81156],
  [0.27226, 0.3697, 0.82624],
  [0.27334, 0.38008, 0.84037],
  [0.27429, 0.39043, 0.85393],
  [0.27509, 0.40072, 0.86692],
  [0.27576, 0.41097, 0.87936],
  [0.27628, 0.42118, 0.89123],
  [0.27667, 0.43134, 0.90254],
  [0.27691, 0.44145, 0.91328],
  [0.27701, 0.45152, 0.92347],
  [0.27698, 0.46153, 0.93309],
  [0.2768, 0.47151, 0.94214],
  [0.27648, 0.48144, 0.95064],
  [0.27603, 0.49132, 0.95857],
  [0.27543, 0.50115, 0.96594],
  [0.27469, 0.51094, 0.97275],
  [0.27381, 0.52069, 0.97899],
  [0.27273, 0.5304, 0.98461],
  [0.27106, 0.54015, 0.9893],
  [0.26878, 0.54995, 0.99303],
  [0.26592, 0.55979, 0.99583],
  [0.26252, 0.56967, 0.99773],
  [0.25862, 0.57958, 0.99876],
  [0.25425, 0.5895, 0.99896],
  [0.24946, 0.59943, 0.99835],
  [0.24427, 0.60937, 0.99697],
  [0.23874, 0.61931, 0.99485],
  [0.23288, 0.62923, 0.99202],
  [0.22676, 0.63913, 0.98851],
  [0.22039, 0.64901, 0.98436],
  [0.21382, 0.65886, 0.97959],
  [0.20708, 0.66866, 0.97423],
  [0.20021, 0.67842, 0.96833],
  [0.19326, 0.68812, 0.9619],
  [0.18625, 0.69775, 0.95498],
  [0.17923, 0.70732, 0.94761],
  [0.17223, 0.7168, 0.93981],
  [0.16529, 0.7262, 0.93161],
  [0.15844, 0.73551, 0.92305],
  [0.15173, 0.74472, 0.91416],
  [0.14519, 0.75381, 0.90496],
  [0.13886, 0.76279, 0.8955],
  [0.13278, 0.77165, 0.8858],
  [0.12698, 0.78037, 0.8759],
  [0.12151, 0.78896, 0.86581],
  [0.11639, 0.7974, 0.85559],
  [0.11167, 0.80569, 0.84525],
  [0.10738, 0.81381, 0.83484],
  [0.10357, 0.82177, 0.82437],
  [0.10026, 0.82955, 0.81389],
  [0.0975, 0.83714, 0.80342],
  [0.09532, 0.84455, 0.79299],
  [0.09377, 0.85175, 0.78264],
  [0.09287, 0.85875, 0.7724],
  [0.09267, 0.86554, 0.7623],
  [0.0932, 0.87211, 0.75237],
  [0.09451, 0.87844, 0.74265],
  [0.09662, 0.88454, 0.73316],
  [0.09958, 0.8904, 0.72393],
  [0.10342, 0.896, 0.715],
  [0.10815, 0.90142, 0.70599],
  [0.11374, 0.90673, 0.69651],
  [0.12014, 0.91193, 0.6866],
  [0.12733, 0.91701, 0.67627],
  [0.13526, 0.92197, 0.66556],
  [0.14391, 0.9268, 0.65448],
  [0.15323, 0.93151, 0.64308],
  [0.16319, 0.93609, 0.63137],
  [0.17377, 0.94053, 0.61938],
  [0.18491, 0.94484, 0.60713],
  [0.19659, 0.94901, 0.59466],
  [0.20877, 0.95304, 0.58199],
  [0.22142, 0.95692, 0.56914],
  [0.23449, 0.96065, 0.55614],
  [0.24797, 0.96423, 0.54303],
  [0.2618, 0.96765, 0.52981],
  [0.27597, 0.97092, 0.51653],
  [0.29042, 0.97403, 0.50321],
  [0.30513, 0.97697, 0.48987],
  [0.32006, 0.97974, 0.47654],
  [0.33517, 0.98234, 0.46325],
  [0.35043, 0.98477, 0.45002],
  [0.36581, 0.98702, 0.43688],
  [0.38127, 0.98909, 0.42386],
  [0.39678, 0.99098, 0.41098],
  [0.41229, 0.99268, 0.39826],
  [0.42778, 0.99419, 0.38575],
  [0.44321, 0.99551, 0.37345],
  [0.45854, 0.99663, 0.3614],
  [0.47375, 0.99755, 0.34963],
  [0.48879, 0.99828, 0.33816],
  [0.50362, 0.99879, 0.32701],
  [0.51822, 0.9991, 0.31622],
  [0.53255, 0.99919, 0.30581],
  [0.54658, 0.99907, 0.29581],
  [0.56026, 0.99873, 0.28623],
  [0.57357, 0.99817, 0.27712],
  [0.58646, 0.99739, 0.26849],
  [0.59891, 0.99638, 0.26038],
  [0.61088, 0.99514, 0.2528],
  [0.62233, 0.99366, 0.24579],
  [0.63323, 0.99195, 0.23937],
  [0.64362, 0.98999, 0.23356],
  [0.65394, 0.98775, 0.22835],
  [0.66428, 0.98524, 0.2237],
  [0.67462, 0.98246, 0.2196],
  [0.68494, 0.97941, 0.21602],
  [0.69525, 0.9761, 0.21294],
  [0.70553, 0.97255, 0.21032],
  [0.71577, 0.96875, 0.20815],
  [0.72596, 0.9647, 0.2064],
  [0.7361, 0.96043, 0.20504],
  [0.74617, 0.95593, 0.20406],
  [0.75617, 0.95121, 0.20343],
  [0.76608, 0.94627, 0.20311],
  [0.77591, 0.94113, 0.2031],
  [0.78563, 0.93579, 0.20336],
  [0.79524, 0.93025, 0.20386],
  [0.80473, 0.92452, 0.20459],
  [0.8141, 0.91861, 0.20552],
  [0.82333, 0.91253, 0.20663],
  [0.83241, 0.90627, 0.20788],
  [0.84133, 0.89986, 0.20926],
  [0.8501, 0.89328, 0.21074],
  [0.85868, 0.88655, 0.2123],
  [0.86709, 0.87968, 0.21391],
  [0.8753, 0.87267, 0.21555],
  [0.88331, 0.86553, 0.21719],
  [0.89112, 0.85826, 0.2188],
  [0.8987, 0.85087, 0.22038],
  [0.90605, 0.84337, 0.22188],
  [0.91317, 0.83576, 0.22328],
  [0.92004, 0.82806, 0.22456],
  [0.92666, 0.82025, 0.2257],
  [0.93301, 0.81236, 0.22667],
  [0.93909, 0.80439, 0.22744],
  [0.94489, 0.79634, 0.228],
  [0.95039, 0.78823, 0.22831],
  [0.9556, 0.78005, 0.22836],
  [0.96049, 0.77181, 0.22811],
  [0.96507, 0.76352, 0.22754],
  [0.96931, 0.75519, 0.22663],
  [0.97323, 0.74682, 0.22536],
  [0.97679, 0.73842, 0.22369],
  [0.98, 0.73, 0.22161],
  [0.98289, 0.7214, 0.21918],
  [0.98549, 0.7125, 0.2165],
  [0.98781, 0.7033, 0.21358],
  [0.98986, 0.69382, 0.21043],
  [0.99163, 0.68408, 0.20706],
  [0.99314, 0.67408, 0.20348],
  [0.99438, 0.66386, 0.19971],
  [0.99535, 0.65341, 0.19577],
  [0.99607, 0.64277, 0.19165],
  [0.99654, 0.63193, 0.18738],
  [0.99675, 0.62093, 0.18297],
  [0.99672, 0.60977, 0.17842],
  [0.99644, 0.59846, 0.17376],
  [0.99593, 0.58703, 0.16899],
  [0.99517, 0.57549, 0.16412],
  [0.99419, 0.56386, 0.15918],
  [0.99297, 0.55214, 0.15417],
  [0.99153, 0.54036, 0.1491],
  [0.98987, 0.52854, 0.14398],
  [0.98799, 0.51667, 0.13883],
  [0.9859, 0.50479, 0.13367],
  [0.9836, 0.49291, 0.12849],
  [0.98108, 0.48104, 0.12332],
  [0.97837, 0.4692, 0.11817],
  [0.97545, 0.4574, 0.11305],
  [0.97234, 0.44565, 0.10797],
  [0.96904, 0.43399, 0.10294],
  [0.96555, 0.42241, 0.09798],
  [0.96187, 0.41093, 0.0931],
  [0.95801, 0.39958, 0.08831],
  [0.95398, 0.38836, 0.08362],
  [0.94977, 0.37729, 0.07905],
  [0.94538, 0.36638, 0.07461],
  [0.94084, 0.35566, 0.07031],
  [0.93612, 0.34513, 0.06616],
  [0.93125, 0.33482, 0.06218],
  [0.92623, 0.32473, 0.05837],
  [0.92105, 0.31489, 0.05475],
  [0.91572, 0.3053, 0.05134],
  [0.91024, 0.29599, 0.04814],
  [0.90463, 0.28696, 0.04516],
  [0.89888, 0.27824, 0.04243],
  [0.89298, 0.26981, 0.03993],
  [0.88691, 0.26152, 0.03753],
  [0.88066, 0.25334, 0.03521],
  [0.87422, 0.24526, 0.03297],
  [0.8676, 0.2373, 0.03082],
  [0.86079, 0.22945, 0.02875],
  [0.8538, 0.2217, 0.02677],
  [0.84662, 0.21407, 0.02487],
  [0.83926, 0.20654, 0.02305],
  [0.83172, 0.19912, 0.02131],
  [0.82399, 0.19182, 0.01966],
  [0.81608, 0.18462, 0.01809],
  [0.80799, 0.17753, 0.0166],
  [0.79971, 0.17055, 0.0152],
  [0.79125, 0.16368, 0.01387],
  [0.7826, 0.15693, 0.01264],
  [0.77377, 0.15028, 0.01148],
  [0.76476, 0.14374, 0.01041],
  [0.75556, 0.13731, 0.00942],
  [0.74617, 0.13098, 0.00851],
  [0.73661, 0.12477, 0.00769],
  [0.72686, 0.11867, 0.00695],
  [0.71692, 0.11268, 0.00629],
  [0.7068, 0.1068, 0.00571],
  [0.6965, 0.10102, 0.00522],
  [0.68602, 0.09536, 0.00481],
  [0.67535, 0.0898, 0.00449],
  [0.66449, 0.08436, 0.00424],
  [0.65345, 0.07902, 0.00408],
  [0.64223, 0.0738, 0.00401],
  [0.63082, 0.06868, 0.00401],
  [0.61923, 0.06367, 0.0041],
  [0.60746, 0.05878, 0.00427],
  [0.5955, 0.05399, 0.00453],
  [0.58336, 0.04931, 0.00486],
  [0.57103, 0.04474, 0.00529],
  [0.55852, 0.04028, 0.00579],
  [0.54583, 0.03593, 0.00638],
  [0.53295, 0.03169, 0.00705],
  [0.51989, 0.02756, 0.0078],
  [0.50664, 0.02354, 0.00863],
  [0.49321, 0.01963, 0.00955],
  [0.4796, 0.01583, 0.01055],
];

// Rainbow colormap (RViz-style)
const RAINBOW_COLORMAP = [
  [0.5, 0.0, 1.0],
  [0.0, 0.0, 1.0],
  [0.0, 0.5, 1.0],
  [0.0, 1.0, 1.0],
  [0.0, 1.0, 0.5],
  [0.0, 1.0, 0.0],
  [0.5, 1.0, 0.0],
  [1.0, 1.0, 0.0],
  [1.0, 0.5, 0.0],
  [1.0, 0.0, 0.0],
];

function getColorFromMap(
  value: number,
  colormap: number[][]
): [number, number, number] {
  const normalizedValue = Math.max(0, Math.min(1, value));
  const index = normalizedValue * (colormap.length - 1);
  const lowerIndex = Math.floor(index);
  const upperIndex = Math.ceil(index);
  const t = index - lowerIndex;

  if (lowerIndex === upperIndex) {
    const color = colormap[lowerIndex];
    return [color[0] * 255, color[1] * 255, color[2] * 255];
  }

  const lower = colormap[lowerIndex];
  const upper = colormap[upperIndex];

  return [
    (lower[0] + (upper[0] - lower[0]) * t) * 255,
    (lower[1] + (upper[1] - lower[1]) * t) * 255,
    (lower[2] + (upper[2] - lower[2]) * t) * 255,
  ];
}

function applyColorMap(
  value: number,
  colorMapType: ColorMapType
): [number, number, number] {
  const colormap = colorMapType === "turbo" ? TURBO_COLORMAP : RAINBOW_COLORMAP;
  return getColorFromMap(value, colormap);
}

function applyGradient(
  value: number,
  minColor: string,
  maxColor: string
): [number, number, number] {
  // Parse hex colors
  const parseHex = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
        ]
      : [0, 0, 0];
  };

  const min = parseHex(minColor);
  const max = parseHex(maxColor);

  const normalizedValue = Math.max(0, Math.min(1, value));

  return [
    min[0] + (max[0] - min[0]) * normalizedValue,
    min[1] + (max[1] - min[1]) * normalizedValue,
    min[2] + (max[2] - min[2]) * normalizedValue,
  ];
}

// Decode raw image data
export function decodeRawImage(
  message: RawImageMessage,
  colorMode: ColorMode = "raw",
  colorMapType: ColorMapType = "turbo",
  gradientColors?: { min: string; max: string },
  valueMin: number = 0,
  valueMax: number = 10000
): DecodedImage | null {
  const { width, height, encoding, data } = message;

  if (!data || data.length === 0) {
    return null;
  }

  const imageData = new Uint8ClampedArray(new ArrayBuffer(width * height * 4));
  const dataArray = data instanceof Uint8Array ? data : new Uint8Array(data);

  try {
    switch (encoding) {
      case "rgb8":
        for (let i = 0; i < width * height; i++) {
          imageData[i * 4] = dataArray[i * 3];
          imageData[i * 4 + 1] = dataArray[i * 3 + 1];
          imageData[i * 4 + 2] = dataArray[i * 3 + 2];
          imageData[i * 4 + 3] = 255;
        }
        break;

      case "rgba8":
        for (let i = 0; i < width * height; i++) {
          imageData[i * 4] = dataArray[i * 4];
          imageData[i * 4 + 1] = dataArray[i * 4 + 1];
          imageData[i * 4 + 2] = dataArray[i * 4 + 2];
          imageData[i * 4 + 3] = dataArray[i * 4 + 3];
        }
        break;

      case "bgr8":
        for (let i = 0; i < width * height; i++) {
          imageData[i * 4] = dataArray[i * 3 + 2];
          imageData[i * 4 + 1] = dataArray[i * 3 + 1];
          imageData[i * 4 + 2] = dataArray[i * 3];
          imageData[i * 4 + 3] = 255;
        }
        break;

      case "bgra8":
        for (let i = 0; i < width * height; i++) {
          imageData[i * 4] = dataArray[i * 4 + 2];
          imageData[i * 4 + 1] = dataArray[i * 4 + 1];
          imageData[i * 4 + 2] = dataArray[i * 4];
          imageData[i * 4 + 3] = dataArray[i * 4 + 3];
        }
        break;

      case "mono8":
      case "8UC1":
        for (let i = 0; i < width * height; i++) {
          const gray = dataArray[i];
          imageData[i * 4] = gray;
          imageData[i * 4 + 1] = gray;
          imageData[i * 4 + 2] = gray;
          imageData[i * 4 + 3] = 255;
        }
        break;

      case "8UC3":
        for (let i = 0; i < width * height; i++) {
          imageData[i * 4] = dataArray[i * 3];
          imageData[i * 4 + 1] = dataArray[i * 3 + 1];
          imageData[i * 4 + 2] = dataArray[i * 3 + 2];
          imageData[i * 4 + 3] = 255;
        }
        break;

      case "mono16":
      case "16UC1": {
        for (let i = 0; i < width * height; i++) {
          const value16 = (dataArray[i * 2 + 1] << 8) | dataArray[i * 2];
          const normalized = (value16 - valueMin) / (valueMax - valueMin);

          let r: number;
          let g: number;
          let b: number;

          if (colorMode === "colormap") {
            [r, g, b] = applyColorMap(normalized, colorMapType);
          } else if (colorMode === "gradient" && gradientColors) {
            [r, g, b] = applyGradient(
              normalized,
              gradientColors.min,
              gradientColors.max
            );
          } else {
            const gray = Math.max(0, Math.min(255, normalized * 255));
            r = gray;
            g = gray;
            b = gray;
          }

          imageData[i * 4] = r;
          imageData[i * 4 + 1] = g;
          imageData[i * 4 + 2] = b;
          imageData[i * 4 + 3] = 255;
        }
        break;
      }

      case "32FC1": {
        for (let i = 0; i < width * height; i++) {
          const view = new DataView(dataArray.buffer, i * 4, 4);
          const value32 = view.getFloat32(0, true);
          const normalized = (value32 - valueMin) / (valueMax - valueMin);

          let r: number;
          let g: number;
          let b: number;

          if (colorMode === "colormap") {
            [r, g, b] = applyColorMap(normalized, colorMapType);
          } else if (colorMode === "gradient" && gradientColors) {
            [r, g, b] = applyGradient(
              normalized,
              gradientColors.min,
              gradientColors.max
            );
          } else {
            const gray = Math.max(0, Math.min(255, normalized * 255));
            r = gray;
            g = gray;
            b = gray;
          }

          imageData[i * 4] = r;
          imageData[i * 4 + 1] = g;
          imageData[i * 4 + 2] = b;
          imageData[i * 4 + 3] = 255;
        }
        break;
      }

      case "bayer_rggb8":
      case "bayer_bggr8":
      case "bayer_gbrg8":
      case "bayer_grbg8":
        // Simple debayer using nearest neighbor interpolation
        debayerImage(dataArray, imageData, width, height, encoding);
        break;

      case "yuv422":
      case "uyvy": {
        // UYVY: U Y V Y (2 pixels per 4 bytes)
        for (let i = 0; i < (width * height) / 2; i++) {
          const u = dataArray[i * 4] - 128;
          const y1 = dataArray[i * 4 + 1];
          const v = dataArray[i * 4 + 2] - 128;
          const y2 = dataArray[i * 4 + 3];

          // Convert YUV to RGB for pixel 1
          const r1 = Math.max(0, Math.min(255, y1 + 1.402 * v));
          const g1 = Math.max(0, Math.min(255, y1 - 0.344 * u - 0.714 * v));
          const b1 = Math.max(0, Math.min(255, y1 + 1.772 * u));

          // Convert YUV to RGB for pixel 2
          const r2 = Math.max(0, Math.min(255, y2 + 1.402 * v));
          const g2 = Math.max(0, Math.min(255, y2 - 0.344 * u - 0.714 * v));
          const b2 = Math.max(0, Math.min(255, y2 + 1.772 * u));

          imageData[i * 8] = r1;
          imageData[i * 8 + 1] = g1;
          imageData[i * 8 + 2] = b1;
          imageData[i * 8 + 3] = 255;

          imageData[i * 8 + 4] = r2;
          imageData[i * 8 + 5] = g2;
          imageData[i * 8 + 6] = b2;
          imageData[i * 8 + 7] = 255;
        }
        break;
      }

      case "yuv422_yuy2":
      case "yuyv": {
        // YUYV: Y U Y V (2 pixels per 4 bytes)
        for (let i = 0; i < (width * height) / 2; i++) {
          const y1 = dataArray[i * 4];
          const u = dataArray[i * 4 + 1] - 128;
          const y2 = dataArray[i * 4 + 2];
          const v = dataArray[i * 4 + 3] - 128;

          // Convert YUV to RGB for pixel 1
          const r1 = Math.max(0, Math.min(255, y1 + 1.402 * v));
          const g1 = Math.max(0, Math.min(255, y1 - 0.344 * u - 0.714 * v));
          const b1 = Math.max(0, Math.min(255, y1 + 1.772 * u));

          // Convert YUV to RGB for pixel 2
          const r2 = Math.max(0, Math.min(255, y2 + 1.402 * v));
          const g2 = Math.max(0, Math.min(255, y2 - 0.344 * u - 0.714 * v));
          const b2 = Math.max(0, Math.min(255, y2 + 1.772 * u));

          imageData[i * 8] = r1;
          imageData[i * 8 + 1] = g1;
          imageData[i * 8 + 2] = b1;
          imageData[i * 8 + 3] = 255;

          imageData[i * 8 + 4] = r2;
          imageData[i * 8 + 5] = g2;
          imageData[i * 8 + 6] = b2;
          imageData[i * 8 + 7] = 255;
        }
        break;
      }

      default:
        console.warn(`Unsupported encoding: ${encoding}`);
        return null;
    }

    return {
      width,
      height,
      data: imageData,
      encoding,
    };
  } catch (error) {
    console.error("Error decoding image:", error);
    return null;
  }
}

function debayerImage(
  bayer: Uint8Array,
  rgb: Uint8ClampedArray,
  width: number,
  height: number,
  pattern: string
) {
  // Simple nearest neighbor debayering
  // Pattern determines the color filter arrangement
  const getPatternOffsets = (pattern: string) => {
    switch (pattern) {
      case "bayer_rggb8":
        return { r: [0, 0], g1: [0, 1], g2: [1, 0], b: [1, 1] };
      case "bayer_bggr8":
        return { r: [1, 1], g1: [1, 0], g2: [0, 1], b: [0, 0] };
      case "bayer_gbrg8":
        return { r: [1, 0], g1: [0, 0], g2: [1, 1], b: [0, 1] };
      case "bayer_grbg8":
        return { r: [0, 1], g1: [0, 0], g2: [1, 1], b: [1, 0] };
      default:
        return { r: [0, 0], g1: [0, 1], g2: [1, 0], b: [1, 1] };
    }
  };

  const offsets = getPatternOffsets(pattern);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const outIdx = idx * 4;

      // Determine which color this pixel is in the Bayer pattern
      const patternX = x % 2;
      const patternY = y % 2;

      let r = 0;
      let g = 0;
      let b = 0;

      if (patternY === offsets.r[0] && patternX === offsets.r[1]) {
        r = bayer[idx];
        // Interpolate G and B from neighbors
        g = getNeighborAverage(
          bayer,
          x,
          y,
          width,
          height,
          offsets.g1,
          offsets.g2
        );
        b = getNeighborAverage(
          bayer,
          x,
          y,
          width,
          height,
          offsets.b,
          offsets.b
        );
      } else if (
        (patternY === offsets.g1[0] && patternX === offsets.g1[1]) ||
        (patternY === offsets.g2[0] && patternX === offsets.g2[1])
      ) {
        g = bayer[idx];
        r = getNeighborAverage(
          bayer,
          x,
          y,
          width,
          height,
          offsets.r,
          offsets.r
        );
        b = getNeighborAverage(
          bayer,
          x,
          y,
          width,
          height,
          offsets.b,
          offsets.b
        );
      } else if (patternY === offsets.b[0] && patternX === offsets.b[1]) {
        b = bayer[idx];
        g = getNeighborAverage(
          bayer,
          x,
          y,
          width,
          height,
          offsets.g1,
          offsets.g2
        );
        r = getNeighborAverage(
          bayer,
          x,
          y,
          width,
          height,
          offsets.r,
          offsets.r
        );
      }

      rgb[outIdx] = r;
      rgb[outIdx + 1] = g;
      rgb[outIdx + 2] = b;
      rgb[outIdx + 3] = 255;
    }
  }
}

function getNeighborAverage(
  bayer: Uint8Array,
  x: number,
  y: number,
  width: number,
  height: number,
  offset1: number[],
  offset2: number[]
): number {
  const neighbors: number[] = [];

  // Check 4 surrounding pixels
  const positions = [
    [y - 1, x - 1],
    [y - 1, x + 1],
    [y + 1, x - 1],
    [y + 1, x + 1],
  ];

  for (const [py, px] of positions) {
    if (py >= 0 && py < height && px >= 0 && px < width) {
      const patternY = py % 2;
      const patternX = px % 2;
      if (
        (patternY === offset1[0] && patternX === offset1[1]) ||
        (patternY === offset2[0] && patternX === offset2[1])
      ) {
        neighbors.push(bayer[py * width + px]);
      }
    }
  }

  if (neighbors.length === 0) return 0;
  return neighbors.reduce((a, b) => a + b, 0) / neighbors.length;
}

// Decode compressed image
export async function decodeCompressedImage(
  message: CompressedImageMessage
): Promise<DecodedImage | null> {
  try {
    const { format, data } = message;
    const dataArray = data instanceof Uint8Array ? data : new Uint8Array(data);

    // Create a blob from the data - convert to proper ArrayBuffer
    const buffer = new ArrayBuffer(dataArray.length);
    const view = new Uint8Array(buffer);
    view.set(dataArray);
    const blob = new Blob([view], { type: `image/${format}` });
    const url = URL.createObjectURL(blob);

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);

        URL.revokeObjectURL(url);

        resolve({
          width: img.width,
          height: img.height,
          data: imageData.data,
          encoding: format,
        });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image"));
      };
      img.src = url;
    });
  } catch (error) {
    console.error("Error decoding compressed image:", error);
    return null;
  }
}

// Apply transformations (flip, rotate)
export function transformImage(
  image: DecodedImage,
  flipHorizontal: boolean = false,
  flipVertical: boolean = false,
  rotation: RotationAngle = 0
): DecodedImage {
  if (!flipHorizontal && !flipVertical && rotation === 0) {
    return image;
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return image;
  }

  // Set canvas size based on rotation
  if (rotation === 90 || rotation === 270) {
    canvas.width = image.height;
    canvas.height = image.width;
  } else {
    canvas.width = image.width;
    canvas.height = image.height;
  }

  // Create temporary canvas for source image
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = image.width;
  tempCanvas.height = image.height;
  const tempCtx = tempCanvas.getContext("2d");

  if (!tempCtx) {
    return image;
  }

  const tempImageData = new ImageData(image.data, image.width, image.height);
  tempCtx.putImageData(tempImageData, 0, 0);

  // Apply transformations
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);

  if (rotation) {
    ctx.rotate((rotation * Math.PI) / 180);
  }

  const scaleX = flipHorizontal ? -1 : 1;
  const scaleY = flipVertical ? -1 : 1;
  ctx.scale(scaleX, scaleY);

  if (rotation === 90 || rotation === 270) {
    ctx.drawImage(tempCanvas, -image.width / 2, -image.height / 2);
  } else {
    ctx.drawImage(tempCanvas, -image.width / 2, -image.height / 2);
  }

  ctx.restore();

  const transformedImageData = ctx.getImageData(
    0,
    0,
    canvas.width,
    canvas.height
  );

  return {
    width: canvas.width,
    height: canvas.height,
    data: transformedImageData.data,
    encoding: image.encoding,
  };
}
