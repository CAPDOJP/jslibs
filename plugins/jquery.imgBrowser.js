/*
*--------------------------------------------------------------------
* jQuery-Plugin "imgBrowser"
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
* imgBrowser
* 画像拡大表示
*--------------------------------------------------------------------
* parameters
* options @ shadow :表示画像ドロップシャドウ設定
* -------------------------------------------------------------------
*/
jQuery.fn.imgBrowser = function(options){
	var options=$.extend({
		group:null,
		limit:0
	},options);
	return $(this).each(function(){
		/*
		*------------------------------------------------------------
		* コンテナ設定
		*------------------------------------------------------------
		*/
		var target=$(this).css({
			'background-color':'rgba(0,0,0,0.95)',
			'cursor':'pointer',
			'display':'none',
			'height':'100%',
			'left':'0px',
			'padding':'75px 0px',
			'position':'fixed',
			'text-align':'center',
			'top':'0px',
			'vertical-align':'middle',
			'width':'100%',
			'z-index':'10000000',
			'box-sizing':'border-box',
			'-moz-box-sizing':'border-box',
			'-ms-box-sizing':'border-box',
			'-o-box-sizing':'border-box',
			'-webkit-box-sizing':'border-box'
		})
		.imgSlider({limit:options.limit})
		.empty();
		var container=$('<div>').css({
			'display':'table',
			'height':'100%',
			'margin':'0px auto',
			'position':'relative'
		});
		var contents=$('<div>').css({
			'display':'table-cell',
			'height':'100%',
			'position':'relative',
			'vertical-align':'middle',
			'white-space':'nowrap'
		});
		var header=$('<div>').css({
			'background-color':'rgba(0,0,0,0.95)',
			'border-bottom':'1px solid rgba(255,255,255,0.25)',
			'height':'74px',
			'margin':'0px',
			'padding':'0px',
			'position':'fixed',
			'left':'0px',
			'top':'0px',
			'width':'100%'
		});
		var footer=$('<div>').css({
			'background-color':'rgba(0,0,0,0.95)',
			'border-top':'1px solid rgba(255,255,255,0.25)',
			'bottom':'0px',
			'height':'74px',
			'margin':'0px',
			'padding':'0px',
			'position':'fixed',
			'left':'0px',
			'width':'100%'
		});
		var close=$('<div>').css({
			'color':'rgba(255,255,255,0.75)',
			'font-size':'36px',
			'height':'74px',
			'line-height':'74px',
			'margin':'0px',
			'padding':'0px',
			'position':'fixed',
			'right':'0px',
			'top':'0px',
			'width':'74px'
		})
		.text('x')
		.on('click',function(){target.hide();});
		target.append(container.append(contents));
		target.append(header.append(close));
		target.append(footer);
		/*
		*------------------------------------------------------------
		* コンテンツ設定
		*------------------------------------------------------------
		*/
		$(options.group).each(function(){
			var group=$(this);
			group.find('img').each(function(){
				$(this).click(function(){
					var center=$(this);
					//画像配置
					var images='';
					group.find('img').each(function(index){
						if ($(this).attr('src')!='undefined' && $(this).attr('src')!='') images+='<img src="'+$(this).attr('src')+'" />';
					});
					contents.html(images);
					contents.find('img').css({
						'margin-right':'25px',
						'max-height':'100%',
						'max-width':'100%',
						'position':'relative',
						'vertical-align':'middle',
						'box-sizing':'border-box',
						'-moz-box-sizing':'border-box',
						'-ms-box-sizing':'border-box',
						'-o-box-sizing':'border-box',
						'-webkit-box-sizing':'border-box'
					});
					contents.find('img').last().css('margin-right','0px');
					//表示
					target.fadeIn(250,function(){
						contents.children().each(function(){
							if ($(this).attr('src')==center.attr('src'))
							{
								var pos=$(this).offset().left-contents.offset().left;
								pos-=($(window).width()-$(this).width())/2;
								target.animate({scrollLeft:pos},500,'easeOutCirc');
								return false;
							}
						});
					})
				});
			});
		});
	});
};
/*
*--------------------------------------------------------------------
* imgSlider
* 画像スライド
*--------------------------------------------------------------------
* parameters
* options @ limit :スライドボックス最大幅
* -------------------------------------------------------------------
*/
jQuery.fn.imgSlider = function(options){
	var options=$.extend({
		limit:0,
		type:'drag'
	},options);
	return $(this).each(function(){
		var capture=false;
		var ratio=0;
		var arrow=null;
		var button=null;
		var prev=null;
		var next=null;
		var slider=null;
		var slidervalues={
			rect:null
		};
		var target=$(this);
		var targetvalues={
			rect:null,
			down:0,
			keep:0,
			move:{
				amount:0,
				left:0
			}
		};
		$.data(target[0],'dragged',false);
		switch (options.type)
		{
			case 'button':
				arrow=$('<span>').css({
					'box-sizing':'border-box',
					'display':'block',
					'height':'20px',
					'left':'50%',
					'position':'absolute',
					'top':'50%',
					'width':'20px',
					'-webkit-transform':'translate(-50%,-50%) rotate(45deg)',
					'-ms-transform':'translate(-50%,-50%) rotate(45deg)',
					'transform':'translate(-50%,-50%) rotate(45deg)'
				});
				button=$('<div>').css({
					'background-color':'rgba(0,0,0,0.75)',
					'height':'100%',
					'margin':'0px',
					'padding':'0px',
					'position':'absolute',
					'top':'0px',
					'transition':'none',
					'width':'50px',
					'z-index':'9999'
				})
				.on('click',function(e){
					if ($(window).width()<options.limit) return;
					if (capture) return;
					capture=true;
					prev.hide();
					next.hide();
					targetvalues.move.left=target.scrollLeft();
					switch ($.data($(this)[0],'type'))
					{
						case 'prev':
							targetvalues.move.left-=target.width();
							break;
						case 'next':
							targetvalues.move.left+=target.width();
							break;
					}
					if (targetvalues.move.left<0) targetvalues.move.left=0;
					if (targetvalues.move.left>target[0].scrollWidth-target.width()) targetvalues.move.left=target[0].scrollWidth-target.width();
					target.animate({scrollLeft:targetvalues.move.left},350,'swing',function(){
						capture=false;
						prev.css({'left':targetvalues.move.left.toString()+'px','top':'0px'}).show();
						next.css({'left':(targetvalues.move.left+target.innerWidth()-next.outerWidth(false)).toString()+'px','top':'0px'}).show();
					});
					e.preventDefault();
					e.stopPropagation();
				}).hide();
				prev=button.clone(true).append(arrow.clone().css({'border-left':'2px solid rgba(255,255,255,0.75)','border-bottom':'2px solid rgba(255,255,255,0.75)','margin-left':'4px'}));
				next=button.clone(true).append(arrow.clone().css({'border-right':'2px solid rgba(255,255,255,0.75)','border-top':'2px solid rgba(255,255,255,0.75)','margin-left':'-4px'}));
				$.data(prev[0],'type','prev');
				$.data(next[0],'type','next');
				target.on({
					'mousemove':function(){
						if ($(window).width()<options.limit) return;
						prev.css({'left':targetvalues.move.left.toString()+'px'});
						next.css({'left':(targetvalues.move.left+target.innerWidth()-next.outerWidth(false)).toString()+'px'});
						if (!prev.is(':visible')) prev.fadeIn();
						if (!next.is(':visible')) next.fadeIn();
					},
					'mouseleave':function(){
						if (capture) return;
						prev.fadeOut();
						next.fadeOut();
					}
				})
				.append(prev)
				.append(next);
				$.data(prev[0],'type','prev');
				$.data(next[0],'type','next');
				break;
			case 'drag':
				target.on({
					'touchstart mousedown':function(e){
						if ($(window).width()<options.limit) return;
						capture=true;
						targetvalues.down=target.scrollLeft();
						targetvalues.move.amount=0;
						if (e.type=='touchstart')
						{
							targetvalues.keep=e.originalEvent.touches[0].pageX;
							targetvalues.move.left=e.originalEvent.touches[0].pageX;
						}
						else
						{
							targetvalues.keep=e.pageX;
							targetvalues.move.left=e.pageX;
						}
						$.data(target[0],'dragged',false);
						e.preventDefault();
					},
					'touchmove mousemove':function(e){
						if ($(window).width()<options.limit) return;
						if (!capture) return;
						if (e.type=='touchmove')
						{
							target.scrollLeft(targetvalues.down+targetvalues.keep-e.originalEvent.touches[0].pageX);
							targetvalues.move.amount=targetvalues.move.left-e.originalEvent.touches[0].pageX;
							targetvalues.move.left=e.originalEvent.touches[0].pageX;
						}
						else
						{
							target.scrollLeft(targetvalues.down+targetvalues.keep-e.pageX);
							targetvalues.move.amount=targetvalues.move.left-e.pageX;
							targetvalues.move.left=e.pageX;
						}
						e.preventDefault();
					},
					'touchend mouseup':function(e){
						if ($(window).width()<options.limit) return;
						if (!capture) return;
						capture=false;
						target.animate({scrollLeft:target.scrollLeft()+Math.round(Math.pow(targetvalues.move.amount,2))*((targetvalues.move.amount<0)?-1:1)},350,'easeOutCirc');
						$.data(target[0],'dragged',(targetvalues.move.amount!=0));
						e.preventDefault();
					}
				});
				break;
			case 'scroll':
				slider=$('<div>').css({
					'background-color':'rgba(0,0,0,0.75)',
					'border-radius':'3px',
					'bottom':'2px',
					'height':'6px',
					'left':'0px',
					'margin':'0px',
					'padding':'0px',
					'position':'absolute',
					'transition':'none',
					'width':'100%',
					'z-index':'9999'
				})
				.on('mousedown',function(e){
					if ($(window).width()<options.limit) return;
					capture=true;
					slidervalues.rect=slider[0].getBoundingClientRect();
					targetvalues.rect=target[0].getBoundingClientRect();
					slider.css({
						'bottom':'auto',
						'left':slidervalues.rect.left.toString()+'px',
						'top':slidervalues.rect.top.toString()+'px',
						'position':'fixed'
					});
					targetvalues.down=target.scrollLeft();
					targetvalues.keep=e.clientX;
					e.preventDefault();
					e.stopPropagation();
				}).hide();
				$(window).on({
					'mousemove':function(e){
						if ($(window).width()<options.limit) return;
						if (!capture) return;
						targetvalues.move.left=slidervalues.rect.left+(e.clientX-targetvalues.keep);
						if (targetvalues.move.left<targetvalues.rect.left) targetvalues.move.left=targetvalues.rect.left;
						if (targetvalues.move.left>targetvalues.rect.right-slider.outerWidth(true)) targetvalues.move.left=targetvalues.rect.right-slider.outerWidth(true);
						slider.css({'left':targetvalues.move.left.toString()+'px'});
						target.scrollLeft(targetvalues.down+(e.clientX-targetvalues.keep)/ratio);
						e.preventDefault();
						e.stopPropagation();
					},
					'mouseup':function(e){
						if ($(window).width()<options.limit) return;
						if (!capture) return;
						capture=false;
						slidervalues.rect=slider[0].getBoundingClientRect();
						targetvalues.rect=target[0].getBoundingClientRect();
						slider.css({
							'bottom':'2px',
							'left':(slidervalues.rect.left-targetvalues.rect.left+target.scrollLeft()).toString()+'px',
							'top':'auto',
							'position':'absolute'
						});
						slider.fadeOut();
						e.preventDefault();
						e.stopPropagation();
					}
				});
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
				break;
		}
		/* スクロールバー表示判定 */
		$(window).on('load resize scroll',function(){
			if (options.type=='scroll')
			{
				ratio=target.width()/target[0].scrollWidth;
				if (slider!=null) slider.css({'width':(target.width()*ratio).toString()+'px'});
			}
			if ($(window).width()<options.limit)
			{
				target.css({
					'cursor':'pointer',
					'overflow-x':'auto',
					'overflow-y':'hidden',
					'white-space':'nowrap',
					'-webkit-overflow-scrolling':'touch'
				});
			}
			else
			{
				target.css({
					'cursor':'pointer',
					'overflow':'hidden',
					'white-space':'nowrap',
					'-webkit-overflow-scrolling':'touch'
				});
			}
		});
	});
};
/*
*--------------------------------------------------------------------
* imgOperator
* 画像ドラッグ&拡大縮小
* -------------------------------------------------------------------
*/
jQuery.fn.imgOperator = function(){
	return $(this).each(function(){
		var target=$(this);
		/* スタイルシート変更 */
		position=target.css({'position':'fixed'});
		/*
		*------------------------------------------------------------
		* 画像調整
		*------------------------------------------------------------
		*/
		$(window).on('load resize scroll',function(e){
			target.relocation(e.type=='load');
		});
		$(window).on(('onwheel' in document)?'wheel':('onmousewheel' in document)?'mousewheel':'DOMMouseScroll',function(e,delta,deltaX,deltaY){
			var delta=(e.originalEvent.deltaY)?e.originalEvent.deltaY*-1:(e.originalEvent.wheelDelta)?e.originalEvent.wheelDelta:e.originalEvent.detail*-1;
			delta=(delta<0)?-150:150;
			target.relocation(false,delta);
			e.preventDefault();
		});
		/*
		*------------------------------------------------------------
		* ドラッグ操作
		*------------------------------------------------------------
		*/
		$.data(target[0],'dragging',false);
		target.on('mousedown',function(e){
			target.dragstart(e.clientX,e.clientY,e.offsetX,e.offsetY);
			e.preventDefault();
		});
		$(window).on('mousemove',function(e){
	    	if (!$.data(target[0],'dragging')) return;
			/* スタイルシート変更 */
		    target.css({
		      'left':e.clientX,
		      'top':e.clientY
		    });
	        e.preventDefault();
		});
		$(window).on('mouseup',function(e){
	    	if (!$.data(target[0],'dragging')) return;
			/* ドラッグ終了 */
			$.data(target[0],'dragging',false);
			/* スタイルシート変更 */
			target.css({
				'left':(target.offset().left).toString()+'px',
				'margin-left':'0px',
				'margin-top':'0px',
				'top':(target.offset().top).toString()+'px',
				'transition':'all 0.35s ease-out 0s'
			});
			$.data(target[0],'centerX',($(window).width()/2-target.offset().left)/target.width());
			$.data(target[0],'centerY',($(window).height()/2-target.offset().top)/target.height());
			target.relocation(false);
	        e.preventDefault();
		});
	});
}
/*
*--------------------------------------------------------------------
* 画像ドラッグ
* -------------------------------------------------------------------
*/
jQuery.fn.dragstart=function(clientX,clientY,offsetX,offsetY){
	var target=$(this);
	/* ドラッグ開始 */
	$.data(target[0],'dragging',true);
	/* スタイルシート変更 */
	target.css({
		'left':clientX.toString()+'px',
		'margin-left':'-'+offsetX.toString()+'px',
		'margin-top':'-'+offsetY.toString()+'px',
		'top':clientY.toString()+'px',
		'transition':'none'
	});
};
/*
*--------------------------------------------------------------------
* 画像再配置
* -------------------------------------------------------------------
*/
jQuery.fn.relocation=function(init,zoom){
	var target=$(this);
	var left=0;
	var top=0;
	var height=0;
	var width=0;
	if (init)
	{
		left=($(window).width()-target.width())/2;
		top=($(window).height()-target.height())/2;
		height=target.height();
		width=target.width();
	}
	else
	{
		height=$.data(target[0],'height');
		width=$.data(target[0],'width');
		if (zoom!=null)
		{
			height=(width+zoom)*(height/width);
			width+=zoom;
		}
		left=($(window).width())/2-(width*$.data(target[0],'centerX'));
		top=($(window).height())/2-(height*$.data(target[0],'centerY'));
	}
	target.css({'left':left.toString()+'px','top':top.toString()+'px','width':width.toString()+'px'});
	$.data(target[0],'centerX',($(window).width()/2-left)/width);
	$.data(target[0],'centerY',($(window).height()/2-top)/height);
	$.data(target[0],'height',height);
	$.data(target[0],'width',width);
};
})(jQuery);
