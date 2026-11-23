// Static Geometry Merger & Matrix Freezer for Reducing WebGL Draw Calls & CPU Scene-Graph Overhead
import * as THREE from 'three';
import { OUTLINE_LAYER } from './materials.js';

function toDynamicSet(dynamicNodes?: Iterable<THREE.Object3D | null | undefined>): Set<THREE.Object3D> {
    const set = new Set<THREE.Object3D>();
    if (!dynamicNodes) return set;
    for (const n of dynamicNodes) {
        if (n) set.add(n);
    }
    return set;
}

/**
 * Updates world matrices once and disables matrixAutoUpdate on all static nodes
 * (leaving dynamicNodes and all their descendants untouched).
 */
export function freezeStaticHierarchy(
    root: THREE.Object3D,
    dynamicNodes?: Iterable<THREE.Object3D | null | undefined>
) {
    if (!root) return;
    const dynamicSet = toDynamicSet(dynamicNodes);
    root.updateMatrixWorld(true);

    function walk(node: THREE.Object3D, inDynamic: boolean) {
        const isDyn = inDynamic || dynamicSet.has(node);
        if (!isDyn) {
            node.matrixAutoUpdate = false;
        }
        const children = node.children;
        for (let i = 0; i < children.length; i++) {
            walk(children[i], isDyn);
        }
    }
    walk(root, false);
}

function concatNonIndexedGeometries(
    geos: THREE.BufferGeometry[],
    includeNormal: boolean,
    includeUv: boolean
): THREE.BufferGeometry | null {
    let totalVerts = 0;
    for (let i = 0; i < geos.length; i++) {
        const pos = geos[i].getAttribute('position');
        if (!pos) return null;
        totalVerts += pos.count;
    }
    if (totalVerts === 0) return null;

    const positions = new Float32Array(totalVerts * 3);
    const normals = includeNormal ? new Float32Array(totalVerts * 3) : null;
    const uvs = includeUv ? new Float32Array(totalVerts * 2) : null;

    let offset = 0;
    for (let i = 0; i < geos.length; i++) {
        const g = geos[i];
        const pos = g.getAttribute('position');
        const count = pos.count;

        for (let v = 0; v < count; v++) {
            const idx3 = (offset + v) * 3;
            positions[idx3] = pos.getX(v);
            positions[idx3 + 1] = pos.getY(v);
            positions[idx3 + 2] = pos.getZ(v);
        }

        if (normals) {
            const norm = g.getAttribute('normal');
            for (let v = 0; v < count; v++) {
                const idx3 = (offset + v) * 3;
                normals[idx3] = norm.getX(v);
                normals[idx3 + 1] = norm.getY(v);
                normals[idx3 + 2] = norm.getZ(v);
            }
        }

        if (uvs) {
            const uv = g.getAttribute('uv');
            for (let v = 0; v < count; v++) {
                const idx2 = (offset + v) * 2;
                uvs[idx2] = uv.getX(v);
                uvs[idx2 + 1] = uv.getY(v);
            }
        }

        offset += count;
    }

    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    if (normals) merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    if (uvs) merged.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    merged.computeBoundingSphere();
    return merged;
}

/**
 * Merges static meshes, static cartoon ink outlines, and static crease LineSegments
 * inside `root` by shared material & render flags, dramatically reducing WebGL draw calls
 * while leaving all `dynamicNodes` (and their children) completely intact and animatable.
 */
export function mergeStaticMeshesInGroup(
    root: THREE.Object3D,
    dynamicNodes?: Iterable<THREE.Object3D | null | undefined>
) {
    if (!root) return;
    const dynamicSet = toDynamicSet(dynamicNodes);
    root.updateMatrixWorld(true);

    const invRoot = root.matrixWorld.clone().invert();
    const relMat = new THREE.Matrix4();

    type BucketEntry = {
        obj: THREE.Mesh | THREE.LineSegments;
        mat: THREE.Material;
        isOutline: boolean;
        isLine: boolean;
        castShadow: boolean;
        receiveShadow: boolean;
        renderOrder: number;
        frustumCulled: boolean;
        layer: number;
    };

    const buckets = new Map<THREE.Material, Map<string, BucketEntry[]>>();

    function addEntry(entry: BucketEntry) {
        let byFlags = buckets.get(entry.mat);
        if (!byFlags) {
            byFlags = new Map();
            buckets.set(entry.mat, byFlags);
        }
        const key = `${entry.isLine ? 'L' : 'M'}|${entry.isOutline ? 'O' : 'S'}|${entry.castShadow ? 1 : 0}|${entry.receiveShadow ? 1 : 0}|${entry.renderOrder}|${entry.frustumCulled ? 1 : 0}|${entry.layer}`;
        let list = byFlags.get(key);
        if (!list) {
            list = [];
            byFlags.set(key, list);
        }
        list.push(entry);
    }

    function collect(node: THREE.Object3D) {
        if (dynamicSet.has(node)) return;
        if ((node as THREE.InstancedMesh).isInstancedMesh) return;

        const meshOrLine = node as THREE.Mesh | THREE.LineSegments;
        const isMesh = Boolean((node as THREE.Mesh).isMesh);
        const isLineSegs = Boolean((node as THREE.LineSegments).isLineSegments);
        if ((isMesh || isLineSegs) && meshOrLine.geometry && meshOrLine.material && !Array.isArray(meshOrLine.material)) {
            if (meshOrLine.geometry.getAttribute('position')) {
                relMat.multiplyMatrices(invRoot, node.matrixWorld);
                // Skip negative-determinant mirrored meshes to preserve triangle winding
                if (relMat.determinant() > 0) {
                    const isOutline = Boolean(node.userData && node.userData.isOutline);
                    const isLine = isLineSegs;
                    const layer = (isOutline || isLine) ? OUTLINE_LAYER : 0;
                    addEntry({
                        obj: meshOrLine,
                        mat: meshOrLine.material,
                        isOutline,
                        isLine,
                        castShadow: Boolean(node.castShadow),
                        receiveShadow: Boolean(node.receiveShadow),
                        renderOrder: node.renderOrder || 0,
                        frustumCulled: node.frustumCulled !== false,
                        layer
                    });
                }
            }
        }

        const children = node.children;
        for (let i = 0; i < children.length; i++) {
            collect(children[i]);
        }
    }
    collect(root);

    const toRemove: THREE.Object3D[] = [];

    buckets.forEach(byFlags => {
        byFlags.forEach(list => {
            if (list.length < 2) return;

            const sample = list[0];
            const prepared: THREE.BufferGeometry[] = [];
            let allHaveNormal = !sample.isLine;
            let allHaveUv = !sample.isLine && !sample.isOutline;

            for (let i = 0; i < list.length; i++) {
                const item = list[i].obj;
                const srcGeo = item.geometry;
                const nonIdx = srcGeo.index ? srcGeo.toNonIndexed() : srcGeo.clone();
                relMat.multiplyMatrices(invRoot, item.matrixWorld);
                nonIdx.applyMatrix4(relMat);
                if (!nonIdx.getAttribute('normal')) allHaveNormal = false;
                if (!nonIdx.getAttribute('uv')) allHaveUv = false;
                prepared.push(nonIdx);
            }

            const mergedGeo = concatNonIndexedGeometries(prepared, allHaveNormal, allHaveUv);
            for (let i = 0; i < prepared.length; i++) {
                prepared[i].dispose();
            }
            if (!mergedGeo) return;

            let mergedObj: THREE.Object3D;
            if (sample.isLine) {
                mergedObj = new THREE.LineSegments(mergedGeo, sample.mat);
            } else {
                const m = new THREE.Mesh(mergedGeo, sample.mat);
                m.castShadow = sample.castShadow;
                m.receiveShadow = sample.receiveShadow;
                mergedObj = m;
            }
            mergedObj.renderOrder = sample.renderOrder;
            mergedObj.frustumCulled = sample.frustumCulled;
            if (sample.isOutline) {
                mergedObj.userData.isOutline = true;
            }
            if (sample.layer !== 0) {
                mergedObj.layers.set(sample.layer);
            }

            root.add(mergedObj);
            for (let i = 0; i < list.length; i++) {
                toRemove.push(list[i].obj);
            }
        });
    });

    for (let i = 0; i < toRemove.length; i++) {
        const obj = toRemove[i];
        if (obj.parent) obj.parent.remove(obj);
    }

    freezeStaticHierarchy(root, dynamicSet);
}
