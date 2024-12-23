import { debug } from "groq-sdk/core.mjs";
import kaboom from "kaboom";

const keys = {};

function toDeg(angle) {
    return angle * (3.14 / 180)
}

function calculate_distance(x1, y1, x2, y2) {
    return Math.sqrt(((x2 - x1) ** 2) + ((y2 - y1) ** 2))
}

function roundToGrid(point, gridSize) {
    return {
        x: Math.round(point.x / gridSize) * gridSize,
        y: Math.round(point.y / gridSize) * gridSize
    };
}


var levels = [
    [
        [1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 2, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 2, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
    ]
]

function keyEventHandler(event) {
    keys[event.code] = event.type === "keydown";
    event.preventDefault();
}
const SPEED = 120

var rays = []

window.addEventListener("keydown", keyEventHandler);
window.addEventListener("keyup", keyEventHandler);

const backgrounds = [
    [0, 255, 0],
    [0, 255, 255],
]

function isColliding(rect1, rect2) {
    // Check if the rectangles overlap on the x-axis
    if (rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x) {

        // Check if the rectangles overlap on the y-axis
        if (rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y) {

            // If they overlap on both axes, there's a collision
            return true;
        }
    }

    // No collision
    return false;
}

var blocks = []

function isPointInsideBox(point, box) {
    return (
        point.x >= box.x &&                // Point is to the right of the box's left edge
        point.x <= box.x + box.width &&   // Point is to the left of the box's right edge
        point.y >= box.y &&               // Point is below the box's top edge
        point.y <= box.y + box.height     // Point is above the box's bottom edge
    );
}

for (let i = 0; i < 2; i++) {

    var w = 560;
    var h = 560;

    const k = kaboom({
        background: backgrounds[i],
        global: false,
        width: w,
        height: h,
        scale: 1.1,
    })

    if (i == 1) {

        k.loadBean()

        var p = k.add([
            k.sprite("bean"),
            k.pos(160, 160),
            k.rotate(0),
            k.area(),
            k.anchor("center"),
            k.scale(0.5),
            k.body(
                { isStatic: false }
            ),
            "player"
        ]);

        for (let i = 0; i < 180; i++) {
            var ray = k.add([
                k.rect(1, 1),
                k.pos(p.pos),
                k.rotate(-30 + i / 3),
                {
                    colliding: false
                }
            ])

            rays.push(ray)
        }


        for (var y = 0; y < levels[0].length; y++) {
            for (var x = 0; x < levels[0][y].length; x++) {
                if (levels[0][y][x] != 0) {

                    var color = levels[0][y][x] == 1 ? k.RED : k.GREEN
                    k.add([
                        k.rect(64, 64),
                        k.area(),
                        k.anchor("center"),
                        k.pos(x * 64, y * 64),
                        k.color(color),
                        "brick", ,
                        {
                            baseColor: color
                        },
                        k.body({ isStatic: true }
                        ),
                        k.z(-10000)
                    ])

                }
            }
        }
        var cellSize = 64
        var FOV = Math.PI / 3

        k.onUpdate(() => {

            var dt = 0
            //k.debug.log(rays[0].colliding)

            rays.forEach((ray) => {

                var index = rays.indexOf(ray)

                ray.pos = p.pos

                var colliding = false
                var rotation = ((FOV / 30) * (index / 4))


                for (let depth = 0; depth < 64 * 64; depth++) {
                    var targetX = ray.pos.x - Math.sin(toDeg(p.angle) + rotation) * (depth / 2)
                    var targetY = ray.pos.y + Math.cos(toDeg(p.angle) + rotation) * (depth / 2)

                    var point = k.vec2(targetX, targetY)


                    var roundedPoint = roundToGrid(
                        point,
                        64
                    )

                    var roundedPos = k.vec2(roundedPoint.x / 64, roundedPoint.y / 64)


                    var mapCell = levels[0][roundedPos.y][roundedPos.x]

                    if (mapCell != 0) {

                        var dis = calculate_distance(p.pos.x, p.pos.y, point.x, point.y)
                        ray.height = dis
                        ray.angle = (Math.atan2(targetY - p.pos.y, targetX - p.pos.x) * (180 / Math.PI)) - 90
                        blocks[index] = {
                            height: ray.height,
                            distance: dis,
                            rotation: rotation,
                            color: (mapCell == 1) ? k.RED : k.GREEN
                        }

                        break
                    }


                    /*


                    if (levels[0][x][y] != 0) {

                        var point = k.vec2(
                            Math.sin(toDeg(rays[r].angle)) * rays[r].height,
                            Math.cos(toDeg(rays[r].angle)) * rays[r].height,
                        )

                        var endPoint = rays[r].pos.add(point)



                        const box1 = { x: endPoint.x, y: endPoint.y, width: 64, height: 64 };
                        const box2 = { x: 64 * x, y: 64 * y, width: 64, height: 64 };

                        if (r == 0) {
                            k.debug.log(isPointInsideBox(endPoint, box2))
                            k.drawCircle({
                                pos: endPoint,
                                radius: 32,
                                color: k.BLACK
                            })
                        }


                    }
                        */
                }

            })


            //rays[r].colliding = isColliding( box2, box1 )


            if (k.debug.fps() > 1) {
                dt = 1 / k.debug.fps()
            }


            if (keys.KeyA) {
                p.angle -= dt * 40//* 20 * (fast ? 3 : 1)
            }

            if (keys.KeyD) {
                p.angle += dt * 40//* 20 * (fast ? 3 : 1)
            }


        })

        //                bean.pos = k.vec2(posx, posy)
        k.onKeyDown("left", () => {
            // .move() is provided by pos() component, move by pixels per second
            p.move(-SPEED, 0)
        })
        
        k.onKeyDown("right", () => {
            p.move(SPEED, 0)
        })
        
        k.onKeyDown("up", () => {
            p.move(0, -SPEED)
        })
        
        k.onKeyDown("down", () => {
            p.move(0, SPEED)
        })

    }

    if (i == 0) {

        var block = []

        k.add([
            k.rect(1024, 600),
            k.color(k.rgb(50, 50, 50))
        ])
        k.add([
            k.rect(1024, 262),
            k.color(k.rgb(100, 100, 100))
        ])


        for (var bs = 0; bs < 180; bs++) {
            var b = k.add([
                k.rect(3.4222222,1),
                k.pos(3.422222*bs, k.center().y),
                k.color(k.RED),
                k.anchor('center')
            ])

            block.push(b)
        }


        k.onDraw(() => {
            for (var i = 0; i < blocks.length; i++) {
                var dark = blocks[i].distance / 2
                var color = blocks[i].color
                var disT = (4*320) / (blocks[i].distance / 16)

                block[i].height = disT

                block[i].color = k.rgb(
                    color.r - dark,
                    color.g - dark,
                    color.b - dark,
                )

            }

        })
    }
}