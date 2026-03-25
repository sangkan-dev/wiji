declare const process:
  | {
      hrtime?: {
        bigint?: () => bigint;
      };
    }
  | undefined;

declare function require(id: string): any;

declare const module:
  | {
      exports?: any;
    }
  | undefined;

declare module "node:crypto" {
  export function randomBytes(size: number): {
    buffer: ArrayBufferLike;
    byteOffset: number;
    byteLength: number;
  };
}

