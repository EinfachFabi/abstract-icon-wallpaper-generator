/**
 * This is the central configuration file.
* Adjust the values here to change the appearance of the background.
 */

export interface Config {
  canvasSize: {
    width: number;
    height: number;
  };
  grid: {
    spacingX: number;
    spacingY: number;
    seamlessRendering: boolean;
  };
  symbols: {
    list: string[];
    fontSize: number;
    adjacentPenalty: number;
    defaultIconOpacity: number;
    /** Density of pale symbols (0.0 to 1.0) */
    density: number;
  };
  clustering: {
    count: number;
    maxRadius: number;
    coloredOpacity: number;
    dimmingFactor: number;
    minDimOpacity: number;
  };
  colors: {
    background: string;
    defaultIconColor: string;
    coloredIconColor: string;
    defaultShapeFillColor: string;
    defaultShapeStrokeColor: string;
    palette: string[];
  };
  shape: {
    corners: number;
    radius: number;
    fillOpacity: number;
    strokeWidth: number;
    strokeOpacity: number;
  };
}

export const CONFIG: Config = {
  canvasSize: {
    width: 1920,
    height: 1080,
  },
  grid: {
    spacingX: 50,
    spacingY: 50,
    seamlessRendering: true,
  },
  symbols: {
    list: [
      'f0ca', 'e15b', 'f002', 'f233', 'f505', 'f1de', 'e448', 'e32a', 'f67e',
      'f7a1', 'f0b0', 'f7b6', 'f5f8', 'f672', 'f530', 'f8bb', 'f534', 'f81b',
      'e3fa', 'f4e3', 'f6d8', 'f0ad', 'f818', 'f61f', 'f577', 'f121', 'e202',
      'f8f4', 'e012', 'f749', 'f6b8', 'e3dc', 'f5dc', 'f03d', 'f542', 'e33b',
      'f590', 'f522', 'f75a', 'f188', 'f8ab', 'e48a', 'f1c9', 'f544', 'f8f6',
      'f19d', 'e2df', 'f030', 'f130', 'f001', 'f7f1', 'e0e3', 'f661', 'f7b9',
      'f0c3', 'f8a7', 'f336', 'f7a1', 'f2ce', 'f1e0', 'f1c0', 'f2db', 'f6be',
      'e132', 'f30d', 'f1b3', 'e13e', 'e41c', 'e443', 'f8df', 'e2ea', 'f312',
      'e0b3', 'f729', 'f564', 'f3a0', 'e409', 'f013', 'f8d5', 'f0c7', 'f328',
      'f6a1', 'f8be', 'e3dd', 'f4c8', 'f700', 'f042', 'f044', 'f048', 'f051',
      'f01e', 'f01c',
    ],
    fontSize: 16,
    adjacentPenalty: 0.8,
    defaultIconOpacity: 0.1,
    density: 1.0,
  },
  clustering: {
    count: 15,
    maxRadius: 350,
    coloredOpacity: 1.0,
    dimmingFactor: 2.5,
    minDimOpacity: 0.05,
  },
  colors: {
    background: '#272822',
    defaultIconColor: '#000000',
    coloredIconColor: '#272822',
    defaultShapeFillColor: '#49483E',
    defaultShapeStrokeColor: '#49483E',
    palette: [
      '#F92672', // Pink
      '#A6E22E', // Green
      '#66D9EF', // Blue
      '#FD971F', // Orange
      '#E6DB74', // Yellow
      '#AE81FF', // Purple
    ],
  },
  shape: {
    corners: 2,
    radius: 20,
    fillOpacity: 0.2,
    strokeWidth: 1,
    strokeOpacity: 0.3,
  },
};

