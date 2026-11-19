use wasm_bindgen::prelude::*;
use serde::Serialize;

// --- Tunables (ported 1:1 from the original JS physics) ---
const UNITS_PER_MPH: f64 = 0.447;
const MAX_SPEED_MPH: f64 = 165.0;
const MAX_SPEED: f64 = MAX_SPEED_MPH * UNITS_PER_MPH; // ~73.8 units/sec
const ACCEL: f64 = 14.5;
const BRAKE_FORCE: f64 = 22.0;
const BASE_DRAG: f64 = 0.95;
const BASE_TURN_SPEED: f64 = 2.1;
const BASE_GRIP: f64 = 5.5;
const CAR_RADIUS: f64 = 1.85;
const BOUNDARY_RADIUS: f64 = 580.0;

#[derive(Serialize, Clone, Copy)]
pub struct ObstacleState {
    pub x: f64,
    pub z: f64,
    pub rot_y: f64,
}

#[derive(Serialize)]
pub struct CollisionEvent {
    pub x: f64,
    pub y: f64,
    pub z: f64,
    pub impact_speed: f64,
}

#[derive(Serialize)]
pub struct StepResult {
    pub car_x: f64,
    pub car_z: f64,
    pub angle: f64,
    pub speed: f64,
    pub lateral_velocity: f64,
    pub steering_input: f64,
    pub crash_pitch_impulse: f64,
    pub crash_roll_impulse: f64,
    pub screen_shake: f64,
    pub obstacles: Vec<ObstacleState>,
    pub collisions: Vec<CollisionEvent>,
}

struct Obstacle {
    x: f64,
    z: f64,
    radius: f64,
    rot_y: f64,
    vx: f64,
    vz: f64,
    angular_vel: f64,
}

#[wasm_bindgen]
pub struct PhysicsWorld {
    car_x: f64,
    car_z: f64,
    angle: f64,
    speed: f64,
    lateral_velocity: f64,
    crash_pitch_impulse: f64,
    crash_roll_impulse: f64,
    screen_shake: f64,
    obstacles: Vec<Obstacle>,
}

#[wasm_bindgen]
impl PhysicsWorld {
    #[wasm_bindgen(constructor)]
    pub fn new() -> PhysicsWorld {
        PhysicsWorld {
            car_x: 0.0,
            car_z: 0.0,
            angle: 0.0,
            speed: 0.0,
            lateral_velocity: 0.0,
            crash_pitch_impulse: 0.0,
            crash_roll_impulse: 0.0,
            screen_shake: 0.0,
            obstacles: Vec::new(),
        }
    }

    /// Register one obstacle. Call these in the SAME order you create the
    /// matching Three.js meshes in JS — index i here must equal index i
    /// in your JS `obstacles` array so results line back up after `step()`.
    pub fn add_obstacle(&mut self, x: f64, z: f64, radius: f64, rot_y: f64) {
        self.obstacles.push(Obstacle {
            x,
            z,
            radius,
            rot_y,
            vx: 0.0,
            vz: 0.0,
            angular_vel: 0.0,
        });
    }

    /// Advance the simulation by `dt` seconds given the current input state.
    /// Returns a JS object: { car_x, car_z, angle, speed, lateral_velocity,
    /// steering_input, crash_pitch_impulse, crash_roll_impulse, screen_shake,
    /// obstacles: [{x, z, rot_y}, ...], collisions: [{x, y, z, impact_speed}, ...] }
    pub fn step(&mut self, dt: f64, w: bool, s: bool, a: bool, d: bool, handbrake: bool) -> JsValue {
        let dt = dt.min(0.1);

        if w && !handbrake {
            self.speed = (self.speed + ACCEL * dt).min(MAX_SPEED);
        } else if w && handbrake {
            self.speed = (self.speed + ACCEL * 0.4 * dt).min(MAX_SPEED * 0.8);
        }

        if s {
            let force = if self.speed > 0.0 { BRAKE_FORCE } else { ACCEL };
            self.speed = (self.speed - force * dt).max(-MAX_SPEED * 0.35);
        }

        let active_drag = if handbrake { 2.2 } else { BASE_DRAG };
        let active_turn_speed = if handbrake { 3.2 } else { BASE_TURN_SPEED };
        let active_grip = if handbrake { 1.25 } else { BASE_GRIP };
        let slip_multiplier = if handbrake { 0.58 } else { 0.28 };

        self.speed *= (-active_drag * dt).exp();
        if self.speed.abs() < 0.05 && !w && !s {
            self.speed = 0.0;
        }

        let mut steering_input = 0.0;
        if self.speed.abs() > 0.2 {
            let dir = if self.speed > 0.0 { 1.0 } else { -1.0 };
            let turn_factor = (self.speed.abs() / 14.0).min(1.0);
            if a {
                steering_input = 1.0;
                self.angle += active_turn_speed * turn_factor * dir * dt;
            }
            if d {
                steering_input = -1.0;
                self.angle -= active_turn_speed * turn_factor * dir * dt;
            }
        }

        let forward_x = self.angle.sin();
        let forward_z = self.angle.cos();

        let target_lateral = steering_input * (self.speed.abs() * slip_multiplier);
        self.lateral_velocity +=
            (target_lateral - self.lateral_velocity) * (active_grip * dt).min(1.0);

        self.car_x += (forward_x * self.speed - self.angle.cos() * self.lateral_velocity) * dt;
        self.car_z += (forward_z * self.speed + self.angle.sin() * self.lateral_velocity) * dt;

        let mut collisions: Vec<CollisionEvent> = Vec::new();

        for obs in self.obstacles.iter_mut() {
            if obs.vx * obs.vx + obs.vz * obs.vz > 0.01 {
                obs.x += obs.vx * dt;
                obs.z += obs.vz * dt;
                obs.rot_y += obs.angular_vel * dt;
                let decay = (-4.5 * dt).exp();
                obs.vx *= decay;
                obs.vz *= decay;
                obs.angular_vel *= decay;
            }

            let dx = self.car_x - obs.x;
            let dz = self.car_z - obs.z;
            let dist_sq = dx * dx + dz * dz;
            let min_dist = CAR_RADIUS + obs.radius;

            if dist_sq < min_dist * min_dist && dist_sq > 0.0001 {
                let dist = dist_sq.sqrt();
                let overlap = min_dist - dist;
                let nx = dx / dist;
                let nz = dz / dist;

                self.car_x += nx * overlap * 0.6;
                self.car_z += nz * overlap * 0.6;
                obs.x -= nx * overlap * 0.4;
                obs.z -= nz * overlap * 0.4;

                let impact_speed = self.speed.abs();
                if impact_speed > 3.0 {
                    collisions.push(CollisionEvent {
                        x: obs.x + nx * obs.radius,
                        y: 0.55,
                        z: obs.z + nz * obs.radius,
                        impact_speed,
                    });

                    obs.vx = -nx * impact_speed * 0.75;
                    obs.vz = -nz * impact_speed * 0.75;
                    obs.angular_vel = (js_sys::Math::random() - 0.5) * impact_speed * 0.5;

                    self.crash_pitch_impulse = -0.2 * (impact_speed / 30.0).min(1.2);
                    self.crash_roll_impulse = (js_sys::Math::random() - 0.5) * 0.25;
                    self.screen_shake = (impact_speed * 0.01).min(0.3);

                    self.speed *= 0.35;
                    self.lateral_velocity *= 0.25;
                }
            }
        }

        let dist_from_center_sq = self.car_x * self.car_x + self.car_z * self.car_z;
        if dist_from_center_sq > BOUNDARY_RADIUS * BOUNDARY_RADIUS {
            let dist_from_center = dist_from_center_sq.sqrt();
            let nx = self.car_x / dist_from_center;
            let nz = self.car_z / dist_from_center;
            self.car_x = nx * BOUNDARY_RADIUS;
            self.car_z = nz * BOUNDARY_RADIUS;

            self.speed *= -0.3;
            self.lateral_velocity *= -0.3;
            self.crash_pitch_impulse = -0.12;
            self.screen_shake = self.screen_shake.max(0.16);
        }

        self.crash_pitch_impulse *= (-9.0 * dt).exp();
        self.crash_roll_impulse *= (-9.0 * dt).exp();
        self.screen_shake *= (-12.0 * dt).exp();

        let result = StepResult {
            car_x: self.car_x,
            car_z: self.car_z,
            angle: self.angle,
            speed: self.speed,
            lateral_velocity: self.lateral_velocity,
            steering_input,
            crash_pitch_impulse: self.crash_pitch_impulse,
            crash_roll_impulse: self.crash_roll_impulse,
            screen_shake: self.screen_shake,
            obstacles: self
                .obstacles
                .iter()
                .map(|o| ObstacleState { x: o.x, z: o.z, rot_y: o.rot_y })
                .collect(),
            collisions,
        };

        serde_wasm_bindgen::to_value(&result).unwrap()
    }
}
