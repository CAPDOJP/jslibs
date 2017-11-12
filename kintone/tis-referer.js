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
*								-example-
*								buttons[
*									{
*										id:'ok',
*										class:'okbuttonclasss',
*										text:'ok'
*									},
*									{
*										id:'cancel',
*										class:'cancelbuttonclasss',
*										text:'cancel'
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
	this.datasource=(options.datasource!=null)?options.datasource:[];
	this.displaytext=options.displaytext;
	this.parambuttons=options.buttons;
	this.paramsearches=options.searches;
	this.callback=null;
	/* valiable */
	var my=this;
	var div=$('<div>').css({
		'box-sizing':'border-box'
	});
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
	var label=$('<label>');
	var select=$('<select>').css({
		'border':'none',
		'border-radius':'5px',
		'box-shadow':'0px 0px 1px rgba(0,0,0,0.35) inset,-1px -1px 1px rgba(255,255,255,0.35) inset',
		'height':'30px',
		'line-height':'30px',
		'padding':'0px 3px'
	});
	var span=$('<span>');
	var table=$('<table>');
	var text=$('<input type="text">').css({
		'border':'none',
		'border-radius':'5px',
		'box-shadow':'0px 0px 1px rgba(0,0,0,0.35) inset,-1px -1px 1px rgba(255,255,255,0.35) inset',
		'height':'30px',
		'line-height':'30px',
		'padding':'0px 3px'
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
		'height':'700px',
		'left':'0',
		'margin':'auto',
		'max-height':'90%',
		'max-width':'90%',
		'padding':'5px',
		'position':'absolute',
		'right':'0',
		'top':'0',
		'width':'900px'
	});
	this.contents=div.clone(true).css({
		'height':'100%',
		'overflow-x':'hidden',
		'overflow-y':'auto',
		'padding':'5px',
		'position':'relative',
		'width':'100%',
		'z-index':'777'
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
		'z-index':'999'
	});
	this.listblock=table.clone(true).css({
		'box-sizing':'border-box',
		'width':'100%'
	}).append($('<tbody>'));
	this.searchblock=div.clone(true).css({
		'background-color':'#3498db',
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
	/* append elements */
	$.each(this.parambuttons,function(index){
		var buttonvalue=$.extend({
			id:'',
			text:''
		},my.parambuttons[index]);
		my.buttonblock.append(
			button.clone(true)
			.attr('id',buttonvalue.id)
			.text(buttonvalue.text)
		);
	});
	$.each(this.paramsearches,function(index){
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
		},my.paramsearches[index]);
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
		my.searchblock.append(
			label.clone(true)
			.css({'display':'inline-block'})
			.append(span.clone(true).text(searchvalue.label))
			.append(searchfield)
		);
	});
	if (this.paramsearches.length!=0)
	{
		this.searchblock.append(
			button.clone(true)
			.addClass(options.searchbuttonclass)
			.text(options.searchbuttontext)
			.on('click',function(){
				/* reload referer */
				my.search();
			})
		);
		$('input[type=text],select',this.searchblock).on('keydown',function(e){
			var code=e.keyCode||e.which;
			if (code==13)
			{
				var targets=my.container.find('button,input[type=text],select,table');
				var total=targets.length;
				var index=targets.index(this);
				if (e.shiftKey)
				{
					if (index==0) index=total;
					index--;
				}
				else
				{
					index++;
					if (index==total) index=0;
				}
				targets.eq(index).focus();
				return false;
			}
		});
	}
	this.contents.append(this.listblock);
	this.container.append(this.contents);
	if (this.parambuttons.length!=0) this.container.append(this.buttonblock);
	if (this.paramsearches.length!=0) this.container.append(this.searchblock);
	this.cover.append(this.container);
	options.container.append(this.cover);
	/* adjust container height */
	$(window).on('load resize',function(){
		var height=my.container.height();
		var margin=(my.paramsearches.length!=0)?my.searchblock.outerHeight(true):0;
		if (my.parambuttons.length!=0) height-=my.buttonblock.outerHeight(true);
		if (my.paramsearches.length!=0) height-=my.searchblock.outerHeight(true);
		my.contents.css({
			'height':height.toString()+'px',
			'margin-top':margin.toString()+'px'
		});
	});
	/* reload referer */
	this.search();
};
Referer.prototype={
	/* reload referer */
	search:function(){
		var my=this;
		var lists=this.listblock.find('tbody').find('tr').find('td');
		var filtersearch=this.datasource;
		if (this.paramsearches.length!=0)
		{
			var searches=this.searchblock.find('input[type=text],select');
			filtersearch=$.grep(this.datasource,function(item,index){
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
							var patterns=pattern.split(' ');
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
		}
		/* lists callback */
		$.each(lists,function(index){
			$(this).off('click');
		});
		/* create lists */
		this.listblock.find('tbody').empty();
		for (var i=0;i<filtersearch.length;i++)
		{
			var filter=filtersearch[i];
			var list=$('<tr>')
			.on('mouseover',function(e){$(this).css({'background-color':'#f5b2b2'});})
			.on('mouseout',function(e){$(this).css({'background-color':'transparent'});});
			$.each(filter,function(key,values){
				list.append($('<input type="hidden" id="'+key+'" value="'+values.value+'">'));
			});
			$.each(my.displaytext,function(index){
				list.append(
					$('<td>').css({
						'border':'1px solid #C9C9C9',
						'cursor':'pointer',
						'padding':'5px'
					})
					.text(filter[my.displaytext[index]].value)
				)
				.on('click',function(){if (my.callback!=null) my.callback($(this));});
			});
			my.listblock.find('tbody').append(list);
		}
	},
	/* display referer */
	show:function(options){
		var options=$.extend({
			buttons:{},
			callback:null
		},options);
		var my=this;
		var height=0;
		var margin=0;
		var lists=this.listblock.find('tbody').find('tr');
		/* buttons callback */
		$.each(options.buttons,function(key,values){
			if (my.buttonblock.find('button#'+key).size())
				my.buttonblock.find('button#'+key).off('click').on('click',function(){if (values!=null) values();});
		});
		/* lists callback */
		$.each(lists,function(index){
			var list=$(this);
			$(this).off('click').on('click',function(){if (options.callback!=null) options.callback(list);});
		});
		this.callback=options.callback;
		this.cover.show();
		/* adjust container height */
		height=this.container.height();
		margin=(this.paramsearches.length!=0)?this.searchblock.outerHeight(true):0;
		if (this.parambuttons.length!=0) height-=this.buttonblock.outerHeight(true);
		if (this.paramsearches.length!=0) height-=this.searchblock.outerHeight(true);
		this.contents.css({
			'height':height.toString()+'px',
			'margin-top':margin.toString()+'px'
		});
		/* focus in search field */
		var searches=this.searchblock.find('input[type=text],select');
		if (searches.length!=0) searches.eq(0).focus();
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
* -------------------------------------------------------------------
*/
var MultiSelect=function(options){
	var options=$.extend({
		container:null,
		buttons:{
			ok:{
				text:''
			},
			cancel:{
				text:''
			}
		}
	},options);
	/* property */
	this.buttons=options.buttons;
	this.selection={};
	/* valiable */
	var my=this;
	var div=$('<div>').css({
		'box-sizing':'border-box'
	});
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
	var table=$('<table>');
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
		'height':'600px',
		'left':'0',
		'margin':'auto',
		'max-height':'90%',
		'max-width':'90%',
		'padding':'5px',
		'position':'absolute',
		'right':'0',
		'top':'0',
		'width':'500px'
	});
	this.contents=div.clone(true).css({
		'height':'100%',
		'overflow-x':'hidden',
		'overflow-y':'auto',
		'padding':'5px',
		'position':'relative',
		'width':'100%',
		'z-index':'777'
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
		'z-index':'999'
	});
	this.listblock=table.clone(true).css({
		'box-sizing':'border-box',
		'width':'100%'
	}).append($('<tbody>'));
	/* append elements */
	$.each(this.buttons,function(key,values){
		my.buttonblock.append(
			button.clone(true)
			.attr('id',key)
			.text(values.text)
		);
	});
	this.contents.append(this.listblock);
	this.container.append(this.contents);
	this.container.append(this.buttonblock);
	this.cover.append(this.container);
	options.container.append(this.cover);
	/* adjust container height */
	$(window).on('load resize',function(){
		my.contents.css({'height':(my.container.height()-my.buttonblock.outerHeight(true)).toString()+'px'});
	});
};
MultiSelect.prototype={
	/* display referer */
	show:function(options){
		var options=$.extend({
			datasource:[],
			buttons:{},
			selected:[]
		},options);
		var my=this;
		/* buttons callback */
		$.each(options.buttons,function(key,values){
			if (my.buttonblock.find('button#'+key).size())
				my.buttonblock.find('button#'+key).off('click').on('click',function(){if (values!=null) values(my.selection);});
		});
		/* create lists */
		this.listblock.find('tbody').empty();
		this.selection={};
		$.each(options.datasource,function(index){
			var listtext=options.datasource[index].text;
			var listvalue=options.datasource[index].value;
			var list=$('<tr>')
			.append(
				$('<td>').css({
					'border':'1px solid #C9C9C9',
					'cursor':'pointer',
					'padding':'5px'
				})
				.append($('<span>').text(listtext))
				.append($('<input type="hidden" value="'+listvalue+'">'))
				.on('click',function(){
					if ($(this).find('input').val() in my.selection)
					{
						$(this).css({'background-color':'transparent'});
						delete my.selection[$(this).find('input').val()];
					}
					else
					{
						$(this).css({'background-color':'#a0d8ef'});
						my.selection[$(this).find('input').val()]=$(this).find('span').text();
					}
				})
			)
			.on('mouseover',function(e){$(this).css({'background-color':'#f5b2b2'});})
			.on('mouseout',function(e){$(this).css({'background-color':'transparent'});});
			if ($.inArray(listvalue,options.selected)>-1)
			{
				list.find('td').css({'background-color':'#a0d8ef'});;
				my.selection[listvalue]=listtext;
			}
			else $(this).css({'background-color':'transparent'});
			my.listblock.find('tbody').append(list);
		});
		this.cover.show();
		/* adjust container height */
		this.contents.css({'height':(this.container.height()-this.buttonblock.outerHeight(true)).toString()+'px'});
	},
	/* hide referer */
	hide:function(){
		this.cover.hide();
	}
};
jQuery.fn.multiselect=function(options){
	var options=$.extend({
		container:null,
		buttons:{}
	},options);
	options.container=this;
	return new MultiSelect(options);
};
/*
*--------------------------------------------------------------------
* parameters
* options	@ minutespan		:minute span
*       	@ isadd				:enable user append
*       	@ isdatepick		:use datepicker
*       	@ issingle			:starttime only
*       	@ buttons			:button elements
*								{
*									ok:{
*										text:''
*									},
*									cancel:{
*										text:''
*									}
*								}
* -------------------------------------------------------------------
*/
var TermSelect=function(options){
	var options=$.extend({
		container:null,
		minutespan:30,
		isadd:false,
		isdatepick:false,
		issingle:false,
		buttons:{
			ok:{
				text:''
			},
			cancel:{
				text:''
			}
		}
	},options);
	/* property */
	this.isadd=options.isadd;
	this.isdatepick=options.isdatepick;
	this.issingle=options.issingle;
	this.buttons=options.buttons;
	/* valiable */
	var my=this;
	var pluswidth=0;
	if (this.isadd) pluswidth+=60;
	/* create elements */
	var div=$('<div>').css({
		'box-sizing':'border-box',
		'margin':'0px',
		'padding':'0px',
		'position':'relative',
		'vertical-align':'top'
	});
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
	var select=$('<select>').css({
		'border':'1px solid #C9C9C9',
		'border-radius':'3px',
		'box-sizing':'border-box',
		'display':'inline-block',
		'height':'30px',
		'margin':'0px',
		'padding':'0px 0.5em',
		'width':'auto'
	});
	var span=$('<span>').css({
		'box-sizing':'border-box',
		'display':'inline-block',
		'line-height':'30px',
		'margin':'0px',
		'padding':'0px 5px',
		'vertical-align':'top'
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
		'height':'500px',
		'left':'0',
		'margin':'auto',
		'max-height':'90%',
		'max-width':'90%',
		'padding':'5px',
		'position':'absolute',
		'right':'0',
		'top':'0',
		'width':(((!options.issingle)?500:320)+pluswidth).toString()+'px'
	});
	this.contents=div.clone(true).css({
		'height':'100%',
		'overflow-x':'hidden',
		'overflow-y':'auto',
		'margin':'0px',
		'padding':'5px',
		'position':'relative',
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
	/* append elements */
	$.each(this.buttons,function(key,values){
		my.buttonblock.append(
			button.clone(true)
			.attr('id',key)
			.text(values.text)
		);
	});
	this.hour=select.clone(true);
	this.minute=select.clone(true);
	for (var i=0;i<60;i+=options.minutespan) this.minute.append($('<option>').attr('value',('0'+i.toString()).slice(-2)).text(('0'+i.toString()).slice(-2)))
	this.template=div.clone(true).addClass('term').css({
		'border-bottom':'1px dotted #C9C9C9',
		'padding':'3px 0px',
		'width':'100%'
	});
	this.template.append(
		div.clone(true).css({
			'display':'inline-block',
			'min-height':'30px',
			'width':'150px'
		})
		.append(span.clone(true).addClass('date'))
	);
	this.template.append(this.hour.clone(true).addClass('starthour'));
	this.template.append(span.clone(true).text('：'));
	this.template.append(this.minute.clone(true).addClass('startminute').val('00'));
	this.template.append(span.clone(true).css({'display':((options.issingle)?'none':'inline-block')}).html('&nbsp;~&nbsp;'));
	this.template.append(this.hour.clone(true).css({'display':((options.issingle)?'none':'inline-block')}).addClass('endhour'));
	this.template.append(span.clone(true).css({'display':((options.issingle)?'none':'inline-block')}).text('：'));
	this.template.append(this.minute.clone(true).css({'display':((options.issingle)?'none':'inline-block')}).addClass('endminute').val('00'));
	/* add row */
	if (options.isadd)
	{
		this.template.append(
			span.clone(true).css({'padding':'0px'})
			.append(
				$('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/add.png" class="add" alt="追加" title="追加">')
				.css({
					'cursor':'pointer',
					'vertical-align':'top',
					'width':'30px'
				})
				.on('click',function(){
					var row=my.template.clone(true);
					$('.del',row).show();
					my.contents.append(row);
				})
			)
		);
		this.template.append(
			span.clone(true).css({'padding':'0px'})
			.append(
				$('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/close.png" class="del" alt="削除" title="削除">')
				.css({
					'cursor':'pointer',
					'display':'none',
					'vertical-align':'top',
					'width':'30px'
				})
				.on('click',function(){
					$(this).closest('.term').remove();
				})
			)
		);
	}
	/* day pickup */
	if (options.isdatepick)
	{
		this.template.find('.date').closest('div').css({'padding-left':'30px'})
		.append(
			$('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/calendar.png" alt="カレンダー" title="カレンダー">')
			.css({
				'position':'absolute',
				'left':'0px',
				'top':'0px',
				'width':'30px'
			})
			.on('click',function(){
				activerow=$(this).closest('div');
				my.calendar.show({activedate:new Date($('.date',$(this).closest('div')).text())});
			})
		);
	}
	/* append elements */
	this.container.append(this.contents);
	this.container.append(this.buttonblock);
	this.cover.append(this.container);
	options.container.append(this.cover);
	/* adjust container height */
	$(window).on('load resize',function(){
		my.contents.css({'height':(my.container.height()-my.buttonblock.outerHeight(true)).toString()+'px'});
	});
	/* day pickup */
	if (options.isdatepick)
	{
		var activerow=null;
		this.calendar=$('body').calendar({
			selected:function(target,value){
				$('.date',activerow).text(value);
			}
		});
	}
};
TermSelect.prototype={
	/* display calendar */
	show:function(options){
		var options=$.extend({
			fromhour:0,
			tohour:23,
			dates:[],
			buttons:{}
		},options);
		var my=this;
		$.each(options.buttons,function(key,values){
			if (my.buttonblock.find('button#'+key).size())
				my.buttonblock.find('button#'+key).off('click').on('click',function(){
					if (values!=null)
					{
						var starttime='';
						var endtime='';
						var times=0;
						var datetimes=[];
						$.each($('div.term',my.container),function(){
							var row=$(this);
							if ($('.date',row).text().length==0) return true;
							starttime=$('.starthour',row).val()+':'+$('.startminute',row).val();
							endtime=$('.endhour',row).val()+':'+$('.endminute',row).val();
							if (parseInt(starttime)>parseInt(endtime))
							{
								starttime=$('.endhour',row).val()+':'+$('.endminute',row).val();
								endtime=$('.starthour',row).val()+':'+$('.startminute',row).val();
							}
							times=0;
							times+=new Date(($('.date',row).text()+'T'+endtime+':00+09:00').dateformat()).getTime();
							times-=new Date(($('.date',row).text()+'T'+starttime+':00+09:00').dateformat()).getTime();
							datetimes.push({
								date:$('.date',row).text(),
								starttime:starttime,
								endtime:endtime,
								hours:times/(1000*60*60)
							});
						});
						values(datetimes);
					}
				});
		});
		this.contents.empty();
		$('.starthour',this.template).empty();
		$('.endhour',this.template).empty();
		for (var i=options.fromhour;i<options.tohour+1;i++)
		{
			$('.starthour',this.template).append($('<option>').attr('value',('0'+i.toString()).slice(-2)).text(('0'+i.toString()).slice(-2)));
			$('.endhour',this.template).append($('<option>').attr('value',('0'+i.toString()).slice(-2)).text(('0'+i.toString()).slice(-2)));
		}
		for (var i=0;i<options.dates.length;i++)
		{
			var row=this.template.clone(true);
			$('.starthour',row).val($('.starthour',row).find('option').first().val());
			$('.endhour',row).val($('.endhour',row).find('option').first().val());
			$('.date',row).text(options.dates[i]);
			this.contents.append(row);
		}
		if (this.isadd && options.dates.length==0) this.contents.append(this.template.clone(true));
		this.cover.show();
	},
	/* hide calendar */
	hide:function(){
		this.cover.hide();
	}
};
jQuery.fn.termselect=function(options){
	var options=$.extend({
		container:null,
		minutespan:30,
		isdatepick:false,
		issingle:false,
		buttons:{}
	},options);
	options.container=this;
	return new TermSelect(options);
};
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
* -------------------------------------------------------------------
*/
var FileSelect=function(options){
	var options=$.extend({
		container:null,
		buttons:{
			ok:{
				text:''
			},
			cancel:{
				text:''
			}
		}
	},options);
	/* property */
	this.buttons=options.buttons;
	/* valiable */
	var my=this;
	var div=$('<div>').css({
		'box-sizing':'border-box'
	});
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
	var table=$('<table>');
	var row=$('<tr>');
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
		'height':'600px',
		'left':'0',
		'margin':'auto',
		'max-height':'90%',
		'max-width':'90%',
		'padding':'5px',
		'position':'absolute',
		'right':'0',
		'top':'0',
		'width':'500px'
	});
	this.contents=div.clone(true).css({
		'height':'100%',
		'overflow-x':'hidden',
		'overflow-y':'auto',
		'padding':'5px',
		'position':'relative',
		'width':'100%',
		'z-index':'666'
	});
	this.fileblock=div.clone(true).css({
		'padding':'5px',
		'position':'relative',
		'width':'100%',
		'z-index':'777'
	})
	.append(
		$('<input type="file">').css({'display':'none'}).on('change',function(){
			var target=$(this);
			if (target[0].files.length!=0)
				my.upload(target[0].files[0]).then(function(res){
					var values={
						contentType:target[0].files[0].type,
						fileKey:JSON.parse(res).fileKey,
						name:target[0].files[0].name
					};
					my.addrow(values);
				});
		})
	)
	.append(
		button.clone(true).addClass('kintoneplugin-button-normal').css({
			'border':'1px solid #3498db',
			'color':'#3498db',
			'width':'100%'
		})
		.text('ファイルを追加')
		.on('click',function(){
			$(this).closest('div').find('input').click();
		})
	);
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
		'z-index':'999'
	});
	this.listblock=table.clone(true).css({
		'box-sizing':'border-box',
		'width':'100%'
	}).append($('<tbody>'));
	/* append elements */
	$.each(this.buttons,function(key,values){
		my.buttonblock.append(
			button.clone(true)
			.attr('id',key)
			.text(values.text)
		);
	});
	this.contents.append(this.fileblock);
	this.contents.append(this.listblock);
	this.container.append(this.contents);
	this.container.append(this.buttonblock);
	this.cover.append(this.container);
	options.container.append(this.cover);
	/* create template */
	this.template=row.clone(true);
	this.template.append(
		$('<td>').css({
			'border-bottom':'1px solid #C9C9C9',
			'cursor':'pointer',
			'padding':'0px 5px'
		})
		.append(
			$('<a href="" id="link">').on('click',function(e){
				var list=$(this).closest('tr');
				my.download(list.find('input#fileKey').val()).then(function(blob){
					var url=window.URL || window.webkitURL;
					var a=document.createElement('a');
					a.href=url.createObjectURL(blob);
					a.download=list.find('input#name').val();
					a.click();
				});
				e.preventDefault();
				e.stopPropagation();
				return false;
			})
		)
		.append($('<input type="hidden" id="contentType">'))
		.append($('<input type="hidden" id="fileKey">'))
		.append($('<input type="hidden" id="name">'))
	);
	this.template.append(
		$('<td>').css({
			'border-bottom':'1px solid #C9C9C9',
			'cursor':'pointer',
			'width':'30px'
		})
		.append(
			$('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/close.png" alt="削除" title="削除">')
			.css({'width':'100%'})
			.on('click',function(){
				$(this).closest('tr').remove();
			})
		)
	);
	/* adjust container height */
	$(window).on('load resize',function(){
		my.contents.css({'height':(my.container.height()-my.buttonblock.outerHeight(true)).toString()+'px'});
	});
};
FileSelect.prototype={
	/* download */
	download:function(fileKey)
	{
		return new Promise(function(resolve,reject)
		{
			var url=kintone.api.url('/k/v1/file',true)+'?fileKey='+fileKey;
			var xhr=new XMLHttpRequest();
			xhr.open('GET',url);
			xhr.setRequestHeader('X-Requested-With','XMLHttpRequest');
			xhr.responseType='blob';
			xhr.onload=function(){
				if (xhr.status===200) resolve(xhr.response);
				else reject(Error('File download error:' + xhr.statusText));
			};
			xhr.onerror=function(){
				reject(Error('There was a network error.'));
			};
			xhr.send();
		});
	},
	/* upload */
	upload:function(file){
		return new Promise(function(resolve,reject)
		{
			var blob=new Blob([file],{type:file.type});
			var filedata=new FormData();
			var xhr=new XMLHttpRequest();
			filedata.append('__REQUEST_TOKEN__',kintone.getRequestToken());
			filedata.append('file',blob,file.name);
			xhr.open('POST',encodeURI('/k/v1/file.json'),false);
			xhr.setRequestHeader('X-Requested-With','XMLHttpRequest');
			xhr.responseType='multipart/form-data';
			xhr.onload=function(){
				if (xhr.status===200) resolve(xhr.responseText);
				else reject(Error('File download error:' + xhr.statusText));
			};
			xhr.onerror=function(){
				reject(Error('There was a network error.'));
			};
			xhr.send(filedata);
		});
	},
	/* add row */
	addrow:function(values){
		var list=this.template.clone(true);
		list.find('input#contentType').val(values.contentType);
		list.find('input#fileKey').val(values.fileKey);
		list.find('input#name').val(values.name);
		list.find('a#link').text(values.name);
		this.listblock.find('tbody').append(list);
	},
	/* display referer */
	show:function(options){
		var options=$.extend({
			datasource:[],
			buttons:{}
		},options);
		var my=this;
		/* buttons callback */
		$.each(options.buttons,function(key,values){
			if (my.buttonblock.find('button#'+key).size())
				my.buttonblock.find('button#'+key).off('click').on('click',function(){
					if (values!=null)
					{
						var res=[];
						$.each(my.listblock.find('tbody').find('tr'),function(){
							res.push({
								contentType:$(this).find('input#contentType').val(),
								fileKey:$(this).find('input#fileKey').val(),
								name:$(this).find('input#name').val()
							});
						});
						values(res);
					}
				});
		});
		/* create lists */
		this.listblock.find('tbody').empty();
		$.each(options.datasource,function(index){my.addrow(options.datasource[index]);});
		this.cover.show();
		/* adjust container height */
		this.contents.css({'height':(this.container.height()-this.buttonblock.outerHeight(true)).toString()+'px'});
	},
	/* hide referer */
	hide:function(){
		this.cover.hide();
	}
};
jQuery.fn.fileselect=function(options){
	var options=$.extend({
		container:null,
		buttons:{}
	},options);
	options.container=this;
	return new FileSelect(options);
};
})(jQuery);
