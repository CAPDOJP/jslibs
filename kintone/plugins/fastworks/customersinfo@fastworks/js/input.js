/*
*--------------------------------------------------------------------
* jQuery-Plugin "input"
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
* options	@ buttons			:button elements
*								{
*									ok:{
*										text:''
*									},
*									cancel:{
*										text:''
*									}
*								}
* 			@ fields			:field informations
* -------------------------------------------------------------------
*/
var FieldsForm=function(options){
	var options=$.extend({
		container:null,
		buttons:[],
		fields:[]
	},options);
	/* property */
	this.buttons=options.buttons;
	this.fields=options.fields;
	/* create elements */
	var my=this;
	var div=$('<div>').css({
		'box-sizing':'border-box',
		'margin':'0px',
		'padding':'0px',
		'position':'relative',
		'vertical-align':'top'
	});
	var address=div.clone(true).css({
		'display':'inline-block',
		'line-height':'40px',
		'width':'100%'
	})
	.append(
		$('<textarea class="receiver">').css({
			'border':'1px solid #3498db',
			'border-radius':'2px',
			'box-sizing':'border-box',
			'display':'block',
			'height':'calc(4.5em + 10px)',
			'line-height':'1.5em',
			'padding':'5px',
			'vertical-align':'top',
			'width':'100%'
		})
	)
	.append(
		$('<span class="label">').css({
			'box-sizing':'border-box',
			'display':'inline-block',
			'width':'100%'
		})
	);
	var datespan=div.clone(true).css({
		'display':'inline-block',
		'line-height':'40px',
		'width':'100%'
	})
	.append($('<input type="hidden" class="receiver">'))
	.append(
		$('<span class="label">').css({
			'box-sizing':'border-box',
			'display':'inline-block',
			'width':'100%'
		})
	);
	var modifier=div.clone(true).css({
		'display':'inline-block',
		'line-height':'40px',
		'width':'100%'
	})
	.append($('<input type="hidden" class="receiver">'))
	.append(
		$('<span class="label">').css({
			'box-sizing':'border-box',
			'display':'inline-block',
			'width':'100%'
		})
	);
	var button=$('<button>').css({
		'background-color':'transparent',
		'border':'none',
		'box-sizing':'border-box',
		'color':'#FFFFFF',
		'cursor':'pointer',
		'font-size':'13px',
		'height':'auto',
		'line-height':'30px',
		'margin':'0px 3px',
		'outline':'none',
		'padding':'0px 1em',
		'vertical-align':'top',
		'width':'auto'
	});
	var label=$('<label>').css({
		'box-sizing':'border-box',
		'border-left':'5px solid #3498db',
		'display':'block',
		'line-height':'25px',
		'margin':'5px 0px',
		'padding':'0px',
		'padding-left':'5px'
	});
	var radio=$('<label>').css({
		'box-sizing':'border-box',
		'display':'inline-block',
		'line-height':'40px',
		'margin':'0px',
		'padding':'0px',
		'vertical-align':'top'
	})
	.append($('<input type="radio" class="receiver">'))
	.append($('<span class="label">').css({'color':'#3498db','padding':'0px 10px 0px 5px'}));
	var remarks=$('<p>').css({
		'box-sizing':'border-box',
		'display':'block',
		'font-size':'0.75em',
		'line-height':'2em',
		'margin':'0px',
		'padding':'0px'
	});
	var textline=$('<input type="text" class="receiver">').css({
		'border':'1px solid #3498db',
		'border-radius':'2px',
		'box-sizing':'border-box',
		'display':'block',
		'height':'40px',
		'line-height':'40px',
		'padding':'0px 5px',
		'vertical-align':'top',
		'width':'100%'
	});
	var title=$('<label>').css({
		'box-sizing':'border-box',
		'display':'block',
		'font-size':'21px',
		'line-height':'40px',
		'margin':'5px 0px',
		'padding':'0px'
	});
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
		'left':'0',
		'margin':'auto',
		'max-height':'90%',
		'max-width':'90%',
		'padding':'5px',
		'position':'absolute',
		'right':'0',
		'text-align':'center',
		'top':'0',
		'width':'600px'
	});
	this.contents=div.clone(true).css({
		'height':'100%',
		'margin':'0px',
		'overflow-x':'hidden',
		'overflow-y':'auto',
		'padding':'5px',
		'position':'relative',
		'text-align':'left',
		'width':'100%',
		'z-index':'1'
	});
	this.buttonblock=div.clone(true).css({
		'background-color':'#3498db',
		'border-bottom-left-radius':'5px',
		'border-bottom-right-radius':'5px',
		'bottom':'0px',
		'left':'0px',
		'padding':'5px',
		'position':'absolute',
		'text-align':'center',
		'width':'100%',
		'z-index':'2'
	});
	this.title=title.clone(true);
	this.fieldcontainer=div.clone(true).addClass('container').css({'padding':'5px','width':'100%'}).append(label.clone(true).addClass('title'));
	for (var i=0;i<this.fields.length;i++)
	{
		var fieldinfo=this.fields[i];
		var fieldcontainer=this.fieldcontainer.clone(true).attr('id',fieldinfo.code);
		var fieldoptions=[];
		var receiver=null;
		fieldcontainer.find('.title').text(fieldinfo.label);
		switch (fieldinfo.type)
		{
			case 'ADDRESS':
				receiver=address.clone(true);
				fieldcontainer.append(receiver);
				break;
			case 'DATESPAN':
				receiver=datespan.clone(true);
				fieldcontainer.css({'display':'inline-block','width':'50%'}).append(receiver);
				break;
			case 'RADIO_BUTTON':
				var checked=true;
				fieldoptions=[fieldinfo.options.length];
				$.each(fieldinfo.options,function(key,values){
					fieldoptions[values.index]=values.label;
				});
				for (var i2=0;i2<fieldoptions.length;i2++)
				{
					receiver=radio.clone(true);
					$('.label',receiver).text(fieldoptions[i2]);
					$('.receiver',receiver).attr('id',fieldoptions[i2]).attr('name',fieldinfo.code).val(fieldoptions[i2]).prop('checked',checked);
					fieldcontainer.append(receiver);
					checked=false;
				}
				break;
			case 'SINGLE_LINE_TEXT':
				receiver=textline.clone(true);
				fieldcontainer.append(receiver);
				break;
			case 'MODIFIER':
				receiver=modifier.clone(true);
				fieldcontainer.css({'display':'inline-block','width':'50%'}).append(receiver);
				break;
		}
		fieldcontainer.append(remarks.clone(true).addClass('remarks'));
		this.contents.append(fieldcontainer);
	}
	$.each(this.buttons,function(key,values){
		my.buttonblock.append(
			button.clone(true)
			.attr('id',key)
			.text(values.text)
		);
	});
	this.container.append(this.title.addClass('head'));
	this.container.append(this.contents);
	this.container.append(this.buttonblock);
	this.cover.append(this.container);
	options.container.append(this.cover);
	/* adjust container height */
	$(window).on('load resize',function(){
		my.contents.css({'height':(my.container.innerHeight()-my.buttonblock.outerHeight(true)-my.title.outerHeight(true)).toString()+'px'});
	});
};
FieldsForm.prototype={
	/* display form */
	show:function(options){
		var options=$.extend({
			buttons:{},
			values:{}
		},options);
		var my=this;
		$.each(options.buttons,function(key,values){
			if (my.buttonblock.find('button#'+key).size())
				my.buttonblock.find('button#'+key).off('click').on('click',function(){if (values!=null) values();});
		});
		$.each(options.values,function(key,values){
			if (key.match(/^\$/g)) return true;
			if (!$('#'+key).size()) return true;
			switch (values.type)
			{
				case 'RADIO_BUTTON':
					$('#'+values.value,$('#'+key)).prop('checked',true);
					break;
				default:
					$('.receiver',$('#'+key)).val(values.value);
					break;
			}
		});
		this.cover.show();
		/* adjust container height */
		this.contents.css({'height':(this.container.innerHeight()-this.buttonblock.outerHeight(true)-this.title.outerHeight(true)).toString()+'px'});
	},
	/* hide form */
	hide:function(){
		this.cover.hide();
	}
};
jQuery.fn.fieldsform=function(options){
	var options=$.extend({
		container:null,
		buttons:[],
		fields:{}
	},options);
	options.container=this;
	return new FieldsForm(options);
};
var FieldsFormConfirm=function(options){
	var options=$.extend({
		container:null
	},options);
	/* create elements */
	var my=this;
	var button=$('<button>').css({
		'background-color':'#3498db',
		'border':'none',
		'border-radius':'5px',
		'box-sizing':'border-box',
		'color':'#FFFFFF',
		'cursor':'pointer',
		'display':'inline-block',
		'font-size':'13px',
		'height':'auto',
		'line-height':'30px',
		'margin':'0px 3px 5px 3px',
		'outline':'none',
		'padding':'0px 1em',
		'vertical-align':'top',
		'width':'auto'
	});
	/* append elements */
	this.container=$('<div>').css({
		'background-color':'#FFFFFF',
		'border-radius':'5px',
		'bottom':'0px',
		'box-shadow':'0px 0px 3px rgba(0,0,0,0.35)',
		'box-sizing':'border-box',
		'display':'none',
		'left':'0px',
		'margin':'5px',
		'padding':'5px',
		'position':'fixed',
		'text-align':'center',
		'vertical-align':'top',
		'width':'calc(100% - 10px)',
		'z-index':'999999'
	});
	this.container.append($('<p>').css({'line-height':'30px'}).text('ピンを登録しますか？'));
	this.container.append(
		$('<div>')
		.append(
			button.clone(true)
			.attr('id','ok')
			.text('登録する')
		)
		.append(
			button.clone(true)
			.attr('id','cancel')
			.text('登録しない')
		)
	);
	options.container.append(this.container);
};
FieldsFormConfirm.prototype={
	/* display form */
	show:function(okcallback,cancelcallback){
		var my=this;
		$('button#ok',this.container).off('click').on('click',function(){
			if (okcallback!=null) okcallback();
			my.hide();
		});
		$('button#cancel',this.container).off('click').on('click',function(){
			if (cancelcallback!=null) cancelcallback();
			my.hide();
		});
		this.container.show();
	},
	/* hide form */
	hide:function(){
		this.container.hide();
	}
};
jQuery.fn.fieldsformconfirm=function(options){
	var options=$.extend({
		container:null
	},options);
	options.container=this;
	return new FieldsFormConfirm(options);
};
})(jQuery);
