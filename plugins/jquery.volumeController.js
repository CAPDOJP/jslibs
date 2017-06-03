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
		precision:0,
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
		'padding':'1em 4.25em 0px 1em',
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
		'margin':'0px',
		'padding':'0.25em 0px',
		'position':'absolute',
		'right':'0px',
		'top':'0px',
		'transition':'none',
		'width':'3.5em',
		'z-index':'333'
	});
	var input=$('<input type="text">').css({
		'background-color':'transparent',
		'border':'none',
		'display':'inline-block',
		'height':'1.5em',
		'line-height':'1.5em',
		'margin':'0px',
		'padding':'0px',
		'padding-right':'1.05em',
		'text-align':'right',
		'vertical-align':'top',
		'width':'100%',
		'z-index':'111'
	})
	.on('change',function(){
		if (!$.isNumeric($(this).val())) $(this).val(my.volume);
		if ($(this).val()<my.min) $(this).val(my.min);
		if ($(this).val()>my.max) $(this).val(my.max);
		my.attachvolume($(this).val());
		if (options.callback) options.callback(my.volume);
	});
	var unit=$('<span>'+options.unit+'</span>').css({
		'display':'inline-block',
		'font-size':'0.75em',
		'height':'2em',
		'line-height':'2em',
		'margin-left':'-1.35em',
		'text-align':'center',
		'vertical-align':'top',
		'width':'1.35em',
		'z-index':'222'
	});
	container.append(line);
	container.append(clip);
	container.append(display.append(input).append(unit));
	target.append(container);
	this.container=container;
	this.line=line;
	this.clip=clip;
	this.display=display;
	this.input=input;
	this.default=options.default;
	this.min=options.min;
	this.max=options.max;
	this.volume=options.default;
	this.disabled=false;
	this.precision=(options.precision==0)?1:Math.pow(10,options.precision);
	container.on('touchstart mousedown',function(e){
		if (my.disabled) return;
		var event=null;
		var clipleft=0;
		var lineleft=my.line.offset().left;
		var containerleft=my.container.offset().left;
		if (e.type.match(/touch/g)) clipleft=e.originalEvent.touches[0].pageX;
		else clipleft=e.pageX;
		if (clipleft<lineleft) return;
		if (clipleft>lineleft+my.line.width()) return;
		capture=true;
		my.clip.css({'left':(clipleft-containerleft-(my.clip.width()/2)).toString()+'px'});
		/* イベント発火 */
		event=new $.Event('touchstart mousedown',e);
		my.clip.trigger(event);
		e.stopPropagation();
		e.preventDefault();
	});
	clip.on('touchstart mousedown',function(e){
		if (my.disabled) return;
		capture=true;
		values.down=my.clip.offset().left-my.container.offset().left;
		if (e.type.match(/touch/g)) values.keep=e.originalEvent.touches[0].pageX;
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
		if (e.type.match(/touch/g)) clipleft=values.down+e.originalEvent.touches[0].pageX-values.keep;
		else clipleft=values.down+e.pageX-values.keep;
		if (clipleft<lineleft-containerleft-(my.clip.width()/2)) clipleft=lineleft-containerleft-(my.clip.width()/2);
		if (clipleft>lineleft-containerleft-(my.clip.width()/2)+my.line.width()) clipleft=lineleft-containerleft-(my.clip.width()/2)+my.line.width();
		my.clip.css({'left':clipleft.toString()+'px'});
		//移動量算出
		clipleft+=(my.clip.width()/2)-(lineleft-containerleft);
		my.volume=Math.floor((clipleft/my.line.width())*(options.max-options.min)*my.precision);
		my.volume+=options.min;
		my.volume/=my.precision;
		my.input.val(my.volume);
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
		this.input.val(volume);
		this.volume=volume;
	},
	/* 無効判定 */
	disable:function(value){
		this.disabled=value;
		this.container.css({'opacity':((value)?'0.5':'1')});
	},
	/* クリップ再配置 */
	relocation:function(){
		this.attachvolume(this.volume);
	}
};
