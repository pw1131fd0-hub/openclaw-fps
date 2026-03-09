import * as CANNON from 'cannon-es';

const world = new CANNON.World();
world.gravity.set(0, -20, 0);

const playerMaterial = new CANNON.Material('playerMaterial');
const shape = new CANNON.Cylinder(0.5, 0.5, 1.8, 8);
const body = new CANNON.Body({
    mass: 80,
    position: new CANNON.Vec3(0, 5, 0),
    fixedRotation: true,
    material: playerMaterial,
});
const quaternion = new CANNON.Quaternion();
quaternion.setFromEuler(-Math.PI / 2, 0, 0);
body.addShape(shape, new CANNON.Vec3(0, 0, 0), quaternion);
world.addBody(body);

const groundMaterial = new CANNON.Material('groundMaterial');
const groundShape = new CANNON.Plane();
const groundBody = new CANNON.Body({ mass: 0, material: groundMaterial });
groundBody.addShape(groundShape);
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

// Contact material
const contactMaterial = new CANNON.ContactMaterial(groundMaterial, playerMaterial, {
    friction: 0.0,
    restitution: 0.0,
});
world.addContactMaterial(contactMaterial);

for(let i=0; i<60; i++) world.step(1/60, 1/60, 3);

const speed = 8;
const targetVelocityX = speed;
for(let i=0; i<5; i++) {
    const delta = 1/60;
    const lerpFactor = 15.0;
    const t = 1 - Math.exp(-lerpFactor * delta);
    body.velocity.x = body.velocity.x + (targetVelocityX - body.velocity.x) * t;
    console.log(`Frame ${i} before step: v.x = ${body.velocity.x}`);
    world.step(delta, delta, 3);
    console.log(`Frame ${i} after step:  v.x = ${body.velocity.x}`);
}
