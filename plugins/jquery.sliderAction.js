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
*         @ hidden		:非表示親要素
*         @ limit		:スクロールバー表示最小ブラウザサイズ
* -------------------------------------------------------------------
*/
jQuery.fn.sliderAction = function(options){
	var options=$.extend({
		direction:'vertical',
		color:'rgba(0,0,0,0.75)',
		hidden:null,
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
		var ratio=0;
		var rect={
			slider:null,
			target:null
		};
		var slider=null;
		var target=$(this);
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
			down.left=target.scrollLeft();
			down.top=target.scrollTop();
			keep.left=e.clientX;
			keep.top=e.clientY;
			/* スクロール開始 */
			rect.slider=slider[0].getBoundingClientRect();
			rect.target=target[0].getBoundingClientRect();
			slider.css({
				'bottom':'auto',
				'left':rect.slider.left.toString()+'px',
				'right':'auto',
				'top':rect.slider.top.toString()+'px',
				'position':'fixed'
			});
			e.preventDefault();
			e.stopPropagation();
		}).hide();
		$(window).on({
			'mousemove':function(e){
				if ($(window).width()<options.limit) return;
				if (!capture) return;
				/* スクロール */
				switch (options.direction)
				{
					case 'vertical':
						drag.top=rect.slider.top+(e.clientY-keep.top);
						if (drag.top<rect.target.top) drag.top=rect.target.top;
						if (drag.top>rect.target.bottom-slider.outerHeight(true)) drag.top=rect.target.bottom-slider.outerHeight(true);
						slider.css({'top':drag.top.toString()+'px'});
						target.scrollTop(down.top+(e.clientY-keep.top)/ratio);
						break;
					case 'holizontal':
						drag.left=rect.slider.left+(e.clientX-keep.left);
						if (drag.left<rect.target.left) drag.left=rect.target.left;
						if (drag.left>rect.target.right-slider.outerWidth(true)) drag.left=rect.target.right-slider.outerWidth(true);
						slider.css({'left':drag.left.toString()+'px'});
						target.scrollLeft(down.left+(e.clientX-keep.left)/ratio);
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
				rect.slider=slider[0].getBoundingClientRect();
				rect.target=target[0].getBoundingClientRect();
				switch (options.direction)
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
			}
			/* スライダーサイズ調整 */
			if (!options.hidden!=null && !options.hidden.is(':visible')) {sizecheck=false;return;}
			checkslidersize();
		});
		/* スライダーサイズ調整 */
		function checkslidersize(){
			switch (options.direction)
			{
				case 'vertical':
					ratio=target.height()/target[0].scrollHeight;
					if (slider!=null) slider.css({'height':(target.height()*ratio).toString()+'px'});
					break;
				case 'holizontal':
					ratio=target.width()/target[0].scrollWidth;
					if (slider!=null) slider.css({'width':(target.width()*ratio).toString()+'px'});
					break;
			}
			sizecheck=true;
		};
	});
};
})(jQuery);
