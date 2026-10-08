// --- 1. SCENE & RENDERER SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue background
scene.fog = new THREE.Fog(0x87ceeb, 20, 150);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const sun = new THREE.DirectionalLight(0xffffff, 0.8);
sun.position.set(50, 80, 50);
sun.castShadow = true;
scene.add(sun);

// Track / Ground Surface
const groundGeo = new THREE.PlaneGeometry(300, 300);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// --- 2. CAR & INTERIOR MESHES ---
const carGroup = new THREE.Group();
scene.add(carGroup);

// Exterior Body
const bodyGeo = new THREE.BoxGeometry(2, 0.8, 4);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
const body = new THREE.Mesh(bodyGeo, bodyMat);
body.position.y = 0.6;
body.castShadow = true;
carGroup.add(body);

// Interior Dashboard
const dashGeo = new THREE.BoxGeometry(1.8, 0.4, 0.6);
const interiorMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
const dash = new THREE.Mesh(dashGeo, interiorMat);
dash.position.set(0, 0.8, 0.5);
carGroup.add(dash);

// Steering Wheel
const wheelGeo = new THREE.TorusGeometry(0.2, 0.03, 8, 24);
const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
const steeringWheel = new THREE.Mesh(wheelGeo, wheelMat);
steeringWheel.position.set(-0.4, 0.9, 0.2);
steeringWheel.rotation.x = Math.PI / 4;
carGroup.add(steeringWheel);

// Windshield Frame
const frameGeo = new THREE.BoxGeometry(1.9, 0.6, 0.1);
const frameMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
const frame = new THREE.Mesh(frameGeo, frameMat);
frame.position.set(0, 1.2, 0.8);
carGroup.add(frame);

// --- 3. CAMERA SYSTEM ---
const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);

const cameraViews = [
    {
        name: "Interior Cockpit",
        offset: new THREE.Vector3(-0.4, 1.05, -0.1),
        lookAtOffset: new THREE.Vector3(-0.4, 1.0, 10)
    },
    {
        name: "Third-Person Chase",
        offset: new THREE.Vector3(0, 2.5, -7),
        lookAtOffset: new THREE.Vector3(0, 0.8, 5)
    },
    {
        name: "Hood Cam",
        offset: new THREE.Vector3(0, 1.0, 1.2),
        lookAtOffset: new THREE.Vector3(0, 0.8, 15)
    }
];

let currentCamIndex = 0;

// --- 4. CONTROLS & PHYSICS ---
const keys = { w: false, s: false, a: false, d: false };
let speed = 0;
let angle = 0;
const maxSpeed = 0.6;
const accel = 0.015;
const friction = 0.96;

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key in keys) keys[key] = true;
    if (key === 'c') {
        currentCamIndex = (currentCamIndex + 1) % cameraViews.length;
        const uiText = document.getElementById('cam-name');
        if (uiText) uiText.innerText = "Current Camera: " + cameraViews[currentCamIndex].name;
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key in keys) keys[key] = false;
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- 5. RENDER LOOP ---
function animate() {
    requestAnimationFrame(animate);

    // Driving Movement
    if (keys.w) speed = Math.min(speed + accel, maxSpeed);
    if (keys.s) speed = Math.max(speed - accel, -maxSpeed / 2);
    speed *= friction;

    if (Math.abs(speed) > 0.001) {
        const dir = speed > 0 ? 1 : -1;
        if (keys.a) angle += 0.03 * dir;
        if (keys.d) angle -= 0.03 * dir;
    }

    carGroup.rotation.y = angle;
    carGroup.position.x += Math.sin(angle) * speed;
    carGroup.position.z += Math.cos(angle) * speed;

    // Steering Wheel Rotation
    if (keys.a) steeringWheel.rotation.z = 0.8;
    else if (keys.d) steeringWheel.rotation.z = -0.8;
    else steeringWheel.rotation.z = 0;

    // Update Active Camera
    const activeView = cameraViews[currentCamIndex];
    const relativeCamOffset = activeView.offset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    const relativeLookAt = activeView.lookAtOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);

    camera.position.copy(carGroup.position).add(relativeCamOffset);
    camera.lookAt(carGroup.position.clone().add(relativeLookAt));

    renderer.render(scene, camera);
}

animate();
