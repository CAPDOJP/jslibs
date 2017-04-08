/*
*--------------------------------------------------------------------
* jQuery-Plugin "sliderAction"
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
* parameters
* options @ direction	:スクロール向き[vertical:holizontal]
*         @ color		:スクロールバー背景色
*         @ limit		:スクロールバー表示最小ブラウザサイズ
* -------------------------------------------------------------------
*/
jQuery.fn.sliderAction = function(options){
	var options=$.extend({
		direction:'vertical',
		color:'rgba(0,0,0,0.75)',
		limit:0
	},options);
	return $(this).each(function(){
		var capture=false;
		var sizecheck=false;
		var down={
			left:0,
			top:0
		};
		var drag={
			left:0,
			top:0
		};
		var keep={
			left:0,
			top:0
		};
		var ratiovertical=1;
		var ratioholizontal=1;
		var rect={
			slider:null,
			target:null
		};
		var slider=null;
		var slidervertical=null;
		var sliderholizontal=null;
		var target=$(this);
		/* スライダー生成 */
		slidervertical=$('<div id="slidervertical">').css({
			'background-color':options.color,
			'border-radius':'3px',
			'cursor':'pointer',
			'height':'100%',
			'margin':'0px',
			'padding':'0px',
			'position':'absolute',
			'right':'2px',
			'top':'0px',
			'transition':'none',
			'width':'6px',
			'z-index':'9999'
		});
		sliderholizontal=$('<div id="sliderholizontal">').css({
			'background-color':options.color,
			'border-radius':'3px',
			'bottom':'2px',
			'cursor':'pointer',
			'height':'6px',
			'left':'0px',
			'margin':'0px',
			'padding':'0px',
			'position':'absolute',
			'transition':'none',
			'width':'100%',
			'z-index':'9999'
		});
		/* スライダーイベント定義 */
		$([slidervertical,sliderholizontal]).on('mousedown',function(e){
			if ($(window).width()<options.limit) return;
			capture=true;
			/* 各種変数初期化 */
			down.left=target.scrollLeft();
			down.top=target.scrollTop();
			keep.left=e.clientX;
			keep.top=e.clientY;
			slider=$(this);
			/* スクロール開始 */
			slidestart();
			e.preventDefault();
			e.stopPropagation();
		}).hide();
		$(window).on({
			'mousemove':function(e){
				if ($(window).width()<options.limit) return;
				if (!capture) return;
				/* スクロール */
				switch (slider.attr('id').replace(/slier/g,''))
				{
					case 'vertical':
						slidemove(e.clientY-keep.top,null);
						break;
					case 'holizontal':
						slidemove(e.clientX-keep.left,null);
						break;
				}
				e.preventDefault();
				e.stopPropagation();
			},
			'mouseup':function(e){
				if ($(window).width()<options.limit) return;
				if (!capture) return;
				capture=false;
				/* スクロール終了 */
				slideend();
				slider.fadeOut();
				e.preventDefault();
				e.stopPropagation();
			}
		});
		/* コンテナボックスイベント定義 */
		target.on({
			'mousemove':function(){
				if ($(window).width()<options.limit) return;
				if (!sizecheck) checkslidersize();
				switch (options.direction)
				{
					case 'vertical':
						if (ratiovertical>=1) return;
						else if (!slidervertical.is(':visible')) slidervertical.fadeIn();
						break;
					case 'holizontal':
						if (ratioholizontal>=1) return;
						else if (!sliderholizontal.is(':visible')) sliderholizontal.fadeIn();
						break;
					case 'both':
						if (ratiovertical>=1 && ratioholizontal>=1) return;
						else
						{
							if (ratiovertical<1)
								if (!slidervertical.is(':visible')) slidervertical.fadeIn();
							if (ratioholizontal<1)
								if (!sliderholizontal.is(':visible')) sliderholizontal.fadeIn();
						}
						break;
				}
			},
			'mouseleave':function(){
				if (capture) return;
				slidervertical.fadeOut();
				sliderholizontal.fadeOut();
			}
		})
		.append(slidervertical)
		.append(sliderholizontal);
		/* ウインドウイベント定義 */
		$(window).on('load resize scroll',function(){
			/* スタイルシート調整 */
			switch (options.direction)
			{
				case 'vertical':
					if ($(window).width()<options.limit)
					{
						target.css({
							'overflow-x':'hidden',
							'overflow-y':'auto',
							'-webkit-overflow-scrolling':'touch'
						});
					}
					else
					{
						target.css({
							'overflow':'hidden',
							'-webkit-overflow-scrolling':'touch'
						});
					}
					break;
				case 'holizontal':
					if ($(window).width()<options.limit)
					{
						target.css({
							'overflow-x':'auto',
							'overflow-y':'hidden',
							'white-space':'nowrap',
							'-webkit-overflow-scrolling':'touch'
						});
					}
					else
					{
						target.css({
							'overflow':'hidden',
							'white-space':'nowrap',
							'-webkit-overflow-scrolling':'touch'
						});
					}
					break;
				case 'both':
					if ($(window).width()<options.limit)
					{
						target.css({
							'overflow':'auto',
							'-webkit-overflow-scrolling':'touch'
						});
					}
					else
					{
						target.css({
							'overflow':'hidden',
							'-webkit-overflow-scrolling':'touch'
						});
					}
					break;
			}
			/* スライダーサイズ調整 */
			if (!target.is(':visible')) {sizecheck=false;return;}
			checkslidersize();
		});
		$(window).on(('onwheel' in document)?'wheel':('onmousewheel' in document)?'mousewheel':'DOMMouseScroll',function(e,delta,deltaX,deltaY){
			/* マウスホイールスクロール */
			var delta=(e.originalEvent.deltaY)?e.originalEvent.deltaY:(e.originalEvent.wheelDelta)?e.originalEvent.wheelDelta:e.originalEvent.detail;
			delta=(delta<0)?-100:100;
			/* 各種変数初期化 */
			down.left=target.scrollLeft();
			down.top=target.scrollTop();
			switch (options.direction)
			{
				case 'vertical':
					slider=slidervertical;
					break;
				case 'holizontal':
					slider=sliderholizontal;
					break;
				case 'both':
					slider=slidervertical;
					break;
			}
			if (!slider.is(':visible')) return;
			/* スクロール開始 */
			slidestart();
			/* スクロール */
			slidemove(delta,slideend);
			e.preventDefault();
			e.stopPropagation();
		});
		/* スライダーサイズ調整 */
		function checkslidersize(){
			switch (options.direction)
			{
				case 'vertical':
					ratiovertical=target[0].clientHeight/target[0].scrollHeight;
					slidervertical.css({'height':(target[0].clientHeight*ratiovertical).toString()+'px'});
					break;
				case 'holizontal':
					ratioholizontal=target[0].clientWidth/target[0].scrollWidth;
					sliderholizontal.css({'width':(target[0].clientWidth*ratioholizontal).toString()+'px'});
					break;
				case 'both':
					ratiovertical=target[0].clientHeight/target[0].scrollHeight;
					slidervertical.css({'height':(target[0].clientHeight*ratiovertical).toString()+'px'});
					ratioholizontal=target[0].clientWidth/target[0].scrollWidth;
					sliderholizontal.css({'width':(target[0].clientWidth*ratioholizontal).toString()+'px'});
					break;
			}
			sizecheck=true;
		};
		/* スクロール開始 */
		function slidestart(){
			rect.slider=slider[0].getBoundingClientRect();
			rect.target=target[0].getBoundingClientRect();
			slider.css({
				'bottom':'auto',
				'left':rect.slider.left.toString()+'px',
				'right':'auto',
				'top':rect.slider.top.toString()+'px',
				'position':'fixed'
			});
		};
		/* スクロール */
		function slidemove(amount,callback){
			switch (slider.attr('id').replace(/slier/g,''))
			{
				case 'vertical':
					drag.top=rect.slider.top+amount;
					if (drag.top<rect.target.top) drag.top=rect.target.top;
					if (drag.top>rect.target.bottom-slider.outerHeight(true)) drag.top=rect.target.bottom-slider.outerHeight(true);
					slider.css({'top':drag.top.toString()+'px'});
					target.scrollTop(down.top+amount/ratiovertical,callback);
					break;
				case 'holizontal':
					drag.left=rect.slider.left+amount;
					if (drag.left<rect.target.left) drag.left=rect.target.left;
					if (drag.left>rect.target.right-slider.outerWidth(true)) drag.left=rect.target.right-slider.outerWidth(true);
					slider.css({'left':drag.left.toString()+'px'});
					target.scrollLeft(down.left+amount/ratioholizontal,callback);
					break;
			}
		};
		/* スクロール終了 */
		function slideend(){
			rect.slider=slider[0].getBoundingClientRect();
			rect.target=target[0].getBoundingClientRect();
			switch (slider.attr('id').replace(/slier/g,''))
			{
				case 'vertical':
					slider.css({
						'left':'auto',
						'right':'2px',
						'top':(rect.slider.top-rect.target.top+target.scrollTop()).toString()+'px',
						'position':'absolute'
					});
					break;
				case 'holizontal':
					slider.css({
						'bottom':'2px',
						'left':(rect.slider.left-rect.target.left+target.scrollLeft()).toString()+'px',
						'top':'auto',
						'position':'absolute'
					});
					break;
			}
		};
	});
};
})(jQuery);
