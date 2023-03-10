let c = document.getElementById("myCanvas");
let ctx = c.getContext("2d");

let CANVASWIDTH = c.width;
let CANVASHEIGHT = c.height;

let GRID = {};
let maskingLength = 20;

let doUpdate = true;
let forceType = "collision";

let damping = .95;

let maxVel = 10;
let maxAcc = 1;


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
    
    intersects(obj) {
        let dx = (obj.x) - (this.obj.x);
        let dy = (obj.y) - (this.obj.y);
        
        let dist = Math.sqrt((dx * dx) + (dy * dy));

        if(dist < this.radius + obj.radius){
            return {"dist": dist, "dx": dx, "dy": dy};
        }

        return false;
    }

    pointInside(x, y){
        let dx = x - this.obj.x;
        let dy = y - this.obj.y;
        let dist = Math.sqrt((dx * dx) + (dy * dy));
        if (dist < this.radius) {
            return true;
        }
        return false;
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

        this.field = new RadialField(this, this.radius, 1, 1, "collision");
    }

    findClosestPoints(parseSize){
        let p_NW_x = this.x - this.radius;
        let p_NW_y = this.y - this.radius;

        let p_NE_x = this.x + this.radius;
        let p_NE_y = this.y - this.radius;

        let p_SW_x = this.x - this.radius;
        let p_SW_y = this.y + this.radius;

        let p_SE_x = this.x + this.radius;
        let p_SE_y = this.y + this.radius;

        // floor all
        p_NW_x = p_NW_x - (p_NW_x % parseSize);
        p_NW_y = p_NW_y - (p_NW_y % parseSize);
        p_NE_x = p_NE_x - (p_NE_x % parseSize);
        p_NE_y = p_NE_y - (p_NE_y % parseSize);
        p_SW_x = p_SW_x - (p_SW_x % parseSize);
        p_SW_y = p_SW_y - (p_SW_y % parseSize);
        p_SE_x = p_SE_x - (p_SE_x % parseSize);
        p_SE_y = p_SE_y - (p_SE_y % parseSize);
        

        // ctx.beginPath();
        // ctx.arc(p_NW_x, p_NW_y, 5, 0, 2 * Math.PI);
        // ctx.fillStyle = "green";
        // ctx.fill();
        // ctx.closePath();

        // ctx.beginPath();
        // ctx.arc(p_NE_x, p_NE_y, 5, 0, 2 * Math.PI);
        // ctx.fillStyle = "red";
        // ctx.fill();

        // ctx.beginPath();
        // ctx.arc(p_SW_x, p_SW_y, 5, 0, 2 * Math.PI);
        // ctx.fillStyle = "blue";
        // ctx.fill();

        // ctx.beginPath();
        // ctx.arc(p_SE_x, p_SE_y, 5, 0, 2 * Math.PI);
        // ctx.fillStyle = "oragne";
        // ctx.fill();

    
        return {
            "NW": {"x": p_NW_x, "y": p_NW_y},
            "NE": {"x": p_NE_x, "y": p_NE_y},
            "SW": {"x": p_SW_x, "y": p_SW_y},
            "SE": {"x": p_SE_x, "y": p_SE_y}
        }


    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.strokeStyle = this.color;
        ctx.stroke();
        ctx.closePath();
    }

    basicCollision() {
        let v = new Vector(0, 0);
        for (let i = 0; i < OBJS.length; i++) {
            if (OBJS[i] != this) {
                let I = this.field.intersects(OBJS[i]);
                
                if(I != false){

                    let dir = 1
                    if(this.field.type == "collision"){
                        dir = -1;
                    }

                    let dx = dir * map(I.dx, 0, this.radius, 0, this.field.force);
                    let dy = dir * map(I.dy, 0, this.radius, 0, this.field.force);
                    let dist = I.dist;

            
                    let force = map(dist, 0, this.radius, 0, 1);
                    
                    console.log(dx, dy, force);
                    v.x += dx * force;
                    v.y += dy * force;
                }
                
            }
        }   
        return v;
    }



    update() {

        let v = new Vector(0, 0);

        // v = this.basicCollision();


        this.acc = new Vector(0, 0);
        this.acc = v;

        this.acc.div(this.mass);

        this.acc.x = Math.min(this.acc.x, maxAcc);
        this.acc.y = Math.min(this.acc.y, maxAcc);


        this.vel.add(this.acc);

        this.vel.x *= damping;
        this.vel.y *= damping;

        if (Math.abs(this.vel.x) < .01){
            this.vel.x = 0;
        }

        if (Math.abs(this.vel.y) < .01){
            this.vel.y = 0;
        }

        this.vel.x = Math.min(this.vel.x, maxVel);
        this.vel.y = Math.min(this.vel.y, maxVel);
        

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

function generateRadialFieldGrid(objects, parseSize) {

    let grid = {};

    for (let i = 0; i < objects.length; i++) {

        let RF = objects[i].field;

        let boundingBox = {
            "x": RF.obj.x - RF.radius,
            "y": RF.obj.y - RF.radius,
            "width": RF.radius * 2,
            "height": RF.radius * 2
        }

        startX = boundingBox.x - (boundingBox.x % parseSize);
        startY = boundingBox.y - (boundingBox.y % parseSize);

        endX = boundingBox.x + boundingBox.width;
        endY = boundingBox.y + boundingBox.height;

        for (let x = startX; x < endX; x += parseSize) {
            for (let y = startY; y < endY; y += parseSize) {

                let point = [x, y];

                let dist = Math.sqrt(Math.pow(RF.obj.x - x, 2) + Math.pow(RF.obj.y - y, 2));

                if (dist <= RF.radius) {
                    if (grid[point] == undefined) {
                        grid[point] = [];
                    }
                    grid[point].push(RF);
                }
            }
        }
    }

    return grid;
}


function assignForces(OBJS, GRID, parseSize){


    for (let i = 0; i < OBJS.length; i++) {
        let O = OBJS[i];
        
        c = O.findClosestPoints(parseSize)
        
        NE = [c.NE.x, c.NE.y];
        NW = [c.NW.x, c.NW.y];
        SE = [c.SE.x, c.SE.y];
        SW = [c.SW.x, c.SW.y];

        let v = new Vector(0, 0);

        console.log(NE, NW, SE, SW);

        console.log(GRID[NE]);
        console.log(GRID[NW]);
        console.log(GRID[SE]);
        console.log(GRID[SW]);
   
    }
}


let OBJS = [];
let numObjects = 3;

function setup() {
    for (let i = 0; i < numObjects; i++) {
        let x = Math.random() * CANVASWIDTH;
        let y = Math.random() * CANVASHEIGHT;
        let r = Math.random() * 200 + 5;
        let c = "rgb(" + Math.random() * 255 + "," + Math.random() * 255 + "," + Math.random() * 255 + ")";
        let O = new Object(x, y, r, c);
        OBJS.push(O);
    }

    update();
    GRID = generateRadialFieldGrid(OBJS, maskingLength);
    update();
    assignForces(OBJS, GRID, maskingLength);
    update();

    
}

// add mouse event listeners
c.addEventListener("mousemove", function (e) {
    let x = e.clientX;
    let y = e.clientY;
});

function update() {

    // ctx.clearRect(0, 0, CANVASWIDTH, CANVASHEIGHT);

    


    for (let i = 0; i < OBJS.length; i++) {
        OBJS[i].update();
        OBJS[i].draw();
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