const canvas = document.getElementById("animationCanvas");
const context = canvas.getContext("2d");
const pauseButton = document.getElementById("pauseButton");
const restartButton = document.getElementById("restartButton");
const statusBox = document.getElementById("animationStatus");

const mascot = new Image();
mascot.src = "daytona-state-mascot.jpg";

const mascotSize = { width: 150, height: 150 };
let x = 90;
let y = 70;
let dx = 3;
let dy = 2.2;
let paused = false;
let particles = [];
let burstFrames = 0;

function keepMascotInBounds() {
    const maxX = canvas.width - mascotSize.width;
    const maxY = canvas.height - mascotSize.height;

    if (x <= 0) {
        x = 0;
        dx = Math.abs(dx);
    } else if (x >= maxX) {
        x = maxX;
        dx = -Math.abs(dx);
    }

    if (y <= 0) {
        y = 0;
        dy = Math.abs(dy);
    } else if (y >= maxY) {
        y = maxY;
        dy = -Math.abs(dy);
    }
}

function createBurst(centerX, centerY) {
    particles = [];
    for (let i = 0; i < 28; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        particles.push({
            x: centerX,
            y: centerY,
            dx: Math.cos(angle) * speed,
            dy: Math.sin(angle) * speed,
            radius: 3 + Math.random() * 5,
            life: 32,
            color: ["#0057a8", "#168a5b", "#f4b400", "#7ac943"][i % 4]
        });
    }
    burstFrames = 32;
}

function drawParticles() {
    particles = particles.filter(function(particle) {
        return particle.life > 0;
    });

    particles.forEach(function(particle) {
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fillStyle = particle.color;
        context.fill();
        particle.x += particle.dx;
        particle.y += particle.dy;
        particle.life -= 1;
        particle.radius *= 0.97;
    });

    if (burstFrames > 0) {
        burstFrames -= 1;
    }
}

function drawScene() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "#f7fbfe";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.strokeStyle = "#0057a8";
    context.lineWidth = 4;
    context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

    context.fillStyle = "#dcefe4";
    context.fillRect(6, canvas.height - 48, canvas.width - 12, 40);

    if (mascot.complete && mascot.naturalWidth > 0) {
        context.save();
        if (burstFrames > 0) {
            context.globalAlpha = 0.65 + Math.random() * 0.35;
        }
        context.drawImage(mascot, x, y, mascotSize.width, mascotSize.height);
        context.restore();
    } else {
        context.fillStyle = "#0057a8";
        context.beginPath();
        context.arc(x + mascotSize.width / 2, y + mascotSize.height / 2, 45, 0, Math.PI * 2);
        context.fill();
    }

    drawParticles();
}

function animate() {
    if (!paused) {
        x += dx;
        y += dy;
        keepMascotInBounds();
    }
    drawScene();
    window.setTimeout(animate, 16);
}

function restartAnimation() {
    x = 90;
    y = 70;
    dx = 3;
    dy = 2.2;
    particles = [];
    burstFrames = 0;
    paused = false;
    pauseButton.textContent = "Pause Animation";
    statusBox.textContent = "Animation restarted. Click the mascot to make it burst and change direction.";
    drawScene();
}

canvas.addEventListener("click", function(event) {
    const bounds = canvas.getBoundingClientRect();
    const scaleX = canvas.width / bounds.width;
    const scaleY = canvas.height / bounds.height;
    const clickX = (event.clientX - bounds.left) * scaleX;
    const clickY = (event.clientY - bounds.top) * scaleY;

    if (clickX >= x && clickX <= x + mascotSize.width &&
        clickY >= y && clickY <= y + mascotSize.height) {
        createBurst(x + mascotSize.width / 2, y + mascotSize.height / 2);
        dx = (Math.random() < 0.5 ? -1 : 1) * (2.5 + Math.random() * 2);
        dy = (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 2);
        statusBox.textContent = "Nice click! The mascot burst and changed direction.";
    }
});

pauseButton.addEventListener("click", function() {
    paused = !paused;
    pauseButton.textContent = paused ? "Resume Animation" : "Pause Animation";
    statusBox.textContent = paused ? "Animation paused." : "Animation resumed.";
});

restartButton.addEventListener("click", restartAnimation);

mascot.addEventListener("load", drawScene);
mascot.addEventListener("error", function() {
    statusBox.textContent = "The mascot image could not be loaded. Check that daytona-state-mascot.jpg is in the same folder.";
});
drawScene();
animate();
