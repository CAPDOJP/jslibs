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
(function($){
/*
*--------------------------------------------------------------------
* parameters
* options	@ datasource		:json
*			@ displaytext		:display text (array)
*			@ searchbuttonclass	:searchbutton class
*			@ searchbuttontext	:searchbutton text
*			@ buttons			:button elements
*								.id is elements id
*								.class is elements class
*								.text is display text
*								.callback is callback of button clicked
*								-example-
*								buttons[
*									{
*										id:'ok',
*										class:'okbuttonclasss',
*										text:'ok',
*										callback:function(){alert('ok clicked');}
*									},
*									{
*										id:'cancel',
*										class:'cancelbuttonclasss',
*										text:'cancel',
*										callback:function(){alert('cancel clicked');}
*									}
*								]
*			@ searches			:search condition elements
*								.id is elements id
*								.class is elements class
*								.label is elements label text
*								.type is elements type [select,input,multi] (multi is all fields search)
*								.param is api parameter (<select> only)
*								.value is key for value (<select> only)
*								.text is key for display text (<select> only)
*								.align is text alignment (<input> only)
*							.callback is value change event
*							-example-
*							searches[
*								{
*									id:'users',
*									class:'selectclasss',
*									label:'choose user',
*									type:'select',
*									param:{app:1},
*									value:'userid,
*									text:'username',
*									callback:function(elements){...}
*								},
*								{
*									id:'companyname',
*									class:'inputclass',
*									label:'input companyname',
*									type:'input',
*									align:'left',
*									callback:function(elements){...}
*								}
*							]
* -------------------------------------------------------------------
*/
var Referer=function(options){
	var options=$.extend({
		container:null,
		datasource:null,
		displaytext:[],
		searchbuttonclass:'',
		searchbuttontext:'再検索',
		buttons:[],
		searches:[]
	},options);
	/* property */
	this.datasource=options.datasource;
	this.displaytext=options.displaytext;
	this.buttons=[];
	this.callback=null;
	/* valiable */
	var my=this;
	var div=$('<div>').css({
		'box-sizing':'border-box'
	});
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
		'background-color':'#FFFFFF',
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
		'overflow-x':'hidden',
		'overflow-y':'auto',
		'position':'relative',
		'z-index':'777'
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
	this.listblock=table.clone(true).css({
		'box-sizing':'border-box',
		'width':'100%'
	}).append('<tbody>');
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
	var buttons=this.buttons;
	var buttonblock=this.buttonblock;
	var searchblock=this.searchblock;
	/* append elements */
	$.each(options.buttons,function(index){
		var buttonvalue=$.extend({
			id:'',
			class:'',
			text:'',
			callback:null
		},options.buttons[index]);
		buttons.push(
			button.clone(true)
			.attr('id',buttonvalue.id)
			.addClass(buttonvalue.class)
			.text(buttonvalue.text)
			.on('click',function(){if (buttonvalue.callback!=null) buttonvalue.callback();})
		);
		buttonblock.append(buttons[index]);
	});
	$.each(options.searches,function(index){
		var searchvalue=$.extend({
			id:'',
			class:'',
			label:'',
			type:'',
			param:{},
			value:'',
			text:'',
			align:'left',
			callback:null
		},options.searches[index]);
		var searchfield=null;
		switch (searchvalue.type)
		{
			case 'select':
				searchfield=select.clone(true).attr('id',searchvalue.id).addClass(searchvalue.class);
				searchfield.listitems({
					param:searchvalue.param,
					value:searchvalue.value,
					text:searchvalue.text,
					addition:$('<option value=""></option')
				});
				$.data(searchfield[0],'multi',false);
				break;
			case 'input':
			case 'multi':
				searchfield=text.clone(true).attr('id',searchvalue.id).addClass(searchvalue.class).css({
					'text-align':searchvalue.align
				});
				$.data(searchfield[0],'multi',(searchvalue.type=='multi'));
				break;
		}
		if (searchvalue.callback!=null) searchfield.on('change',function(){searchvalue.callback(searchfield);});
		searchblock.append(
			label.clone(true).css({
				'display':'inline-block'
			})
			.append(span.clone(true).text(searchvalue.label))
			.append(searchfield)
		);
	});
	if (options.searches.length!=0)
	{
		searchblock.append(
			button.clone(true)
			.addClass(options.searchbuttonclass)
			.text(options.searchbuttontext)
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
	options.container.append(this.cover);
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
				var searchesvalue=($(this).val())?$(this).val():'';
				if (searchesvalue=='') exists++;
				else
				{
					var checker=0;
					if ($.data($(this)[0],'multi'))
					{
						var pattern=searchesvalue.replace(/[ 　]+/g,' ');
						patterns=pattern.split(' ');
						pattern='';
						$.each(patterns,function(index){
						    pattern+='(?=.*'+patterns[index]+')';
						});
						$.each(item,function(key,values){
						    if (values.value) checker+=(values.value.toString().match(new RegExp('(^'+pattern+')+','ig'))!=null)?1:0;
						});
					}
					else checker+=(item[$(this).attr('id')].value==searchesvalue)?1:0;
					exists+=(checker!=0)?1:0;
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
				list.append($('<td>').css({
					'border':'1px solid #C9C9C9',
					'cursor':'pointer',
					'padding':'5px'
				})
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
			'padding-top':this.searchblock.outerHeight(true)+5+'px',
			'padding-bottom':this.buttonblock.outerHeight(true)+5+'px'
		});
	},
	/* hide referer */
	hide:function(){
		this.cover.hide();
	}
};
jQuery.fn.referer=function(options){
	var options=$.extend({
		container:null,
		datasource:null,
		displaytext:[],
		searchbuttonclass:'',
		searchbuttontext:'再検索',
		searches:[],
		buttons:[]
	},options);
	options.container=this;
	return new Referer(options);
};
})(jQuery);
