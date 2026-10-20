//App Design Explanation 
//
//This game employs a mouse-controlled cue stick to ensure a straightforward and user-friendly design. Players can aim and shoot seamlessly by moving the cue stick with the mouse pad. Once the cue stick is aligned with the cue ball, clicking propels the ball in the intended direction. This design mirrors the real-world pool experience, allowing players of all skill levels to enjoy the game while enhancing immersion.  
//
//Cue Function Implementation  
//
//The cue stick dynamically moves around with the cue ball in response to the mouse pointer, enabling players to select the perfect angle for their shot. The strength of the shot is determined by the speed slider where the user can slide it to either increase or decrease the speed, giving players precise control over their strokes. Tapping on the mouse pad sends the ball on its intended path based on the speed.  
//
//Game Features Cue Ball Mechanics - If the cue ball is accidentally potted, a sound effect (“oops”) signals a foul. The player is then prompted to place the cue ball in the D zone to continue playing. 
//
//Hole Mechanics - When a red ball enters a hole, it disappears permanently. - If a colored ball enters a hole, it disappears and reappears in its initial position. - If the cue ball enters a hole, the user needs to place it back in the D zone to continue playing.  
//
//Keyboard Shortcuts - Key 1: Resets the cue ball to its original position. - Key 2: Randomizes the positions of the red balls. - Key 3: Randomizes the positions of all balls, creating a fresh gameplay setup.  
//
//Instruction Panel At the start of the game, an instruction panel guides players through the controls and objectives. Clicking the "OK" button closes the panel and displays the game board. 
//
//Console Feedback During gameplay, the console logs every collision involving the cue ball, such as hitting red balls, striped balls, or table edges. This feature helps players analyze their shots and improve their gameplay.  
//
//Unique Extension  
//
//Red Ball Counter A counter on the screen tracks how many red balls have been pocketed, motivating players to achieve their goals and adding a competitive edge.  
//
//Enhanced Cue Ball Mechanics If the cue ball is accidentally potted, a sound effect (“oops”) signals a foul. The player is then prompted to place the cue ball in the D zone to continue playing. This extension balances arcade-style fun with simulation realism, offering an engaging experience for a wide range of players.  
//
//Conclusion By combining a mouse-based cue system, sound effects, instructional guides, and unique mechanics, the game provides a rich and immersive experience. The dynamic gameplay options and intuitive controls make it both innovative and accessible, appealing to players seeking a mix of entertainment and challenge. 

 










// Game settings and configuration
let SURFACE_LENGTH = 800;// Default table length
let SURFACE_WIDTH;// Table width, adjusted dynamically
let SPHERE_SIZE;// Size of each ball
let HOLE_SIZE; // Size of each hole
const EDGE_SIZE = 20;// Width of table edges
let OUTER_BOUNDARY = 1000;// Boundary to keep balls within the table

// Matter.js modules
const Engine = Matter.Engine;
const World = Matter.World;
const Bodies = Matter.Bodies;
const Body = Matter.Body;
const Events = Matter.Events;

// Game state variables
let engine;// Physics engine
let world;// World containing all game objects
let spheres = [];// All game balls
let crimsonSpheres = [];// Red balls
let stripedSpheres = [];// Striped balls
let playerSphere;// Player's cue ball
let stick;// Cue stick
let holes = [];// Holes on the table
let edges = [];// Table edges
let gameType = 1;// Game mode
let previousPotted = null;// Last potted ball
let placementMode = true;// Allow placing the cue ball
let boundaries = [];// Table boundaries
let sequentialStripes = 0;// Number of consecutive striped balls potted
let roundPoints = 0;// Points in the current round
let totalPoints = 0;// Total points accumulated

// Point system for the balls
const POINT_VALUES = {
    crimson: 1,
    golden: 2,
    emerald: 3,
    bronze: 4,
    sapphire: 5,
    rose: 6,
    obsidian: 7
};
// variable to store sound object
let potSound;

// Sphere colors
const SPHERE_PALETTE = {
    crimson: '#D42C2A',
    rose: '#F7A0B7',
    obsidian: '#101010',
    sapphire: '#1B4BCC',
    bronze: '#8B4513',
    emerald: '#0C4F26',
    golden: '#ECC337',
    ivory: '#F9F9F9'
};

// Surface aesthetics
const SURFACE_THEME = {
    felt: '#1B4B4B',    // Darker teal
    border: '#4A3728',  // Darker mahogany
    hole: '#121212',    // Slightly lighter black
    accent: '#C4A484',  // Tan accent
    markings: '#D4D4D4' // Slightly darker markings
};

// Initial sphere positions
const STRIPE_LOCATIONS = {
    rose: { x: 0.73, y: 0.5 },
    obsidian: { x: 0.85, y: 0.5 },
    sapphire: { x: 0.5, y: 0.5 },
    bronze: { x: 0.25, y: 0.5 },
    emerald: { x: 0.25, y: 0.34 },
    golden: { x: 0.25, y: 0.66 }
};

// class representing a game ball
class GameSphere {
    constructor(x, y, color, isStriped = false) {
        this.radius = SPHERE_SIZE / 2;
        this.body = Bodies.circle(x, y, this.radius, {
            restitution: 0.85,
            friction: 0.01,
            frictionAir: 0.01,
            density: 1.2,
            label: color,
            slop: 0.01
        });
        
        this.color = color;
        this.isStriped = isStriped;
        this.startPosition = { x, y };
        World.add(world, this.body);
    }

    render() {
        const pos = this.body.position;
        
        // Shadow effect
        fill(0, 40);
        noStroke();
        circle(pos.x + 2, pos.y + 2, this.radius * 2);
        
        // Main sphere
        fill(this.color);
        circle(pos.x, pos.y, this.radius * 2);
        
        // Lighting effect
        fill(255, 100);
        circle(pos.x - this.radius/3, pos.y - this.radius/3, this.radius/2);
    }

    clearFromWorld() {
        World.remove(world, this.body);
    }

    resetToStart() {
        Body.setPosition(this.body, this.startPosition);
        Body.setVelocity(this.body, { x: 0, y: 0 });
        Body.setAngularVelocity(this.body, 0);
    }
}

// class representing the player's stick
class PlayerStick {
    constructor() {
        this.rotation = 0;
        this.length = SURFACE_WIDTH / 4;
        this.isDrawing = false;
        this.strokePower = 8;  // Fixed stroke power
        this.visible = true;
    }

    render() {
        if (!playerSphere || placementMode) return;

        push();
        translate(playerSphere.body.position.x, playerSphere.body.position.y);
        rotate(this.rotation);

        // Stick shadow
        stroke(0, 40);
        strokeWeight(8);
        line(SPHERE_SIZE + 4, 2, this.length + 4, 2);
        
        // Main stick shaft
        stroke('#8B4513');  // Darker wood color
        strokeWeight(7);
        line(SPHERE_SIZE, 0, this.length, 0);
        
        // Stick handle
        stroke('#654321');  // Even darker wood for handle
        strokeWeight(8);
        line(this.length - 50, 0, this.length, 0);
        
        // Stick tip
        stroke('#1E1E1E');  // Darker tip
        strokeWeight(5);
        line(SPHERE_SIZE, 0, SPHERE_SIZE + 5, 0);
        pop();
    }

    update() {
        if (!playerSphere || placementMode) return;
        
        this.rotation = atan2(
            mouseY - playerSphere.body.position.y,
            mouseX - playerSphere.body.position.x
        );
        this.strokePower = speedSlider.value(); // Use the slider value
      
    }

    strike() {
        if (!playerSphere || placementMode) return;

        let strikeVector = p5.Vector.fromAngle(this.rotation + PI);
        strikeVector.mult(this.strokePower);
      
        // Cap the stroke power to a maximum value
        let cappedPower = constrain(this.strokePower, 1, 3); // Adjust max value as needed
    strikeVector.mult(cappedPower);
        
        Body.applyForce(playerSphere.body, playerSphere.body.position, {
            x: strikeVector.x,
            y: strikeVector.y
        });
        this.isDrawing = false;
    }
}

// calculate table dimensions based on window size
function calculateSurfaceDimensions() {
    const maxWidth = windowWidth - 100;
    const maxHeight = windowHeight - 200;

    if (maxWidth / 2 <= maxHeight) {
        SURFACE_LENGTH = maxWidth;
        SURFACE_WIDTH = SURFACE_LENGTH / 2;
    } else {
        SURFACE_WIDTH = maxHeight;
        SURFACE_LENGTH = SURFACE_WIDTH * 2;
    }

    SPHERE_SIZE = SURFACE_WIDTH / 36;
    HOLE_SIZE = SPHERE_SIZE * 1.5;
}


// initialize table boundaries
function initializeBoundaries() {
    boundaries.forEach(boundary => World.remove(world, boundary));
    boundaries = [];

    const boundaryOptions = {
        isStatic: true,
        render: { visible: false },
        restitution: 0.9
    };

    const boundaryPositions = [
        [SURFACE_LENGTH/2 + 50, -OUTER_BOUNDARY/2, SURFACE_LENGTH + OUTER_BOUNDARY, 20],
        [SURFACE_LENGTH/2 + 50, SURFACE_WIDTH + OUTER_BOUNDARY/2 + 50, SURFACE_LENGTH + OUTER_BOUNDARY, 20],
        [-OUTER_BOUNDARY/2, SURFACE_WIDTH/2 + 50, 20, SURFACE_WIDTH + OUTER_BOUNDARY],
        [SURFACE_LENGTH + OUTER_BOUNDARY/2 + 50, SURFACE_WIDTH/2 + 50, 20, SURFACE_WIDTH + OUTER_BOUNDARY]
    ];

    boundaryPositions.forEach(([x, y, width, height]) => {
        boundaries.push(Bodies.rectangle(x, y, width, height, boundaryOptions));
    });

    boundaries.forEach(boundary => World.add(world, boundary));
}

//create edges for ball containment
function createEdges() {
    edges.forEach(edge => World.remove(world, edge));
    edges = [];

    const edgeOptions = {
        isStatic: true,
        restitution: 0.8,
        friction: 0.3,
        slop: 0.01
    };

    const edgePositions = [
        [SURFACE_LENGTH/2 + 50, 50, SURFACE_LENGTH - 40, EDGE_SIZE],
        [SURFACE_LENGTH/2 + 50, SURFACE_WIDTH + 50, SURFACE_LENGTH - 40, EDGE_SIZE],
        [50, SURFACE_WIDTH/4 + 50, EDGE_SIZE, SURFACE_WIDTH/2],
        [50, SURFACE_WIDTH * 0.75 + 50, EDGE_SIZE, SURFACE_WIDTH/2],
        [SURFACE_LENGTH + 50, SURFACE_WIDTH/2 + 50, EDGE_SIZE, SURFACE_WIDTH - 40]
    ];

    edgePositions.forEach(([x, y, width, height]) => {
        edges.push(Bodies.rectangle(x, y, width, height, edgeOptions));
    });

    edges.forEach(edge => World.add(world, edge));
}

// function for potting the balls in the hole
function createHoles() {
    holes = [];
    const holeRadius = SPHERE_SIZE * 2;

    const holePositions = [
        [50, 50],
        [SURFACE_LENGTH/2 + 50, 50],
        [SURFACE_LENGTH + 50, 50],
        [50, SURFACE_WIDTH + 50],
        [SURFACE_LENGTH/2 + 50, SURFACE_WIDTH + 50],
        [SURFACE_LENGTH + 50, SURFACE_WIDTH + 50]
    ];

    holePositions.forEach(([x, y]) => {
        const hole = Bodies.circle(x, y, holeRadius, {
            isSensor: true,
            isStatic: true
        });

        World.add(world, hole);
        holes.push({
            x, y,
            radius: holeRadius,
            body: hole
        });
    });
}

// Initialize striped and red balls in regular arrangement
function initializeSpheresRegular() {
    Object.entries(STRIPE_LOCATIONS).forEach(([color, pos]) => {
        const x = pos.x * SURFACE_LENGTH + 50;
        const y = pos.y * SURFACE_WIDTH + 50;
        const sphere = new GameSphere(x, y, SPHERE_PALETTE[color], true);
        spheres.push(sphere);
        stripedSpheres.push(sphere);
    });

    const startX = SURFACE_LENGTH * 0.75 + 50;
    const startY = SURFACE_WIDTH/2 + 50;
    const rows = 5;
    const spacing = SPHERE_SIZE * 1.05;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col <= row; col++) {
            const x = startX + (row * spacing);
            const y = startY - (row * spacing/2) + (col * spacing);
            const sphere = new GameSphere(x, y, SPHERE_PALETTE.crimson);
            spheres.push(sphere);
            crimsonSpheres.push(sphere);
        }
    }
}

// randomize the balls 
function initializeSpheresRandom(includeStripes = true) {
    for (let i = 0; i < 15; i++) {
        let x, y;
        do {
            x = random(SURFACE_LENGTH * 0.4 + 50, SURFACE_LENGTH * 0.9 + 50);
            y = random(100, SURFACE_WIDTH);
        } while (checkSphereOverlap(x, y));

        const sphere = new GameSphere(x, y, SPHERE_PALETTE.crimson);
        spheres.push(sphere);
        crimsonSpheres.push(sphere);
    }

    if (includeStripes) {
        Object.entries(STRIPE_LOCATIONS).forEach(([color, _]) => {
            let x, y;
            do {
                x = random(SURFACE_LENGTH * 0.4 + 50, SURFACE_LENGTH * 0.9 + 50);
                y = random(100, SURFACE_WIDTH);
            } while (checkSphereOverlap(x, y));

            const sphere = new GameSphere(x, y, SPHERE_PALETTE[color], true);
            spheres.push(sphere);
            stripedSpheres.push(sphere);
        });
    } else {
        Object.entries(STRIPE_LOCATIONS).forEach(([color, pos]) => {
            const x = pos.x * SURFACE_LENGTH + 50;
            const y = pos.y * SURFACE_WIDTH + 50;
            const sphere = new GameSphere(x, y, SPHERE_PALETTE[color], true);
            spheres.push(sphere);
            stripedSpheres.push(sphere);
        });
    }
}

// Check if a new ball overlaps with existing balls
function checkSphereOverlap(x, y) {
    return spheres.some(sphere => 
        dist(x, y, sphere.body.position.x, sphere.body.position.y) < SPHERE_SIZE * 1.1
    );
}

function checkBoundaryViolations() {
    for (let sphere of spheres) {
        const pos = sphere.body.position;
        if (pos.x < 0 || pos.x > SURFACE_LENGTH + 100 || 
            pos.y < 0 || pos.y > SURFACE_WIDTH + 100) {
            if (sphere === playerSphere) {
                handlePlayerSpherePotted();
            } else if (sphere.isStriped) {
                sphere.resetToStart();
            } else {
                World.remove(world, sphere.body);
                spheres = spheres.filter(s => s !== sphere);
                crimsonSpheres = crimsonSpheres.filter(s => s !== sphere);
            }
        }
    }
}

// Handle potted balls based on type
function processPottedSphere(sphere, index) {
    if (sphere === playerSphere) {
        handlePlayerSpherePotted();
        potSound.rate(1);
        potSound.play();
        return;
    }

    if (sphere.color === SPHERE_PALETTE.crimson) {
        processPottedCrimson(sphere, index);
    } else if (sphere.isStriped) {
        processPottedStriped(sphere);
    }
}

function handlePlayerSpherePotted() {
    placementMode = true;
    Body.setPosition(playerSphere.body, { x: -100, y: -100 });
    console.log("Cue ball potted! Place it in the starting zone.");
}

// Reset potted striped balls
function processPottedStriped(sphere) {
    sphere.resetToStart();
}
let redBallCount = 0; // Counter for the number of red balls potted
function processPottedCrimson(sphere, index) {
    sphere.clearFromWorld();
    spheres.splice(index, 1);
    crimsonSpheres = crimsonSpheres.filter(s => s !== sphere);
    
    redBallCount++;
    console.log(`Red balls potted: ${redBallCount}`);
}


// Monitor collisions between balls and holes
function monitorHoles() {
    for (let i = spheres.length - 1; i >= 0; i--) {
        const sphere = spheres[i];
        const pos = sphere.body.position;

        for (let hole of holes) {
            const distance = dist(pos.x, pos.y, hole.x, hole.y);
            if (distance < hole.radius * 2.0) {  
                // Magnetic effect near holes
                if (distance < hole.radius * 1.5) {
                    const angle = atan2(hole.y - pos.y, hole.x - pos.x);
                    const magnetism = 0.008;
                    Body.applyForce(sphere.body, pos, {
                        x: cos(angle) * magnetism,
                        y: sin(angle) * magnetism
                    });
                }
                
                // Process potted sphere when very close
                if (distance < hole.radius * 1.3) {
                    processPottedSphere(sphere, i);
                    break;
                }
            }
        }
    }
}

// Track collisions during gameplay
function trackCollisions(event) {
    event.pairs.forEach((pair) => {
        if (pair.bodyA === playerSphere?.body || pair.bodyB === playerSphere?.body) {
            const otherBody = pair.bodyA === playerSphere.body ? pair.bodyB : pair.bodyA;
            let impactType = "edge";

            if (otherBody.label === SPHERE_PALETTE.crimson) {
                impactType = "red ball";
            } else if (Object.values(SPHERE_PALETTE).includes(otherBody.label)) {
                impactType = "coloured ball";
            }

            console.log(`Impact detected: player sphere hit ${impactType}`);
        }
    });
}


function preload() {
    potSound = loadSound('oops_sound.mp3'); // Load the sound file
}

let speedSlider; // Declare the slider variable
let showInstructions = true; // Variable to control instructions display
let okButton; // Button for dismissing instructions

// Set up the game environment
function setup() {
    calculateSurfaceDimensions();
    createCanvas(SURFACE_LENGTH + 100, SURFACE_WIDTH + 150);
    
    engine = Engine.create({
        positionIterations: 8,
        velocityIterations: 8
    });
    world = engine.world;
    engine.world.gravity.y = 0;

    initializeBoundaries();
    createEdges();
    createHoles();
    
    stick = new PlayerStick();

    Events.on(engine, 'collisionStart', trackCollisions);
    
    resetSurface();

    // Create a slider for speed control
    speedSlider = createSlider(1, 3, 3); // Min: 1, Max: 20, Default: 8
    speedSlider.position(50, SURFACE_WIDTH + 130); // Position below the surface
    speedSlider.style('width', '200px');
    
    // Initially hide the slider
    speedSlider.hide();
    
    // Create the OK button for the instructions
    okButton = createButton('OK');
    okButton.position(SURFACE_LENGTH / 2 + 60, SURFACE_WIDTH + 75);
    okButton.mousePressed(() => {
        showInstructions = false; // Hide instructions
        okButton.hide(); // Remove the button
        speedSlider.show(); // Show the slider after instructions
    });
    
    
}

// Render and update the game on each frame
function draw() {
    
    if (showInstructions) {
        displayInstructions();
        return; // Skip rendering the game while showing instructions
    }
    
    background(50);
    Engine.update(engine);
    
    checkBoundaryViolations();
    renderPlayingSurface();
    
    // Render holes with enhanced depth effect
    holes.forEach(hole => {
        fill(0, 50);
        circle(hole.x, hole.y, HOLE_SIZE * 1.8);
        fill(SURFACE_THEME.hole);
        circle(hole.x, hole.y, HOLE_SIZE * 1.5);
    });
    
    // Render all spheres
    spheres.forEach(sphere => sphere.render());
    
    stick.update();
    stick.render();
    
    monitorHoles();
    
    // Highlight starting zone during placement
    if (placementMode) {
        stroke(255, 100);
        noFill();
        arc(SURFACE_LENGTH/4 + 50, SURFACE_WIDTH/2 + 50, 
            SURFACE_WIDTH/3, SURFACE_WIDTH/3, 
            HALF_PI, - HALF_PI);
    }
  // Display the current speed setting
    fill(255);
    textSize(16);
    textAlign(LEFT);
    
    text(`Speed Adjustment: speed ${speedSlider.value()}`, 50, SURFACE_WIDTH + 110); // Display the slider value
    fill('red')
    text(`Red Balls Potted: ${redBallCount}`, 300, SURFACE_WIDTH + 110); // Display the count
  
}

// Display the instructions 
function displayInstructions() {
    background(100);
    fill(255);
    textAlign(CENTER);
    textSize(20);
    text("Welcome to the Game!", width / 2, height / 7);
    textSize(16);
    text("How to Play:", width / 2, height / 7 + 40);
    text("1. Use the mouse to aim and shoot the cue ball.", width / 2, height / 7 + 80);
    text("2. Pot all the red balls to score points.", width / 2, height / 7 + 120);
    text("3. Adjust stroke power using the slider below.", width / 2, height / 7 + 160);
    text("4. Avoid potting the cue ball!", width / 2, height / 7 + 200);
    text("5. Click on the key 1 to reset", width / 2, height / 7 + 240);
    text("6. Click on the key 2 to randomise the redballs", width / 2, height / 7 + 280);
    text("7. Click on the key 3 to randomise all the balls", width / 2, height / 7 + 320);
    text("8. Click on OK to start", width / 2, height / 7 + 360);
}


function renderPlayingSurface() {
    // Outer decorative frame
    push();
    fill('#2C1810');  // Dark wood frame
    rect(30, 30, SURFACE_LENGTH + 40, SURFACE_WIDTH + 40);
    
    // Metallic border
    const gradientBorder = 8;
    for(let i = 0; i < gradientBorder; i++) {
        fill(lerpColor(
            color('#B8B8B8'), 
            color('#4A4A4A'), 
            i/gradientBorder
        ));
        rect(
            40 + i, 
            40 + i, 
            SURFACE_LENGTH + 20 - i*2, 
            SURFACE_WIDTH + 20 - i*2
        );
    }
    
    // Main playing surface with gradient
    const surfaceGradient = drawingContext.createLinearGradient(
        50, 50,
        50, SURFACE_WIDTH + 50
    );
    surfaceGradient.addColorStop(0, '#1A332F');
    surfaceGradient.addColorStop(0.5, '#244D48');
    surfaceGradient.addColorStop(1, '#1A332F');
    
    drawingContext.fillStyle = surfaceGradient;
    rect(50, 50, SURFACE_LENGTH, SURFACE_WIDTH);
 
    // Playing area markings
    stroke('#C0C0C0');
    strokeWeight(1);
    
    // Starting line with detailed pattern
    drawStylizedLine(
        SURFACE_LENGTH/4 + 50, 50,
        SURFACE_LENGTH/4 + 50, SURFACE_WIDTH + 50
    );
    
    // Starting zone markers
    noFill();
    stroke('#C0C0C0');
    strokeWeight(1);
    
    // Dotted arc for starting zone
    drawDottedArc(
        SURFACE_LENGTH/4 + 50, 
        SURFACE_WIDTH/2 + 50,
        SURFACE_WIDTH/3, 
        SURFACE_WIDTH/3,
        -HALF_PI, 
        HALF_PI,
        50  // Number of dots
    );
    
    // Position markers with decorative elements
    Object.entries(STRIPE_LOCATIONS).forEach(([_, pos]) => {
        const x = pos.x * SURFACE_LENGTH + 50;
        const y = pos.y * SURFACE_WIDTH + 50;
        drawPositionMarker(x, y);
    });
    pop();
}



function drawStylizedLine(x1, y1, x2, y2) {
    const segments = 30;
    const segLength = (y2 - y1) / segments;
    
    for(let i = 0; i < segments; i++) {
        if(i % 2 === 0) {
            line(
                x1, 
                y1 + i * segLength,
                x1, 
                y1 + (i + 1) * segLength
            );
        }
    }
}

function drawDottedArc(x, y, w, h, start, end, dots) {
    const step = (end - start) / dots;
    for(let a = start; a <= end; a += step) {
        const px = x - cos(a) * w/2;
        const py = y + sin(a) * h/2;
        circle(px, py, 2);
    }
}

function drawPositionMarker(x, y) {
    push();
    fill('#C0C0C0');
    noStroke();
    
    // Decorative position marker
    const markerSize = 6;
    circle(x, y, markerSize);
    
    // Additional decorative elements
    const outerSize = markerSize * 2;
    noFill();
    stroke('#C0C0C0');
    strokeWeight(0.5);
    circle(x, y, outerSize);
    
    // Cross lines
    const lineLength = outerSize * 0.7;
    line(x - lineLength, y, x + lineLength, y);
    line(x, y - lineLength, x, y + lineLength);
    pop();
}


// Removed displayScoreboard function as scoring is no longer needed

// Reset cue ball position when mouse is pressed
function mousePressed() {
    if (placementMode) {
        let startX = SURFACE_LENGTH/4 + 10;
        let startY = SURFACE_WIDTH/2 + 10;
        let zoneRadius = SURFACE_WIDTH/6;
        
        let inStartZone = false;
        if (dist(mouseX, mouseY, startX, startY) < zoneRadius) {
            let angle = atan2(mouseY - startY, mouseX - startX);
            if (angle >= -HALF_PI && angle <= HALF_PI) {
                inStartZone = true;
            }
        }
        
        if (inStartZone) {
            placePlayerSphere(mouseX, mouseY);
            placementMode = false;
        } else {
            console.log("Place the sphere within the starting zone!");
        }
    } else {
        stick.isDrawing = true;
    }
}

// Strike the ball when mouse is released
function mouseReleased() {
    if (stick.isDrawing) {
        stick.strike();
    }
}

// key press function to reset or randomize balls
function keyPressed() {
    if (key === '1' || key === '2' || key === '3') {
        gameType = parseInt(key);
        resetSurface();
        totalPoints = 0;
        roundPoints = 0;
        redBallCount = 0;
    }1
}

function windowResized() {
    calculateSurfaceDimensions();
    resizeCanvas(SURFACE_LENGTH + 200, SURFACE_WIDTH + 200);
    initializeBoundaries();
    resetSurface();
}

// reset game layout 
function resetSurface() {
    spheres.forEach(sphere => sphere.clearFromWorld());
    spheres = [];
    crimsonSpheres = [];
    stripedSpheres = [];
    playerSphere = null;
    
    switch(gameType) {
        case 1:
            initializeSpheresRegular();
            break;
        case 2:
            initializeSpheresRandom(false);
            break;
        case 3:
            initializeSpheresRandom(true);
            break;
    }
    
    placementMode = true;
}


// place the cue ball at a specific location
function placePlayerSphere(x, y) {
    if (playerSphere) {
        playerSphere.clearFromWorld();
    }
    playerSphere = new GameSphere(x, y, SPHERE_PALETTE.ivory);
    spheres.push(playerSphere);
}