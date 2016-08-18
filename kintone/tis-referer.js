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
*							.text is key for display text
*							.value is key for value
*			@ searches		:search condition elements
*							.id is elements id
*							.label is elements label text
*							.type is elements type
*							.data is json (<select> only)
*							.text is key for display text (<select> only)
*							.value is key for value (<select> only)
*							.align is text alignment (<input> only)
*			@ buttons		:button elements
*							.id is elements id
*							.text is display text
* -------------------------------------------------------------------
*/
var Referer=function(options){
	var options=$.extend({
		datasource:{
			data:null,
			text:'',
			value:'',
		},
		searches:[],
		buttons:[]
	},options);
	/* valiable */
	this.datasource=options.datasource;
	/* create elements */
	var block=$('<div>').css({
		'box-sizing':'border-box'
	});
	var button=$('<button>').css({
		'background-color':'transparent',
		'border':'1px solid #a9a9a9',
		'border-radius':'5px',
		'box-sizing':'border-box',
		'height':'30px',
		'lint-height':'30px'
	});
	var text=$('<input type="text">').css({
		'box-sizing':'border-box',
		'height':'30px',
		'lint-height':'30px',
		'padding-left':'100px',
		'width':'100%'
	});
	var label=$('<label>').css({
		'box-sizing':'border-box',
		'padding-bottom':'5px',
		'width':'100%',
		'z-index':'11'
	});
	var option=$('<option>');
	var select=$('<select>').css({
		'box-sizing':'border-box',
		'height':'30px',
		'lint-height':'30px',
		'padding-left':'100px',
		'width':'100%',
		'z-index':'11'
	});
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
	});
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
	this.listblock=block.clone().css({
		'position':'relative',
		'width':'100%'
	});
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
	for (var i=0;i<options.searches.length;i++)
	{
		var searchfield=null;
		switch (options.searches[i].type)
		{
			case 'select':
				searchfield=select.clone();
				$.each(options.searches[i].data,function(index){
					searchfield.append(
						option.clone()
						.attr('value',options.searches[i].data[index][options.searches[i].value].value.toString())
						.text(options.searches[i].data[index][options.searches[i].text].value.toString())
					);
				});
				break;
			case 'input':
				searchfield=text.clone().css({
					'text-align':(options.searches[i].align!=null)?options.searches[i].align.toString():'left'
				});
				break;
		}
		this.searchblock.append(label.clone().append(span.clone().text(options.searches[i].label)).append(searchfield));
	}
	this.buttons=[];
	for (var i=0;i<options.buttons.length;i++)
	{
		this.buttons.push(
			button.clone()
			.attr('id',options.buttons[i].id.toString())
			.text(options.buttons[i].text.toString())
		);
		this.buttonblock.append(this.buttons[i]);
	}
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
	/* display referer */
	show:function(options){
		var options=$.extend({
			datasource:{
				data:null,
				text:'',
				value:'',
			},
			buttons:'',
			okcallback:null,
			buttonscallback:null
		},options);
		var back=this.back;
		var contents=this.contents;
		/* コンテンツ初期化 */
		this.contents.children('div').on('click',null);
		this.contents.empty();
		/* データ配置 */
		$.each(options.datasource.data,function(index){
			contents.append($('<div>').css({
					'box-sizing':'border-box',
					'width':'100%'
				})
				.on('click',function(){
					back.hide();
					if (options.okcallback!=null) options.okcallback($(this).children('p').text(),$(this).children('input[type=hidden]').val());
				})
				.append('<p>'+options.datasource.data[index][options.datasource.text].value.toString()+'</p>')
				.append('<input type="hidden" value="'+options.datasource.data[index][options.datasource.value].value.toString()+'">')
			);
		});
		/* ボタン初期化 */
		this.buttons.children('button').on('click',null);
		this.buttons.empty();
		/* ボタン */
		if (options.buttons.length!=0) this.buttons.append(options.buttons);
		/* ボタンスタイルシート */
		$.each(this.buttons.children('button'),function(){
			$(this).css({
				'cursor':'pointer',
				'margin':'5px'
			});
		});
		/* ボタンイベント */
		if (options.buttonscallback!=null)
		{
			this.buttons.children('button').on('click',function(){
				back.hide();
				options.buttonscallback($(this).attr('id'));
			})
			.show();
		}
		else this.buttons.children('button:not(#cancel)').hide();
		this.back.show();
	},
	/* hide referer */
	hide:function(){
		this.back.hide();
	}
};
