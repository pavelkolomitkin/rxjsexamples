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

    const SPACE_KEY_CODE = 32;


    const PlayerFiring = Observable
        .merge(
            Observable.fromEvent(canvas, 'click'),
            Observable.fromEvent(canvas, 'keydown')
                .filter((event:KeyboardEvent) => {
                    console.log(event.keyCode);
                    return event.keyCode === SPACE_KEY_CODE
                })
        )
        .startWith({
            x: canvas.width / 2,
            y: HERO_Y
        })
        .sample(Observable.interval(200))
        .timestamp();

    const HeroShots = Observable
        .combineLatest(
            SpaceShipStream,
            PlayerFiring,
            (spaceShip, playerFiring) => {
                return {
                    timestamp: playerFiring.timestamp,
                    x: spaceShip.x
                };
            }
        )
        .distinctUntilChanged((shotPrev, shotNext) => {
            return (shotPrev.timestamp === shotNext.timestamp);
        })
        .scan((shotArray: Array<any>, shot) => {
            shotArray.push({x: shot.x, y: HERO_Y});
            return shotArray;
        }, []);

    const SHOOTING_SPEED = 15;

    const drawHeroShots = (heroShots) => {
        heroShots.forEach((shot) => {
            shot.y -= SHOOTING_SPEED;
            drawTriangle(shot.x, shot.y, 5, '#cc000a', 'up');
        });
    }

    const renderScene = (actors) => {
        paintStars(actors.stars);
        drawSpaceShip(actors.spaceship.x, actors.spaceship.y);
        renderEnemies(actors.enemies);
        drawHeroShots(actors.heroShots);
    };

    const game = Observable
        .combineLatest(
            StarStream,
            SpaceShipStream,
            Enemies,
            HeroShots,
            (stars, spaceship, enemies, heroShots) => {
            return { stars: stars, spaceship: spaceship, enemies: enemies, heroShots: heroShots };
        })
        .sample(Observable.interval(300));

    game.subscribe(renderScene);
});

