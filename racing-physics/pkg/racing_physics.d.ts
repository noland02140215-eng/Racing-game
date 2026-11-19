/* tslint:disable */
/* eslint-disable */

export class PhysicsWorld {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Register one obstacle. Call these in the SAME order you create the
     * matching Three.js meshes in JS — index i here must equal index i
     * in your JS `obstacles` array so results line back up after `step()`.
     */
    add_obstacle(x: number, z: number, radius: number, rot_y: number): void;
    constructor();
    /**
     * Advance the simulation by `dt` seconds given the current input state.
     * Returns a JS object: { car_x, car_z, angle, speed, lateral_velocity,
     * steering_input, crash_pitch_impulse, crash_roll_impulse, screen_shake,
     * obstacles: [{x, z, rot_y}, ...], collisions: [{x, y, z, impact_speed}, ...] }
     */
    step(dt: number, w: boolean, s: boolean, a: boolean, d: boolean, handbrake: boolean): any;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_physicsworld_free: (a: number, b: number) => void;
    readonly physicsworld_add_obstacle: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly physicsworld_new: () => number;
    readonly physicsworld_step: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => any;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
