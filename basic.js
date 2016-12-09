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

stage.addChild(bunny);

// start animating
animate();
function animate() {
	requestAnimationFrame(animate);
	
	// just for fun, let's rotate ms rabbit a little
	bunny.rotation += 0.005;
	
	let width = renderer.view.offsetWidth;
	let height = renderer.view.offsetHeight;
	
	renderer.resize (width, height);
	
	bunny.position.x = width * 0.5;
	bunny.position.y = height * 0.5;
	
	// render the container
	renderer.render(stage);
}
