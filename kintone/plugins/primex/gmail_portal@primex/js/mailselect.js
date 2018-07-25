/*
*--------------------------------------------------------------------
* jQuery-Plugin "mailselect"
* Version: 1.0
* Copyright (c) 2016 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
(function($){
var div=$('<div>').css({
	'box-sizing':'border-box',
	'margin':'0px',
	'padding':'0px',
	'position':'relative',
	'vertical-align':'top'
});
var span=$('<span>').css({
	'box-sizing':'border-box',
	'display':'inline-block',
	'line-height':'30px',
	'margin':'0px',
	'padding':'0px 5px',
	'vertical-align':'top'
});
var button=$('<button>').css({
	'background-color':'transparent',
	'border':'none',
	'border-radius':'3px',
	'box-sizing':'border-box',
	'color':'#FFFFFF',
	'cursor':'pointer',
	'font-size':'13px',
	'height':'30px',
	'line-height':'30px',
	'margin':'0px 3px',
	'outline':'none',
	'padding':'0px 1em',
	'vertical-align':'top',
	'width':'auto'
});
var cell=$('<td>').css({
	'border':'1px solid #C9C9C9',
	'cursor':'pointer',
	'padding':'5px'
});
var cellhead=$('<th>').css({
	'border':'1px solid #C9C9C9',
	'font-weight':'normal',
	'padding':'5px',
	'text-align':'center'
});
var checkbox=$('<input type="checkbox" class="receiver">');
var radio=$('<label>').css({
	'box-sizing':'border-box',
	'display':'inline-block',
	'line-height':'30px',
	'margin':'0px',
	'padding':'0px',
	'vertical-align':'top'
})
.append($('<input type="radio" class="receiver">'))
.append(span.clone(true).addClass('label').css({'padding':'0px 10px 0px 5px'}));
var title=$('<label class="title">').css({
	'box-sizing':'border-box',
	'border-left':'5px solid #3498db',
	'display':'inline-block',
	'line-height':'30px',
	'margin':'0px',
	'padding':'0px',
	'padding-left':'10px',
	'width':'5em'
});
var createdialog=function(){
	return {
		cover:div.clone(true).css({
			'background-color':'rgba(0,0,0,0.5)',
			'display':'none',
			'height':'100%',
			'left':'0px',
			'position':'fixed',
			'top':'0px',
			'width':'100%',
			'z-index':'999999'
		}),
		container:div.clone(true).css({
			'background-color':'#FFFFFF',
			'bottom':'0',
			'border-radius':'5px',
			'box-shadow':'0px 0px 3px rgba(0,0,0,0.35)',
			'height':+'calc(100% - 1em)',
			'left':'0',
			'margin':'auto',
			'max-height':'calc(100% - 1em)',
			'max-width':'calc(100% - 1em)',
			'padding':'5px 5px 40px 5px',
			'position':'absolute',
			'right':'0',
			'top':'0',
			'width':'700px'
		}),
		contents:div.clone(true).css({
			'height':'100%',
			'margin':'0px',
			'overflow-x':'hidden',
			'overflow-y':'auto',
			'padding':'5px 5px 10px 5px',
			'position':'relative',
			'text-align':'left',
			'width':'100%',
			'z-index':'1'
		}),
		header:div.clone(true).css({
			'background-color':'#FFFFFF',
			'border-bottom':'1px solid #C9C9C9',
			'border-top-left-radius':'5px',
			'border-top-right-radius':'5px',
			'left':'0px',
			'padding':'5px',
			'position':'absolute',
			'text-align':'left',
			'top':'0px',
			'width':'100%',
			'z-index':'3'
		}),
		footer:div.clone(true).css({
			'background-color':'#3498db',
			'border-bottom-left-radius':'5px',
			'border-bottom-right-radius':'5px',
			'bottom':'0px',
			'left':'0px',
			'padding':'5px',
			'position':'absolute',
			'text-align':'center',
			'width':'100%',
			'z-index':'3'
		}),
		lists:$('<table>').css({
			'box-sizing':'border-box',
			'width':'100%'
		})
		.append($('<thead>'))
		.append($('<tbody>'))
	};
}
var MailSelect=function(options){
	var options=$.extend({
		container:null,
		datasource:[],
		config:{},
		fields:{}
	},options);
	/* valiable */
	var my=this;
	/* property */
	this.datasource=options.datasource;
	this.config=options.config;
	this.fields=options.fields;
	this.dialog=createdialog();
	this.contents=this.dialog.contents;
	this.selectionto={};
	this.selectioncc={};
	this.selectionbcc={};
	/* append elements */
	this.fieldcontainer=div.clone(true).addClass('container').css({'padding':'5px','width':'100%'}).append(title.clone(true));
	$.each(this.fields,function(key,values){
		var checked=true;
		var fieldinfo=values;
		var fieldcontainer=my.fieldcontainer.clone(true).attr('id',fieldinfo.code);
		var fieldoptions=[];
		var receiver=null;
		fieldcontainer.find('.title').text(fieldinfo.label);
		fieldoptions=[fieldinfo.options.length];
		$.each(fieldinfo.options,function(key,values){
			fieldoptions[values.index]=values.label;
		});
		for (var i=0;i<fieldoptions.length;i++)
		{
			receiver=radio.clone(true);
			$('.label',receiver).html(fieldoptions[i]);
			$('.receiver',receiver).attr('id',fieldoptions[i]).attr('name',fieldinfo.code).val(fieldoptions[i]).prop('checked',checked).on('change',function(){my.search()});
			fieldcontainer.append(receiver);
			checked=false;
		}
		my.dialog.header.append(fieldcontainer);
	});
	$('thead',this.dialog.lists)
	.append(
		$('<tr>')
		.append(cellhead.clone(true).text('To'))
		.append(cellhead.clone(true).text('Cc'))
		.append(cellhead.clone(true).text('Bcc'))
		.append(cellhead.clone(true).text('宛先'))
		.append(cellhead.clone(true).text('メールアドレス'))
	)
	this.dialog.contents.append(this.dialog.lists);
	this.dialog.container.append(this.dialog.contents);
	this.dialog.container.append(this.dialog.header);
	this.dialog.container.append(
		this.dialog.footer
		.append(button.clone(true).attr('id','ok').text('OK'))
		.append(button.clone(true).attr('id','cancel').text('キャンセル'))
	);
	this.dialog.cover.append(this.dialog.container);
	options.container.append(this.dialog.cover);
	/* create template */
	this.template=$('<tr>')
	.append(
		cell.clone(true).css({'text-align':'center'})
		.append(
			checkbox.clone(true)
			.on('change',function(){
				var row=$(this).closest('tr');
				var key=$('input[type=hidden]',row).val();
				if (key in my.selectionto)
				{
					$(this).css({'background-color':'transparent'});
					delete my.selectionto[key];
				}
				else
				{
					$(this).css({'background-color':'#a0d8ef'});
					my.selectionto[key]={};
					my.selectionto[key]['name']=$('.'+my.config['mailtoname'],row).text();
					my.selectionto[key]['mail']=$('.'+my.config['mailtoaddress'],row).text();
				}
			})
		)
	)
	.append(
		cell.clone(true).css({'text-align':'center'})
		.append(
			checkbox.clone(true)
			.on('change',function(){
				var row=$(this).closest('tr');
				var key=$('input[type=hidden]',row).val();
				if (key in my.selectioncc)
				{
					$(this).css({'background-color':'transparent'});
					delete my.selectioncc[key];
				}
				else
				{
					$(this).css({'background-color':'#a0d8ef'});
					my.selectioncc[key]={};
					my.selectioncc[key]['name']=$('.'+my.config['mailtoname'],row).text();
					my.selectioncc[key]['mail']=$('.'+my.config['mailtoaddress'],row).text();
				}
			})
		)
	)
	.append(
		cell.clone(true).css({'text-align':'center'})
		.append(
			checkbox.clone(true)
			.on('change',function(){
				var row=$(this).closest('tr');
				var key=$('input[type=hidden]',row).val();
				if (key in my.selectionbcc)
				{
					$(this).css({'background-color':'transparent'});
					delete my.selectionbcc[key];
				}
				else
				{
					$(this).css({'background-color':'#a0d8ef'});
					my.selectionbcc[key]={};
					my.selectionbcc[key]['name']=$('.'+my.config['mailtoname'],row).text();
					my.selectionbcc[key]['mail']=$('.'+my.config['mailtoaddress'],row).text();
				}
			})
		)
	)
	.append(
		cell.clone(true)
		.append($('<span>')).addClass(this.config['mailtoname'])
	)
	.append(
		cell.clone(true)
		.append($('<span>')).addClass(this.config['mailtoaddress'])
	)
	.append($('<input type="hidden">'));
	/* adjust container height */
	$(window).on('load resize',function(){
		my.dialog.container.css({'padding-top':(my.dialog.header.outerHeight(false)).toString()+'px'});
	});
	/* reload mailselect */
	this.search();
};
MailSelect.prototype={
	/* reload mailselect */
	search:function(){
		var my=this;
		var filtersearch=$.grep(this.datasource,function(item,index){
			var exists=0;
			$.each(my.fields,function(key,values){
				if (item[key].value==$('#'+key,my.dialog.header).find('[name='+key+']:checked').val()) exists++;
			});
			return Object.keys(my.fields).length==exists;
		});
		/* create lists */
		this.selectionto={};
		this.selectioncc={};
		this.selectionbcc={};
		this.dialog.lists.find('tbody').empty();
		for (var i=0;i<filtersearch.length;i++)
		{
			var filter=filtersearch[i];
			var list=this.template.clone(true);
			$('input[type=hidden]',list).val(filter['$id'].value);
			$('.'+this.config['mailtoname'],list).text(filter[this.config['mailtoname']].value);
			$('.'+this.config['mailtoaddress'],list).text(filter[this.config['mailtoaddress']].value);
			this.dialog.lists.find('tbody').append(list);
		}
	},
	/* display form */
	show:function(options){
		var options=$.extend({
			buttons:{}
		},options);
		var my=this;
		/* buttons callback */
		$.each(options.buttons,function(key,values){
			if (my.dialog.footer.find('button#'+key).size())
				my.dialog.footer.find('button#'+key).off('click').on('click',function(){
					if (values!=null) values(Object.values(my.selectionto),Object.values(my.selectioncc),Object.values(my.selectionbcc));
				});
		});
		this.selectionto={};
		this.selectioncc={};
		this.selectionbcc={};
		$.each(this.dialog.lists.find('tbody').find('tr'),function(index){
			$.each($(this).find('input[type=checkbox]'),function(index){
				$(this).prop('checked',false);
				$(this).closest('td').css({'background-color':'transparent'});
			});
		});
		this.dialog.cover.show();
		/* adjust container height */
		this.dialog.container.css({'padding-top':(this.dialog.header.outerHeight(false)).toString()+'px'});
	},
	/* hide form */
	hide:function(){
		this.dialog.cover.hide();
	}
};
jQuery.fn.mailselect=function(options){
	var options=$.extend({
		container:null,
		datasource:[],
		config:{},
		fields:{}
	},options);
	options.container=this;
	return new MailSelect(options);
};
})(jQuery);
