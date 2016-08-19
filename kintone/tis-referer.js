/*
*--------------------------------------------------------------------
* jQuery-Plugin "tis-referer"
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
* options	@ datasource	:datasource
*							.data is json
*							.text is key for display text (array)
*			@ searches		:search condition elements
*							.id is elements id
*							.label is elements label text
*							.type is elements type
*							.param is api parameter (<select> only)
*							.text is key for display text (<select> only)
*							.value is key for value (<select> only)
*							.align is text alignment (<input> only)
*							-example-
*							searches[
*								{
*									id:'users',
*									label:'choose user',
*									type:'select',
*									data:resp.records,
*									text:'username',
*									value:'userid
*								},
*								{
*									id:'companyname',
*									label:'input companyname',
*									type:'input',
*									align:'left'
*								}
*							]
*			@ buttons		:button elements
*							.id is elements id
*							.text is display text
*							.callback is callback of button clicked
*							-example-
*							buttons[
*								{
*									id:'ok',
*									text:'ok',
*									callback:function(){alert('ok clicked');}
*								},
*								{
*									id:'cancel',
*									text:'cancel',
*									callback:function(){alert('cancel clicked');}
*								}
*							]
* -------------------------------------------------------------------
*/
var Referer=function(options){
	var options=$.extend({
		datasource:{
			data:null,
			text:[]
		},
		searches:[],
		buttons:[]
	},options);
	/* property */
	this.datasource=options.datasource;
	this.callback=null;
	/* create elements */
	var block=$('<div>').css({
		'box-sizing':'border-box'
	}).fieldscss();
	var button=$('<button>').css({
		'background-color':'transparent',
		'border':'1px solid #a9a9a9',
		'border-radius':'5px',
		'box-sizing':'border-box',
		'height':'30px',
		'lint-height':'30px'
	}).fieldscss();
	var label=$('<label>').css({
		'box-sizing':'border-box',
		'padding-bottom':'5px',
		'width':'100%',
		'z-index':'11'
	}).fieldscss();
	var select=$('<select>').css({
		'box-sizing':'border-box',
		'height':'30px',
		'lint-height':'30px',
		'padding-left':'100px',
		'width':'100%',
		'z-index':'11'
	}).fieldscss();
	var span=$('<span>').css({
		'box-sizing':'border-box',
		'height':'30px',
		'lint-height':'30px',
		'left':'0px',
		'padding':'5px',
		'position':'absolute',
		'top':'0px',
		'width':'100px',
		'z-index':'99'
	}).fieldscss();
	var table=$('<table>').css({
		'min-width':'100%',
		'position':'relative',
	}).fieldscss();
	var text=$('<input type="text">').css({
		'box-sizing':'border-box',
		'height':'30px',
		'lint-height':'30px',
		'padding-left':'100px',
		'width':'100%'
	}).fieldscss();
	this.container=block.clone().css({
		'background-color':'rgba(0,0,0,0.5)',
		'display':'none',
		'height':'100%',
		'left':'0px',
		'position':'fixed',
		'top':'0px',
		'width':'100%',
		'z-index':'999999'
	});
	this.contents=block.clone().css({
		'background-color':'#ffffff',
		'bottom':'0',
		'border-radius':'5px',
		'height':'700px',
		'left':'0',
		'margin':'auto',
		'max-height':'100%',
		'max-width':'100%',
		'overflow-x':'hidden',
		'overflow-y':'auto',
		'padding':'5px',
		'position':'absolute',
		'right':'0',
		'top':'0',
		'width':'900px'
	});
	this.buttonblock=block.clone().css({
		'background-color':'rgba(0,0,0,0.5)',
		'bottom':'0px',
		'left':'0px',
		'padding':'5px',
		'position':'absolute',
		'text-align':'center',
		'width':'100%',
		'z-index':'999'
	});
	this.listblock=table.clone().append('<tbody>');
	this.searchblock=block.clone().css({
		'background-color':'rgba(0,0,0,0.5)',
		'left':'0px',
		'padding':'5px',
		'position':'absolute',
		'text-align':'center',
		'top':'0px',
		'width':'100%',
		'z-index':'888'
	});
	this.buttons=[];
	$.each(options.buttons,function(index){
		var buttonvalue=$.extend({
			id:'',
			text:'',
			callback:null
		},options.buttons[index]);
		this.buttons.push(
			button.clone()
			.attr('id',buttonvalue.id)
			.text(buttonvalue.text)
			.on('click',function(){if (buttonvalue.callback!=null) buttonvalue.callback();})
		);
		this.buttonblock.append(this.buttons[index]);
	});
	$.each(options.searches,function(index){
		var searchvalue=$.extend({
			id:'',
			label:'',
			type:'',
			param:{},
			text:'',
			value:'',
			align:'left'
		},options.searches[index]);
		var searchfield=null;
		switch (searchvalue.type)
		{
			case 'select':
				searchfield=select.clone();
				searchfield.listitems({
					param:searchvalue.param,
					value:searchvalue.value,
					text:searchvalue.text
				});
				break;
			case 'input':
				searchfield=text.clone().css({
					'text-align':searchvalue.align
				});
				break;
		}
		this.searchblock.append(label.clone().append(span.clone().text(searchvalue.label)).append(searchfield));
	});
	/* append elements */
	this.contents.append(this.listblock);
	if (options.searches.length!=0) this.contents.append(this.searchblock);
	if (options.buttons.length!=0) this.contents.append(this.buttonblock);
	this.container.append(this.contents);
	$('body').append(this.container);
	/* adjust contents paddings */
	this.contents.css({
		'padding-top':(this.searchblock.outerHeight(true)).toString()+'px',
		'padding-bottom':(this.buttonblock.outerHeight(true)).toString()+'px',
	});
};
Referer.prototype={
	/* reload referer */
	search:function(){
		var callback=this.callback;
		var lists=this.listblock.find('tbody').find('tr').find('td');
		var searches=this.searchblock.find('input,select');
		var filters=$.grep(this.datasource.data,function(item,index){
			var exists=0;
			$.each(searches,function(index){
				if (searches.val().toString()=='') exists++;
				else
				{
					if (item[$(this).attr('id')].value.toString()==searches.val().toString()) exists++;
				}
			});
			return searches.length==exists;
		});
		/* lists callback */
		$.each(lists,function(index){
			$(this).off('click');
		});
		/* create lists */
		this.listblock.find('tbody').empty();
		$.each(filters,function(index){
			var filter=filters[index];
			var list=$('<tr>').fieldscss();
			$.each(filter,function(key,values){
				list.append('<input type="hidden" id="'+key.toString()+'" value="'+values.value.toString()+'">');
			});
			$.each(this.datasource.text,function(index){
				list.append($('<td>')
				.fieldscss()
				.text(filter[this.datasource.text[index]].value))
				.on('click',function(){if (callback!=null) callback(list);});
			});
			this.listblock.find('tbody').append(list);
		});
	},
	/* display referer */
	show:function(options){
		var options=$.extend({
			buttons:{},
			callback:null
		},options);
		var buttons=this.buttons;
		var lists=this.listblock.find('tbody').find('tr').find('td');
		/* buttons callback */
		$.each(options.buttons,function(key,values){
			$.each(buttons,function(index){
				if ($(this).attr('id')==key)
				{
					$(this).off('click');
					$(this).on('click',function(){if (values!=null) values();});
				}
			});
		});
		/* lists callback */
		$.each(lists,function(index){
			$(this).off('click');
			$(this).on('click',function(){if (options.callback!=null) options.callback($(this).closest('tr'));});
		});
		this.callback=options.callback;
		this.container.show();
	},
	/* hide referer */
	hide:function(){
		this.container.hide();
	}
};
