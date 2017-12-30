import {Observable, Observer, AsyncSubject} from 'rxjs';
import $ from 'jquery-ts';

$(() => {

    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    document.body.appendChild(canvas);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;


    const paintStars = (stars) => {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ffffff';

        stars.forEach((star) => {
            ctx.fillRect(star.x, star.y, star.size, star.size);
        });
    }

    const SPEED = 20;
    const STAR_NUMBER = 250;

    let StarStream = Observable.range(1, STAR_NUMBER)
        .map(() => {
            //debugger;
            return {
                x: Math.random() * parseInt(canvas.width.toString()),
                y: Math.random() * parseInt(canvas.height.toString()),
                size: Math.random() * 3 + 1
            };
        })
        .toArray()
        .flatMap((starArray) => {
            return Observable
                .interval(SPEED)
                .map(() => {
                    starArray.forEach((star) => {
                        if (star.y >= canvas.height)
                        {
                            star.y = 0;
                        }
                        star.y += 5;
                    });

                    return starArray;
                });
        });


    const drawTriangle = (x, y, width, color, direction) => {
        ctx.fillStyle = color;

        ctx.beginPath();
        ctx.moveTo(x - width, y);
        ctx.lineTo(x, direction === 'up' ? y - width : y + width );
        ctx.lineTo(x + width, y);
        ctx.lineTo(x - width, y);
        ctx.fill();
    }

    const getRandomInt = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    const drawSpaceShip = (x, y) => {
        drawTriangle(x, y, 20, '#00ff12', 'up');
    }

    const renderEnemies = (enemies) => {
        enemies.forEach((enemy) => {
            enemy.y += 5;
            enemy.x += getRandomInt(-15, 15);

            drawTriangle(enemy.x, enemy.y, 20, '#ffffff', 'down');
        });
    }

    const HERO_Y = canvas.height - 30;
    const SpaceShipStream = Observable.fromEvent(canvas, 'mousemove')
        .map((event: MouseEvent) => {
            return {
                x: event.clientX,
                y: HERO_Y
            };
        })
        .startWith({
            x: canvas.width / 2,
            y: HERO_Y
        });


    const Enemies = Observable.interval(1500)
        .scan((enemyArray: Array<any>) => {
            const enemy = {
                x: Math.random() * parseInt(canvas.width.toString()),
                y: -30
            };

            enemyArray.push(enemy);
            return enemyArray;
        }, []);

    const renderScene = (actors) => {
        paintStars(actors.stars);
        drawSpaceShip(actors.spaceship.x, actors.spaceship.y);
        renderEnemies(actors.enemies);
    };

    const game = Observable
        .combineLatest(
            StarStream,
            SpaceShipStream,
            Enemies,
            (stars, spaceship, enemies) => {
            return { stars: stars, spaceship: spaceship, enemies: enemies };
        });

    game
        .sample(Observable.interval(40))
        .subscribe(renderScene);
});

