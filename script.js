/**
 * ND-CITADEL ENGINE v1.0 [FIXED]
 * ARCHITECTURE PAR : N'DIAYE ADAMA
 */

let scene, camera, renderer, player;
let buildings = [], joystickActive = false;
let xp = 0;

function init() {
    console.log("Démarrage du moteur ND-Z...");
    
    // Création de la scène
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, 10, 80);

    // Caméra
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 15);

    // Rendu (Le dessin)
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // Lumières
    const ambient = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambient);
    const light = new THREE.PointLight(0x00ffcc, 1, 100);
    light.position.set(10, 20, 10);
    scene.add(light);

    // Sol Néon
    const grid = new THREE.GridHelper(500, 100, 0x00ffcc, 0x222222);
    scene.add(grid);

    // Avatar Adama
    const playerGeo = new THREE.BoxGeometry(1, 2, 1);
    const playerMat = new THREE.MeshPhongMaterial({ color: 0x00ffcc });
    player = new THREE.Mesh(playerGeo, playerMat);
    player.position.y = 1;
    scene.add(player);

    // Ville de Macassi
    for(let i=0; i<50; i++) {
        let h = Math.random() * 20 + 5;
        let bGeo = new THREE.BoxGeometry(6, h, 6);
        let bMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
        let b = new THREE.Mesh(bGeo, bMat);
        b.position.set(Math.random()*160-80, h/2, Math.random()*160-80);
        scene.add(b);
        buildings.push(b);
    }

    setupControls();
    animate();
}

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
        const dist = Math.min(Math.sqrt(x*x+y*y), 40);

        stick.style.transform = `translate(${Math.cos(angle)*dist}px, ${Math.sin(angle)*dist}px)`;

        // Mouvement
        player.position.x += Math.cos(angle) * 0.25;
        player.position.z += Math.sin(angle) * 0.25;
        player.rotation.y = -angle + Math.PI/2;
    });
}

function animate() {
    requestAnimationFrame(animate);
    // Caméra suit Adama
    camera.position.lerp(new THREE.Vector3(player.position.x, player.position.y+10, player.position.z+15), 0.1);
    camera.lookAt(player.position);
    renderer.render(scene, camera);
}

// FORCE LE LANCEMENT
window.addEventListener('load', init);
