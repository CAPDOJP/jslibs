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
* options	@ datasource	:json
*			@ displaytext	:display text (array)
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
*			@ searches		:search condition elements
*							.id is elements id
*							.label is elements label text
*							.type is elements type
*							.param is api parameter (<select> only)
*							.value is key for value (<select> only)
*							.text is key for display text (<select> only)
*							.align is text alignment (<input> only)
*							-example-
*							searches[
*								{
*									id:'users',
*									label:'choose user',
*									type:'select',
*									param:{app:1},
*									value:'userid,
*									text:'username'
*								},
*								{
*									id:'companyname',
*									label:'input companyname',
*									type:'input',
*									align:'left'
*								}
*							]
* -------------------------------------------------------------------
*/
var Referer=function(options){
	var options=$.extend({
		datasource:null,
		displaytext:[],
		searches:[],
		buttons:[]
	},options);
	/* property */
	this.datasource=options.datasource;
	this.displaytext=options.displaytext;
	this.callback=null;
	/* create elements */
	var div=$('<div>').style();
	var button=$('<button>').style();
	var label=$('<label>').style();
	var select=$('<select>').style();
	var span=$('<span>').style();
	var table=$('<table>').style();
	var text=$('<input type="text">').style();
	this.container=div.clone().css({
		'background-color':'rgba(0,0,0,0.5)',
		'display':'none',
		'height':'100%',
		'left':'0px',
		'position':'fixed',
		'top':'0px',
		'width':'100%',
		'z-index':'999999'
	});
	this.contents=div.clone().css({
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
	this.buttonblock=div.clone().css({
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
	this.searchblock=div.clone().css({
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
	var buttonblock=this.buttonblock;
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
		buttonblock.append(this.buttons[index]);
	});
	var searchblock=this.searchblock;
	$.each(options.searches,function(index){
		var searchvalue=$.extend({
			id:'',
			label:'',
			type:'',
			param:{},
			value:'',
			text:'',
			align:'left'
		},options.searches[index]);
		var searchfield=null;
		switch (searchvalue.type)
		{
			case 'select':
				searchfield=select.clone().attr('id',searchvalue.id);
				searchfield.listitems({
					param:searchvalue.param,
					value:searchvalue.value,
					text:searchvalue.text
				});
				break;
			case 'input':
				searchfield=text.clone().attr('id',searchvalue.id).css({
					'text-align':searchvalue.align
				});
				break;
		}
		searchblock.append(
			label.clone()
			.append(span.clone().text(searchvalue.label))
			.append(searchfield)
		);
	});
	/* append elements */
	this.contents.append(this.listblock);
	if (options.buttons.length!=0) this.contents.append(this.buttonblock);
	if (options.searches.length!=0) this.contents.append(this.searchblock);
	this.container.append(this.contents);
	$('body').append(this.container);
	/* adjust contents paddings */
	this.contents.css({
		'padding-top':(this.searchblock.outerHeight(true))+'px',
		'padding-bottom':(this.buttonblock.outerHeight(true))+'px',
	});
	/* reload referer */
	this.search();
};
Referer.prototype={
	/* reload referer */
	search:function(){
		var callback=this.callback;
		var lists=this.listblock.find('tbody').find('tr').find('td');
		var searches=this.searchblock.find('input,select');
		var filters=$.grep(this.datasource,function(item,index){
			var exists=0;
			$.each(searches,function(index){
				if (searches.val()=='') exists++;
				else
				{
					if (item[$(this).attr('id')].value==searches.val()) exists++;
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
			var list=$('<tr>').style();
			$.each(filter,function(key,values){
				list.append('<input type="hidden" id="'+key+'" value="'+values.value+'">');
			});
			$.each(this.displaytext,function(index){
				list.append($('<td>')
				.style()
				.text(filter[this.displaytext[index]].value))
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
