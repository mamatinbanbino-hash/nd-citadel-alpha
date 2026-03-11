/**
 * ND-CITADEL ENGINE v1.0 [FINAL-CORE]
 * ARCHITECTURE & CONCEPTION : N'DIAYE ADAMA
 * TOUT DROITS RÉSERVÉS - ND-Z COMMANDO
 */

let scene, camera, renderer, player;
let buildings = [], vehicles = [], loots = [];
let joystickActive = false;
let xp = 0, lvl = 1;

// 1. INITIALISATION DU SYSTÈME
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

    // Lumières Cyber (Glow effect)
    const ambient = new THREE.AmbientLight(0x404040, 1.8);
    scene.add(ambient);
    const pointLight = new THREE.PointLight(0x00ffcc, 1.2, 100);
    pointLight.position.set(15, 25, 15);
    scene.add(pointLight);

    // Grille de perspective ND-Z
    const grid = new THREE.GridHelper(500, 120, 0x00ffcc, 0x111111);
    scene.add(grid);

    // GÉNÉRATION DE LA CITADELLE (VILLE)
    for(let i=0; i<65; i++) {
        createBuilding(
            Math.random() * 180 - 90, 
            Math.random() * 25 + 5, 
            Math.random() * 180 - 90
        );
    }

    // CRÉATION DE L'AVATAR ADAMA
    const playerGeo = new THREE.CapsuleGeometry(0.5, 1.2, 4, 8);
    const playerMat = new THREE.MeshPhongMaterial({ color: 0x00ffcc, emissive: 0x00ffcc, emissiveIntensity: 0.3 });
    player = new THREE.Mesh(playerGeo, playerMat);
    player.position.y = 1.6;
    scene.add(player);

    // INITIALISATION DES ÉLÉMENTS DU MONDE
    spawnVehicle(20, -20);
    spawnLoot(15, 15);
    spawnLoot(-25, 40);
    setupAudio();

    setupControls();
    animate();
}

// 2. CONSTRUCTEUR D'ARCHITECTURE
function createBuilding(x, h, z) {
    const geo = new THREE.BoxGeometry(6.5, h, 6.5);
    const mat = new THREE.MeshPhongMaterial({ color: 0x080808 });
    const b = new THREE.Mesh(geo, mat);
    b.position.set(x, h/2, z);
    
    const edges = new THREE.EdgesGeometry(geo);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x00ffcc }));
    line.position.copy(b.position);
    
    scene.add(b);
    scene.add(line);
    buildings.push(b);
}

// 3. VÉHICULES ET BUTINS (WORO-WORO & LOOTS)
function spawnVehicle(x, z) {
    const car = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.5, 2.5), new THREE.MeshPhongMaterial({ color: 0xffcc00 }));
    body.position.y = 1;
    car.add(body);
    car.position.set(x, 0, z);
    scene.add(car);
    vehicles.push(car);
}

function spawnLoot(x, z) {
    const lootGeo = new THREE.OctahedronGeometry(0.8);
    const lootMat = new THREE.MeshBasicMaterial({ color: 0xff00ff });
    const loot = new THREE.Mesh(lootGeo, lootMat);
    loot.position.set(x, 2, z);
    scene.add(loot);
    loots.push(loot);
}

// 4. AUDIO SPATIAL CYBERPUNK
function setupAudio() {
    const listener = new THREE.AudioListener();
    camera.add(listener);
    const sound = new THREE.Audio(listener);
    const loader = new THREE.AudioLoader();
    loader.load('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', (buffer) => {
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setVolume(0.15);
        window.addEventListener('click', () => { if(!sound.isPlaying) sound.play(); }, {once: true});
    });
}

// 5. CONTRÔLES TACTILES ET PHYSIQUE
function setupControls() {
    const joy = document.getElementById('joy-container');
    const stick = document.getElementById('joy-stick');

    joy.addEventListener('touchstart', () => joystickActive = true);
    window.addEventListener('touchend', () => { 
        joystickActive = false; 
        stick.style.transform = 'translate(0,0)'; 
    });

    window.addEventListener('touchmove', (e) => {
        if(!joystickActive) return;
        const rect = joy.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left - rect.width/2;
        const y = touch.clientY - rect.top - rect.height/2;
        const angle = Math.atan2(y, x);
        const dist = Math.min(Math.sqrt(x*x+y*y), 45);

        stick.style.transform = `translate(${Math.cos(angle)*dist}px, ${Math.sin(angle)*dist}px)`;

        const speed = 0.35;
        const nextX = player.position.x + Math.cos(angle) * speed;
        const nextZ = player.position.z + Math.sin(angle) * speed;
        
        if(!checkCollision(nextX, nextZ)) {
            player.position.x = nextX;
            player.position.z = nextZ;
            player.rotation.y = -angle + Math.PI/2;
        }
    });

    // Support Clavier
    window.addEventListener('keydown', (e) => {
        if(e.key === 't' || e.key === 'T') document.getElementById('chat-input').focus();
    });
}

function checkCollision(nx, nz) {
    for(let b of buildings) {
        if(Math.abs(nx - b.position.x) < 4.2 && Math.abs(nz - b.position.z) < 4.2) return true;
    }
    return false;
}

// 6. BOUCLE D'ANIMATION ET XP
function animate() {
    requestAnimationFrame(animate);
    
    // Rotation des loots et collecte
    loots.forEach((loot, i) => {
        loot.rotation.y += 0.06;
        if(player.position.distanceTo(loot.position) < 2.5) {
            scene.remove(loot);
            loots.splice(i, 1);
            updateXP(150);
            if(navigator.vibrate) navigator.vibrate(50);
        }
    });

    // Caméra fluide (Interpolation)
    const targetCam = new THREE.Vector3(player.position.x, player.position.y+11, player.position.z+17);
    camera.position.lerp(targetCam, 0.07);
    camera.lookAt(player.position);

    renderer.render(scene, camera);
}

function updateXP(val) {
    xp += val;
    document.getElementById('xp').innerText = xp;
    if(xp >= 600 && lvl === 1) {
        lvl = 2;
        document.getElementById('lvl').innerText = lvl;
        document.getElementById('active-quest').innerText = "MISSION: Infiltration CVSA [Secteur-D]";
    }
    localStorage.setItem('nd_xp_save', xp);
}

// SÉCURITÉ ANTI-MODIFICATION XP
(function() {
    let internalXP = xp;
    Object.defineProperty(window, 'ND_XP_CORE', {
        get: () => internalXP,
        set: (v) => { if(v >= internalXP) internalXP = v; }
    });
})();

// Action : Impulsion Néon
window.gameAction = () => {
    const flash = new THREE.PointLight(0xff00ff, 8, 15);
    flash.position.copy(player.position);
    scene.add(flash);
    setTimeout(() => scene.remove(flash), 120);
    if(navigator.vibrate) navigator.vibrate([30, 50, 30]);
};

window.onload = () => {
    const saved = localStorage.getItem('nd_xp_save');
    if(saved) { xp = parseInt(saved); document.getElementById('xp').innerText = xp; }
    init();
};
