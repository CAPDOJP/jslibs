/*
*--------------------------------------------------------------------
* jQuery-Plugin "volumeController"
* Version: 1.0
* Copyright (c) 2014 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
/*
*--------------------------------------------------------------------
* volumeController
* 移動量調整コントローラー
*--------------------------------------------------------------------
* parameters
* options @ container:コンテナ
*         @ min      :最小値
*         @ max      :最大値
*         @ default  :初期値
*         @ width    :最大幅
*         @ callback :コールバック
* -------------------------------------------------------------------
*/
/* コンストラクタ */
var volumeController = function(options){
	var options=$.extend({
		container:null,
		min:0,
		max:100,
		default:0,
		unit:'%',
		width:1000,
		callback:null
	},options);
	if (options.container==null) {alert('移動量調整コントローラーボックスを指定して下さい。');return;}
	var my=this;
	var target=options.container;
	var capture=false;
	var values={
		down:0,
		keep:0
	};
	/* コントローラー生成 */
	var container=$('<div>').css({
		'height':'2em',
		'margin':'0px auto',
		'max-width':options.width.toString()+'px',
		'padding':'1em 6em 0px 1em',
		'width':'100%'
	});
	var line=$('<div>').css({
		'border-top':'1px solid rgba(255,255,255,0.15)',
		'border-bottom':'1px solid #9E9E9E',
		'height':'0px',
		'margin':'-1px 0px 0px 0px',
		'padding':'0px',
		'transition':'none',
		'width':'100%',
		'z-index':'111'
	});
	var clip=$('<button>').css({
		'border':'none',
		'border-radius':'50%',
		'box-shadow':'1px 1px 2px rgba(0,0,0,0.5)',
		'cursor':'pointer',
		'height':'1.4em',
		'left':'0.3em',
		'margin':'0px',
		'padding':'0px',
		'position':'absolute',
		'top':'0.3em',
		'transition':'none',
		'width':'1.4em',
		'z-index':'222'
	});
	var display=$('<div>').css({
		'height':'2em',
		'line-height':'2em',
		'margin':'0px',
		'padding':'0px',
		'position':'absolute',
		'right':'0px',
		'top':'0px',
		'transition':'none',
		'width':'5em',
		'z-index':'333'
	}).append('<span></span><span>'+options.unit+'</span>');
	container.append(line);
	container.append(clip);
	container.append(display);
	target.append(container);
	this.container=container;
	this.line=line;
	this.clip=clip;
	this.display=display;
	this.min=options.min;
	this.max=options.max;
	this.volume=options.default;
	this.disabled=false;
	clip.on('touchstart mousedown',function(e){
		if (my.disabled) return;
		capture=true;
		values.down=my.clip.offset().left-my.container.offset().left;
		if (e.type=='touchstart') values.keep=e.originalEvent.touches[0].pageX;
		else values.keep=e.pageX;
		e.stopPropagation();
		e.preventDefault();
	});
	$(window).on('touchmove mousemove',function(e){
		if (my.disabled) return;
		if (!capture) return;
		var clipleft=0;
		var lineleft=my.line.offset().left;
		var containerleft=my.container.offset().left;
		if (e.type=='touchmove') clipleft=values.down+e.originalEvent.touches[0].pageX-values.keep;
		else clipleft=values.down+e.pageX-values.keep;
		if (clipleft<lineleft-containerleft-(my.clip.width()/2)) clipleft=lineleft-containerleft-(my.clip.width()/2);
		if (clipleft>lineleft-containerleft-(my.clip.width()/2)+my.line.width()) clipleft=lineleft-containerleft-(my.clip.width()/2)+my.line.width();
		my.clip.css({'left':clipleft.toString()+'px'});
		//移動量算出
		clipleft+=(my.clip.width()/2)-(lineleft-containerleft);
		my.volume=Math.floor((clipleft/my.line.width())*(options.max-options.min));
		my.volume+=options.min;
		my.display.find('span').first().text(my.volume);
		if (options.callback) options.callback(my.volume);
		e.stopPropagation();
		e.preventDefault();
	});
	$(window).on('touchend mouseup',function(e){
		if (my.disabled) return;
		if (!capture) return;
		capture=false;
		e.stopPropagation();
		e.preventDefault();
	});
	$(window).on('load resize',function(){
		my.attachvolume(my.volume);
	});
};
/* 関数定義 */
volumeController.prototype={
	/* 倍率セット */
	attachvolume:function(volume){
		var clipleft=0;
		clipleft+=this.line.offset().left-this.container.offset().left-(this.clip.width()/2);
		clipleft+=this.line.width()*((volume-this.min)/(this.max-this.min));
		this.clip.css({'left':clipleft.toString()+'px'});
		this.display.find('span').first().text(volume);
		this.volume=volume;
	},
	/* 無効判定 */
	disable:function(value){
		this.disabled=value;
		this.container.css({'opacity':((value)?'0.5':'1')});
	}
};
