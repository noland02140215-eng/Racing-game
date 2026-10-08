// Global game variables
var canvas, context;
var x = 0, y = 0;       // Starting coordinates
var speed = 5;          // Car movement speed
var angle = 0;          // Steering angle in degrees
var mod = 0;            // Movement modifier (1 = forward, -1 = reverse, 0 = stop)
var car;

// Initialize game context and event listeners on page load
window.onload = function () {
    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");

    // Load car image asset
    car = new Image();
    car.src = "myimage.png";

    // Register keyboard event listeners
    window.addEventListener("keydown", keypress_handler, false);
    window.addEventListener("keyup", keyup_handler, false);

    // Run game loop every 30 milliseconds
    var moveInterval = setInterval(function () {
        draw();
    }, 30);
};

// Main game loop function
function draw() {
    context = canvas.getContext("2d");
    context.clearRect(0, 0, 800, 800); // Clear canvas frame

    // Optional background shape
    context.fillStyle = "rgb(200, 100, 220)";
    context.fillRect(50, 50, 100, 100);

    // Calculate position updates using trigonometry (converted to radians)
    x += (speed * mod) * Math.cos(Math.PI / 180 * angle);
    y += (speed * mod) * Math.sin(Math.PI / 180 * angle);

    // Save context state, translate, rotate, and render car centered
    context.save();
    context.translate(x, y);
    context.rotate(Math.PI / 180 * angle);
    context.drawImage(car, -(car.width / 2), -(car.height / 2));
    context.restore();
}

// Keydown handler for WASD inputs
function keypress_handler(event) {
    if (event.keyCode == 87) { // W key: forward
        mod = 1;
    }
    if (event.keyCode == 83) { // S key: reverse
        mod = -1;
    }
    if (event.keyCode == 65) { // A key: steer left
        angle -= 5;
    }
    if (event.keyCode == 68) { // D key: steer right
        angle += 5;
    }
}

// Keyup handler to stop throttle when keys are released
function keyup_handler(event) {
    if (event.keyCode == 87 || event.keyCode == 83) {
        mod = 0;
    }
}
