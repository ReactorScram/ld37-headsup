declare var document: any;
declare function requestAnimationFrame (fn: any): void;
declare class Howl {
	constructor (params: Object);
	play (): void;
}
declare class XMLHttpRequest {
	onload: any;
	readyState: number;
	responseText: string;
	
	open (verb: string, url: string, async: boolean): void;
	send (idk: any): void;
}

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

interface Vec2 {
	x: number;
	y: number;
}

interface PixiView {
	offsetWidth: number;
	offsetHeight: number;
}

interface PixiContainer {
	addChild (child: any): void;
	position: Vec2;
	rotation: number;
}

interface PixiRenderer {
	view: any;
	render (stage: PixiContainer): void;
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

enum ESound {
	Correct,
	Refresh,
}

class Context {
	check: PixiContainer;
	refresh: PixiSprite;
	
	clock: PixiSprite;
	clockHand: PixiSprite;
	
	clickCount: number;
	numCorrect: number;
	frames: number;
	display: string;
	renderer: PixiRenderer;
	richText: any;
	stage: PixiContainer;
	style: any;
	wordList: Array <string>;
	
	// Must stay sorted for the algo to be efficient
	usedWordList: Array <number>;
	
	targetBasisAngle: number;
	
	// Jiggle timers
	checkmarkJiggle: number;
	checkmarkJiggleDirection: number;
	refreshJiggle: number;
	loadJiggle: number;
	basisJiggle: number;
	textJiggle: number;
	
	sounds: Map <ESound, any>;
	
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
		this.basisJiggle = 0.0;
		this.textJiggle = 0.0;
		
		this.sounds = new Map ([
			[ESound.Correct, new Howl ({
				src: ['sounds/correct.ogg', 'sounds/correct.webm']
			})],
			[ESound.Refresh, new Howl ({
				src: ['sounds/refresh.ogg', 'sounds/refresh.webm']
			})],
		]);
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
	
	ctx.check = new PIXI.Container ();
	ctx.check.addChild (check);
	
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
	
	ctx.stage.addChild (ctx.check);
	ctx.stage.addChild (ctx.refresh);
	
	let clockTex = PIXI.Texture.fromImage ("images/clock.png");
	let clock = new PIXI.Sprite (clockTex);
	
	clock.anchor.x = 0.5;
	clock.anchor.y = 0.5;
	ctx.stage.addChild (clock);
	ctx.clock = clock;
	
	let clockHandTex = PIXI.Texture.fromImage ("images/clock-hand.png");
	let clockHand = new PIXI.Sprite (clockHandTex);
	
	clockHand.anchor.x = 0.5;
	clockHand.anchor.y = 0.5;
	ctx.stage.addChild (clockHand);
	ctx.clockHand = clockHand;
	
	ctx.style = {
		align: "center",
		fontFamily : 'Sans',
		fontSize : '30px',
		fontStyle : 'italic',
		fontWeight : 'bold',
		fill : '#F7EDCA',
		stroke : '#277007',
		strokeThickness : 6,
		dropShadow : false,
		wordWrap : true,
		wordWrapWidth : 240
	};
	
	ctx.richText = new PIXI.Text('',ctx.style);
	ctx.richText.anchor = { x: 0.5, y: 0.5 };
	
	ctx.check.addChild (ctx.richText);
	
	ctx.stage.addChild(ctx.check);
	
	ctx.basisJiggle = getTargetBasis (ctx.renderer.view);
	
	startAnimating (ctx);
	
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
		//startAnimating (ctx);
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
	ctx.clickCount = ctx.clickCount + 1;
	ctx.display = ctx.wordList [pickWord (ctx.wordList, ctx.usedWordList, Prns.at (Prns.fromNum (ctx.clickCount)))];
	//console.log ("Used " + ctx.usedWordList.length + " words");
}

function onCheck (ctx: Context, eventData): void {
	contextPickWord (ctx);
	ctx.checkmarkJiggle = 1.0;
	ctx.checkmarkJiggleDirection = ctx.clickCount % 2.0 * 2.0 - 1.0;
	ctx.numCorrect += 1;
	
	ctx.sounds.get (ESound.Correct).play ();
}

function onRefresh (ctx: Context, eventData): void {
	contextPickWord (ctx);
	ctx.refreshJiggle = 1.0;
	
	ctx.sounds.get (ESound.Refresh).play ();
	ctx.textJiggle = 1.0;
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

function smoothStep (t: number): number {
	if (t == 0.0) {
		return 0.0;
	}
	return 3 * t * t - 2 * t * t * t;
}

function refreshYTween (t: number): number {
	if (t == 0.0) {
		return 0.0;
	}
	return Math.sin (Math.PI * 2.0 * smoothStep (t));
}

function refreshRotTween (t: number): number {
	if (t == 0.0) {
		return 0.0;
	}
	let ts = smoothStep (t);
	return ts - 0.25 * Math.sin (Math.PI * 2.0 * ts);
}

function tickTween (t: number): number {
	let t2 = 0.0;
	
	if (t < 0.125) {
		t2 = t * 8.0;
	}
	else if (t < 0.25) {
		t2 = (0.25 - t) * 8.0;
	}
	
	return smoothStep (t2);
}

function tickTockTween (t: number): number {
	if (t < 0.5) {
		return tickTween (t * 2.0);
	}
	else {
		return -tickTween (t * 2.0 - 1.0);
	}
}

function getTargetBasis (view: any): number {
	let width = view.offsetWidth;
	let height = view.offsetHeight;
	
	if (height > width) {
		return 1.0;
	}
	else {
		return 0.0;
	}
}

function startAnimating (ctx: Context) {
	requestAnimationFrame(function (timestamp) {
		animate (ctx, timestamp);
	});
}

function animate (ctx: Context, timestamp) {
	//let anythingChanged = ctx.checkmarkJiggle > 0.0 || ctx.refreshJiggle > 0.0 || ctx.loadJiggle > 0.0 || ctx.basisJiggle > 0.0;
	
	startAnimating (ctx);
	
	let animRate: number = 1.0 / 30.0;
	
	function jiggleStep (t: number): number {
		return jiggleClamp (t - animRate);
	}
	
	function jiggleTowards (t: number, target: number): number {
		if (t < target) {
			t = t + animRate;
			if (t > target) {
				t = target;
			}
		}
		else {
			t = t - animRate;
			if (t < target) {
				t = target;
			}
		}
		
		return t;
	}
	
	let width = ctx.renderer.view.offsetWidth;
	let height = ctx.renderer.view.offsetHeight;
	
	ctx.targetBasisAngle = getTargetBasis (ctx.renderer.view);
	
	ctx.basisJiggle = jiggleTowards (ctx.basisJiggle, ctx.targetBasisAngle);
	
	let tweenedBasis = Math.PI * 0.5 * refreshRotTween (ctx.basisJiggle);
	
	let basis = {
		x: Math.cos (tweenedBasis),
		y: Math.sin (tweenedBasis),
	};
	
	let basis2 = {
		x: basis.y,
		y: -basis.x,
	};
	
	let center = {
		x: width * 0.5, 
		y: height * 0.5,
	};
	
	// Hey reactor did you know that JS has matrix libs
	// yes
	function transform (pos) {
		return {
			x: center.x + pos.x * basis2.x + pos.y * basis.x,
			y: center.y + pos.x * basis2.y + pos.y * basis.y,
		};
	}
	
	ctx.renderer.resize (width, height);
	
	let timeSeconds = timestamp / 1000.0;
	let totalTime = 60.0;
	let timeT = (timeSeconds / totalTime) % 1.0;
	
	if (isLoaded (ctx)) {
		ctx.loadJiggle = jiggleStep (ctx.loadJiggle);
		ctx.checkmarkJiggle = jiggleStep (ctx.checkmarkJiggle);
		ctx.refreshJiggle = jiggleStep (ctx.refreshJiggle);
		ctx.textJiggle = jiggleStep (ctx.textJiggle);
		
		ctx.richText.text = ctx.display;
		
		// I should have floored the 255.0 * clause before multiplying it
		// but this produces a crazy rainbow effect that I like.
		ctx.richText.tint = 0x010101 * (255.0 * (1.0 - ctx.textJiggle));
		
		let loadT = loadTween (ctx.loadJiggle);
		let checkT = checkTween (ctx.checkmarkJiggle);
		//let refreshT = refreshTween (ctx.refreshJiggle);
		
		let loadY = height * loadT;
		
		ctx.check.position = transform ({ x: 0.0, y: 100.0 });
		ctx.check.position.x += 0.0;
		ctx.check.position.y += loadY + 50 * checkT;
		ctx.check.rotation = 0.2 * ctx.checkmarkJiggleDirection * checkT;
		
		ctx.refresh.position = transform ({ x: -50.0, y: -150.0 });
		ctx.refresh.position.x += 0.0;
		ctx.refresh.position.y += loadY + 30 * refreshYTween (ctx.refreshJiggle);
		ctx.refresh.rotation = -2.0 * Math.PI * refreshRotTween (ctx.refreshJiggle);
		
		ctx.clock.position = transform ({ x: 100.0, y: -150.0 });
		ctx.clock.position.x += 8.0 * timeT * timeT * tickTockTween ((timeSeconds * 0.5) % 1.0);
		ctx.clock.position.y += loadY;
		
		ctx.clockHand.position = ctx.clock.position;
		ctx.clockHand.rotation = timeT * 2.0 * Math.PI;
	}
	else {
		ctx.richText.text = "Loading...";
	}
	
	ctx.frames = ctx.frames + 1;
	
	// render the container
	ctx.renderer.render(ctx.stage);
}
