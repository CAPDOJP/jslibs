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
					'transition':'none',
					'width':'6px',
					'z-index':'9999'
				});
				break;
			case 'holizontal':
				slider=$('<div>').css({
					'background-color':options.color,
					'border-radius':'3px',
					'cursor':'pointer',
					'height':'6px',
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
			slidestart();
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
				if (ratio>=1) return;
				if (!slider.is(':visible'))
				{
					/* リサイズに伴う位置調整 */
					switch (options.direction)
					{
						case 'vertical':
							slider.css({
								'left':(target.scrollLeft()+target[0].clientWidth-8).toString()+'px',
								'position':'absolute',
								'top':(target.scrollTop()*ratio+target.scrollTop()).toString()+'px'
							});
							break;
						case 'holizontal':
							slider.css({
								'left':(target.scrollLeft()*ratio+target.scrollLeft()).toString()+'px',
								'position':'absolute',
								'top':(target.scrollTop()+target[0].clientHeight-8).toString()+'px'
							});
							break;
					}
					slider.fadeIn();
				}
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
			var checker=target;
			if (target.parents('.floating')) checker=target.parents('.floating').first();
			if (!checker.isVisible()) {sizecheck=false;return;}
			checkslidersize();
		});
		$(window).on(('onwheel' in document)?'wheel':('onmousewheel' in document)?'mousewheel':'DOMMouseScroll',function(e,delta,deltaX,deltaY){
			if (!slider.is(':visible')) return;
			/* マウスホイールスクロール */
			var delta=(e.originalEvent.deltaY)?e.originalEvent.deltaY:(e.originalEvent.wheelDelta)?e.originalEvent.wheelDelta:e.originalEvent.detail;
			delta=(delta<0)?-100:100;
			/* 各種変数初期化 */
			down.left=target.scrollLeft();
			down.top=target.scrollTop();
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
					ratio=target[0].clientHeight/target[0].scrollHeight;
					if (slider!=null) slider.css({'height':(target[0].clientHeight*ratio).toString()+'px'});
					break;
				case 'holizontal':
					ratio=target[0].clientWidth/target[0].scrollWidth;
					if (slider!=null) slider.css({'width':(target[0].clientWidth*ratio).toString()+'px'});
					break;
			}
			sizecheck=true;
		};
		/* スクロール開始 */
		function slidestart(){
			rect.slider=slider[0].getBoundingClientRect();
			rect.target=target[0].getBoundingClientRect();
			slider.css({
				'left':rect.slider.left.toString()+'px',
				'position':'fixed',
				'top':rect.slider.top.toString()+'px'
			});
		};
		/* スクロール */
		function slidemove(amount,callback){
			switch (options.direction)
			{
				case 'vertical':
					drag.top=rect.slider.top+amount;
					if (drag.top<rect.target.top) drag.top=rect.target.top;
					if (drag.top>rect.target.bottom-slider.outerHeight(true)) drag.top=rect.target.bottom-slider.outerHeight(true);
					slider.css({'top':drag.top.toString()+'px'});
					target.scrollTop(down.top+amount/ratio,callback);
					break;
				case 'holizontal':
					drag.left=rect.slider.left+amount;
					if (drag.left<rect.target.left) drag.left=rect.target.left;
					if (drag.left>rect.target.right-slider.outerWidth(true)) drag.left=rect.target.right-slider.outerWidth(true);
					slider.css({'left':drag.left.toString()+'px'});
					target.scrollLeft(down.left+amount/ratio,callback);
					break;
			}
		};
		/* スクロール終了 */
		function slideend(){
			rect.slider=slider[0].getBoundingClientRect();
			rect.target=target[0].getBoundingClientRect();
			switch (options.direction)
			{
				case 'vertical':
					slider.css({
						'left':(target.scrollLeft()+target[0].clientWidth-8).toString()+'px',
						'position':'absolute',
						'top':(rect.slider.top-rect.target.top+target.scrollTop()).toString()+'px'
					});
					break;
				case 'holizontal':
					slider.css({
						'left':(rect.slider.left-rect.target.left+target.scrollLeft()).toString()+'px',
						'position':'absolute',
						'top':(target.scrollTop()+target[0].clientHeight-8).toString()+'px'
					});
					break;
			}
		};
	});
};
})(jQuery);
