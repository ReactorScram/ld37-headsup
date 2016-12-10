let Prns = (function () {
	let Long = dcodeIO.Long;
	
	function fromNum (n: number): Long {
		return Long.fromBits (n, 0, true);
	}
	
	function fromHex (s: string): Long {
		return Long.fromString (s, true, 16);
	}
	
	let mix_s0 = fromNum (31);
	let mix_s1 = fromNum (27);
	let mix_s2 = fromNum (33);
	let mix_m0 = fromHex ("7fb5d329728ea185");
	let mix_m1 = fromHex ("81dadef4bc2dd44d");
	let weyl = fromHex ("61c8864680b583eb");
	
	function xs (x: Long, shift: Long): Long {
		return x.xor (x.shiftRightUnsigned (shift));
	}
	
	function mix (x: Long): Long {
		x = xs (x, mix_s0);
		x = x.multiply (mix_m0);
		x = xs (x, mix_s1);
		x = x.multiply (mix_m1);
		x = xs (x, mix_s2);
		
		return x;
	}
	
	function at (n: Long): Long {
		return mix (weyl.multiply (n));
	}
	
	function at_u32 (n: number): number {
		return at (Long.fromBits (n, 0, true)).getLowBitsUnsigned ();
	}
	
	function debug (n: number): string {
		return at (fromNum (n)).toString (10);
	}
	
	return {
		debug: debug,
		fromNum: fromNum,
		mix: mix,
		at: at,
		at_u32: at_u32,
	};
})();

interface PixiView {
	offsetWidth: number;
	offsetHeight: number;
}

interface PixiStage {
	addChild (child: any): void;
}

interface PixiRenderer {
	view: HTMLElement;
	render (stage: PixiStage): void;
	resize (width: number, height: number): void;
}

interface Vec2 {
	x: number;
	y: number;
}

interface PixiSprite {
	rotation: number;
	position: Vec2;
}

class Context {
	bunny: PixiSprite;
	clickCount: number;
	frames: number;
	prns_output: string;
	renderer: PixiRenderer;
	richText: any;
	stage: PixiStage;
	style: any;
	wordList: Array <string>;
	
	constructor (public Pixi: any, public pseudoCookie: number) {
		this.clickCount = 0;
		this.frames = 0;
		this.prns_output = "0"; //Prns.debug (this.clickCount);
	}
}

interface Long {
	getLowBitsUnsigned (): number;
	modulo (o: Long): Long;
	multiply (o: Long): Long;
	xor (o: Long): Long;
	shiftRightUnsigned (n: Long): Long;
	toString (radix: number): string;
}

interface LongPackage {
	fromBits (lowBits: number, highBits: number, unsigned: boolean): Long;
	fromString (s: string, unsigned: boolean, radix: number): Long;
}

class dcodeIO {
	static Long: LongPackage;
}

function load (PIXI) {
	let ctx = new Context (PIXI, Math.floor (Math.random () * 1024 * 1024 * 1024));
	
	ctx.renderer = PIXI.autoDetectRenderer(1280, 720,{backgroundColor : 0x1099bb});
	document.body.appendChild(ctx.renderer.view);

	// create the root of the scene graph
	ctx.stage = new PIXI.Container();

	// create a texture from an image path
	var texture = PIXI.Texture.fromImage('Lenna.png');

	// create a new Sprite using the texture
	let bunny = new PIXI.Sprite(texture);

	// center the sprite's anchor point
	bunny.anchor.x = 0.5;
	bunny.anchor.y = 0.5;

	// move the sprite to the center of the screen
	bunny.position.x = 400;
	bunny.position.y = 240;
	
	let localOnDown = function (eventData) {
		onDown (ctx, eventData);
	};
	
	bunny.interactive = true;
	bunny.on('mousedown', localOnDown);
	bunny.on('touchstart', localOnDown);
	
	ctx.bunny = bunny;
	
	ctx.stage.addChild(ctx.bunny);

	ctx.style = {
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

	ctx.richText = new PIXI.Text('',ctx.style);
	ctx.richText.x = 10;
	ctx.richText.y = 10;

	ctx.stage.addChild(ctx.richText);
	
	animate (ctx);
	
	loadWordList (ctx);
}

function loadWordList (ctx: Context): void {
	// Modified from the MDN example
	var oReq = new XMLHttpRequest();
	oReq.open("GET", "word-lists/ludumdare.json", true);
	oReq.onload = function () {
		if (oReq.readyState === 4) {
			ctx.wordList = JSON.parse (oReq.responseText);
			tryFinishLoading (ctx);
		}
	}
	oReq.send(null);
}

function tryFinishLoading (ctx: Context): void {
	if (isLoaded (ctx)) {
		console.log ("Loaded!");
	}
	else {
		console.log ("wordList = " + ctx.wordList);
	}
}

function isLoaded (ctx: Context): boolean {
	return ctx.wordList != null && ctx.wordList.length > 0;
}

function onDown (ctx: Context, eventData): void {
	ctx.clickCount = ctx.clickCount + 1;
	
	if (isLoaded (ctx)) {
	ctx.prns_output = ctx.wordList [Prns.at (Prns.fromNum (ctx.clickCount)).modulo (Prns.fromNum (ctx.wordList.length)).getLowBitsUnsigned ()];
	}
	else {
		ctx.prns_output = "Loading words...";
	}
	
	console.log (JSON.stringify ({
		clickCount: ctx.clickCount,
		frames: ctx.frames,
		pseudoCookie: ctx.pseudoCookie,
		date: Date.now ()
	}));
}

function animate (ctx: Context) {
	requestAnimationFrame(function () {
		animate (ctx);
	});
	
	let width = ctx.renderer.view.offsetWidth;
	let height = ctx.renderer.view.offsetHeight;
	
	ctx.renderer.resize (width, height);
	
	// just for fun, let's rotate ms rabbit a little
	ctx.bunny.rotation = ctx.frames * 0.005;
	ctx.frames = ctx.frames + 1;
	
	ctx.bunny.position.x = width * 0.5;
	ctx.bunny.position.y = height * 0.5;
	/*
	ctx.richText.text = "Click Lenna to send me data! You have clicked " + ctx.clickCount + " times!";
	*/
	
	ctx.richText.text = ctx.clickCount + " -> " + ctx.prns_output;
	
	// render the container
	ctx.renderer.render(ctx.stage);
}
