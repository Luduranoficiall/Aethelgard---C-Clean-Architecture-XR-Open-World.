import * as THREE from 'three';
import { WorldPortalDef } from '../core/WorldPortals.ts';

export class PortalOrb {
  public group: THREE.Group = new THREE.Group();
  public orbMesh: THREE.Mesh;
  public outerRing: THREE.Mesh;
  public innerCore: THREE.Mesh;
  public def: WorldPortalDef;
  public isHovered: boolean = false;
  private timeOffset: number = Math.random() * 10;

  constructor(def: WorldPortalDef) {
    this.def = def;

    // Outer translucent cosmic sphere
    const sphereGeo = new THREE.SphereGeometry(0.32, 28, 28);
    const sphereMat = new THREE.MeshPhongMaterial({
      color: def.orbColorHex,
      transparent: true,
      opacity: 0.65,
      shininess: 80,
      emissive: def.orbColorHex,
      emissiveIntensity: 0.25,
    });
    this.orbMesh = new THREE.Mesh(sphereGeo, sphereMat);
    this.orbMesh.name = `Portal: ${def.title}`;

    // Inner terrain preview core
    const coreGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const coreMat = new THREE.MeshStandardMaterial({
      color: def.groundColorHex,
      roughness: 0.5,
      flatShading: true,
    });
    this.innerCore = new THREE.Mesh(coreGeo, coreMat);

    // Orbital celestial ring
    const ringGeo = new THREE.TorusGeometry(0.44, 0.015, 12, 36);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
    });
    this.outerRing = new THREE.Mesh(ringGeo, ringMat);
    this.outerRing.rotation.x = Math.PI / 3;

    this.group.add(this.orbMesh, this.innerCore, this.outerRing);
    this.group.position.set(...def.position);
  }

  public update(dt: number): void {
    const elapsed = Date.now() * 0.001 + this.timeOffset;

    // Gentle floating bob
    this.group.position.y = this.def.position[1] + Math.sin(elapsed * 1.5) * 0.06;

    // Orbital ring and core spin
    this.outerRing.rotation.z += dt * 0.8;
    this.outerRing.rotation.y += dt * 0.4;
    this.innerCore.rotation.y += dt * 0.5;

    // Hover pulsation
    const targetScale = this.isHovered ? 1.15 : 1.0;
    this.group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), dt * 6);
  }
}
