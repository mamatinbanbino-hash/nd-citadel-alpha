/**
 * ND-CITADEL ENGINE v1.0
 * ARCHITECTURE PAR : N'DIAYE ADAMA
 */

let scene, camera, renderer, player;
let buildings = [], vehicles = [], loots = [];
let joystickActive = false;
let xp = 0, lvl = 1;

// 1. INITIALISATION DU MONDE 3D
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020202);
    scene.fog = new THREE.Fog(0x020202, 10, 80);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 15);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // Lumières Cyber
    const ambient = new THREE.AmbientLight(0x404040, 1.5);
    scene.add(ambient);
    const pointLight = new THREE.PointLight(0x00ffcc, 1, 100);
    pointLight.position.set(10, 20, 10);
    scene.add(pointLight);

    // Sol quadrillé
    const grid = new THREE.GridHelper(500, 100, 0x00ffcc, 0x111111);
    scene.add(grid);

    // GÉNÉRATION DE LA VILLE
    for(let i=0; i<60; i++) {
        createBuilding(Math.random()*160-80, Math.random()*20+5, Math.random()*160-80);
    }

    // AVATAR
    const playerGeo = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
    const playerMat = new THREE.MeshPhongMaterial({ color: 0x00ffcc, emissive: 0x00ffcc, emissiveIntensity: 0.2 });
    player = new THREE.Mesh(playerGeo, playerMat);
    player.position.y = 1.5;
    scene.add(player);

    spawnVehicle(15, -15);
    spawnLoot(10, 10);
    
    // EXTENSION : INITIALISATION AUDIO
    setupAudio();

    setupControls();
    animate();
}

function createBuilding(x, h, z) {
    const geo = new THREE.BoxGeometry(6, h, 6);
    const mat = new THREE.MeshPhongMaterial({ color: 0x0a0a0a });
    const b = new THREE.Mesh(geo, mat);
    b.position.set(x, h/2, z);
    const edges = new THREE.EdgesGeometry(geo);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x00ffcc }));
    line.position.copy(b.position);
    scene.add(b);
    scene.add(line);
    buildings.push(b);
}

function spawnVehicle(x, z) {
    const car = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(4, 1.2, 2.2), new THREE.MeshPhongMaterial({ color: 0xffcc00 }));
    body.position.y = 0.8;
    car.add(body);
    car.position.set(x, 0, z);
    scene.add(car);
    vehicles.push(car);
}

function spawnLoot(x, z) {
    const lootGeo = new THREE.OctahedronGeometry(0.6);
    const lootMat = new THREE.MeshBasicMaterial({ color: 0xff00ff });
    const loot = new THREE.Mesh(lootGeo, lootMat);
    loot.position.set(x, 1.5, z);
    scene.add(loot);
    loots.push(loot);
}

// 2. EXTENSION : AUDIO SPATIAL
function setupAudio() {
    const listener = new THREE.AudioListener();
    camera.add(listener);
    const sound = new THREE.Audio(listener);
    const loader = new THREE.AudioLoader();
    loader.load('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', (buffer) => {
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setVolume(0.2);
        window.addEventListener('click', () => { if(!sound.isPlaying) sound.play(); }, {once: true});
    });
}

// 3. PHYSIQUE ET MOUVEMENT
function setupControls() {
    const joy = document.getElementById('joy-container');
    const stick = document.getElementById('joy-stick');
    joy.addEventListener('touchstart', () => joystickActive = true);
    window.addEventListener('touchend', () => { joystickActive = false; stick.style.transform = 'translate(0,0)'; });
    window.addEventListener('touchmove', (e) => {
        if(!joystickActive) return;
        const rect = joy.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left - rect.width/2;
        const y = touch.clientY - rect.top - rect.height/2;
        const angle = Math.atan2(y, x);
        const dist = Math.min(Math.sqrt(x*x+y*y), 45);
        stick.style.transform = `translate(${Math.cos(angle)*dist}px, ${Math.sin(angle)*dist}px)`;
        const nextX = player.position.x + Math.cos(angle) * 0.3;
        const nextZ = player.position.z + Math.sin(angle) * 0.3;
        if(!checkCollision(nextX, nextZ)) {
            player.position.x = nextX;
            player.position.z = nextZ;
            player.rotation.y = -angle + Math.PI/2;
        }
    });
}

function checkCollision(nx, nz) {
    for(let b of buildings) {
        if(Math.abs(nx - b.position.x) < 4 && Math.abs(nz - b.position.z) < 4) return true;
    }
    return false;
}

// 4. BOUCLE DE RENDU OPTIMISÉE
function animate() {
    requestAnimationFrame(animate);
    loots.forEach((loot, i) => {
        loot.rotation.y += 0.05;
        if(player.position.distanceTo(loot.position) < 2) {
            scene.remove(loot);
            loots.splice(i, 1);
            updateXP(100);
        }
    });
    camera.position.lerp(new THREE.Vector3(player.position.x, player.position.y+10, player.position.z+16), 0.08);
    camera.lookAt(player.position);
    renderer.render(scene, camera);
}

function updateXP(val) {
    xp += val;
    document.getElementById('xp').innerText = xp;
    if(xp >= 500) {
        lvl = 2;
        document.getElementById('lvl').innerText = lvl;
        document.getElementById('active-quest').innerText = "MISSION: Infiltrer le CVSA (Niv. 2)";
    }
    localStorage.setItem('nd_xp', xp);
}

// EXTENSION : SÉCURITÉ ANTI-CHEAT
(function secure() {
    let sXP = xp;
    Object.defineProperty(window, 'XP_PROTECT', {
        get: () => sXP,
        set: (v) => { if(v >= sXP) { sXP = v; updateXP(0); } }
    });
})();

window.gameAction = () => {
    const f = new THREE.PointLight(0xff0000, 5, 10);
    f.position.copy(player.position);
    scene.add(f);
    setTimeout(() => scene.remove(f), 100);
};

window.onload = () => {
    const saved = localStorage.getItem('nd_xp');
    if(saved) { xp = parseInt(saved); }
    init();
};
