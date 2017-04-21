/*
*--------------------------------------------------------------------
* jQuery-Plugin "tableAction"
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
* options @ buttons        :指定関数を実行するボタン群
*         @ merge          :マージ判定
*         @ mergeexclude   :マージ対象外列
*         @ mergeclass     :マージクラス定義
*         @ mergetrigger   :マージトリガー
*         @ unmergetrigger :アンマージトリガー
* -------------------------------------------------------------------
*/
jQuery.fn.tableAction = function(options){
	var options=$.extend({
		buttons:{},
		merge:false,
		mergeexclude:[],
		mergeclass:'merge',
		mergetrigger:null,
		unmergetrigger:null,
		callback:{
			guidestart:null,
			guide:null,
			guideend:null
		}
	},options);
	var tables=$(this);
	return $(this).each(function(){
		if ($(this).find('tbody')==null) {alert('tableにはtbody要素を追加して下さい。');return;}
		var container=$(this);
		var contents=container.find('tbody');
		$.data(container[0],'options',options);
		/*
		*------------------------------------------------------------
		* ボタン操作(指定関数を実行)
		*------------------------------------------------------------
		* parameters
		* key   :セレクタ
		* values:コールバック関数
		* -----------------------------------------------------------
		*/
		$.each(options.buttons,function(key,values){
			//イベント追加
			if (values!=null) container.on('click',key,function(){values($(this));});
		});
		/*
		*------------------------------------------------------------
		* セルマージ操作
		*------------------------------------------------------------
		*/
		/* マージ用変数 */
		var merged=false;
		var mergerow=-1;
		var mergestart=-1;
		var mergefrom=-1;
		var mergeto=-1;
		var mergelimitfrom=-1;
		var mergelimitto=-1;
		container.on('mousedown touchstart','td',function(e){
			if (!options.merge) return;
			var row=$(this).parent();
			var cellindex=row.find('td').index($(this));
			var rowindex=contents.find('tr').index(row);
			if (options.mergeexclude.indexOf(container.cellindex(row,cellindex))==-1)
			{
				/* ドラッグスタート */
				merged=false;
				mergerow=rowindex;
				mergestart=cellindex;
				mergefrom=cellindex;
				mergeto=cellindex;
				for (var i=cellindex;i>-1;i--)
				{
					if (row.find('td').eq(i).hasClass(options.mergeclass)) break;
					mergelimitfrom=i;
				}
				for (var i=cellindex;i<row.find('td').length-1;i++)
				{
					if (row.find('td').eq(i).hasClass(options.mergeclass)) break;
					mergelimitto=i;
				}
				if (!$(this).hasClass(options.mergeclass)) $(this).addClass(options.mergeclass);
				else merged=true;
				if (options.callback.guidestart!=null) options.callback.guidestart(e,container,mergerow,mergefrom);
				e.preventDefault();
			}
		});
		$(window).on('mousemove touchmove',function(e){
			if (!options.merge) return;
			/* ドラッグ中以外は処理しない */
			if (mergerow==-1)
			{
				var hittable=null;
				var hitrow=null;
				var hitcell=null;
				$.each(tables,function(index){
					var hittable=$(this);
					$.each(hittable.find('tbody').find('tr'),function(){
			        	if ($(this).offset().top<e.pageY && $(this).offset().top+$(this).outerHeight(true)>e.pageY)
			        	{
		        			hitrow=$(this);
							$.each(hitrow.find('td'),function(){
					        	if ($(this).offset().left<e.pageX && $(this).offset().left+$(this).outerWidth(true)>e.pageX) hitcell=$(this);
							});
			        	}
					});
				});
				if (options.callback.guidestart!=null)
				{
					if (hitcell!=null)
					{
						if (options.mergeexclude.indexOf(container.cellindex(hitrow,hitrow.find('td').index(hitcell)))==-1)
						{
							options.callback.guidestart(e,hittable,hittable.find('tbody').find('tr').index(hitrow),hitrow.find('td').index(hitcell));
						}
						else options.callback.guidestart(e,hittable,null,null);
					}
					else options.callback.guidestart(e,hittable,null,null);
				}
				return;
			}
			/* マウスオーバーセル取得 */
			var posX=(e.type=='touchmove')?e.originalEvent.touches[0].pageX:e.pageX;
			var hit=-1;
			for (var i=mergelimitfrom;i<mergelimitto+1;i++)
			{
				var cell=contents.find('tr').eq(mergerow).find('td').eq(i);
				if (cell.offset().left<posX && cell.offset().left+cell.outerWidth(true)>posX) hit=i;
			}
			if (hit==-1) return;
			if (mergestart>hit)
			{
				mergefrom=hit;
				mergeto=mergestart;
			}
			else
			{
				mergefrom=mergestart;
				mergeto=hit;
			}
			/* セル範囲描画 */
			for (var i=mergelimitfrom;i<mergelimitto+1;i++)
			{
				var cell=contents.find('tr').eq(mergerow).find('td').eq(i);
				if (i>mergefrom-1 && i<mergeto+1) cell.addClass(options.mergeclass);
				else cell.removeClass(options.mergeclass);
			}
			if (options.callback.guide!=null) options.callback.guide(e,container,mergerow,mergefrom,mergeto);
			e.preventDefault();
		});
		$(window).on('mouseup touchend',function(e){
			if (!options.merge) return;
			/* ドラッグ中以外は処理しない */
			if (mergerow==-1) return;
			var cell=contents.find('tr').eq(mergerow).find('td').eq(mergefrom);
			if (!merged)
			{
				if (options.mergetrigger!=null)
					options.mergetrigger(
						container,
						cell,
						mergerow,
						mergefrom,
						mergeto
					);
			}
			else
			{
				if (options.unmergetrigger!=null)
					options.unmergetrigger(
						container,
						cell,
						mergerow,
						mergefrom
					);
			}
			/* ドラッグ終了 */
			merged=false;
			mergerow=-1;
			mergestart=-1;
			mergefrom=-1;
			mergeto=-1;
			mergelimitfrom=-1;
			mergelimitto=-1;
			if (options.callback.guideend!=null) options.callback.guideend(e);
			e.preventDefault();
		});
	});
};
/*
*--------------------------------------------------------------------
* テーブル操作
* -------------------------------------------------------------------
*/
/* セルインデックス取得 */
jQuery.fn.cellindex=function(row,cellindex){
	var colspan=0;
	$.each(row.find('td'),function(index){
	  	if (index<cellindex)
			if (parseInt('0'+$(this).attr('colspan'))!=0) colspan+=parseInt('0'+$(this).attr('colspan'))-1;
	});
	return cellindex+colspan;
};
/* 初期化 */
jQuery.fn.cleartable=function(callback){
	var container=$(this);
	var contents=container.find('tbody');
	var options=$.data(container[0],'options');
	$.each(contents.find('tr'),function(index){
		if (index==0)
		{
			/* セル結合解除 */
			$.each($(this).find('td'),function(index){
				container.unmergecell($(this));
			});
			/* セル値クリア */
			$.each($(this).find('td'),function(index){
				if (options.mergeexclude.indexOf(index)==-1) $(this).empty();
			});
		}
		else $(this).remove();
	});
	if (callback!=null) callback();
};
/* 行挿入 */
jQuery.fn.insertrow=function(row,callback){
	var container=$(this);
	var contents=container.find('tbody');
	var options=$.data(container[0],'options');
	var target=row.clone(true);
	/* セル結合解除 */
	$.each(target.find('td'),function(index){
		container.unmergecell($(this));
	});
	/* セル値クリア */
	$.each(target.find('td'),function(index){
		if (options.mergeexclude.indexOf(index)==-1) $(this).empty();
	});
	if (contents.find('tr').index(row)==contents.find('tr').length-1) contents.append(target);
	else target.insertAfter(row);
	if (callback!=null) callback(target);
};
/* セル結合 */
jQuery.fn.mergecell=function(cell,from,to){
	var container=$(this);
	var options=$.data(container[0],'options');
	cell.attr('colspan',to-from+1);
	for (var i=from;i<to;i++) cell.parent().find('td').eq(from+1).remove();
	cell.addClass(options.mergeclass);
};
/* セル結合解除 */
jQuery.fn.unmergecell=function(cell){
	var container=$(this);
	var options=$.data(container[0],'options');
	var colspan=parseInt('0'+cell.attr('colspan'));
	cell.removeAttr('colspan');
	for (var i=0;i<colspan-1;i++) $('<td>').insertAfter(cell);
	cell.removeClass(options.mergeclass);
};
})(jQuery);
