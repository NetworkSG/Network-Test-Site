/* ═══════════════════════════════════════════════════════
   Three.js Disposal Utilities
   Ensures complete cleanup of GPU resources
   ═══════════════════════════════════════════════════════ */
import * as THREE from "three";
import type { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";

/**
 * Recursively dispose all geometry, materials, and textures in an Object3D tree.
 */
export function disposeObject3D(obj: THREE.Object3D): void {
  obj.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    if (mesh.material) {
      disposeMaterial(mesh.material);
    }
  });
}

/**
 * Dispose a material or array of materials, including their textures.
 */
export function disposeMaterial(material: THREE.Material | THREE.Material[]): void {
  const materials = Array.isArray(material) ? material : [material];
  for (const mat of materials) {
    // Dispose all texture properties
    const m = mat as THREE.MeshStandardMaterial;
    if (m.map) m.map.dispose();
    if (m.normalMap) m.normalMap.dispose();
    if (m.roughnessMap) m.roughnessMap.dispose();
    if (m.metalnessMap) m.metalnessMap.dispose();
    if (m.aoMap) m.aoMap.dispose();
    if (m.emissiveMap) m.emissiveMap.dispose();
    if (m.envMap) m.envMap.dispose();
    if (m.alphaMap) m.alphaMap.dispose();
    if (m.bumpMap) m.bumpMap.dispose();
    if (m.displacementMap) m.displacementMap.dispose();
    if (m.lightMap) m.lightMap.dispose();
    mat.dispose();
  }
}

/**
 * Remove and dispose a CSS2DObject (label), including its DOM element.
 */
export function disposeCSS2DLabel(label: CSS2DObject): void {
  if (label.element && label.element.parentNode) {
    label.element.parentNode.removeChild(label.element);
  }
  label.removeFromParent();
}

/**
 * Clear a texture cache map, disposing all textures.
 */
export function clearTextureCache(cache: Map<string, THREE.Texture>): void {
  cache.forEach((tex) => tex.dispose());
  cache.clear();
}

/**
 * Full scene cleanup — traverse and dispose everything, then clear maps.
 */
export function disposeScene(scene: THREE.Scene): void {
  scene.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) disposeMaterial(mesh.material);
  });
  scene.clear();
}
