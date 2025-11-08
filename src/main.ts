import { CONFIG, type Config } from './config';

// Interface for a single symbol in the grid
interface SymbolData {
  char: string;
  x: number;
  y: number;
  iconColor: string;
  shapeColor: string;
  shapeStrokeColor: string;
  iconOpacity: number;
  shapeFillOpacity: number;
  shapeStrokeOpacity: number;
  // isColored is no longer needed since we use 'null'
}

// Interface for a cluster center
interface ClusterCenter {
  x: number;
  y: number;
  color: string;
}

/**
 * The main class encapsulating the background logic.
 */
class BackgroundGenerator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: Config;
  /** The grid can now have 'null' entries if bubbles are removed due to density */
  private grid: (SymbolData | null)[][] = [];
  private symbols: string[] = [];
  private clusterCenters: ClusterCenter[] = [];

  constructor(canvasId: string, config: Config) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error(`Canvas element with ID '${canvasId}' not found.`);
    }
    this.ctx = this.canvas.getContext('2d')!;
    this.config = config;

    this.symbols = this.config.symbols.list.map((code) =>
      String.fromCharCode(parseInt(code, 16))
    );

    this.setCanvasInternalResolution(
      this.config.canvasSize.width,
      this.config.canvasSize.height
    );
  }

  public async generate(): Promise<void> {
    await document.fonts.ready;
    document.body.classList.add('fonts-loaded');
    this.initUI();
    this.regenerate();
  }

  /**
   * Clears and regenerates the canvas content.
   * applyDensity() is no longer needed as populateGrid() now handles this.
   */
  private regenerate = (): void => {
    this.createClusters();
    this.populateGrid();
    this.draw();
  };

  private setCanvasInternalResolution(width: number, height: number): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.scale(dpr, dpr);
    this.config.canvasSize.width = width;
    this.config.canvasSize.height = height;
  }

  private createClusters(): void {
    this.clusterCenters = [];
    for (let i = 0; i < this.config.clustering.count; i++) {
      this.clusterCenters.push({
        x: Math.random() * this.config.canvasSize.width,
        y: Math.random() * this.config.canvasSize.height,
        color: this.config.colors.palette[
          Math.floor(Math.random() * this.config.colors.palette.length)
        ],
      });
    }
  }

  /**
   * Populates the 2D grid.
   * Now calls getColorForSymbol, which can return 'null'
   * based on the density setting.
   */
  private populateGrid(): void {
    this.grid = [];
    const { spacingX, spacingY, seamlessRendering } = this.config.grid;
    const { width, height } = this.config.canvasSize;
    const { radius: shapeRadius } = this.config.shape;

    if (spacingX <= 0 || spacingY <= 0) {
      console.warn('SpacingX or SpacingY is 0 or less.');
      return;
    }

    const expandAmountX = seamlessRendering ? spacingX + shapeRadius : 0;
    const expandAmountY = seamlessRendering ? spacingY + shapeRadius : 0;

    let row = 0;
    for (
      let y = spacingY / 2 - expandAmountY;
      y < height + spacingY / 2 + expandAmountY;
      y += spacingY
    ) {
      this.grid[row] = [];
      let col = 0;
      const xOffset = row % 2 === 0 ? spacingX / 2 : 0;

      for (
        let x = xOffset + spacingX / 2 - expandAmountX;
        x < width + xOffset + spacingX / 2 + expandAmountX;
        x += spacingX
      ) {
        // Gets color information (can be null if density < 100%)
        const symbolData = this.getColorForSymbol(x, y);

        if (symbolData) {
          // Symbol is drawn
          const symbolChar = this.getRandomSymbol(row, col);
          this.grid[row][col] = {
            char: symbolChar,
            x: x,
            y: y,
            ...symbolData,
          };
        } else {
          // Symbol is skipped due to density
          this.grid[row][col] = null;
        }
        col++;
      }
      row++;
    }
  }

  private getRandomSymbol(row: number, col: number): string {
    const leftSymbol =
      col > 0 && this.grid[row] ? this.grid[row][col - 1]?.char : null;
    const topSymbol =
      row > 0 && this.grid[row - 1] ? this.grid[row - 1][col]?.char : null;

    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const randomSymbol =
        this.symbols[Math.floor(Math.random() * this.symbols.length)];
      const isAdjacentMatch =
        randomSymbol === leftSymbol || randomSymbol === topSymbol;

      if (isAdjacentMatch) {
        if (Math.random() > this.config.symbols.adjacentPenalty) {
          return randomSymbol;
        }
      } else {
        return randomSymbol;
      }
      attempts++;
    }
    return this.symbols[Math.floor(Math.random() * this.symbols.length)];
  }

  /**
   * Determines color and opacity.
   * Can now return 'null' if a pale symbol is removed
   * by the density setting.
   */
  private getColorForSymbol(
    x: number,
    y: number
  ): Omit<SymbolData, 'char' | 'x' | 'y'> | null {
    let nearestDist = Infinity;
    let nearestCluster: ClusterCenter | null = null;

    for (const cluster of this.clusterCenters) {
      const dist = Math.hypot(cluster.x - x, cluster.y - y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestCluster = cluster;
      }
    }

    const { maxRadius, dimmingFactor, minDimOpacity, coloredOpacity } =
      this.config.clustering;
    const { defaultIconOpacity, density } = this.config.symbols; // Get density here
    const {
      defaultIconColor,
      coloredIconColor,
      defaultShapeFillColor,
      defaultShapeStrokeColor,
    } = this.config.colors;
    const {
      fillOpacity: defaultFillOpacity,
      strokeOpacity: defaultStrokeOpacity,
    } = this.config.shape;

    if (nearestCluster && nearestDist < maxRadius) {
      const probability = 1 - nearestDist / maxRadius;

      if (Math.random() < probability) {
        // *** BRIGHT / COLORED SYMBOL ***
        // These are unaffected by density and always returned.
        return {
          iconColor: coloredIconColor,
          shapeColor: nearestCluster.color,
          shapeStrokeColor: nearestCluster.color,
          iconOpacity: defaultIconOpacity,
          shapeFillOpacity: coloredOpacity,
          shapeStrokeOpacity: coloredOpacity,
        };
      }
    }

    // *** PALE / STANDARD SYMBOL ***

    // NEW: Density check
    // If density < 100%, there is a chance that the symbol
    // is not created at all (return null).
    if (Math.random() > density) {
      return null;
    }

    // Density check passed, calculate opacity based on distance
    const dimDistanceFactor = Math.min(
      1,
      nearestDist / (maxRadius * dimmingFactor)
    );
    const dimFillOpacity =
      (1 - dimDistanceFactor) * (defaultFillOpacity - minDimOpacity) +
      minDimOpacity;
    const strokeFillRatio =
      defaultFillOpacity > 0 ? defaultStrokeOpacity / defaultFillOpacity : 0;
    const dimStrokeOpacity = dimFillOpacity * strokeFillRatio;

    return {
      iconColor: defaultIconColor,
      shapeColor: defaultShapeFillColor,
      shapeStrokeColor: defaultShapeStrokeColor,
      iconOpacity: defaultIconOpacity,
      shapeFillOpacity: dimFillOpacity,
      shapeStrokeOpacity: dimStrokeOpacity,
    };
  }

  private drawPolygon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    sides: number
  ): void {
    ctx.beginPath();
    const slice = (Math.PI * 2) / sides;
    const startAngle = -Math.PI / 2;

    for (let i = 0; i < sides; i++) {
      const angle = startAngle + i * slice;
      const px = x + radius * Math.cos(angle);
      const py = y + radius * Math.sin(angle);
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
  }

  /**
   * Draws the entire content.
   * Rotation logic has been removed.
   */
  private drawContent(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    const { fontSize } = this.config.symbols; // iconRotation removed
    const { corners, radius, strokeWidth } = this.config.shape;
    // angleRad removed

    ctx.fillStyle = this.config.colors.background;
    ctx.fillRect(0, 0, width, height);

    ctx.font = `900 ${fontSize}px "Font Awesome 5 Free"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const row of this.grid) {
      if (row) {
        for (const symbol of row) {
          if (symbol) { // Only draw if symbol is not 'null'
            // --- 3a. Shape Fill ---
            if (corners >= 2) {
              ctx.globalAlpha = symbol.shapeFillOpacity;
              ctx.fillStyle = symbol.shapeColor;
              if (corners === 2) {
                ctx.beginPath();
                ctx.arc(symbol.x, symbol.y, radius, 0, Math.PI * 2);
                ctx.fill();
              } else {
                this.drawPolygon(ctx, symbol.x, symbol.y, radius, corners);
                ctx.fill();
              }
            }

            // --- 3b. Shape Border ---
            if (strokeWidth > 0 && corners >= 2) {
              ctx.globalAlpha = symbol.shapeStrokeOpacity;
              ctx.strokeStyle = symbol.shapeStrokeColor;
              ctx.lineWidth = strokeWidth;
              if (corners === 2) {
                ctx.beginPath();
                ctx.arc(symbol.x, symbol.y, radius, 0, Math.PI * 2);
                ctx.stroke();
              } else {
                this.drawPolygon(ctx, symbol.x, symbol.y, radius, corners);
                ctx.stroke();
              }
            }

            // --- 3c. Symbol (Icon) ---
            // Rotation logic (save/translate/rotate/restore) removed
            ctx.globalAlpha = symbol.iconOpacity;
            ctx.fillStyle = symbol.iconColor;
            // Draw directly at the symbol position
            ctx.fillText(symbol.char, symbol.x, symbol.y);
          }
        }
      }
    }
    ctx.globalAlpha = 1.0;
  }

  private draw(): void {
    this.drawContent(
      this.ctx,
      this.config.canvasSize.width,
      this.config.canvasSize.height
    );
  }

  /**
   * Initializes UI elements and their event listeners.
   */
  private initUI(): void {
    // Get UI elements
    const canvasWidthInput = document.getElementById('canvasWidth') as HTMLInputElement;
    const canvasHeightInput = document.getElementById('canvasHeight') as HTMLInputElement;
    const spacingXInput = document.getElementById('spacingX') as HTMLInputElement;
    const spacingYInput = document.getElementById('spacingY') as HTMLInputElement;
    const fontSizeInput = document.getElementById('fontSize') as HTMLInputElement;
    const defaultIconOpacityInput = document.getElementById('defaultIconOpacity') as HTMLInputElement;
    const defaultIconOpacityValueSpan = document.getElementById('defaultIconOpacityValue') as HTMLSpanElement;
    const clusterCountInput = document.getElementById('clusterCount') as HTMLInputElement;
    const clusterRadiusInput = document.getElementById('clusterRadius') as HTMLInputElement;
    
    // UI element for density (re-added)
    const symbolDensityInput = document.getElementById('symbolDensity') as HTMLInputElement;
    const symbolDensityValueSpan = document.getElementById('symbolDensityValue') as HTMLSpanElement;
    const coloredOpacityInput = document.getElementById('coloredOpacity') as HTMLInputElement;
    const coloredOpacityValueSpan = document.getElementById('coloredOpacityValue') as HTMLSpanElement;

    const borderCornersInput = document.getElementById('borderCorners') as HTMLInputElement;
    const borderRadiusInput = document.getElementById('borderRadius') as HTMLInputElement;
    const borderFillOpacityInput = document.getElementById('borderFillOpacity') as HTMLInputElement;
    const borderFillOpacityValueSpan = document.getElementById('borderFillOpacityValue') as HTMLSpanElement;
    const borderStrokeWidthInput = document.getElementById('borderStrokeWidth') as HTMLInputElement;
    const borderStrokeOpacityInput = document.getElementById('borderStrokeOpacity') as HTMLInputElement;
    const borderStrokeOpacityValueSpan = document.getElementById('borderStrokeOpacityValue') as HTMLSpanElement;

    const applySettingsButton = document.getElementById('applySettings') as HTMLButtonElement;
    const downloadImageButton = document.getElementById('downloadImage') as HTMLButtonElement;

    // Set initial values for UI elements from configuration
    canvasWidthInput.value = this.config.canvasSize.width.toString();
    canvasHeightInput.value = this.config.canvasSize.height.toString();
    spacingXInput.value = this.config.grid.spacingX.toString();
    spacingYInput.value = this.config.grid.spacingY.toString();
    fontSizeInput.value = this.config.symbols.fontSize.toString();
    defaultIconOpacityInput.value = this.config.symbols.defaultIconOpacity.toString();
    defaultIconOpacityValueSpan.textContent = this.config.symbols.defaultIconOpacity.toFixed(2);
    clusterCountInput.value = this.config.clustering.count.toString();
    clusterRadiusInput.value = this.config.clustering.maxRadius.toString();

    // Initial values for density (re-added)
    symbolDensityInput.value = this.config.symbols.density.toString();
    symbolDensityValueSpan.textContent = `${(this.config.symbols.density * 100).toFixed(0)}%`;
    coloredOpacityInput.value = this.config.clustering.coloredOpacity.toString();
    coloredOpacityValueSpan.textContent = this.config.clustering.coloredOpacity.toFixed(2);

    borderCornersInput.value = this.config.shape.corners.toString();
    borderRadiusInput.value = this.config.shape.radius.toString();
    borderFillOpacityInput.value = this.config.shape.fillOpacity.toString();
    borderFillOpacityValueSpan.textContent = this.config.shape.fillOpacity.toFixed(2);
    borderStrokeWidthInput.value = this.config.shape.strokeWidth.toString();
    borderStrokeOpacityInput.value = this.config.shape.strokeOpacity.toString();
    borderStrokeOpacityValueSpan.textContent = this.config.shape.strokeOpacity.toFixed(2);

    // Event listeners for opacity ranges
    defaultIconOpacityInput.addEventListener('input', () => {
      defaultIconOpacityValueSpan.textContent = parseFloat(defaultIconOpacityInput.value).toFixed(2);
    });
    borderFillOpacityInput.addEventListener('input', () => {
      borderFillOpacityValueSpan.textContent = parseFloat(borderFillOpacityInput.value).toFixed(2);
    });
    borderStrokeOpacityInput.addEventListener('input', () => {
      borderStrokeOpacityValueSpan.textContent = parseFloat(borderStrokeOpacityInput.value).toFixed(2);
    });

    // Event listener for density (re-added)
    symbolDensityInput.addEventListener('input', () => {
      symbolDensityValueSpan.textContent = `${(parseFloat(symbolDensityInput.value) * 100).toFixed(0)}%`;
    });
    coloredOpacityInput.addEventListener('input', () => {
      coloredOpacityValueSpan.textContent = parseFloat(coloredOpacityInput.value).toFixed(2);
    });

    // "Apply" button listener
    applySettingsButton.addEventListener('click', () => {
      // Update configuration from UI values
      this.config.canvasSize.width = parseInt(canvasWidthInput.value);
      this.config.canvasSize.height = parseInt(canvasHeightInput.value);
      this.config.grid.spacingX = parseInt(spacingXInput.value);
      this.config.grid.spacingY = parseInt(spacingYInput.value);
      this.config.symbols.fontSize = parseInt(fontSizeInput.value);
      this.config.symbols.defaultIconOpacity = parseFloat(defaultIconOpacityInput.value);
      this.config.clustering.count = parseInt(clusterCountInput.value);
      this.config.clustering.maxRadius = parseInt(clusterRadiusInput.value);

      // Update density value (re-added)
      this.config.symbols.density = parseFloat(symbolDensityInput.value);
      this.config.clustering.coloredOpacity = parseFloat(coloredOpacityInput.value);

      this.config.shape.corners = parseInt(borderCornersInput.value);
      this.config.shape.radius = parseInt(borderRadiusInput.value);
      this.config.shape.fillOpacity = parseFloat(borderFillOpacityInput.value);
      this.config.shape.strokeWidth = parseInt(borderStrokeWidthInput.value);
      this.config.shape.strokeOpacity = parseFloat(borderStrokeOpacityInput.value);

      // Reset canvas and regenerate
      this.setCanvasInternalResolution(
        this.config.canvasSize.width,
        this.config.canvasSize.height
      );
      this.regenerate();
    });

    downloadImageButton.addEventListener('click', () => {
      this.downloadImage();
    });
  }

  private downloadImage(): void {
    const downloadWidth = this.config.canvasSize.width;
    const downloadHeight = this.config.canvasSize.height;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;

    tempCanvas.width = downloadWidth * dpr;
    tempCanvas.height = downloadHeight * dpr;
    tempCtx.scale(dpr, dpr);

    // Call central drawing method on temporary context
    this.drawContent(tempCtx, downloadWidth, downloadHeight);

    // Download logic
    const dataURL = tempCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `hintergrund_${downloadWidth}x${downloadHeight}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// ---- Start application ----
window.addEventListener('DOMContentLoaded', () => {
  try {
    const generator = new BackgroundGenerator('bg-canvas', CONFIG);
    generator.generate();
  } catch (error) {
    console.error('Error initializing generator:', error);
  }
});

