/*
*--------------------------------------------------------------------
* jQuery-Plugin "volumeControler"
* Version: 1.0
* Copyright (c) 2014 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
(function($){
/*
*--------------------------------------------------------------------
* volumeControler
* 移動量調整コントローラー
*--------------------------------------------------------------------
* parameters
* options @ line     :境界線ブロック
*         @ clip     :クリップブロック
*         @ display  :移動量表示ブロック
*         @ min      :最小値
*         @ max      :最大値
*         @ default  :初期値
*         @ callback :コールバック
* -------------------------------------------------------------------
*/
jQuery.fn.volumeControler = function(options){
	var options=$.extend({
		min:0,
		max:100,
		default:0,
		width:1000,
		callback:null
	},options);
	return $(this).each(function(){
		var capture=false;
		var target=$(this);
		var values={
			down:0,
			keep:0
		};
		/* コントローラー生成 */
		var container=$('<div>').css({
			'height':'2em',
			'margin':'0px auto',
			'max-width':options.width.toString()+'px',
			'width':'100%'
		});
		var line=$('<div>').css({
			'border-top':'1px solid rgba(255,255,255,0.15)',
			'border-bottom':'1px solid #9E9E9E',
			'height':'0px',
			'left':'1em',
			'position':'absolute',
			'top':'calc(1em - 1px)',
			'transition':'none',
			'width':'calc(100% - 7em)',
			'z-index':'111'
		});
		var clip=$('<button>').css({
			'border':'none',
			'border-radius':'50%',
			'box-shadow':'1px 1px 2px rgba(0,0,0,0.5)',
			'cursor':'pointer',
			'height':'1em',
			'left':'0.5em',
			'position':'absolute',
			'top':'0.5em',
			'transition':'none',
			'width':'1em',
			'z-index':'222'
		});
		var display=$('<div>').css({
			'height':'2em',
			'line-height':'2em',
			'position':'absolute',
			'right':'0px',
			'top':'0px',
			'transition':'none',
			'width':'5em',
			'z-index':'333'
		}).append('<span></span><span>%</span>');
		container.append(line);
		container.append(clip);
		container.append(display);
		target.append(container);
		$.data(target[0],'container',container);
		$.data(target[0],'line',line);
		$.data(target[0],'clip',clip);
		$.data(target[0],'display',display);
		$.data(target[0],'min',options.min);
		$.data(target[0],'max',options.max);
		$.data(target[0],'volume',options.default);
		clip.on('touchstart mousedown',function(e){
			capture=true;
			values.down=clip.offset().left-container.offset().left;
			if (e.type=='touchstart') values.keep=e.originalEvent.touches[0].pageX;
			else values.keep=e.pageX;
			e.preventDefault();
		});
		$(window).on('touchmove mousemove',function(e){
			if (!capture) return;
			var clipleft=0;
			var lineleft=line.offset().left;
			var containerleft=container.offset().left;
			if (e.type=='touchmove') clipleft=values.down+e.originalEvent.touches[0].pageX-values.keep;
			else clipleft=values.down+e.pageX-values.keep;
			if (clipleft<lineleft-containerleft-(clip.width()/2)) clipleft=lineleft-containerleft-(clip.width()/2);
			if (clipleft>lineleft-containerleft-(clip.width()/2)+line.width()) clipleft=lineleft-containerleft-(clip.width()/2)+line.width();
			clip.css({'left':clipleft.toString()+'px'});
			//移動量算出
			clipleft+=(clip.width()/2)-(lineleft-containerleft);
			$.data(target[0],'volume',Math.floor((clipleft/line.width())*(options.max-options.min)));
			display.find('span').first().text($.data(target[0],'volume'));
			if (options.callback) options.callback($.data(target[0],'volume'));
			e.preventDefault();
		});
		$(window).on('touchend mouseup',function(e){
			if (!capture) return;
			capture=false;
			e.preventDefault();
		});
		$(window).on('load resize',function(){
			target.attachvolume($.data(target[0],'volume'));
		});
	});
};
jQuery.fn.attachvolume = function(volume){
	return $(this).each(function(){
		var target=$(this);
		var clipleft=0;
		if (!$.data(target[0],'container')) return;
		if (!$.data(target[0],'line')) return;
		if (!$.data(target[0],'clip')) return;
		if (!$.data(target[0],'display')) return;
		clipleft+=$.data(target[0],'line').offset().left-$.data(target[0],'container').offset().left-($.data(target[0],'clip').width()/2);
		clipleft+=$.data(target[0],'line').width()*(volume/($.data(target[0],'max')-$.data(target[0],'min')));
		$.data(target[0],'clip').css({'left':clipleft.toString()+'px'});
		$.data(target[0],'display').find('span').first().text(volume);
		$.data(target[0],'volume',volume);
	});
};
})(jQuery);
