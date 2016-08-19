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
/*
*--------------------------------------------------------------------
* parameters
* options	@ id	        :element id
*			@ container		:elements of container
*			@ header		:elements of head
*			@ template		:elements of row
* -------------------------------------------------------------------
*/
var Table=function(options){
	var options=$.extend({
		id:'',
		container:null,
		head:null,
		template:null,
	},options);
	/* valiable */
	this.container=$('<table id="'+options.id+'">').fieldscss();
	this.head=$('<thead>');
	this.contents=$('<tbody>');
	this.template=options.template;
	/* append elements */
	this.container.append(this.head);
	this.container.append(this.contents);
	if (options.container!=null) options.container.append(this.container);
};
Table.prototype={
	/* rows clear */
	clearrows:function(){
		this.contents.empty();
	},
	/* row insert */
	insertrow:function(row,callback){
	    var target=this.template.clone();
	    if (row==null) this.contents.append(target);
	    else
	    {
        	if (this.contents.find('tr').index(row)==this.contents.find('tr').length-1) this.contents.append(target);
        	else target.insertAfter(row);
	    }
    	if (callback!=null) callback(target);
	},
	/* mearge cell */
	merge:function(cell,from,to){
        cell.attr('colspan',to-from+1);
        for (var i=from;i<to;i++) cell.parent().find('td').eq(from+1).remove();
		cell.addClass(this.mergeclass);
	},
	/* unmearge cell */
	unmerge:function(cell){
		var colspan=parseInt('0'+cell.attr('colspan'));
        cell.removeAttr('colspan');
        for (var i=0;i<colspan-1;i++) $('<td>').insertAfter(cell);
		cell.removeClass(this.mergeclass);
	}
};
