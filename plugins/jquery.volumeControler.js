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
		line:null,
		clip:null,
		display:null,
		min:0,
		max:100,
		default:0,
		callback:null
	},options);
	return $(this).each(function(){
		var capture=false;
		var target=$(this);
		var values={
			down:0,
			keep:0
		};
		var volume=options.default;
		if (options.line) options.line.css({'transition':'none'});
		if (options.clip) options.clip.css({'transition':'none'});
		if (options.display) options.display.css({'transition':'none'});
		$.data(target[0],'line',options.line);
		$.data(target[0],'clip',options.clip);
		$.data(target[0],'display',options.display);
		$.data(target[0],'min',options.min);
		$.data(target[0],'max',options.max);
		options.clip.on('touchstart mousedown',function(e){
			capture=true;
			values.down=options.clip.offset().left-target.offset().left;
			if (e.type=='touchstart') values.keep=e.originalEvent.touches[0].pageX;
			else values.keep=e.pageX;
			e.preventDefault();
		});
		$(window).on('touchmove mousemove',function(e){
			if (!capture) return;
			var clipleft=0;
			var lineleft=options.line.offset().left;
			var targetleft=target.offset().left;
			if (e.type=='touchmove') clipleft=values.down+e.originalEvent.touches[0].pageX-values.keep;
			else clipleft=values.down+e.pageX-values.keep;
			if (clipleft<lineleft-targetleft-(options.clip.width()/2)) clipleft=lineleft-targetleft-(options.clip.width()/2);
			if (clipleft>lineleft-targetleft-(options.clip.width()/2)+options.line.width()) clipleft=lineleft-targetleft-(options.clip.width()/2)+options.line.width();
			options.clip.css({'left':clipleft.toString()+'px'});
			//移動量算出
			clipleft+=(options.clip.width()/2)-(lineleft-targetleft);
			volume=Math.floor((clipleft/options.line.width())*(options.max-options.min));
			if (options.display) options.display.text(volume);
			if (options.callback) options.callback(volume);
			e.preventDefault();
		});
		$(window).on('touchend mouseup',function(e){
			if (!capture) return;
			capture=false;
			e.preventDefault();
		});
		$(window).on('load resize',function(){
			target.attachvolume(volume);
		});
	});
};
jQuery.fn.attachvolume = function(volume){
	return $(this).each(function(){
		var target=$(this);
		var clipleft=0;
		if (!$.data(target[0],'line')) return;
		if (!$.data(target[0],'clip')) return;
		if (!$.data(target[0],'display')) return;
		clipleft+=$.data(target[0],'line').offset().left-target.offset().left-($.data(target[0],'clip').width()/2);
		clipleft+=$.data(target[0],'line').width()*(volume/($.data(target[0],'max')-$.data(target[0],'min')));
		$.data(target[0],'clip').css({'left':clipleft.toString()+'px'});
		if ($.data(target[0],'display')) $.data(target[0],'display').text(volume);
	});
};
})(jQuery);
