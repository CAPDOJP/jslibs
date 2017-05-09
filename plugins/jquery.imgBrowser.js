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
			'background-color':'rgba(0,0,0,0.5)',
			'box-sizing':'border-box',
			'cursor':'pointer',
			'display':'none',
			'height':'100%',
			'left':'0px',
			'padding':'3em 1em',
			'position':'fixed',
			'text-align':'center',
			'top':'0px',
			'vertical-align':'middle',
			'width':'100%',
			'z-index':'10000000'
		})
		.imgSlider({limit:options.limit})
		.empty();
		var container=$('<div>').css({
			'box-sizing':'border-box',
			'display':'table',
			'height':'100%',
			'margin':'0px auto',
			'position':'relative'
		});
		var contents=$('<div>').css({
			'box-sizing':'border-box',
			'display':'table-cell',
			'height':'100%',
			'position':'relative',
			'vertical-align':'middle',
			'white-space':'nowrap'
		});
		var close=$('<div>').css({
			'color':'rgba(255,255,255,0.75)',
			'font-size':'1.5em',
			'height':'3em',
			'line-height':'3em',
			'margin':'0px',
			'padding':'0px',
			'position':'fixed',
			'right':'0px',
			'top':'0px',
			'width':'3em'
		})
		.text('x')
		.on('click',function(){target.hide();});
		target.append(container.append(contents));
		target.append(close);
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
						'box-sizing':'border-box',
						'margin-right':'1em',
						'max-height':'100%',
						'max-width':'100%',
						'position':'relative',
						'vertical-align':'middle'
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
		var arrow=null;
		var button=null;
		var prev=null;
		var next=null;
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
		}
		/* スクロールバー表示判定 */
		$(window).on('load resize scroll',function(){
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
jQuery.fn.imgOperator = function(options){
	var options=$.extend({
		container:null,
		zoommin:0,
		zoommax:1000,
		wheelcallback:null
	},options);
	return $(this).each(function(){
		var target=$(this);
		var zoom=100;
		/* 変数格納 */
		$.data(target[0],'container',options.container);
		$.data(target[0],'enablewheel',true);
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
			if (!$.data(target[0],'enablewheel')) return;
			var delta=(e.originalEvent.deltaY)?e.originalEvent.deltaY*-1:(e.originalEvent.wheelDelta)?e.originalEvent.wheelDelta:e.originalEvent.detail*-1;
			zoom+=(delta<0)?-50:50;
			if (zoom<options.zoommin) zoom=options.zoommin;
			if (zoom>options.zoommax) zoom=options.zoommax;
			target.relocation(false,zoom);
			if (options.wheelcallback) options.wheelcallback(zoom);
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
			$.data(target[0],'left',target.offset().left/$(window).width());
			$.data(target[0],'top',target.offset().top/$(window).height());
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
* マウスホイールイベント許可判定
* -------------------------------------------------------------------
*/
jQuery.fn.enablewheel=function(enable){
	var target=$(this);
	$.data(target[0],'enablewheel',enable);
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
		left=(($.data(target[0],'container').innerWidth()-target.width())/2)+$.data(target[0],'container').offset().left;
		top=(($.data(target[0],'container').innerHeight()-target.height())/2)+$.data(target[0],'container').offset().top;
		height=target.height();
		width=target.width();
		$.data(target[0],'baseheight',height);
		$.data(target[0],'basewidth',width);
	}
	else
	{
		height=$.data(target[0],'height');
		width=$.data(target[0],'width');
		if (zoom!=null)
		{
			height=$.data(target[0],'baseheight')*(zoom/100);
			width=$.data(target[0],'basewidth')*(zoom/100);
		}
		left=($.data(target[0],'left')*$(window).width())-((width-$.data(target[0],'width'))/2);
		top=($.data(target[0],'top')*$(window).height())-((height-$.data(target[0],'height'))/2);
	}
	target.css({'left':left.toString()+'px','top':top.toString()+'px','width':width.toString()+'px'});
	$.data(target[0],'left',left/$(window).width());
	$.data(target[0],'top',top/$(window).height());
	$.data(target[0],'height',height);
	$.data(target[0],'width',width);
};
})(jQuery);
