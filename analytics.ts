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
	check: PixiSprite;
	refresh: PixiSprite;
	
	clickCount: number;
	numCorrect: number;
	frames: number;
	display: string;
	renderer: PixiRenderer;
	richText: any;
	stage: PixiStage;
	style: any;
	wordList: Array <string>;
	
	// Must stay sorted for the algo to be efficient
	usedWordList: Array <number>;
	
	// Jiggle timers
	checkmarkJiggle: number;
	checkmarkJiggleDirection: number;
	refreshJiggle: number;
	loadJiggle: number;
	
	constructor (public Pixi: any, public pseudoCookie: number) {
		this.clickCount = 0;
		this.frames = 0;
		this.display = "Loading...";
		this.usedWordList = [];
		this.checkmarkJiggle = 0;
		this.refreshJiggle = 0;
		this.numCorrect = 0;
		this.loadJiggle = 1.0;
		this.checkmarkJiggleDirection = 0.0;
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
	
	ctx.renderer = PIXI.autoDetectRenderer(1280, 720,{backgroundColor : 0x62c6cc});
	document.body.appendChild(ctx.renderer.view);
	
	// create the root of the scene graph
	ctx.stage = new PIXI.Container();
	
	// create a texture from an image path
	let checkTex = PIXI.Texture.fromImage('images/checkmark.png');
	
	// create a new Sprite using the texture
	let check = new PIXI.Sprite(checkTex);
	
	// center the sprite's anchor point
	check.anchor.x = 0.5;
	check.anchor.y = 0.5;
	
	check.scale.x = 0.5;
	check.scale.y = 0.5;
	
	let localCheck = function (eventData) {
		onCheck (ctx, eventData);
	};
	
	check.interactive = true;
	check.on('mousedown', localCheck);
	check.on('touchstart', localCheck);
	
	ctx.check = check;
	
	let refreshTex = PIXI.Texture.fromImage ("images/refresh.png");
	let refresh = new PIXI.Sprite (refreshTex);
	
	refresh.anchor.x = 0.5;
	refresh.anchor.y = 0.5;
	
	refresh.scale.x = 0.5;
	refresh.scale.y = 0.5;
	
	let localRefresh = function (eventData) {
		onRefresh (ctx, eventData);
	}
	
	refresh.interactive = true;
	refresh.on ("mousedown", localRefresh);
	refresh.on ("touchstart", localRefresh);
	
	ctx.refresh = refresh;
	
	ctx.stage.addChild(ctx.check);
	
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
		// Pick first word
		contextPickWord (ctx);
	}
	else {
		//
	}
}

function isLoaded (ctx: Context): boolean {
	return ctx.wordList != null && ctx.wordList.length > 0;
}

function insertSorted (list: Array <number>, value: number): void {
	list.push (value);
	// Thanks w3Schools
	// Pretend this is a really efficient insertion sort if anyone asks
	list.sort(function(a, b){return a-b});
}

function pickWord (wordList: Array <string>, usedWordList: Array <number>, rnd: Long): number {
	//let length = Prns.fromNum (ctx.wordList.length);
	
	let wordListLength = wordList.length;
	
	if (usedWordList.length == wordListLength) {
		// Ran out of words, re-shuffle
		// This should not happen in a typical 60-second game
		usedWordList = [];
	}
	
	let length = Prns.fromNum (wordListLength - usedWordList.length);
	
	let i = rnd.modulo (length).getLowBitsUnsigned ();
	
	usedWordList.forEach (function (strike) {
		if (i >= strike) {
			i = i + 1;
		}
		else {
			// Pass - idk if forEach has a 'break'
		}
	});
	
	insertSorted (usedWordList, i);
	
	return i;
}

function contextPickWord (ctx: Context): void {
	ctx.display = ctx.wordList [pickWord (ctx.wordList, ctx.usedWordList, Prns.at (Prns.fromNum (ctx.clickCount + 1)))];
	//console.log ("Used " + ctx.usedWordList.length + " words");
}

function onCheck (ctx: Context, eventData): void {
	/*
	ctx.clickCount = ctx.clickCount + 1;
	
	if (isLoaded (ctx)) {
		ctx.display = ctx.wordList [pickWord (ctx.wordList, ctx.usedWordList, Prns.at (Prns.fromNum (ctx.clickCount)))];
		console.log ("Used " + ctx.usedWordList.length + " words");
	}
	
	console.log (JSON.stringify ({
		clickCount: ctx.clickCount,
		frames: ctx.frames,
		pseudoCookie: ctx.pseudoCookie,
		date: Date.now ()
	}));
	*/
	
	ctx.clickCount = ctx.clickCount + 1;
	contextPickWord (ctx);
	ctx.checkmarkJiggle = 1.0;
	ctx.checkmarkJiggleDirection = Prns.at (Prns.fromNum (ctx.clickCount)).modulo (Prns.fromNum (2)).getLowBitsUnsigned () * 2.0 - 1.0;
	ctx.numCorrect += 1;
}

function onRefresh (ctx: Context, eventData): void {
	contextPickWord (ctx);
	ctx.refreshJiggle = 1.0;
}

function jiggleClamp (t: number): number {
	if (t < 0.0) {
		return 0.0;
	}
	else if (t > 1.0) {
		return 1.0;
	}
	else {
		return t;
	}
}

function loadTween (t: number): number {
	if (t == 0.0) {
		return 0.0;
	}
	return 0.5 * t * t + 0.5 * t * Math.sin (8.25 * Math.PI * Math.pow (t, 0.5));
}

function checkTween (t: number): number {
	if (t == 0.0) {
		return 0.0;
	}
	return t * t * Math.sin (12 * Math.PI * t);
}

function animate (ctx: Context) {
	requestAnimationFrame(function () {
		animate (ctx);
	});
	
	let animRate: number = 1.0 / 60.0;
	
	function jiggleStep (t: number): number {
		return jiggleClamp (t - animRate);
	}
	
	let width = ctx.renderer.view.offsetWidth;
	let height = ctx.renderer.view.offsetHeight;
	
	ctx.renderer.resize (width, height);
	
	if (isLoaded (ctx)) {
		ctx.loadJiggle = jiggleStep (ctx.loadJiggle);
		ctx.checkmarkJiggle = jiggleStep (ctx.checkmarkJiggle);
		ctx.richText.text = ctx.display + "\nScore: " + ctx.numCorrect;
		
		ctx.check.position.x = width * 0.5;
		ctx.check.position.y = height * (0.5 + loadTween (ctx.loadJiggle)) + 50 * checkTween (ctx.checkmarkJiggle);
		ctx.check.rotation = 0.1 * ctx.checkmarkJiggleDirection * checkTween (ctx.checkmarkJiggle);
	}
	else {
		ctx.richText.text = "Loading...";
	}
	
	ctx.frames = ctx.frames + 1;
	
	//ctx.bunny.position.x = width * 0.5;
	//ctx.bunny.position.y = height * 0.5;
	
	
	
	// render the container
	ctx.renderer.render(ctx.stage);
}
