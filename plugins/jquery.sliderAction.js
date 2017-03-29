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
		var container=null;
		var down={
				left:0,
				top:0
		};
		var drag={
			left:0,
			start:0,
			top:0
		};
		var ratio=0;
		var rect=null;
		var slider=null;
		var target=$(this);
		container=target.parent();
		/* スライダー生成 */
		switch (options.direction)
		{
			case 'vertical':
				slider=$('<div>').css({
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
				break;
			case 'holizontal':
				slider=$('<div>').css({
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
				break;
		}
		/* スライダーイベント定義 */
		slider.on('mousedown',function(e){
			if ($(window).width()<options.limit) return;
			capture=true;
			/* 各種変数初期化 */
			rect=slider[0].getBoundingClientRect();
			slider.css({
				'bottom':'auto',
				'left':rect.left.toString()+'px',
				'right':'auto',
				'top':rect.top.toString()+'px',
				'position':'fixed'
			});
			down.left=target.scrollLeft();
			down.top=target.scrollTop();
			switch (options.direction)
			{
				case 'vertical':
					drag.start=e.clientY;
					break;
				case 'holizontal':
					drag.start=e.clientX;
					break;
			}
			e.preventDefault();
			e.stopPropagation();
		}).hide();
		$(window).on({
			'mousemove':function(e){
				if ($(window).width()<options.limit) return;
				if (!capture) return;
				/* 各種変数初期化 */
				switch (options.direction)
				{
					case 'vertical':
						drag.top=rect.top+(e.clientY-drag.start);
						if (drag.top<0) drag.top=0;
						if (drag.top>container.innerHeight()-slider.outerHeight(true)) drag.top=container.innerHeight()-slider.outerHeight(true);
						slider.css({'top':drag.top.toString()+'px'});
						target.scrollTop(down.top+(e.clientY-drag.start)/ratio);
						break;
					case 'holizontal':
						drag.left=rect.left+(e.clientX-drag.start);
						if (drag.left<0) drag.left=0;
						if (drag.left>container.innerWidth()-slider.outerWidth(true)) drag.left=container.innerWidth()-slider.outerWidth(true);
						slider.css({'left':drag.left.toString()+'px'});
						target.scrollLeft(down.left+(e.clientX-drag.start)/ratio);
						break;
				}
				e.preventDefault();
				e.stopPropagation();
			},
			'mouseup':function(e){
				if ($(window).width()<options.limit) return;
				if (!capture) return;
				capture=false;
				rect=slider[0].getBoundingClientRect();
				switch (options.direction)
				{
					case 'vertical':
						slider.css({
							'left':'auto',
							'right':'2px',
							'top':(rect.top+target.scrollTop()).toString()+'px',
							'position':'absolute'
						});
						break;
					case 'holizontal':
						slider.css({
							'bottom':'2px',
							'left':(rect.left+target.scrollLeft()).toString()+'px',
							'top':'auto',
							'position':'absolute'
						});
						break;
				}
				slider.fadeOut();
				e.preventDefault();
				e.stopPropagation();
			}
		});
		/* コンテナボックスイベント定義 */
		target.on({
			'mousemove':function(){
				if ($(window).width()<options.limit) return;
				if (ratio>=1) return;
				if (!slider.is(':visible')) slider.fadeIn();
			},
			'mouseleave':function(){
				if (capture) return;
				slider.fadeOut();
			}
		}).append(slider);
		/* ウインドウイベント定義 */
		$(window).on('load resize scroll',function(){
			switch (options.direction)
			{
				case 'vertical':
					/* スライダーサイズ調整 */
					ratio=container.innerHeight()/target[0].scrollHeight;
					if (slider!=null) slider.css({'height':(container.innerHeight()*ratio).toString()+'px'});
					/* スタイルシート調整 */
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
					/* スライダーサイズ調整 */
					ratio=container.innerWidth()/target[0].scrollWidth;
					if (slider!=null) slider.css({'width':(container.innerWidth()*ratio).toString()+'px'});
					/* スタイルシート調整 */
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
			}
		});
	});
};
})(jQuery);
