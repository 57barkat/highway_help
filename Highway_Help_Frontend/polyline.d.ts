declare module "@mapbox/polyline" {
  export function decode(str: string): number[][];
  export function encode(coords: number[][]): string;
  const polyline: {
    decode(str: string): number[][];
    encode(coords: number[][]): string;
  };
  export default polyline;
}
