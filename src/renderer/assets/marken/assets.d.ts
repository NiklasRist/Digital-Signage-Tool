// Moduldeklaration fuer den statischen Asset-Import (#315, Frage-A-Nachtrag):
// Gebuendelte Markendateien werden per statischem `import` geladen. Bewusst NUR
// '*.png' - keine breite vite/client-Referenz, die dem Renderer-Typraum die ganzen
// Vite-Glob-Typen geben wuerde.
declare module '*.png' {
  const quelle: string
  export default quelle
}
