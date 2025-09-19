import * as THREE from 'three';
import { BEAR_X_LIMIT, updateBear } from '../entities/bear.js';
import { getOrbitControls, initOrbitControls } from '../scene.js';
import { toggleDevTools, resetDevTools } from './dev.js';
import { bear, gameState } from './game.js';

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let keysPressed = {};
let isDragging = false;
// Use a fixed plane at the log depth so dragging continues off the log
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -1);
const _dragPoint = new THREE.Vector3();

function onPointerDown(event) {
    if (gameState.current !== 'PLAYING' || event.target.tagName === 'BUTTON') return;
    isDragging = true;
    bear.userData.isMovingWithKeys = false;
    onPointerMove(event);
}

function onPointerMove(event) {
    if (!isDragging || gameState.current !== 'PLAYING' || !bear) return;

    updatePointer(event);
    raycaster.setFromCamera(pointer, window.camera);
    if (raycaster.ray.intersectPlane(dragPlane, _dragPoint)) {
        bear.userData.targetX = THREE.MathUtils.clamp(_dragPoint.x, -BEAR_X_LIMIT, BEAR_X_LIMIT);
        bear.userData.isMovingWithKeys = false;
    }
}

function onPointerUp() {
    isDragging = false;
}

function updatePointer(event) {
    const eventCoord = event.changedTouches ? event.changedTouches[0] : event;
    pointer.x = (eventCoord.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(eventCoord.clientY / window.innerHeight) * 2 + 1;
}

function handleKeyDown(event) {
    if (gameState.current !== 'PLAYING' || !bear) return;
    keysPressed[event.key] = true;
    if (event.key === 'a' || event.key === 'ArrowLeft' || event.key === 'd' || event.key === 'ArrowRight') {
        bear.userData.isMovingWithKeys = true;
    }
    updateBearMovement();
}

function handleKeyUp(event) {
    keysPressed[event.key] = false;
    updateBearMovement();
}

function updateBearMovement() {
    if (!bear || gameState.current !== 'PLAYING' || !bear.userData.isMovingWithKeys) return;
    let moveDirection = 0;
    if (keysPressed['a'] || keysPressed['ArrowLeft']) moveDirection = -1;
    else if (keysPressed['d'] || keysPressed['ArrowRight']) moveDirection = 1;
    updateBear(bear, moveDirection);
}

function handleGlobalKeyUp(event) {
    if (event.key === '`' || event.key === '~') {
        resetDevTools(getOrbitControls());
    }
}

function handleDevButtonClick() {
    toggleDevTools(initOrbitControls());
}

export function initControls(sceneRef, cameraRef) {
    window.scene = sceneRef; 
    window.camera = cameraRef; 

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('keyup', handleGlobalKeyUp, true);

    const devButton = document.getElementById('dev-console-button');
    if (devButton) devButton.addEventListener('click', handleDevButtonClick);
}