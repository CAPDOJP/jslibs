/*
*--------------------------------------------------------------------
* jQuery-Plugin "colorPicker"
* Version: 1.0
* Copyright (c) 2014 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
/*
*--------------------------------------------------------------------
* colorPicker
* カラーピッカー
*--------------------------------------------------------------------
* parameters
* options @ container:コンテナ
* -------------------------------------------------------------------
*/
/* コンストラクタ */
var colorPicker = function(options){
	var options=$.extend({
		layer:null,
		container:null
	},options);
	if (options.container==null) {alert('カラーピッカーボックスを指定して下さい。');return;}
	var my=this;
	var cell=$('<p>').css({
		'display':'inline-block',
		'font-size':'0.8em',
		'line-height':'1.875em',
		'padding':'0px',
		'vertical-align':'top',
	});
	var caption=cell.clone().css({
		'margin':'0px 1em 0px 0px',
		'text-align':'right',
		'width':'3em',
		'z-index':'111'
	});
	var display=cell.clone().css({
		'margin':'0px',
		'text-align':'left',
		'width':'calc(100% - 4em)',
		'z-index':'222'
	});
	var container=$('<div>').css({
		'display':'block',
		'margin':'1em 0px',
		'padding':'0px 1em 0px 0px',
		'height':'3em',
		'width':'100%'
	});
	var canvas=$('<canvas>').css({
		'border-radius':'0.25em',
		'box-shadow':'0px 0px 1px rgba(0,0,0,0.15),1px 1px 1px rgba(255,255,255,0.35)',
		'cursor':'crosshair',
		'display':'inline-block',
		'margin':'0px',
		'vertical-align':'top',
		'z-index':'222'
	});
	var clip=$('<button>').css({
		'border':'none',
		'border-radius':'50%',
		'box-shadow':'1px 1px 2px rgba(0,0,0,0.5)',
		'cursor':'pointer',
		'height':'1.4em',
		'left':'4.3em',
		'margin':'0px',
		'padding':'0px',
		'position':'absolute',
		'top':'0.8em',
		'transition':'none',
		'width':'1.4em',
		'z-index':'333'
	});
	canvas.on('touchstart mousedown',function(e){
		var event=null;
		var clipleft=0;
		var canvasleft=0;
		var containerleft=0;
		if ($(this)[0]==my.hue.canvas[0]) my.values.target='hue';
		if ($(this)[0]==my.saturation.canvas[0]) my.values.target='saturation';
		if ($(this)[0]==my.brightness.canvas[0]) my.values.target='brightness';
		switch(my.values.target)
		{
			case 'hue':
				my.values.clip=my.hue.clip;
				my.values.canvas=my.hue.canvas;
				my.values.container=my.hue.container;
				break;
			case 'saturation':
				my.values.clip=my.saturation.clip;
				my.values.canvas=my.saturation.canvas;
				my.values.container=my.saturation.container;
				break;
			case 'brightness':
				my.values.clip=my.brightness.clip;
				my.values.canvas=my.brightness.canvas;
				my.values.container=my.brightness.container;
				break;
		}
		canvasleft=my.values.canvas.offset().left;
		containerleft=my.values.container.offset().left;
		if (e.type.match(/touch/g)) clipleft=e.originalEvent.touches[0].pageX;
		else clipleft=e.pageX;
		if (clipleft<canvasleft) return;
		if (clipleft>canvasleft+my.values.canvas.width()) return;
		my.capture=true;
		my.values.clip.css({'left':(clipleft-containerleft-(my.values.clip.width()/2)).toString()+'px'});
		/* 倍率調整 */
		my.adjustvolume();
		/* イベント発火 */
		event=new $.Event('touchstart mousedown',e);
		my.values.clip.trigger(event);
		e.stopPropagation();
		e.preventDefault();
	});
	clip.on('touchstart mousedown',function(e){
		if ($(this)[0]==my.hue.clip[0]) my.values.target='hue';
		if ($(this)[0]==my.saturation.clip[0]) my.values.target='saturation';
		if ($(this)[0]==my.brightness.clip[0]) my.values.target='brightness';
		switch(my.values.target)
		{
			case 'hue':
				my.values.clip=my.hue.clip;
				my.values.canvas=my.hue.canvas;
				my.values.container=my.hue.container;
				break;
			case 'saturation':
				my.values.clip=my.saturation.clip;
				my.values.canvas=my.saturation.canvas;
				my.values.container=my.saturation.container;
				break;
			case 'brightness':
				my.values.clip=my.brightness.clip;
				my.values.canvas=my.brightness.canvas;
				my.values.container=my.brightness.container;
				break;
		}
		my.capture=true;
		my.values.down=my.values.clip.offset().left-my.values.container.offset().left;
		if (e.type.match(/touch/g)) my.values.keep=e.originalEvent.touches[0].pageX;
		else my.values.keep=e.pageX;
		e.stopPropagation();
		e.preventDefault();
	});
	$(window).on('touchmove mousemove',function(e){
		if (!my.capture) return;
		var clipleft=0;
		var canvasleft=0;
		var containerleft=0;
		canvasleft=my.values.canvas.offset().left;
		containerleft=my.values.container.offset().left;
		if (e.type.match(/touch/g)) clipleft=my.values.down+e.originalEvent.touches[0].pageX-my.values.keep;
		else clipleft=my.values.down+e.pageX-my.values.keep;
		if (clipleft<canvasleft-containerleft-(my.values.clip.width()/2)) clipleft=canvasleft-containerleft-(my.values.clip.width()/2);
		if (clipleft>canvasleft-containerleft-(my.values.clip.width()/2)+my.values.canvas.width()) clipleft=canvasleft-containerleft-(my.values.clip.width()/2)+my.values.canvas.width();
		my.values.clip.css({'left':clipleft.toString()+'px'});
		/* 倍率調整 */
		my.adjustvolume();
		e.stopPropagation();
		e.preventDefault();
	});
	$(window).on('touchend mouseup',function(e){
		if (!my.capture) return;
		my.capture=false;
		e.stopPropagation();
		e.preventDefault();
	});
	$(window).on('resize',function(){
		/* 倍率セット */
		my.attachvolume();
	});
	this.layer=options.layer;
	this.container=options.container.css({'text-align':'center'});
	this.capture=false;
	this.callback=null;
	this.values={
		target:'',
		down:0,
		keep:0,
		clip:null,
		canvas:null,
		container:null
	};
	/* 情報パネル生成 */
	this.informations=$('<div>').css({
		'display':'inline-block',
		'border':'1px solid #9E9E9E',
		'border-radius':'0.25em',
		'margin':'0px 0px 1em 3.2em',
		'padding':'1em',
		'vertical-align':'top',
		'width':'calc(50% - 3.2em)'
	});
	/* サムネイル生成 */
	this.thumbnail=$('<div>').css({
		'display':'inline-block',
		'border':'none',
		'border-radius':'0.25em',
		'height':'8em',
		'margin':'0px 10% 1em 10%',
		'transition':'none',
		'vertical-align':'top',
		'width':'30%'
	});
	/* 16進数カラーボックス生成 */
	this.hex=$('<input type="text">').css({
		'border':'1px solid #9E9E9E',
		'border-radius':'0.25em',
		'box-shadow':'0px 0px 1px rgba(0,0,0,0.15),1px 1px 1px rgba(255,255,255,0.35)',
		'display':'inline-block',
		'font-size':'0.8em',
		'height':'1.875em',
		'line-height':'1.875em',
		'margin':'0px',
		'padding':'0px 0.25em',
		'text-align':'left',
		'vertical-align':'top',
		'width':'calc(100% - 4em)'
	})
	.on('change',function(){
		var color=$(this).val().replace('#','');
		if (color.length==6)
		{
			/* HSBカラー変換 */
			my.toHSB(color)
			/* 倍率セット */
			my.attachvolume();
			if (options.callback) options.callback('#'+color);
		}
	});
	/* 色相スライダー生成 */
	this.hue={
		display:display.clone(),
		container:container.clone(),
		caption:caption.clone().css({'text-align':'center'}).text('色相'),
		canvas:canvas.clone(true),
		clip:clip.clone(true),
		max:359,
		volume:0
	};
	/* 彩度スライダー生成 */
	this.saturation={
		display:display.clone(),
		container:container.clone(),
		caption:caption.clone().css({'text-align':'center'}).text('彩度'),
		canvas:canvas.clone(true),
		clip:clip.clone(true),
		max:100,
		volume:0
	};
	/* 明度スライダー生成 */
	this.brightness={
		display:display.clone(),
		container:container.clone(),
		caption:caption.clone().css({'text-align':'center'}).text('明度'),
		canvas:canvas.clone(true),
		clip:clip.clone(true),
		max:100,
		volume:0
	};
	this.container
	.append(this.informations
		.append(caption.clone().text('色相'))
		.append(this.hue.display)
		.append(caption.clone().text('彩度'))
		.append(this.saturation.display)
		.append(caption.clone().text('明度'))
		.append(this.brightness.display)
		.append(caption.clone().text('#'))
		.append(this.hex)
	)
	.append(this.thumbnail)
	.append(this.hue.container
		.append(this.hue.caption)
		.append(this.hue.canvas)
		.append(this.hue.clip)
	)
	.append(this.saturation.container
		.append(this.saturation.caption)
		.append(this.saturation.canvas)
		.append(this.saturation.clip)
	)
	.append(this.brightness.container
		.append(this.brightness.caption)
		.append(this.brightness.canvas)
		.append(this.brightness.clip)
	);
};
/* 関数定義 */
colorPicker.prototype={
	/* 倍率調整 */
	adjustvolume:function(){
		var position=parseInt(this.values.clip.css('left'));
		var canvasleft=this.values.canvas.offset().left;
		var containerleft=this.values.container.offset().left;
		position+=(this.values.clip.width()/2)-(canvasleft-containerleft);
		switch(this.values.target)
		{
			case 'hue':
				this.hue.volume=Math.ceil((position/this.values.canvas.width())*this.hue.max);
				break;
			case 'saturation':
				this.saturation.volume=Math.ceil((position/this.values.canvas.width())*this.saturation.max);
				break;
			case 'brightness':
				this.brightness.volume=Math.ceil((position/this.values.canvas.width())*this.brightness.max);
				break;
		}
		/* 再描画 */
		this.redraw();
		/* 16進数カラー変換 */
		this.toHEX();
		if (this.callback) this.callback('#'+this.hex.val().toString());
	},
	/* 倍率セット */
	attachvolume:function(){
		var clipleft=0;
		var volumes=[this.hue,this.saturation,this.brightness];
		/* 再描画 */
		this.redraw();
		$.each(volumes,function(index){
			clipleft=0;
			clipleft+=volumes[index].canvas.offset().left-volumes[index].container.offset().left-(volumes[index].clip.width()/2);
			clipleft+=volumes[index].canvas.width()*(volumes[index].volume/volumes[index].max);
			volumes[index].clip.css({'left':clipleft.toString()+'px'});
		});
	},
	/* 表示 */
	show:function(color,callback){
		if (this.layer) this.layer.show();
		/* 引数取得 */
		this.callback=callback;
		/* HSBカラー変換 */
		this.toHSB(color)
		/* 倍率セット */
		this.attachvolume();
	},
	/* 再描画 */
	redraw:function(){
		var height=parseInt($('body').css('font-size'))*1.5;
		var width=0;
		var context=null;
		/* 色相 */
		width=this.hue.container.width()-this.hue.caption.outerWidth(true);
		this.hue.canvas.attr('height',height.toString()+'px');
		this.hue.canvas.attr('width',width.toString()+'px');
		if (this.hue.canvas[0].getContext)
		{
			context=this.hue.canvas[0].getContext('2d');
			for (var i=0;i<width;i++)
			{
				context.fillStyle='hsl('+(i*this.hue.max/width).toString()+',50%,50%)';
				context.fillRect(i,0,i,height);
			}
		}
		/* 彩度 */
		width=this.saturation.container.width()-this.saturation.caption.outerWidth(true);
		this.saturation.canvas.attr('height',height.toString()+'px');
		this.saturation.canvas.attr('width',width.toString()+'px');
		if (this.saturation.canvas[0].getContext)
		{
			context=this.saturation.canvas[0].getContext('2d');
			for (var i=0;i<width;i++)
			{
				context.fillStyle='hsl('+this.hue.volume.toString()+','+(i*this.saturation.max/width)+'%,50%)';
				context.fillRect(i,0,i,height);
			}
		}
		/* 明度 */
		width=this.brightness.container.width()-this.brightness.caption.outerWidth(true);
		this.brightness.canvas.attr('height',height.toString()+'px');
		this.brightness.canvas.attr('width',width.toString()+'px');
		if (this.brightness.canvas[0].getContext)
		{
			context=this.brightness.canvas[0].getContext('2d');
			for (var i=0;i<width;i++)
			{
				context.fillStyle='hsl(0,0%,'+(i*this.brightness.max/width)+'%)';
				context.fillRect(i,0,i,height);
			}
		}
	},
	/* 16進数カラー変換 */
	toHEX:function(){
		var color='';
		var hsb={h:this.hue.volume,s:this.saturation.volume,b:this.brightness.volume};
		var rgb={r:0,g:0,b:0};
		hsb.h/=60;
		hsb.s/=100;
		hsb.b/=100;
		rgb.r=hsb.b;
		rgb.g=hsb.b;
		rgb.b=hsb.b;
		if (hsb.s>0)
		{
			var index=Math.floor(hsb.h);
			switch (index)
			{
				case 0:
					rgb.g=hsb.b*(1-hsb.s*(1-(hsb.h-index)));
					rgb.b=hsb.b*(1-hsb.s);
					break;
				case 1:
					rgb.r=hsb.b*(1-hsb.s*(hsb.h-index));
					rgb.b=hsb.b*(1-hsb.s);
					break;
				case 2:
					rgb.r=hsb.b*(1-hsb.s);
					rgb.b=hsb.b*(1-hsb.s*(1-(hsb.h-index)));
					break;
				case 3:
					rgb.r=hsb.b*(1-hsb.s);
					rgb.g=hsb.b*(1-hsb.s*(hsb.h-index));
					break;
				case 4:
					rgb.r=hsb.b*(1-hsb.s*(1-(hsb.h-index)));
					rgb.g=hsb.b*(1-hsb.s);
					break;
				case 5:
					rgb.g=hsb.b*(1-hsb.s);
					rgb.b=hsb.b*(1-hsb.s*(hsb.h-index));
					break;
			}
		}
		color+=$.hex(Math.round(rgb.r*255));
		color+=$.hex(Math.round(rgb.g*255));
		color+=$.hex(Math.round(rgb.b*255));
		/* 情報パネル変更 */
		this.hue.display.text(this.hue.volume);
		this.saturation.display.text(this.saturation.volume);
		this.brightness.display.text(this.brightness.volume);
		this.hex.val(color);
		/* サムネイル背景色変更 */
		this.thumbnail.css({'background-color':'#'+color});
	},
	/* HSBカラー変換 */
	toHSB:function(color){
		var colors=[];
		var hsb={h:0,s:0,b:0};
		var rgb={r:0,g:0,b:0};
		var diff={check:0,r:0,g:0,b:0};
		var max=0;
		var min=0;
		color=color.replace(/(#|rgba|rgb|\(|\))/g,'');
		colors=color.split(',');
		if (colors.length==1)
		{
			switch (color.length)
			{
				case 3:
					rgb.r=parseInt(color.substr(0,1),16);
					rgb.g=parseInt(color.substr(1,1),16);
					rgb.b=parseInt(color.substr(2,1),16);
					break;
				case 6:
					rgb.r=parseInt(color.substr(0,2),16);
					rgb.g=parseInt(color.substr(2,2),16);
					rgb.b=parseInt(color.substr(4,2),16);
					break;
			}
		}
		else
		{
			rgb.r=parseInt(colors[0]);
			rgb.g=parseInt(colors[1]);
			rgb.b=parseInt(colors[2]);
		}
		rgb.r/=255;
		rgb.g/=255;
		rgb.b/=255;
		hsb.b=Math.max(rgb.r,rgb.g,rgb.b);
		diff.check=hsb.b-Math.min(rgb.r,rgb.g,rgb.b);
		diff.r=(hsb.b-rgb.r)/6/diff.check+1/2;;
		diff.g=(hsb.b-rgb.g)/6/diff.check+1/2;;
		diff.b=(hsb.b-rgb.b)/6/diff.check+1/2;;
		if (diff.check!==0)
		{
			hsb.s=diff.check/hsb.b;
			if (rgb.r===hsb.b) hsb.h=diff.b-diff.g;
			else if (rgb.g===hsb.b) hsb.h=(1/3)+diff.r-diff.b;
			else if (rgb.b===hsb.b) hsb.h=(2/3)+rgb.g2-diff.r;
			if (hsb.h < 0) hsb.h+=1;
			else if (hsb.h > 1) hsb.h-=1;
		}
		hsb.h=Math.round(hsb.h*360);
		hsb.s=Math.round(hsb.s*100);
		hsb.b=Math.round(hsb.b*100);
		if (hsb.h<0) hsb.h=0;
		if (hsb.s<0) hsb.s=0;
		if (hsb.b<0) hsb.b=0;
		if (hsb.h>360) hsb.h=360;
		if (hsb.s>100) hsb.s=100;
		if (hsb.b>100) hsb.b=100;
		/* 倍率変数へ格納 */
		this.hue.volume=hsb.h;
		this.saturation.volume=hsb.s;
		this.brightness.volume=hsb.b;
		/* 16進数カラー変換 */
		this.toHEX();
	}
};
/* 16進数変換(桁数調整) */
jQuery.extend({
	hex:function(value){
		var sin="0123456789ABCDEF";
		if(value>255) return 'FF';
		if(value<0) return '00';
		return sin.charAt(Math.floor(value/16))+sin.charAt(value%16);
	}
});

