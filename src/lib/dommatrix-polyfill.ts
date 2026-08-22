// pdfjs-dist's legacy Node build references the browser-only `DOMMatrix`
// API at module load time (e.g. `const SCALE_MATRIX = new DOMMatrix()`),
// even though plain text extraction (page.getTextContent()) never
// exercises the canvas-rendering code paths that actually need it. Node
// has no DOMMatrix global, so importing pdfjs-dist without this polyfill
// throws `ReferenceError: DOMMatrix is not defined` on any request that
// touches it — this file must be imported before pdfjs-dist so the global
// exists by the time its module body runs. Only the 2D affine subset is
// implemented, since PDF transforms are always 2D.
type MatrixInit = { a?: number; b?: number; c?: number; d?: number; e?: number; f?: number }

class DOMMatrixPolyfill {
  a = 1; b = 0; c = 0; d = 1; e = 0; f = 0

  constructor(init?: number[] | MatrixInit | DOMMatrixPolyfill) {
    if (Array.isArray(init)) {
      if (init.length === 6) {
        [this.a, this.b, this.c, this.d, this.e, this.f] = init
      } else if (init.length === 16) {
        this.a = init[0]; this.b = init[1]; this.c = init[4]; this.d = init[5]; this.e = init[12]; this.f = init[13]
      }
    } else if (init && typeof init === "object") {
      this.a = init.a ?? 1; this.b = init.b ?? 0; this.c = init.c ?? 0
      this.d = init.d ?? 1; this.e = init.e ?? 0; this.f = init.f ?? 0
    }
  }

  get is2D() { return true }
  get isIdentity() {
    return this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 && this.e === 0 && this.f === 0
  }

  multiply(other: MatrixInit) { return new DOMMatrixPolyfill(this).multiplySelf(other) }

  multiplySelf(other: MatrixInit) {
    const m = other instanceof DOMMatrixPolyfill ? other : new DOMMatrixPolyfill(other)
    const a = this.a * m.a + this.c * m.b
    const b = this.b * m.a + this.d * m.b
    const c = this.a * m.c + this.c * m.d
    const d = this.b * m.c + this.d * m.d
    const e = this.a * m.e + this.c * m.f + this.e
    const f = this.b * m.e + this.d * m.f + this.f
    this.a = a; this.b = b; this.c = c; this.d = d; this.e = e; this.f = f
    return this
  }

  preMultiplySelf(other: MatrixInit) {
    const m = other instanceof DOMMatrixPolyfill ? other : new DOMMatrixPolyfill(other)
    Object.assign(this, m.multiply(this))
    return this
  }

  invertSelf() {
    const { a, b, c, d, e, f } = this
    const det = a * d - b * c
    if (det === 0) {
      this.a = this.b = this.c = this.d = this.e = this.f = NaN
      return this
    }
    const ia = d / det, ib = -b / det, ic = -c / det, id = a / det
    this.a = ia; this.b = ib; this.c = ic; this.d = id
    this.e = -(e * ia + f * ic); this.f = -(e * ib + f * id)
    return this
  }

  translate(tx = 0, ty = 0) { return new DOMMatrixPolyfill(this).translateSelf(tx, ty) }
  translateSelf(tx = 0, ty = 0) { return this.multiplySelf({ a: 1, b: 0, c: 0, d: 1, e: tx, f: ty }) }

  scale(sx = 1, sy = sx) { return new DOMMatrixPolyfill(this).scaleSelf(sx, sy) }
  scaleSelf(sx = 1, sy = sx) { return this.multiplySelf({ a: sx, b: 0, c: 0, d: sy, e: 0, f: 0 }) }

  transformPoint(point?: { x?: number; y?: number }) {
    const x = point?.x ?? 0
    const y = point?.y ?? 0
    return { x: this.a * x + this.c * y + this.e, y: this.b * x + this.d * y + this.f, z: 0, w: 1 }
  }
}

if (typeof globalThis.DOMMatrix === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).DOMMatrix = DOMMatrixPolyfill
}
