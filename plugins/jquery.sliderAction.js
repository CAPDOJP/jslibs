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
		var ratio={
			holizontal:0,
			vertical:0
		};
		var rect={
			slider:null,
			other:null,
			target:null
		};
		var slider={
			base:null,
			holizontal:null,
			other:null,
			target:null,
			vertical:null
		};
		var target=$(this);
		/* スライダー生成 */
		slider.base=$('<div>').css({
			'background-color':options.color,
			'border-radius':'3px',
			'cursor':'pointer',
			'margin':'0px',
			'padding':'0px',
			'position':'absolute',
			'transition':'none',
			'z-index':'9999'
		})
		.on('mousedown',function(e){
			if ($(window).width()<options.limit) return;
			capture=true;
			/* 各種変数初期化 */
			down.left=target.scrollLeft();
			down.top=target.scrollTop();
			keep.left=e.clientX;
			keep.top=e.clientY;
			slider.target=$(this);
			/* スクロール開始 */
			slidestart();
			e.preventDefault();
			e.stopPropagation();
		}).hide();
		slider.holizontal=slider.base.clone(true).attr('id','sliderholizontal').css({
			'height':'6px',
			'width':'100%'
		});
		slider.vertical=slider.base.clone(true).attr('id','slidervertical').css({
			'height':'100%',
			'width':'6px'
		});
		$(window).on({
			'mousemove':function(e){
				if ($(window).width()<options.limit) return;
				if (!capture) return;
				/* スクロール */
				switch (slider.target.attr('id').replace(/slider/g,''))
				{
					case 'holizontal':
						slidemove(e.clientX-keep.left,null);
						break;
					case 'vertical':
						slidemove(e.clientY-keep.top,null);
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
				slider.holizontal.fadeOut();
				slider.vertical.fadeOut();
				e.preventDefault();
				e.stopPropagation();
			}
		});
		/* コンテナボックスイベント定義 */
		target.on({
			'mousemove':function(){
				if ($(window).width()<options.limit) return;
				if (!sizecheck) checkslidersize();
				/* リサイズに伴う位置調整 */
				switch (options.direction)
				{
					case 'both':
						if (ratio.holizontal>=1 && ratio.vertical>=1) return;
						if (!slider.holizontal.is(':visible') && ratio.holizontal<1)
						{
							slider.holizontal.css({
								'left':(target.scrollLeft()*ratio.holizontal+target.scrollLeft()).toString()+'px',
								'position':'absolute',
								'top':(target.scrollTop()+target[0].clientHeight-8).toString()+'px'
							});
							slider.holizontal.fadeIn();
						}
						if (!slider.vertical.is(':visible') && ratio.vertical<1)
						{
							slider.vertical.css({
								'left':(target.scrollLeft()+target[0].clientWidth-8).toString()+'px',
								'position':'absolute',
								'top':(target.scrollTop()*ratio.vertical+target.scrollTop()).toString()+'px'
							});
							slider.vertical.fadeIn();
						}
						break;
					case 'holizontal':
						if (ratio.holizontal>=1) return;
						if (!slider.holizontal.is(':visible'))
						{
							slider.holizontal.css({
								'left':(target.scrollLeft()*ratio.holizontal+target.scrollLeft()).toString()+'px',
								'position':'absolute',
								'top':(target.scrollTop()+target[0].clientHeight-8).toString()+'px'
							});
							slider.holizontal.fadeIn();
						}
						break;
					case 'vertical':
						if (ratio.vertical>=1) return;
						if (!slider.vertical.is(':visible'))
						{
							slider.vertical.css({
								'left':(target.scrollLeft()+target[0].clientWidth-8).toString()+'px',
								'position':'absolute',
								'top':(target.scrollTop()*ratio.vertical+target.scrollTop()).toString()+'px'
							});
							slider.vertical.fadeIn();
						}
						break;
				}
			},
			'mouseleave':function(){
				if (capture) return;
				slider.holizontal.fadeOut();
				slider.vertical.fadeOut();
			},
			'recheck':function(){
				sizecheck=false;
			}
		})
		.append(slider.holizontal)
		.append(slider.vertical);
		/* ウインドウイベント定義 */
		$(window).on('load resize scroll',function(){
			/* スタイルシート調整 */
			switch (options.direction)
			{
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
			}
			/* スライダーサイズ調整 */
			var checker=target;
			if (target.parents('.floating')) checker=target.parents('.floating').first();
			if (!checker.isVisible()) {sizecheck=false;return;}
			checkslidersize();
		});
		$(window).on(('onwheel' in document)?'wheel':('onmousewheel' in document)?'mousewheel':'DOMMouseScroll',function(e,delta,deltaX,deltaY){
			switch (options.direction)
			{
				case 'both':
					slider.target=slider.vertical;
					break;
				case 'holizontal':
					slider.target=slider.holizontal;
					break;
				case 'vertical':
					slider.target=slider.vertical;
					break;
			}
			if (!slider.target.is(':visible')) return;
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
			ratio.holizontal=target[0].clientWidth/target[0].scrollWidth;
			ratio.vertical=target[0].clientHeight/target[0].scrollHeight;
			if (slider.holizontal!=null) slider.holizontal.css({'width':(target[0].clientWidth*ratio.holizontal).toString()+'px'});
			if (slider.vertical!=null) slider.vertical.css({'height':(target[0].clientHeight*ratio.vertical).toString()+'px'});
			sizecheck=true;
		};
		/* スクロール開始 */
		function slidestart(){
			rect.slider=slider.target[0].getBoundingClientRect();
			rect.target=target[0].getBoundingClientRect();
			slider.target.css({
				'left':rect.slider.left.toString()+'px',
				'position':'fixed',
				'top':rect.slider.top.toString()+'px'
			});
			if (options.direction=='both')
			{
				switch (slider.target.attr('id').replace(/slider/g,''))
				{
					case 'holizontal':
						slider.other=slider.vertical;
						break;
					case 'vertical':
						slider.other=slider.holizontal;
						break;
				}
				rect.other=slider.other[0].getBoundingClientRect();
				slider.other.css({
					'left':rect.other.left.toString()+'px',
					'position':'fixed',
					'top':rect.other.top.toString()+'px'
				});
			}
			else slider.other=null;
		};
		/* スクロール */
		function slidemove(amount,callback){
			switch (slider.target.attr('id').replace(/slider/g,''))
			{
				case 'holizontal':
					drag.left=rect.slider.left+amount;
					if (drag.left<rect.target.left) drag.left=rect.target.left;
					if (drag.left>rect.target.right-slider.target.outerWidth(true)) drag.left=rect.target.right-slider.target.outerWidth(true);
					slider.target.css({'left':drag.left.toString()+'px'});
					target.scrollLeft(down.left+amount/ratio.holizontal,callback);
					break;
				case 'vertical':
					drag.top=rect.slider.top+amount;
					if (drag.top<rect.target.top) drag.top=rect.target.top;
					if (drag.top>rect.target.bottom-slider.target.outerHeight(true)) drag.top=rect.target.bottom-slider.target.outerHeight(true);
					slider.target.css({'top':drag.top.toString()+'px'});
					target.scrollTop(down.top+amount/ratio.vertical,callback);
					break;
			}
		};
		/* スクロール終了 */
		function slideend(){
			rect.slider=slider.target[0].getBoundingClientRect();
			rect.target=target[0].getBoundingClientRect();
			if (rect.other!=null) rect.other=slider.other[0].getBoundingClientRect();
			switch (slider.target.attr('id').replace(/slider/g,''))
			{
				case 'holizontal':
					slider.target.css({
						'left':(rect.slider.left-rect.target.left+target.scrollLeft()).toString()+'px',
						'position':'absolute',
						'top':(target.scrollTop()+target[0].clientHeight-8).toString()+'px'
					});
					if (rect.other!=null)
					{
						slider.other.css({
							'left':(target.scrollLeft()+target[0].clientWidth-8).toString()+'px',
							'position':'absolute',
							'top':(rect.other.top-rect.target.top+target.scrollTop()).toString()+'px'
						});
					}
					break;
				case 'vertical':
					slider.target.css({
						'left':(target.scrollLeft()+target[0].clientWidth-8).toString()+'px',
						'position':'absolute',
						'top':(rect.slider.top-rect.target.top+target.scrollTop()).toString()+'px'
					});
					if (rect.other!=null)
					{
						slider.other.css({
							'left':(rect.other.left-rect.target.left+target.scrollLeft()).toString()+'px',
							'position':'absolute',
							'top':(target.scrollTop()+target[0].clientHeight-8).toString()+'px'
						});
					}
					break;
			}
		};
	});
};
jQuery.fn.rechecksliderbounds = function(){
	/* イベント発火 */
	var event=new $.Event('recheck',null);
	$(this).trigger(event);
}
})(jQuery);
