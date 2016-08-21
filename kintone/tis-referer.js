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
	this.buttons=[];
	this.callback=null;
	/* valiable */
	var div=$('<div>');
	var button=$('<button>');
	var label=$('<label>');
	var select=$('<select>');
	var span=$('<span>');
	var table=$('<table>');
	var text=$('<input type="text">');
	/* append elements */
	this.cover=div.clone(true).css({
		'background-color':'rgba(0,0,0,0.5)',
		'display':'none',
		'height':'100%',
		'left':'0px',
		'position':'fixed',
		'top':'0px',
		'width':'100%',
		'z-index':'999999'
	});
	this.container=div.clone(true).css({
		'background-color':'#ffffff',
		'bottom':'0',
		'border-radius':'5px',
		'box-shadow':'0px 0px 3px rgba(0,0,0,0.35)',
		'height':'700px',
		'left':'0',
		'margin':'auto',
		'max-height':'100%',
		'max-width':'100%',
		'padding':'5px',
		'position':'absolute',
		'right':'0',
		'top':'0',
		'width':'900px'
	});
	this.contents=div.clone(true).css({
		'height':'100%',
		'min-height':'100%',
		'min-width':'100%',
		'overflow-x':'hidden',
		'overflow-y':'auto',
		'position':'relative',
		'width':'100%'
	});
	this.buttonblock=div.clone(true).css({
		'background-color':'rgba(0,0,0,0.5)',
		'border-bottom-left-radius':'5px',
		'border-bottom-right-radius':'5px',
		'bottom':'0px',
		'left':'0px',
		'padding':'5px',
		'position':'absolute',
		'text-align':'center',
		'width':'100%',
		'z-index':'999'
	});
	this.listblock=table.clone(true).append('<tbody>');
	this.searchblock=div.clone(true).css({
		'background-color':'rgba(0,0,0,0.5)',
		'border-top-left-radius':'5px',
		'border-top-right-radius':'5px',
		'left':'0px',
		'padding':'5px',
		'position':'absolute',
		'text-align':'center',
		'top':'0px',
		'width':'100%',
		'z-index':'888'
	});
	/* valiable */
	var my=this;
	var buttons=this.buttons;
	var buttonblock=this.buttonblock;
	var searchblock=this.searchblock;
	/* append elements */
	$.each(options.buttons,function(index){
		var buttonvalue=$.extend({
			id:'',
			text:'',
			callback:null
		},options.buttons[index]);
		buttons.push(
			button.clone(true)
			.attr('id',buttonvalue.id)
			.text(buttonvalue.text)
			.on('click',function(){if (buttonvalue.callback!=null) buttonvalue.callback();})
		);
		buttonblock.append(buttons[index]);
	});
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
				searchfield=select.clone(true).attr('id',searchvalue.id);
				searchfield.listitems({
					param:searchvalue.param,
					value:searchvalue.value,
					text:searchvalue.text,
					addition:$('<option value=""></option')
				});
				break;
			case 'input':
				searchfield=text.clone(true).attr('id',searchvalue.id).css({
					'text-align':searchvalue.align
				});
				break;
		}
		searchblock.append(
			label.clone(true)
			.append(span.clone(true).text(searchvalue.label))
			.append(searchfield)
		);
	});
	if (options.searches.length!=0)
	{
		searchblock.append(
			button.clone(true)
			.text('再検索')
			.on('click',function(){
				/* reload referer */
				my.search();
			})
		);
	}
	this.contents.append(this.listblock);
	this.container.append(this.contents);
	if (options.buttons.length!=0) this.container.append(this.buttonblock);
	if (options.searches.length!=0) this.container.append(this.searchblock);
	this.cover.append(this.container);
	$('body').append(this.cover);
	/* reload referer */
	my.search();
};
Referer.prototype={
	/* reload referer */
	search:function(){
		var callback=this.callback;
		var displaytext=this.displaytext;
		var listblock=this.listblock;
		var lists=this.listblock.find('tbody').find('tr').find('td');
		var searches=this.searchblock.find('input,select');
		var filtersearch=$.grep(this.datasource,function(item,index){
			var exists=0;
			$.each(searches,function(index){
				var value=($(this).val()!=null)?$(this).val():'';
				if (value=='') exists++;
				else
				{
					if (item[$(this).attr('id')].value==value) exists++;
				}
			});
			return searches.length==exists;
		});
		/* lists callback */
		$.each(lists,function(index){
			$(this).off('click');
		});
		/* create lists */
		listblock.find('tbody').empty();
		for (var i=0;i<filtersearch.length;i++)
		{
			var filter=filtersearch[i];
			var list=$('<tr>');
			$.each(filter,function(key,values){
				list.append('<input type="hidden" id="'+key+'" value="'+values.value+'">');
			});
			$.each(displaytext,function(index){
				list.append($('<td>')
				.text(filter[displaytext[index]].value))
				.on('click',function(){if (callback!=null) callback(list);});
			});
			listblock.find('tbody').append(list);
		}
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
		this.cover.show();
		/* adjust container paddings */
		this.container.css({
			'padding-top':(this.searchblock.outerHeight(true))+'px',
			'padding-bottom':(this.buttonblock.outerHeight(true))+'px',
		});
	},
	/* hide referer */
	hide:function(){
		this.cover.hide();
	}
};
