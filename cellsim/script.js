let c = document.getElementById("myCanvas");
let ctx = c.getContext("2d");

let CANVASWIDTH = c.width;
let CANVASHEIGHT = c.height;

let grid = {}
let maskingLength = 20;

let doUpdate = true;
let forceType = "collision";

let damping = .95;

// listend for keyboard input
document.addEventListener("keydown", function (e) {
    doUpdate = !doUpdate;
    update();
});

function map(x, a, b, c, d) {
    return (x - a) * (d - c) / (b - a) + c;
}

class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        this.x += v.x;
        this.y += v.y;
    }

    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
    }

    mult(s) {
        this.x *= s;
        this.y *= s;
    }

    div(s) {
        this.x /= s;
        this.y /= s;
    }

    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        let m = this.mag();
        if (m != 0) {
            this.div(m);
        }
    }
}

class RadialField {

    constructor(obj, radius, falloff, force, type) {
        this.obj = obj;
        this.radius = radius;
        this.falloff = falloff;
        this.force = force;
        this.type = type;
    }

    calculateForceFromPoint(x, y, returnVector = false) {
        let dx = x - this.obj.x;
        let dy = y - this.obj.y;
        let dist = dx * dx + dy * dy;
        let force = 0;
        
        if (dist < this.radius * this.radius) {
            if (this.falloff == 0){
                force = this.force;
            } else {
                let fall = map(dist, 0, this.radius * this.radius, 0, this.falloff);
                force = this.force * fall;
            }
        }

        if (this.type == "gravity") {
            force *= -1;
        }

        if (returnVector) {
            let v = new Vector(dx, dy);
            v.normalize();
            v.mult(force);
            return v;
        }

        return force;
    }     

    draw() {
        ctx.beginPath();
        ctx.arc(this.obj.x, this.obj.y, this.radius, 0, 2 * Math.PI);
        ctx.strokeStyle = "black";
        ctx.stroke();
        ctx.closePath();
    }
}



class Object {

    constructor(x, y, radius, color, mass = 1) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.mass = mass;
        this.acc = new Vector(0, 0);
        this.vel = new Vector(0, 0);

        
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    update() {


        let v = F.calculateForceFromPoint(this.x, this.y, true);
        v.add(G.calculateForceFromPoint(this.x, this.y, true));
        v.add(R.calculateForceFromPoint(this.x, this.y, true));

        this.acc = new Vector(0, 0);
        this.acc = v;

        this.acc.div(this.mass);
        this.vel.add(this.acc);

        this.vel.x *= damping;
        this.vel.y *= damping;

        if (Math.abs(this.vel.x) < .1){
            this.vel.x = 0;
        }

        if (Math.abs(this.vel.y) < .1){
            this.vel.y = 0;
        }

        this.x += this.vel.x;
        this.y += this.vel.y;
        

        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.vel.x *= -1;
        } else if (this.x + this.radius > CANVASWIDTH) {
            this.x = CANVASWIDTH - this.radius;
            this.vel.x *= -1;
        }

        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.vel.y *= -1;
        } else if (this.y + this.radius > CANVASHEIGHT) {
            this.y = CANVASHEIGHT - this.radius;
            this.vel.y *= -1;
        }   
    }
}




let OBJS = [];
let numObjects = 750;

// let F = new RadialField(new Object(CANVASWIDTH / 2, CANVASHEIGHT / 2, 50, "blue"), 200, 3, 2, "collision");
// let G = new RadialField(new Object(CANVASWIDTH / 2, CANVASHEIGHT / 2, 50, "orange"), 250, 1.5, .5, "gravity");
// let R = new RadialField(new Object(CANVASWIDTH / 2, CANVASHEIGHT / 2, 50, "red"), 50, 3, 1, "gravity");

let F = new RadialField(new Object(CANVASWIDTH / 2, CANVASHEIGHT / 2, 50, "blue"), 200, 1, .9, "collision");
let G = new RadialField(new Object(CANVASWIDTH / 2, CANVASHEIGHT / 2, 50, "orange"), 250, 1.2, .5, "gravity");
let R = new RadialField(new Object(CANVASWIDTH / 2, CANVASHEIGHT / 2, 50, "red"), 50, 3, 1, "gravity");


function setup() {
    for (let i = 0; i < numObjects; i++) {
        let x = Math.random() * CANVASWIDTH;
        let y = Math.random() * CANVASHEIGHT;
        let r = Math.random() * 10 + 5;
        let c = "rgb(" + Math.random() * 255 + "," + Math.random() * 255 + "," + Math.random() * 255 + ")";
        let O = new Object(x, y, r, c);

        

        OBJS.push(O);
    }
}

// add mouse event listeners
c.addEventListener("mousemove", function (e) {
    F.obj.x = e.clientX;
    F.obj.y = e.clientY;

    G.obj.x = e.clientX;
    G.obj.y = e.clientY;

    R.obj.x = e.clientX;
    R.obj.y = e.clientY;
});

function update() {

    ctx.clearRect(0, 0, CANVASWIDTH, CANVASHEIGHT);

    F.draw();
    G.draw();
    R.draw();

    for (let i = 0; i < OBJS.length; i++) {
        OBJS[i].update();
        OBJS[i].update();
        OBJS[i].draw();

        // OBJS[i].vel.x += (Math.random() * 2 - 1) * .5;
        // OBJS[i].vel.y += (Math.random() * 2 - 1) * .5;
    }

    if(doUpdate) {
        requestAnimationFrame(update);
    }

}

setup();
update();









/*
 * 
 *  3 Pass Collision System 
 * 
 *  *   Radial Field: The area around an object (circular) 
 *      which will influence other objects around it
 * 
 *  1)  Generate all Radial Fields for all Objects in the canvas
 *      and post them to a generator function
 *          -   objects will each have a radial field which will contain 
 *              the following variables:
 *                  >   Radial radius: how large the radial field is 
 *                      relitive to the object
 *                  >   Radial falloff: how fast the folloff should be 
 *                      map(falloff, 0, 1, 0, radius). As falloff increases
 *                      from 0 - 1, the radial force becomes weaker the further
 *                      from the center
 *                  >   Radial force: the uni-directional force exerted from
 *                      the center of the object outward. If falloff is 0, 
 *                      the force will be constant throughout
 *                  >   x: x coordinate
 *                  >   y: y coordinate
 * 
 * 
 *                  &   ---------------------------------------------------------   &
 *                  &   In order to turn this from collions to gravity              &
 *                  &   simply reverse the vectors from the radial field            &
 *                  &   as the collisoin has them facing away from the center       &
 *                  &   and gravity would have them facing torward the center       &
 *                  &   ---------------------------------------------------------   &
 * 
 * 
 *  2)  Once radial fields are posted to a generator function, we can render each
 *      radial field onto the canvas' force field
 * 
 *      determine sample size for each square on the canvas' force field grid
 *      the smaller the sample size is, the more computations needed as it will
 *      a higher accuarcy
 * 
 *      for each radial field:
 * 
 *          -   determine all of the squares which are inside the radial radius
 *          -   compute each inner squares' force relative to the radial force and
 *              radial falloff
 *          -   overlay the modified squares onto the grid
 * 
 * 
 *  3)  For every object, get the grid square it is in, if that grid sqaure's 
 *      force field square has a value != 0, apply that value to the ax, ay of
 *      the object
 * 
 * 
 */