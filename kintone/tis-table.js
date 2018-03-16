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
* merge table
*--------------------------------------------------------------------
* parameters
* options	@ container			:elements of container
*			@ table	        	:element of table
*			@ header			:elements of head
*			@ template			:elements of row
*			@ dragclass			:dragging classname
*			@ merge				:merge flag
*			@ mergeexclude		:merge exclude column index (array)
*			@ mergeclass		:merged classname
*			@ mergetrigger		:merge trigger
*			@ unmergetrigger	:unmerge trigger
* -------------------------------------------------------------------
*/
var Table=function(options){
	var options=$.extend({
		container:null,
		table:null,
		head:null,
		template:null,
		dragclass:'drag',
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
	/* property */
	this.container=options.table;
	this.head=$('<thead>').append(options.head);
	this.contents=$('<tbody>');
	this.template=options.template;
	this.dragclass=options.dragclass;
	this.mergeclass=options.mergeclass;
	this.dragenabled=true;
	/* append elements */
	this.container.append(this.head);
	this.container.append(this.contents);
	if (options.container!=null) options.container.append(this.container);
	/* initialize valiable */
	this.rows=this.contents.children('tr');
	/* valiable */
	var my=this;
	var container=this.container;
	var contents=this.contents;
	var merged=false;
	var mergerow=-1;
	var mergestart=-1;
	var mergefrom=-1;
	var mergeto=-1;
	var mergelimitfrom=-1;
	var mergelimitto=-1;
	/* events of merge */
	container.off('mousedown.merge touchstart.merge').on('mousedown.merge touchstart.merge','td',function(e){
		if (!options.merge) return;
		if (!my.dragenabled) return;
		var row=$(this).parent();
		var rowindex=contents.find('tr').index(row);
		var cellindex=row.find('td').index($(this));
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
			for (var i=cellindex;i<row.find('td').length;i++)
			{
				if (row.find('td').eq(i).hasClass(options.mergeclass)) break;
				mergelimitto=i;
			}
			if (!$(this).hasClass(options.mergeclass)) $(this).addClass(options.dragclass);
			else merged=true;
			if (options.callback.guidestart!=null) options.callback.guidestart(e,my,container,mergerow,mergefrom);
			e.preventDefault();
		}
	});
	$(window).off('mousemove.merge touchmove.merge').on('mousemove.merge touchmove.merge',function(e){
		if (!options.merge) return;
		if (!my.dragenabled) return;
		/* return except during merge */
		if (mergerow==-1)
		{
			var hitrow=null;
			var hitcell=null;
			$.each(contents.find('tr'),function(){
	        	if ($(this).offset().top<e.pageY && $(this).offset().top+$(this).outerHeight(true)>e.pageY)
	        	{
        			hitrow=$(this);
					$.each(hitrow.find('td:visible'),function(){
			        	if ($(this).offset().left<e.pageX && $(this).offset().left+$(this).outerWidth(true)>e.pageX) hitcell=$(this);
					});
	        	}
			});
			if (options.callback.guidestart!=null)
			{
				if (hitcell!=null)
				{
					if (options.mergeexclude.indexOf(my.cellindex(hitrow,hitrow.find('td').index(hitcell)))==-1)
					{
						options.callback.guidestart(e,my,container,contents.find('tr').index(hitrow),hitrow.find('td').index(hitcell));
					}
					else options.callback.guidestart(e,my,container,null,null);
				}
				else options.callback.guidestart(e,my,container,null,null);
			}
			return;
		}
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
			if (i>mergefrom-1 && i<mergeto+1) cell.addClass(options.dragclass);
			else cell.removeClass(options.dragclass);
		}
		if (options.callback.guide!=null) options.callback.guide(e,my,container,mergerow,mergefrom,mergeto);
		e.preventDefault();
	});
	$(window).off('mouseup.merge touchend.merge').on('mouseup.merge touchend.merge',function(e){
		if (!options.merge) return;
		if (!my.dragenabled) return;
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
		if (options.callback.guideend!=null) options.callback.guideend(e);
		e.preventDefault();
	});
};
Table.prototype={
	/* get cell index */
	cellindex:function(row,cellindex){
    	var colspan=0;
    	$.each(row.find('td'),function(index){
    	  	if (index<cellindex)
    			if (parseInt('0'+$(this).attr('colspan'))!=0) colspan+=parseInt('0'+$(this).attr('colspan'))-1;
    	});
    	return cellindex+colspan;
	},
	/* get merged cell index */
	mergecellindex:function(row,cellindex){
    	var colspan=0;
    	$.each(row.find('td'),function(index){
   			if (parseInt('0'+$(this).attr('colspan'))!=0) colspan+=parseInt('0'+$(this).attr('colspan'));
   			else colspan++;
    	  	if (colspan>cellindex) {colspan=index;return false;}
    	});
    	return colspan;
	},
	/* rows clear */
	clearrows:function(){
		this.contents.empty();
		/* initialize valiable */
		this.rows=this.contents.children('tr');
	},
	/* row insert */
	insertrow:function(row,callback){
	    var target=this.template.clone(true);
	    if (row==null) this.contents.append(target);
	    else
	    {
        	if (this.contents.find('tr').index(row)==this.contents.find('tr').length-1) this.contents.append(target);
        	else target.insertAfter(row);
	    }
		/* initialize valiable */
		this.rows=this.contents.children('tr');
    	if (callback!=null) callback(target);
	},
	/* mearge cell */
	mergecell:function(cell,from,to){
        cell.attr('colspan',to-from+1);
        for (var i=from;i<to;i++) cell.parent().find('td').eq(from+1).remove();
		cell.addClass(this.mergeclass);
		cell.removeClass(this.dragclass);
	},
	/* unmearge cell */
	unmergecell:function(cell){
		var colspan=parseInt('0'+cell.attr('colspan'));
        cell.removeAttr('colspan');
        for (var i=0;i<colspan-1;i++) $('<td>').insertAfter(cell);
		cell.removeClass(this.mergeclass);
		cell.removeClass(this.dragclass);
	}
};
jQuery.fn.mergetable=function(options){
	var options=$.extend({
		container:null,
		table:null,
		head:null,
		template:null,
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
	options.table=this;
	return new Table(options);
};
/*
*--------------------------------------------------------------------
* adjustable table
*--------------------------------------------------------------------
* parameters
* options	@ table	        	:element of table
*			@ add				:elements of append button
*			@ del				:elements of delete button
*			@ addcallback		:append calback function
* -------------------------------------------------------------------
*/
var AdjustTable=function(options){
	var options=$.extend({
		table:null,
		add:'',
		del:'',
		addcallback:null,
		delcallback:null
	},options);
	/* property */
	this.container=options.table;
	this.contents=this.container.children('tbody');
	this.add=options.add;
	this.del=options.del;
	this.addcallback=options.addcallback;
	this.delcallback=options.delcallback;
	/* initialize valiable */
	this.rows=this.contents.children('tr');
	this.template=this.rows.first().clone(true);
	/* create rows */
	if (this.rows!=null) this.rows.remove();
	this.addrow();
	if (this.del.length!=0) $(this.del,this.rows.first()).css({'display':'none'});
};
AdjustTable.prototype={
	addrow:function(){
		var my=this;
		var row=null;
		this.contents.append(this.template.clone(true));
		/* initialize valiable */
		this.rows=this.contents.children('tr');
		/* events */
		row=this.rows.last();
		if (this.add.length!=0) $(this.add,row).on('click',function(){my.addrow()});
		if (this.del.length!=0) $(this.del,row).on('click',function(){my.delrow($(this).closest('tr'))});
		if (this.addcallback!=null) this.addcallback(row);
	},
	delrow:function(row){
		var index=this.rows.index(row);
		row.remove();
		/* initialize valiable */
		this.rows=this.contents.children('tr');
		if (this.delcallback!=null) this.delcallback(index);
	},
	clearrows:function(){
		this.rows.remove();
		/* initialize valiable */
		this.rows=this.contents.children('tr');
	}
};
jQuery.fn.adjustabletable=function(options){
	var options=$.extend({
		table:null,
		add:'',
		del:'',
		addcallback:null
	},options);
	options.table=this;
	return new AdjustTable(options);
};
})(jQuery);
