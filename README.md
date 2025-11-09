# 🎨 Abstract Icon-Wallpaper Generator
A web-based tool for generating your own abstract background images in the Monokai style. This project uses HTML5 Canvas, TypeScript, and Vite to create a 2D array of icons (Font Awesome) with random, colored clusters.

The tool offers a comprehensive settings panel to control every aspect of the generated image and download the result as a high-resolution PNG.

<br></br>

<img width="1906" height="908" alt="Screenshot" src="https://github.com/user-attachments/assets/03b98880-1330-4ce6-8227-b4d788374bbb" />

<br></br>

## ✨ Features:

- Dynamic generation: Each image is procedurally generated on an HTML5 canvas
- Interactive web UI: A settings panel allows live adjustment of all parameters
- Customizable resolution: The width and height of the image to be exported can be freely selected (up to 8k resolution)
- Grid control: Distance between symbols on the X and Y axes
- Cluster algorithm: Generates random “hotspots” (clusters) on the image
- Intelligent coloring:
  - Icons within a cluster are assigned a bright, random color from the Monokai palette
  - Icons outside of clusters are pale and dark
- “Punched-out” icon style: Icons in colored bubbles take on the background color
- Customizable shapes: The icons are placed in shapes whose corners (from circle to polygon), radius, and border thickness can be adjusted
- Density control: A slider controls the percentage of pale symbols displayed. Colored cluster symbols always remain visible
- PNG export: Download the generated image in the set resolution

<br></br>

## 🛠️ Tech Stack:

- Vite: As a super-fast build tool and development server
- TypeScript: For type safety and better code organization
- HTML5 Canvas: For all 2D drawing logic
- Font Awesome: As a source for the over 100 icons used

<br></br>

## 🚀 Getting Started:

To run the project locally, follow these steps:

Clone repository:
```
git clone https://github.com/EinfachFabi/abstract-icon-wallpaper-generator
cd abstract-icon-wallpaper-generator
```

Install dependencies (nodejs):
```
npm install
```

Start development server:
```
npm run dev
```

Web application:

- Open the URL displayed in the terminal (usually http://localhost:5173).

<br></br>

## ⚙️ Configuration:

All important settings can be configured directly via the web interface.

For more extensive changes, such as adding or changing the available symbols (Font Awesome hex codes) or the color palette, the src/config.ts file can be edited directly.
