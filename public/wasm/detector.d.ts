declare namespace wasm_bindgen {
	/* tslint:disable */
	/* eslint-disable */
	
	export function detect_ai(pixels: Uint8Array, width: number, height: number, channels: number): number;
	
	export function init_model(model_bytes: Uint8Array): number;
	
}

declare type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

declare interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly detect_ai: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly init_model: (a: number, b: number) => number;
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_start: () => void;
}

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
declare function wasm_bindgen (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
