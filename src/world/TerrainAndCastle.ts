import * as THREE from 'three';

export class TerrainAndCastle {
  public group: THREE.Group = new THREE.Group();
  public groundMesh!: THREE.Mesh;
  public castleGroup: THREE.Group = new THREE.Group();
  public treesGroup: THREE.Group = new THREE.Group();
  public villageGroup: THREE.Group = new THREE.Group();
  public mountainsGroup: THREE.Group = new THREE.Group();
  public particlesMesh!: THREE.Points;

  constructor() {
    this.buildGround();
    this.buildCastle();
    this.buildVillage();
    this.buildForest();
    this.buildMountainBackdrop();
    this.buildAmbientDust();

    this.group.add(this.castleGroup);
    this.group.add(this.villageGroup);
    this.group.add(this.treesGroup);
    this.group.add(this.mountainsGroup);
  }

  private buildGround(): void {
    const geo = new THREE.PlaneGeometry(120, 120, 48, 48);
    geo.rotateX(-Math.PI / 2);

    // Gently deform vertices for rolling hills
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // Gentle undulation, keeping center flat for walking
      const distFromCenter = Math.sqrt(x * x + z * z);
      if (distFromCenter > 8) {
        const height = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 1.5 + Math.sin(x * 0.05 + z * 0.05) * 2.2;
        pos.setY(i, Math.max(-0.2, height));
      } else {
        pos.setY(i, 0);
      }
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: 0x3b6b32,
      roughness: 0.85,
      metalness: 0.05,
      flatShading: true,
    });

    this.groundMesh = new THREE.Mesh(geo, mat);
    this.groundMesh.receiveShadow = true;
    this.group.add(this.groundMesh);

    // Cobblestone path toward the castle
    const pathGeo = new THREE.PlaneGeometry(3.5, 30, 8, 20);
    pathGeo.rotateX(-Math.PI / 2);
    const pathMat = new THREE.MeshStandardMaterial({
      color: 0x7a7d76,
      roughness: 0.9,
      flatShading: true,
    });
    const path = new THREE.Mesh(pathGeo, pathMat);
    path.position.set(0, 0.02, -12);
    this.group.add(path);
  }

  private buildCastle(): void {
    // Castle fortress in the distance
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8b939c, roughness: 0.7, flatShading: true });
    const darkStoneMat = new THREE.MeshStandardMaterial({ color: 0x5a626d, roughness: 0.8, flatShading: true });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x243e6b, roughness: 0.5, flatShading: true });
    const flagMat = new THREE.MeshStandardMaterial({ color: 0xc83232, side: THREE.DoubleSide });

    // Main Keep
    const keepGeo = new THREE.BoxGeometry(10, 14, 8);
    const keep = new THREE.Mesh(keepGeo, stoneMat);
    keep.position.set(0, 7, -26);
    this.castleGroup.add(keep);

    // Keep Roof
    const keepRoofGeo = new THREE.ConeGeometry(7, 5, 4);
    const keepRoof = new THREE.Mesh(keepRoofGeo, roofMat);
    keepRoof.rotation.y = Math.PI / 4;
    keepRoof.position.set(0, 16.5, -26);
    this.castleGroup.add(keepRoof);

    // Twin High Watchtowers
    const towerGeo = new THREE.CylinderGeometry(2, 2.3, 18, 12);
    const towerRoofGeo = new THREE.ConeGeometry(2.8, 6, 12);

    const leftTower = new THREE.Mesh(towerGeo, stoneMat);
    leftTower.position.set(-7, 9, -24);
    const leftRoof = new THREE.Mesh(towerRoofGeo, roofMat);
    leftRoof.position.set(-7, 21, -24);

    const rightTower = new THREE.Mesh(towerGeo, stoneMat);
    rightTower.position.set(7, 9, -24);
    const rightRoof = new THREE.Mesh(towerRoofGeo, roofMat);
    rightRoof.position.set(7, 21, -24);

    this.castleGroup.add(leftTower, leftRoof, rightTower, rightRoof);

    // Castle Gate / Archway
    const gateGeo = new THREE.BoxGeometry(4, 5, 2);
    const gateMat = new THREE.MeshStandardMaterial({ color: 0x3d2719, roughness: 0.9 });
    const gate = new THREE.Mesh(gateGeo, gateMat);
    gate.position.set(0, 2.5, -22);
    this.castleGroup.add(gate);

    // Battlements wall
    const wallGeo = new THREE.BoxGeometry(18, 5, 2);
    const wall = new THREE.Mesh(wallGeo, darkStoneMat);
    wall.position.set(0, 2.5, -23);
    this.castleGroup.add(wall);

    // Castle Flag atop tower
    const flagPoleGeo = new THREE.CylinderGeometry(0.06, 0.06, 3);
    const flagPole = new THREE.Mesh(flagPoleGeo, stoneMat);
    flagPole.position.set(-7, 25.5, -24);
    const flagGeo = new THREE.PlaneGeometry(1.5, 0.9);
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(-6.2, 26, -24);
    this.castleGroup.add(flagPole, flag);
  }

  private buildVillage(): void {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x6e4a2d, roughness: 0.8, flatShading: true });
    const plasterMat = new THREE.MeshStandardMaterial({ color: 0xded2be, roughness: 0.9, flatShading: true });
    const thatchRoofMat = new THREE.MeshStandardMaterial({ color: 0x8a6231, roughness: 0.8, flatShading: true });

    const housePositions = [
      { x: -9, z: -8, rot: 0.3 },
      { x: -11, z: -16, rot: 0.1 },
      { x: 9, z: -9, rot: -0.4 },
      { x: 12, z: -17, rot: -0.2 },
    ];

    housePositions.forEach(({ x, z, rot }) => {
      const house = new THREE.Group();

      // Lower stone/wood base
      const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(4.5, 3, 4), plasterMat);
      baseMesh.position.y = 1.5;
      house.add(baseMesh);

      // Wooden beams
      const beamGeo = new THREE.BoxGeometry(0.3, 3, 0.3);
      for (const [bx, bz] of [[-2.2, -1.9], [2.2, -1.9], [-2.2, 1.9], [2.2, 1.9]]) {
        const beam = new THREE.Mesh(beamGeo, woodMat);
        beam.position.set(bx, 1.5, bz);
        house.add(beam);
      }

      // Thatch Roof
      const roofMesh = new THREE.Mesh(new THREE.ConeGeometry(3.6, 2.4, 4), thatchRoofMat);
      roofMesh.position.y = 4.2;
      roofMesh.rotation.y = Math.PI / 4;
      house.add(roofMesh);

      // Wooden door
      const doorMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.8), woodMat);
      doorMesh.position.set(0, 0.9, 2.01);
      house.add(doorMesh);

      house.position.set(x, 0, z);
      house.rotation.y = rot;
      this.villageGroup.add(house);
    });
  }

  private buildForest(): void {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3219, roughness: 0.9 });
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x1f471e, roughness: 0.7, flatShading: true });

    const treePositions = [
      [-6, -4], [-14, -6], [-17, -13], [-8, -2], [-15, -2],
      [7, -3], [14, -5], [16, -12], [8, 2], [18, -2],
      [-5, -19], [6, -18], [-12, -26], [13, -25],
    ];

    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 2.2, 6);
    const foliageGeo1 = new THREE.ConeGeometry(1.6, 2.5, 6);
    const foliageGeo2 = new THREE.ConeGeometry(1.3, 2.1, 6);
    const foliageGeo3 = new THREE.ConeGeometry(0.9, 1.7, 6);

    treePositions.forEach(([x, z]) => {
      const tree = new THREE.Group();

      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 1.1;
      tree.add(trunk);

      const f1 = new THREE.Mesh(foliageGeo1, leavesMat);
      f1.position.y = 2.4;
      const f2 = new THREE.Mesh(foliageGeo2, leavesMat);
      f2.position.y = 3.6;
      const f3 = new THREE.Mesh(foliageGeo3, leavesMat);
      f3.position.y = 4.7;

      tree.add(f1, f2, f3);

      const scale = 0.8 + Math.random() * 0.45;
      tree.scale.set(scale, scale, scale);
      tree.position.set(x, 0, z);
      this.treesGroup.add(tree);
    });
  }

  private buildMountainBackdrop(): void {
    const mountainMat = new THREE.MeshStandardMaterial({ color: 0x5b6573, roughness: 0.95, flatShading: true });
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xdeecfb, roughness: 0.5, flatShading: true });

    const peaks = [
      { x: -35, y: 22, z: -55, r: 18, h: 44 },
      { x: 0, y: 28, z: -65, r: 24, h: 56 },
      { x: 38, y: 24, z: -58, r: 20, h: 48 },
      { x: -60, y: 18, z: -45, r: 16, h: 36 },
      { x: 62, y: 19, z: -46, r: 17, h: 38 },
    ];

    peaks.forEach(({ x, y, z, r, h }) => {
      const mountainGeo = new THREE.ConeGeometry(r, h, 7);
      const mountain = new THREE.Mesh(mountainGeo, mountainMat);
      mountain.position.set(x, y, z);

      // Snowy peak cap
      const snowGeo = new THREE.ConeGeometry(r * 0.35, h * 0.35, 7);
      const snow = new THREE.Mesh(snowGeo, snowMat);
      snow.position.set(x, y + h * 0.32, z);

      this.mountainsGroup.add(mountain, snow);
    });
  }

  private buildAmbientDust(): void {
    const count = 300;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = 0.5 + Math.random() * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40 - 10;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.08,
      transparent: true,
      opacity: 0.45,
    });

    this.particlesMesh = new THREE.Points(geo, mat);
    this.group.add(this.particlesMesh);
  }

  public updateParticles(dt: number): void {
    if (!this.particlesMesh) return;
    const pos = this.particlesMesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) + Math.sin(Date.now() * 0.001 + i) * 0.005;
      if (y > 9) y = 0.5;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  }

  public applyBiome(groundHex: number, treeHex: number, particleHex: number): void {
    (this.groundMesh.material as THREE.MeshStandardMaterial).color.setHex(groundHex);
    (this.particlesMesh.material as THREE.PointsMaterial).color.setHex(particleHex);

    this.treesGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry instanceof THREE.ConeGeometry) {
        (child.material as THREE.MeshStandardMaterial).color.setHex(treeHex);
      }
    });
  }
}
