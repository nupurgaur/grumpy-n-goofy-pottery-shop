/** Export the pot preview container as a PNG reference image */

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const DEFAULT_SIZE = 560;

const parsePadding = (value: string, size: number) => {
  const parts = value.trim().split(/\s+/).map((p) => parseFloat(p) / 100);
  const [top, right, bottom, left] =
    parts.length === 4
      ? parts
      : parts.length === 1
        ? [parts[0], parts[0], parts[0], parts[0]]
        : [parts[0], parts[1], parts[0], parts[1]];

  return {
    top: size * top,
    right: size * right,
    bottom: size * bottom,
    left: size * left,
  };
};

export async function capturePotDesignPng(
  container: HTMLElement,
  options?: { width?: number; height?: number },
): Promise<string> {
  const canvasEl = container.querySelector("[data-pot-preview-canvas]");
  if (!canvasEl) throw new Error("Preview not ready");

  const size = options?.width ?? DEFAULT_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  ctx.fillStyle = "#FAF6F0";
  ctx.fillRect(0, 0, size, size);

  const patternLayer = canvasEl.querySelector(
    "[data-pot-pattern-layer]",
  ) as HTMLElement | null;
  const sketchLayer = canvasEl.querySelector(
    "[data-pot-sketch-layer]",
  ) as HTMLImageElement | null;
  const accessoryWrap = canvasEl.querySelector("[data-accessory-preview]");
  const accessorySvg = accessoryWrap?.querySelector("svg");

  const padding = parsePadding(
    canvasEl.getAttribute("data-sketch-padding") || "6% 14% 6% 4%",
    size,
  );
  const sketchScale = parseFloat(
    canvasEl.getAttribute("data-sketch-scale") || "0.9",
  );

  const innerW = size - padding.left - padding.right;
  const innerH = size - padding.top - padding.bottom;
  const drawW = innerW * sketchScale;
  const drawH = innerH * sketchScale;
  const drawX = padding.left + (innerW - drawW) / 2;
  const drawY = padding.top + (innerH - drawH) / 2;

  if (patternLayer) {
    const patternStyle = getComputedStyle(patternLayer);
    const maskUrl = patternStyle.maskImage || patternStyle.webkitMaskImage;
    const bgImage = patternStyle.backgroundImage;

    if (maskUrl && maskUrl !== "none" && bgImage && bgImage !== "none") {
      const maskSrc = maskUrl.match(/url\(["']?([^"')]+)["']?\)/)?.[1];
      if (maskSrc) {
        const maskImg = await loadImage(maskSrc);
        const tileSize = parseInt(
          patternLayer.dataset.patternTileSize || "32",
          10,
        );
        const patternTile = await patternTileFromBackground(bgImage, tileSize);

        const offscreen = document.createElement("canvas");
        offscreen.width = drawW;
        offscreen.height = drawH;
        const offCtx = offscreen.getContext("2d");
        if (offCtx) {
          for (let y = 0; y < drawH; y += patternTile.height) {
            for (let x = 0; x < drawW; x += patternTile.width) {
              offCtx.drawImage(patternTile, x, y);
            }
          }
          offCtx.globalCompositeOperation = "destination-in";
          const maskScale = drawW / maskImg.width;
          const maskDrawW = maskImg.width * maskScale;
          const maskDrawH = maskImg.height * maskScale;
          offCtx.drawImage(
            maskImg,
            (drawW - maskDrawW) / 2,
            (drawH - maskDrawH) / 2,
            maskDrawW,
            maskDrawH,
          );
          ctx.drawImage(offscreen, drawX, drawY);
        }
      }
    }
  }

  if (sketchLayer?.src) {
    const sketchImg = await loadImage(sketchLayer.src);
    ctx.drawImage(sketchImg, drawX, drawY, drawW, drawH);
  }

  if (accessorySvg) {
    const accessoryString = new XMLSerializer().serializeToString(accessorySvg);
    const accessoryImg = await loadImage(
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(accessoryString)}`,
    );
    const accessorySize = drawW * 0.17;
    const wrap = accessoryWrap as HTMLElement;
    const topPct = parseFloat(wrap.style.top || "24%");
    const leftPct = parseFloat(wrap.style.left || "74%");
    const centerX = drawX + (leftPct / 100) * drawW;
    const centerY = drawY + (topPct / 100) * drawH;
    ctx.drawImage(
      accessoryImg,
      centerX - accessorySize / 2,
      centerY - accessorySize / 2,
      accessorySize,
      accessorySize,
    );
  }

  return canvas.toDataURL("image/png");
}

async function patternTileFromBackground(
  bgImage: string,
  tileSize: number,
): Promise<HTMLCanvasElement> {
  const match = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
  if (!match?.[1]) throw new Error("Pattern unavailable");

  const src = match[1].startsWith("data:")
    ? match[1]
    : decodeURIComponent(match[1].replace(/^data:image\/svg\+xml,/, "data:image/svg+xml,"));

  const img = await loadImage(src);
  const tile = document.createElement("canvas");
  tile.width = tileSize;
  tile.height = tileSize;
  const tctx = tile.getContext("2d");
  if (!tctx) throw new Error("Canvas unavailable");
  tctx.drawImage(img, 0, 0, tileSize, tileSize);
  return tile;
}

export async function downloadPotDesignPng(container: HTMLElement): Promise<void> {
  const dataUrl = await capturePotDesignPng(container);

  return new Promise((resolve, reject) => {
    fetch(dataUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "goofy-n-grumpy-pot-design.png";
        link.click();
        URL.revokeObjectURL(url);
        resolve();
      })
      .catch(reject);
  });
}
