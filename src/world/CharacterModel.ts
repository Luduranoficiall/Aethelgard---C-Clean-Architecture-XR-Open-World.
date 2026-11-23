import * as THREE from 'three';

export class CharacterModel {
  public group: THREE.Group = new THREE.Group();
  public swordGroup: THREE.Group = new THREE.Group();
  public shieldGroup: THREE.Group = new THREE.Group();
  public capeMesh!: THREE.Mesh;
  public slashTrailMesh!: THREE.Mesh;
  public spellBurstMesh!: THREE.Mesh;

  private leftLeg!: THREE.Mesh;
  private rightLeg!: THREE.Mesh;
  private rightArm!: THREE.Group;
  private leftArm!: THREE.Group;
  private headMesh!: THREE.Mesh;

  private walkCycle: number = 0;
  private slashAnimationTime: number = 0;
  private isSlashing: boolean = false;
  private spellAnimationTime: number = 0;

  constructor() {
    this.buildCharacter();
    this.buildSword();
    this.buildShield();
    this.buildEffects();
  }

  private buildCharacter(): void {
    const armorMat = new THREE.MeshStandardMaterial({ color: 0x2e4057, roughness: 0.35, metalness: 0.6 });
    const goldTrimMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3, metalness: 0.8 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5c6a5, roughness: 0.8 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.9 });
    const capeMat = new THREE.MeshStandardMaterial({ color: 0xa92323, side: THREE.DoubleSide, roughness: 0.6 });

    // Torso (Cuirass)
    const torsoGeo = new THREE.BoxGeometry(0.48, 0.6, 0.28);
    const torso = new THREE.Mesh(torsoGeo, armorMat);
    torso.position.y = 1.05;

    // Gold emblem on breastplate
    const emblemGeo = new THREE.BoxGeometry(0.2, 0.2, 0.05);
    const emblem = new THREE.Mesh(emblemGeo, goldTrimMat);
    emblem.position.set(0, 1.1, 0.14);
    this.group.add(torso, emblem);

    // Head
    const headGeo = new THREE.BoxGeometry(0.26, 0.28, 0.26);
    this.headMesh = new THREE.Mesh(headGeo, skinMat);
    this.headMesh.position.set(0, 1.55, 0);

    // Anime spiky hair
    const hairGeo = new THREE.ConeGeometry(0.22, 0.22, 5);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 1.72, -0.04);
    hair.rotation.x = -0.2;
    this.group.add(this.headMesh, hair);

    // Flowing Cape
    const capeGeo = new THREE.PlaneGeometry(0.5, 0.85, 4, 6);
    this.capeMesh = new THREE.Mesh(capeGeo, capeMat);
    this.capeMesh.position.set(0, 1.05, -0.16);
    this.capeMesh.rotation.x = 0.15;
    this.group.add(this.capeMesh);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.18, 0.65, 0.18);
    this.leftLeg = new THREE.Mesh(legGeo, armorMat);
    this.leftLeg.position.set(-0.14, 0.42, 0);

    this.rightLeg = new THREE.Mesh(legGeo, armorMat);
    this.rightLeg.position.set(0.14, 0.42, 0);
    this.group.add(this.leftLeg, this.rightLeg);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.14, 0.55, 0.14);
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.33, 1.25, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, armorMat);
    leftArmMesh.position.y = -0.25;
    this.leftArm.add(leftArmMesh);

    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.33, 1.25, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, armorMat);
    rightArmMesh.position.y = -0.25;
    this.rightArm.add(rightArmMesh);

    this.group.add(this.leftArm, this.rightArm);
  }

  private buildSword(): void {
    const steelMat = new THREE.MeshStandardMaterial({ color: 0xd8e3f0, metalness: 0.9, roughness: 0.15 });
    const hiltMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.3 });
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x3d2719, roughness: 0.8 });

    // Blade
    const bladeGeo = new THREE.BoxGeometry(0.08, 0.95, 0.02);
    const blade = new THREE.Mesh(bladeGeo, steelMat);
    blade.position.y = 0.5;

    // Crossguard
    const guardGeo = new THREE.BoxGeometry(0.28, 0.05, 0.06);
    const guard = new THREE.Mesh(guardGeo, hiltMat);
    guard.position.y = 0.05;

    // Grip
    const gripGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.2);
    const grip = new THREE.Mesh(gripGeo, gripMat);
    grip.position.y = -0.07;

    // Pommel
    const pommelGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const pommel = new THREE.Mesh(pommelGeo, hiltMat);
    pommel.position.y = -0.18;

    this.swordGroup.add(blade, guard, grip, pommel);
    this.swordGroup.position.set(0, -0.45, 0.1);
    this.swordGroup.rotation.x = Math.PI / 4;
    this.rightArm.add(this.swordGroup);
  }

  private buildShield(): void {
    const shieldMat = new THREE.MeshStandardMaterial({ color: 0x223652, metalness: 0.5, roughness: 0.4 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.2 });

    const shieldGeo = new THREE.CylinderGeometry(0.24, 0.2, 0.04, 12);
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.rotation.x = Math.PI / 2;

    const bossGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const boss = new THREE.Mesh(bossGeo, trimMat);
    boss.position.z = 0.03;

    this.shieldGroup.add(shield, boss);
    this.shieldGroup.position.set(0, -0.3, 0.15);
    this.leftArm.add(this.shieldGroup);
  }

  private buildEffects(): void {
    // Sword slash arc trail
    const arcGeo = new THREE.RingGeometry(0.6, 0.95, 24, 1, 0, Math.PI * 0.75);
    const arcMat = new THREE.MeshBasicMaterial({
      color: 0x66ccff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    this.slashTrailMesh = new THREE.Mesh(arcGeo, arcMat);
    this.slashTrailMesh.rotation.x = Math.PI / 2;
    this.slashTrailMesh.position.set(0, 1.1, 0.4);
    this.group.add(this.slashTrailMesh);

    // Arcane burst shockwave ring
    const burstGeo = new THREE.RingGeometry(0.2, 0.4, 32);
    const burstMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    this.spellBurstMesh = new THREE.Mesh(burstGeo, burstMat);
    this.spellBurstMesh.rotation.x = -Math.PI / 2;
    this.spellBurstMesh.position.y = 0.08;
    this.group.add(this.spellBurstMesh);
  }

  public triggerSwordSlash(comboStep: number): void {
    this.isSlashing = true;
    this.slashAnimationTime = 0;
    (this.slashTrailMesh.material as THREE.MeshBasicMaterial).opacity = 0.85;

    // Tint trail based on combo (Step 3: fiery yellow)
    if (comboStep === 3) {
      (this.slashTrailMesh.material as THREE.MeshBasicMaterial).color.setHex(0xffaa22);
    } else {
      (this.slashTrailMesh.material as THREE.MeshBasicMaterial).color.setHex(0x66ccff);
    }
  }

  public triggerArcaneBurst(): void {
    this.spellAnimationTime = 0.01;
    this.spellBurstMesh.scale.set(1, 1, 1);
    (this.spellBurstMesh.material as THREE.MeshBasicMaterial).opacity = 0.9;
  }

  public updateAnimation(dt: number, isMoving: boolean): void {
    // Walking stride animation
    if (isMoving) {
      this.walkCycle += dt * 9;
      this.leftLeg.rotation.x = Math.sin(this.walkCycle) * 0.55;
      this.rightLeg.rotation.x = -Math.sin(this.walkCycle) * 0.55;
      this.leftArm.rotation.x = -Math.sin(this.walkCycle) * 0.4;
      this.capeMesh.rotation.x = 0.35 + Math.sin(this.walkCycle * 2) * 0.15;
    } else {
      this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, 0, dt * 8);
      this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, 0, dt * 8);
      this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, 0, dt * 8);
      this.capeMesh.rotation.x = 0.15 + Math.sin(Date.now() * 0.002) * 0.05;
    }

    // Slashing keyframe interpolation
    if (this.isSlashing) {
      this.slashAnimationTime += dt * 4.5;
      const progress = this.slashAnimationTime;

      if (progress < 0.4) {
        // Windup
        this.rightArm.rotation.x = -Math.PI / 2 - progress * 2;
        this.rightArm.rotation.z = -0.4;
      } else if (progress < 1.0) {
        // Slash through
        const slashProgress = (progress - 0.4) / 0.6;
        this.rightArm.rotation.x = Math.PI / 3 * slashProgress;
        this.rightArm.rotation.y = -Math.PI / 2 * slashProgress;
        this.slashTrailMesh.rotation.z = -slashProgress * Math.PI;
      } else {
        // Recovery
        this.isSlashing = false;
        this.rightArm.rotation.set(0, 0, 0);
        (this.slashTrailMesh.material as THREE.MeshBasicMaterial).opacity = 0;
      }
    }

    // Arcane burst shockwave expansion
    if (this.spellAnimationTime > 0) {
      this.spellAnimationTime += dt * 2.5;
      const scale = 1 + this.spellAnimationTime * 6;
      this.spellBurstMesh.scale.set(scale, scale, 1);
      const opacity = Math.max(0, 1 - this.spellAnimationTime);
      (this.spellBurstMesh.material as THREE.MeshBasicMaterial).opacity = opacity;

      if (opacity <= 0) {
        this.spellAnimationTime = 0;
      }
    }
  }
}
