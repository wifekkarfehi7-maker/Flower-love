import QRCode from "qrcode";

const BASE_OPTIONS = {
  margin: 1,
  // "M" keeps the code readable when a printed card gets scuffed or a phone
  // camera is at an angle, without inflating the module count.
  errorCorrectionLevel: "M",
  color: { dark: "#101828", light: "#ffffff" },
} as const;

export function qrDataUrl(text: string, width = 512) {
  return QRCode.toDataURL(text, { ...BASE_OPTIONS, width });
}

export function qrSvg(text: string) {
  return QRCode.toString(text, { ...BASE_OPTIONS, type: "svg" });
}

function triggerDownload(href: string, filename: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function downloadQrPng(text: string, filename: string, width = 1024) {
  const dataUrl = await qrDataUrl(text, width);
  triggerDownload(dataUrl, `${filename}.png`);
}

export async function downloadQrSvg(text: string, filename: string) {
  const svg = await qrSvg(text);
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  triggerDownload(url, `${filename}.svg`);
  URL.revokeObjectURL(url);
}
