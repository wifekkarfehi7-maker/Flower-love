"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { encode } from "uqr";

import { Button } from "@/components/ui/button";

const STRINGS = {
  ar: { png: "تحميل PNG", svg: "تحميل SVG", alt: "رمز QR لرابط الدعوة" },
  fr: { png: "Télécharger PNG", svg: "Télécharger SVG", alt: "QR code du lien de l'invitation" },
  en: { png: "Download PNG", svg: "Download SVG", alt: "QR code for the invitation link" },
};

/** Size of the PNG download, in pixels — large enough for print. */
const PNG_SIZE = 1200;

/**
 * The invitation link as a QR code: shown on screen and downloadable as a
 * print-ready PNG or an SVG. Dark modules on white with a quiet zone, the
 * way scanners read most reliably; error correction "Q" so a printed card
 * still scans with a small smudge or fold.
 */
export function InvitationQr({ url, fileName, locale }: { url: string; fileName: string; locale: "ar" | "fr" | "en" }) {
  const t = STRINGS[locale];
  const qr = React.useMemo(() => encode(url, { ecc: "Q", border: 4 }), [url]);

  const path = React.useMemo(() => {
    let d = "";
    qr.data.forEach((row, y) =>
      row.forEach((dark, x) => {
        if (dark) d += `M${x} ${y}h1v1h-1z`;
      })
    );
    return d;
  }, [qr]);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${qr.size} ${qr.size}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#ffffff"/><path fill="#1a1712" d="${path}"/></svg>`;

  function save(href: string, extension: string) {
    const link = document.createElement("a");
    link.href = href;
    link.download = `${fileName}.${extension}`;
    link.click();
  }

  function downloadSvg() {
    const href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    save(href, "svg");
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  }

  function downloadPng() {
    const canvas = document.createElement("canvas");
    canvas.width = PNG_SIZE;
    canvas.height = PNG_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cell = PNG_SIZE / qr.size;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, PNG_SIZE, PNG_SIZE);
    ctx.fillStyle = "#1a1712";
    qr.data.forEach((row, y) =>
      row.forEach((dark, x) => {
        // Rounded out to whole pixels so neighbouring modules never leave hairline gaps.
        if (dark) ctx.fillRect(Math.floor(x * cell), Math.floor(y * cell), Math.ceil(cell), Math.ceil(cell));
      })
    );
    save(canvas.toDataURL("image/png"), "png");
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-56 max-w-full overflow-hidden rounded-xl border border-ink-100 bg-white sm:w-64">
        <svg
          role="img"
          aria-label={t.alt}
          viewBox={`0 0 ${qr.size} ${qr.size}`}
          shapeRendering="crispEdges"
          className="block h-auto w-full"
        >
          <rect width="100%" height="100%" fill="#ffffff" />
          <path fill="#1a1712" d={path} />
        </svg>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={downloadPng}>
          <Download className="h-3.5 w-3.5" />
          {t.png}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={downloadSvg}>
          <Download className="h-3.5 w-3.5" />
          {t.svg}
        </Button>
      </div>
    </div>
  );
}
