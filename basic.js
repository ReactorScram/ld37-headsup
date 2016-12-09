var renderer = PIXI.autoDetectRenderer(1280, 720,{backgroundColor : 0x1099bb});
document.body.appendChild(renderer.view);

// create the root of the scene graph
var stage = new PIXI.Container();

// create a texture from an image path
var texture = PIXI.Texture.fromImage('Lenna.png');

// create a new Sprite using the texture
var bunny = new PIXI.Sprite(texture);

// center the sprite's anchor point
bunny.anchor.x = 0.5;
bunny.anchor.y = 0.5;

// move the sprite to the center of the screen
bunny.position.x = 400;
bunny.position.y = 240;

bunny.interactive = true;
bunny.on('mousedown', onDown);
bunny.on('touchstart', onDown);

stage.addChild(bunny);

let style = {
    fontFamily : 'Arial',
    fontSize : '30px',
    fontStyle : 'italic',
    fontWeight : 'bold',
    fill : '#F7EDCA',
    stroke : '#4a1850',
    strokeThickness : 5,
    dropShadow : true,
    dropShadowColor : '#000000',
    dropShadowAngle : Math.PI / 6,
    dropShadowDistance : 6,
    wordWrap : true,
    wordWrapWidth : 340
};

let richText = new PIXI.Text('',style);
richText.x = 10;
richText.y = 10;

stage.addChild(richText);

let clickCount = 0;

function onDown (eventData) {
	clickCount = clickCount + 1;
}

// start animating
animate();
function animate() {
	requestAnimationFrame(animate);
	
	let width = renderer.view.offsetWidth;
	let height = renderer.view.offsetHeight;
	
	renderer.resize (width, height);
	
	// just for fun, let's rotate ms rabbit a little
	bunny.rotation += 0.005;
	
	bunny.position.x = width * 0.5;
	bunny.position.y = height * 0.5;
	
	richText.text = "Click Lenna to send me analytics data! You have clicked " + clickCount + " times!";
	
	// render the container
	renderer.render(stage);
}
