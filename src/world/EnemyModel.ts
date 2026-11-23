import * as THREE from 'three';
import { EnemyEntity } from '../core/EnemyEntity.ts';
import { EnemyType } from '../core/types.ts';

export class EnemyModel {
  public group: THREE.Group = new THREE.Group();
  public entity: EnemyEntity;
  public hpBarFill!: THREE.Mesh;
  public hpBarBg!: THREE.Mesh;
  public isStunned: boolean = false;
  private stunTimeRemaining: number = 0;
  private bodyMesh!: THREE.Mesh;
  private weaponMesh!: THREE.Mesh;

  constructor(entity: EnemyEntity, position: THREE.Vector3) {
    this.entity = entity;
    this.buildMesh();
    this.buildHealthBar();
    this.group.position.copy(position);
  }

  private buildMesh(): void {
    const isKnight = this.entity.type === EnemyType.CavaleiroSombrio;
    const bodyColor = isKnight ? 0x221111 : 0x2d4f26;

    const bodyMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.6,
      metalness: isKnight ? 0.8 : 0.2,
      flatShading: true,
    });

    // Body
    const height = isKnight ? 1.6 : 1.1;
    const radius = isKnight ? 0.35 : 0.28;
    const bodyGeo = new THREE.CylinderGeometry(radius * 0.8, radius, height, 8);
    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.bodyMesh.position.y = height / 2;
    this.group.add(this.bodyMesh);

    // Glowing Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: isKnight ? 0xff2222 : 0xffaa00 });
    const eyeGeo = new THREE.SphereGeometry(0.06, 6, 6);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.12, height - 0.2, radius * 0.7);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.12, height - 0.2, radius * 0.7);
    this.group.add(leftEye, rightEye);

    // Weapon (Axe or Dark Mace)
    const weaponMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.9 });
    const weaponGeo = new THREE.BoxGeometry(0.1, 0.8, 0.1);
    this.weaponMesh = new THREE.Mesh(weaponGeo, weaponMat);
    this.weaponMesh.position.set(radius + 0.15, height * 0.6, 0.1);
    this.weaponMesh.rotation.x = Math.PI / 4;
    this.group.add(this.weaponMesh);
  }

  private buildHealthBar(): void {
    const bgGeo = new THREE.PlaneGeometry(0.8, 0.1);
    const bgMat = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });
    this.hpBarBg = new THREE.Mesh(bgGeo, bgMat);
    this.hpBarBg.position.y = 1.9;

    const fillGeo = new THREE.PlaneGeometry(0.78, 0.08);
    const fillMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
    this.hpBarFill = new THREE.Mesh(fillGeo, fillMat);
    this.hpBarFill.position.set(0, 1.9, 0.01);

    this.group.add(this.hpBarBg, this.hpBarFill);
  }

  public update(dt: number, playerPosition: THREE.Vector3, cameraPosition: THREE.Vector3): void {
    if (!this.entity.isAlive) {
      this.group.visible = false;
      return;
    }

    // Billboarding health bar toward camera
    this.hpBarBg.lookAt(cameraPosition);
    this.hpBarFill.lookAt(cameraPosition);

    // Update HP bar fill ratio
    const hpRatio = Math.max(0, this.entity.currentHealth / this.entity.maxHealth);
    this.hpBarFill.scale.x = hpRatio;

    // Handle stun
    if (this.isStunned) {
      this.stunTimeRemaining -= dt;
      this.bodyMesh.rotation.z = Math.sin(Date.now() * 0.02) * 0.2;
      if (this.stunTimeRemaining <= 0) {
        this.isStunned = false;
        this.bodyMesh.rotation.z = 0;
      }
      return;
    }

    // AI navigation toward player
    const dist = this.group.position.distanceTo(playerPosition);
    if (dist < this.entity.aggroRadius && dist > 1.4) {
      const dir = new THREE.Vector3().subVectors(playerPosition, this.group.position).normalize();
      dir.y = 0;
      const speed = this.entity.isEnraged ? 2.8 : 1.6;
      this.group.position.addScaledVector(dir, speed * dt);
      this.group.lookAt(playerPosition.x, this.group.position.y, playerPosition.z);

      // Walking bounce
      this.bodyMesh.position.y = (this.entity.type === EnemyType.CavaleiroSombrio ? 0.8 : 0.55) + Math.sin(Date.now() * 0.01) * 0.06;
    }

    // Weapon idle swing
    this.weaponMesh.rotation.x = Math.PI / 4 + Math.sin(Date.now() * 0.005) * 0.2;

    this.entity.updateFrame(dt);
  }

  public triggerStumble(): void {
    this.isStunned = true;
    this.stunTimeRemaining = 1.2;
  }
}
