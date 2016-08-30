/*
*--------------------------------------------------------------------
* jQuery-Plugin "tis-table"
* Version: 1.0
* Copyright (c) 2016 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
(function($){
/*
*--------------------------------------------------------------------
* parameters
* options	@ header			:elements of head
*			@ template			:elements of row
*			@ merge				:merge flag
*			@ mergeexclude		:merge exclude column index (array)
*			@ mergeclass		:merged classname
*			@ mergetrigger		:merge trigger
*			@ unmergetrigger	:unmerge trigger
* -------------------------------------------------------------------
*/
jQuery.fn.mergetable=function(options){
	var options=$.extend({
		head:null,
		template:null,
		merge:false,
		mergeexclude:[],
		mergeclass:'merge',
		mergetrigger:null,
		unmergetrigger:null
	},options);
	return $(this).each(function(){
		/* property */
		this.head=$('<thead>').append(options.head);
		this.contents=$('<tbody>');
		this.template=options.template;
		this.mergeclass=options.mergeclass;
		/* append elements */
		$(this).append(this.head);
		$(this).append(this.contents);
		/* valiable */
		var my=this;
		var contents=this.contents;
		var merged=false;
		var mergerow=-1;
		var mergestart=-1;
		var mergefrom=-1;
		var mergeto=-1;
		var mergelimitfrom=-1;
		var mergelimitto=-1;
		/* events of merge */
		$(this).on('mousedown touchstart','td',function(e){
			if (!options.merge) return;
			var row=$(this).parent();
			var cellindex=row.find('td').index($(this));
			var rowindex=contents.find('tr').index(row);
			if (options.mergeexclude.indexOf(my.cellindex(row,cellindex))==-1)
			{
				/* merge start */
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
				e.preventDefault();
			}
		});
		$(window).on('mousemove touchmove',function(e){
			if (!options.merge) return;
			/* return except during merge */
			if (mergerow==-1) return;
			/* get hover cell */
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
			/* print merge range */
			for (var i=mergelimitfrom;i<mergelimitto+1;i++)
			{
				var cell=contents.find('tr').eq(mergerow).find('td').eq(i);
				if (i>mergefrom-1 && i<mergeto+1) cell.addClass(options.mergeclass);
				else cell.removeClass(options.mergeclass);
			}
			e.preventDefault();
		});
		$(window).on('mouseup touchend',function(e){
			if (!options.merge) return;
			/* return except during merge */
			if (mergerow==-1) return;
			var cell=contents.find('tr').eq(mergerow).find('td').eq(mergefrom);
			if (!merged)
			{
				if (options.mergetrigger!=null)
					options.mergetrigger(
						my,
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
						my,
						cell,
						mergerow,
						mergefrom
					);
			}
			/* merge end */
			merged=false;
			mergerow=-1;
			mergestart=-1;
			mergefrom=-1;
			mergeto=-1;
			mergelimitfrom=-1;
			mergelimitto=-1;
			e.preventDefault();
		});
	});
};
/* functions */
jQuery.fn.extend({
	cellindex:function(row,cellindex){
    	var colspan=0;
    	$.each(row.find('td'),function(index){
    	  	if (index<cellindex)
    			if (parseInt('0'+$(this).attr('colspan'))!=0) colspan+=parseInt('0'+$(this).attr('colspan'))-1;
    	});
    	return cellindex+colspan;
	},
	clearrows:function(){
		this.contents.empty();
	},
	insertrow:function(row,callback){
	    var target=this.template.clone(true);
	    if (row==null) this.contents.append(target);
	    else
	    {
        	if (this.contents.find('tr').index(row)==this.contents.find('tr').length-1) this.contents.append(target);
        	else target.insertAfter(row);
	    }
    	if (callback!=null) callback(target);
	},
	mergecell:function(cell,from,to){
        cell.attr('colspan',to-from+1);
        for (var i=from;i<to;i++) cell.parent().find('td').eq(from+1).remove();
		cell.addClass(this.mergeclass);
	},
	unmergecell:function(cell){
		var colspan=parseInt('0'+cell.attr('colspan'));
        cell.removeAttr('colspan');
        for (var i=0;i<colspan-1;i++) $('<td>').insertAfter(cell);
		cell.removeClass(this.mergeclass);
	}
});
})(jQuery);
