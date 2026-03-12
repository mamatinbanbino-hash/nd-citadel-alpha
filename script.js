/**
 * ND-CITADEL ENGINE v1.0 [FIXED]
 * ARCHITECTURE & CONCEPTION : N'DIAYE ADAMA
 */

let scene, camera, renderer, player;
let buildings = [], joystickActive = false;
let xp = 0;

function init() {
    console.log("Démarrage du moteur ND-Z...");
    
    // 1. SCÈNE & BROUILLARD
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020202);
    scene.fog = new THREE.Fog(0x020202, 10, 80);

    // 2. CAMÉRA
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 15);

    // 3. RENDU (FIXÉ POUR MOBILE)
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(renderer.domElement);

    // 4. LUMIÈRES
    const ambient = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambient);
    const light = new THREE.PointLight(0x00ffcc, 1.5, 100);
    light.position.set(10, 25, 10);
    scene.add(light);

    // 5. SOL NÉON (LA GRILLE)
    const grid = new THREE.GridHelper(500, 100, 0x00ffcc, 0x111111);
    scene.add(grid);

    // 6. AVATAR ADAMA
    const playerGeo = new THREE.BoxGeometry(1, 2, 1);
    const playerMat = new THREE.MeshPhongMaterial({ color: 0x00ffcc, emissive: 0x00ffcc, emissiveIntensity: 0.2 });
    player = new THREE.Mesh(playerGeo, playerMat);
    player.position.y = 1;
    scene.add(player);

    // 7. GÉNÉRATION DE LA CITADELLE
    for(let i=0; i<55; i++) {
        let h = Math.random() * 20 + 5;
        let bGeo = new THREE.BoxGeometry(6, h, 6);
        let bMat = new THREE.MeshPhongMaterial({ color: 0x0a0a0a });
        let b = new THREE.Mesh(bGeo, bMat);
        b.position.set(Math.random()*160-80, h/2, Math.random()*160-80);
        
        // Bordures néon des bâtiments
        const edges = new THREE.EdgesGeometry(bGeo);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x00ffcc }));
        line.position.copy(b.position);
        
        scene.add(b);
        scene.add(line);
        buildings.push(b);
    }

    setupControls();
    animate();
}

// 8. CONTRÔLES (JOYSTICK)
function setupControls() {
    const joy = document.getElementById('joy-container');
    const stick = document.getElementById('joy-stick');

    if(!joy || !stick) return;

    joy.addEventListener('touchstart', (e) => {
        joystickActive = true;
        e.preventDefault();
    }, {passive: false});

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

        // Mouvement fluide
        player.position.x += Math.cos(angle) * 0.3;
        player.position.z += Math.sin(angle) * 0.3;
        player.rotation.y = -angle + Math.PI/2;
    }, {passive: false});
}

// 9. BOUCLE DE RENDU
function animate() {
    requestAnimationFrame(animate);
    
    // Suivi Caméra
    if(player) {
        const targetPos = new THREE.Vector3(player.position.x, player.position.y + 10, player.position.z + 15);
        camera.position.lerp(targetPos, 0.1);
        camera.lookAt(player.position);
    }
    
    renderer.render(scene, camera);
}

// 10. GESTION DU REDIMENSIONNEMENT
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- CORRECTION FINALE : FORCE LE LANCEMENT ---
window.addEventListener('load', init);
