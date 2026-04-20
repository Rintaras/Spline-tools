(function () {
    const canvas = document.getElementById('background-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: false,
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    // パーティクルシステム（軽量化）
    const particleCount = 600;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 200;
        positions[i + 1] = (Math.random() - 0.5) * 200;
        positions[i + 2] = (Math.random() - 0.5) * 200;
        velocities[i] = (Math.random() - 0.5) * 0.02;
        velocities[i + 1] = (Math.random() - 0.5) * 0.02;
        velocities[i + 2] = (Math.random() - 0.5) * 0.02;

        // 色を紫系に設定
        colors[i] = 0.4 + Math.random() * 0.3; // R
        colors[i + 1] = 0.5 + Math.random() * 0.3; // G
        colors[i + 2] = 0.9; // B
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
        size: 1.0,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        sizeAttenuation: false
    });

    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);

    // 線の接続用の配列（軽量化版）
    const lineSegments = [];
    const maxDistance = 40;
    const maxDistanceSq = maxDistance * maxDistance;
    let lineUpdateCounter = 0;
    const maxConnectionsPerParticle = 8; // 各パーティクルの最大接続数

    function updateLines() {
        // 既存の線を削除
        lineSegments.forEach(line => {
            line.geometry.dispose();
            line.material.dispose();
            scene.remove(line);
        });
        lineSegments.length = 0;

        const pos = particles.attributes.position.array;

        // 近接パーティクル間に線を描画（最適化版）
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            let connectionCount = 0;

            // 各パーティクルに対して、近くのパーティクルだけをチェック
            for (let j = i + 1; j < particleCount && connectionCount < maxConnectionsPerParticle; j++) {
                const j3 = j * 3;
                const dx = pos[i3] - pos[j3];
                const dy = pos[i3 + 1] - pos[j3 + 1];
                const dz = pos[i3 + 2] - pos[j3 + 2];
                const distanceSq = dx * dx + dy * dy + dz * dz;

                if (distanceSq < maxDistanceSq) {
                    const distance = Math.sqrt(distanceSq);
                    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                        new THREE.Vector3(pos[i3], pos[i3 + 1], pos[i3 + 2]),
                        new THREE.Vector3(pos[j3], pos[j3 + 1], pos[j3 + 2])
                    ]);

                    const opacity = (1 - distance / maxDistance) * 0.25;
                    const lineMaterial = new THREE.LineBasicMaterial({
                        color: 0x667eea,
                        transparent: true,
                        opacity: opacity
                    });

                    const line = new THREE.Line(lineGeometry, lineMaterial);
                    scene.add(line);
                    lineSegments.push(line);
                    connectionCount++;
                }
            }
        }
    }

    camera.position.z = 120;

    let frame = 0;
    let lastTime = performance.now();
    const targetCameraRotation = { x: 0, y: 0 };
    const currentCameraRotation = { x: 0, y: 0 };

    function animate() {
        requestAnimationFrame(animate);
        frame++;

        const currentTime = performance.now();
        const deltaTime = Math.min((currentTime - lastTime) / 16.67, 2);
        lastTime = currentTime;

        const pos = particles.attributes.position.array;

        // パーティクルの更新（軽量化版）
        for (let i = 0; i < particleCount * 3; i += 3) {
            // 位置を更新
            pos[i] += velocities[i] * deltaTime;
            pos[i + 1] += velocities[i + 1] * deltaTime;
            pos[i + 2] += velocities[i + 2] * deltaTime;

            // 境界で反転（簡略化）
            if (Math.abs(pos[i]) > 100) {
                velocities[i] *= -0.9;
                pos[i] = Math.sign(pos[i]) * 100;
            }
            if (Math.abs(pos[i + 1]) > 100) {
                velocities[i + 1] *= -0.9;
                pos[i + 1] = Math.sign(pos[i + 1]) * 100;
            }
            if (Math.abs(pos[i + 2]) > 100) {
                velocities[i + 2] *= -0.9;
                pos[i + 2] = Math.sign(pos[i + 2]) * 100;
            }
        }

        particles.attributes.position.needsUpdate = true;

        // 線の更新（頻度を下げて軽量化）
        lineUpdateCounter++;
        if (lineUpdateCounter >= 5) {
            updateLines();
            lineUpdateCounter = 0;
        }

        // カメラの滑らかな回転（簡略化）
        targetCameraRotation.y += 0.0002;
        targetCameraRotation.x = Math.sin(frame * 0.0008) * 0.08;

        // 現在の回転を目標に向かって滑らかに補間
        currentCameraRotation.y += (targetCameraRotation.y - currentCameraRotation.y) * 0.05;
        currentCameraRotation.x += (targetCameraRotation.x - currentCameraRotation.x) * 0.05;

        camera.rotation.y = currentCameraRotation.y;
        camera.rotation.x = currentCameraRotation.x;

        renderer.render(scene, camera);
    }

    // ウィンドウリサイズ対応
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // 初期化
    updateLines();
    animate();
})();
