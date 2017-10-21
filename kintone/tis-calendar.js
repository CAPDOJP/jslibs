/*
*--------------------------------------------------------------------
* jQuery-Plugin "tis-calendar"
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
* options	@ multi			:multi dates select
*			@ selected		:cell click event
*			@ span			:display month count
*			@ active		:active date color {back,fore}
*			@ normal		:normal date color {back,fore}
*			@ saturday		:saturday color {back,fore}
*			@ sunday		:subday color {back,fore}
*			@ today			:today color {back,fore}
* -------------------------------------------------------------------
*/
var Calendar=function(options){
	var options=$.extend({
		container:null,
		multi:false,
		selected:null,
		span:1,
		active:{back:'#FFB46E',fore:'#2B2B2B'},
		normal:{back:'#FFFFFF',fore:'#2B2B2B'},
		saturday:{back:'#FFFFFF',fore:'#69B4C8'},
		sunday:{back:'#FFFFFF',fore:'#FA8273'},
		today:{back:'#69B4C8',fore:'#2B2B2B'}
	},options);
	/* property */
	this.activedates=[];
	this.calendars=[];
	this.frommonth=new Date().calc('first-of-month');
	this.params=options;
	/* valiable */
	var my=this;
	var calendarparams={
		height:0,
		width:0,
		rows:8,
		cells:{
			height:30,
			width:30
		},
		margin:{
			left:5,
			right:5,
			top:0,
			bottom:10
		}
	};
	var columns=0;
	var week=['日','月','火','水','木','金','土'];
	calendarparams.height=calendarparams.cells.height*calendarparams.rows+(calendarparams.rows-1)+(calendarparams.margin.top+calendarparams.margin.bottom);
	calendarparams.width=calendarparams.cells.width*week.length+(week.length-1)+(calendarparams.margin.left+calendarparams.margin.right);
	switch (options.span)
	{
		case 1:
		case 2:
		case 3:
			columns=options.span;
			break;
		default:
			columns=4;
			break;
	}
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
		'background-position':'left top',
		'background-repeat':'no-repeat',
		'background-size':calendarparams.cells.width.toString()+'px '+calendarparams.cells.height.toString()+'px',
		'border':'none',
		'box-sizing':'border-box',
		'cursor':'pointer',
		'font-size':'13px',
		'height':calendarparams.cells.height.toString()+'px',
		'line-height':calendarparams.cells.height.toString()+'px',
		'margin':'0px',
	    'outline':'none',
	    'padding':'0px',
		'width':calendarparams.cells.width.toString()+'px'
	});
	var table=$('<table>').css({
		'margin-left':calendarparams.margin.left.toString()+'px',
		'margin-right':calendarparams.margin.right.toString()+'px',
		'margin-top':calendarparams.margin.top.toString()+'px',
		'margin-bottom':calendarparams.margin.bottom.toString()+'px'
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
		'height':(calendarparams.height*Math.ceil(options.span/columns)+(calendarparams.cells.height*((options.multi)?3:2))).toString()+'px',
		'left':'0',
		'margin':'auto',
		'max-height':'100%',
		'max-width':'100%',
		'padding':(calendarparams.cells.height*2).toString()+'px 0px '+((options.multi)?calendarparams.cells.height:0).toString()+'px 0px',
		'position':'absolute',
		'right':'0',
		'text-align':'center',
		'top':'0',
		'width':(calendarparams.width*columns+10).toString()+'px'
	})
	.append(
		button.clone(true).css({
			'background-image':'url("https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/close.png")',
			'position':'absolute',
			'right':'0px',
			'top':'0px',
			'z-index':options.span+1
		})
		.on('click',function(){my.cover.hide();})
	)
	.append(
		div.clone(true).css({
			'height':calendarparams.cells.height.toString()+'px',
			'left':'0px',
			'position':'absolute',
			'top':calendarparams.cells.height.toString()+'px',
			'z-index':options.span+2,
			'width':'100%'
		})
		.append(
			button.clone(true).css({
				'background-image':'url("https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/prev.png")',
				'position':'absolute',
				'left':'0px',
				'top':'0px'
			})
			.on('click',function(){
				/* calc months */
				my.frommonth=my.frommonth.calc('-'+options.span.toString()+' month').calc('first-of-month');
				/* display calendar */
				my.show();
			})
		)
		.append(
			button.clone(true).css({
				'background-image':'url("https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/next.png")',
				'position':'absolute',
				'right':'0px',
				'top':'0px'
			})
			.on('click',function(){
				/* calc months */
				my.frommonth=my.frommonth.calc(options.span.toString()+' month').calc('first-of-month');
				/* display calendar */
				my.show();
			})
		)
	);
	this.contents=table.clone(true).css({
		'overflow-x':'hidden',
		'overflow-y':'auto',
		'padding':'0px 5px',
		'width':'100%'
	});
	this.buttonblock=div.clone(true).css({
		'bottom':'0px',
		'left':'0px',
		'padding':'0px',
		'position':'absolute',
		'text-align':'center',
		'width':'100%',
		'z-index':options.span+3
	})
	.append(
		button.clone(true).css({'width':'6em'})
		.attr('id','ok')
		.text('OK')
	)
	.append(
		button.clone(true).css({'width':'6em'})
		.attr('id','cancel')
		.text('キャンセル')
	);
	/* create calendar */
	for (var i=0;i<options.span;i++)
	{
		var calendar=table.clone(true).css({'box-sizing':'border-box'});
		this.calendars.push(
			div.clone(true).css({
				'display':'inline-block',
				'height':calendarparams.height.toString()+'px',
				'width':calendarparams.width.toString()+'px'
			})
			.append(calendar)
		);
		/* create cells */
		for (var i2=0;i2<week.length*calendarparams.rows;i2++)
		{
			if (i2%week.length==0) calendar.append($('<tr>'));
			calendar.find('tr').last()
			.append(
				$('<td>').css({
					'border':'1px solid #C9C9C9',
					'box-sizing':'border-box',
					'color':options.normal.fore,
					'font-size':'13px',
					'height':calendarparams.cells.height.toString()+'px',
					'line-height':calendarparams.cells.height.toString()+'px',
					'margin':'0px',
					'padding':'0px',
					'text-align':'center',
					'width':calendarparams.cells.width.toString()+'px'
				})
				.on('click',function(){
					if ($.isNumeric($(this).text()))
					{
						var month=new Date(($(this).closest('table').find('tr').first().find('td').eq(0).text()+'-01').dateformat());
						var value=month.calc((parseInt($(this).text())-1).toString()+' day');
						if (options.multi)
						{
							if ($.inArray(value,this.activedates)>-1)
							{
								this.activedates.splice($.inArray(value,this.activedates),1);
							}
							else
							{
								this.activedates.push(value);
							}
						}
						else
						{
							if (options.selected!=null) options.selected($(this).closest('td'),value.format('Y-m-d'));
							my.cover.hide();
						}
					}
				})
			);
		}
		/* create header */
		calendar.find('tr').eq(0).find('td').css({'border':'none','cursor':'pointer'});
		calendar.find('tr').eq(0).find('td').each(function(index){if (index>0) $(this).remove();});
		calendar.find('tr').eq(0).find('td').eq(0).attr('colspan',week.length).css('cursor','default');
		calendar.find('tr').eq(1).find('td').each(function(index){$(this).text(week[index]);});
		calendar.find('tr:gt(0)').find('td').eq(0).css({'background-color':options.sunday.back,'color':options.sunday.fore});
		calendar.find('tr:gt(0)').find('td').eq(6).css({'background-color':options.saturday.back,'color':options.saturday.fore});
	}
	/* append elements */
	$.each(this.calendars,function(index){my.contents.append(my.calendars[index]);});
	this.container.append(this.contents);
	if (options.multi) this.container.append(this.buttonblock);
	this.cover.append(this.container);
	options.container.append(this.cover);
};
Calendar.prototype={
	/* display calendar */
	show:function(options){
		var options=$.extend({
			activedate:null,
			activedates:null,
			buttons:{}
		},options);
		var my=this;
		var activedates=(options.activedate!=null)?options.activedate.format('Y-m-d'):((options.activedates!=null)?options.activedates:'');
		var calendar=null;
		var month=null;
		var params=this.params;
		var selections=activedates.split(',');
		/* buttons callback */
		$.each(options.buttons,function(key,values){
			if (my.buttonblock.find('button#'+key).size())
				my.buttonblock.find('button#'+key).off('click').on('click',function(){
					if (values!=null)
					{
						var selection='';
						for (var i=0;i<this.activedates.length;i++) selection+=this.activedates[i].format('Y-m-d')+',';
						selection=selection.replace(/,$/g,'');
						values(selection);
					}
				});
		});
		/* setup active day and display month */
		this.activedates=[];
		for (var i=0;i<selections.length;i++)
		{
			if (selections[i].match(/^[0-9]{4}(-|\/){1}[0-1]?[0-9]{1}(-|\/){1}[0-3]?[0-9]{1}$/g)!=null)
			{
				this.activedates.push(new Date(selections[i].replace(/-/g,'\/')));
				if (i==0) this.frommonth=new Date(selections[i].replace(/-/g,'\/')).calc('first-of-month');
			}
		}
		for (var i=0;i<params.span;i++)
		{
			calendar=this.calendars[i].find('table');
			month=this.frommonth.calc(i.toString()+' month');
			/* initialize header title */
			calendar.find('tr').first().find('td').eq(0).text(month.format('Y-m'));
			/* setup cells */
			calendar.find('tr:gt(1)').find('td').each(function(index){
				var display=index-month.getDay();
				var day=month.calc(display.toString()+' day');
				var style={
					'background-color':params.normal.back,
					'color':params.normal.fore,
					'cursor':'default'
				};
				var active={
					'background-color':params.active.back,
					'color':params.active.fore,
					'cursor':'pointer'
				};
				/* not process less than one day this month */
				if (display<0) {$(this).css(style).html('&nbsp;');return;}
				/* not processing beyond the next month 1 day */
				if (day.format('Y-m')!=month.format('Y-m')) {$(this).css(style).html('&nbsp;');return;}
				switch ((index+1)%7)
				{
					case 0:
						//saturday's style
						style['background-color']=params.saturday.back;
						style['color']=params.saturday.fore;
						break;
					case 1:
						//sunday's style
						style['background-color']=params.sunday.back;
						style['color']=params.sunday.fore;
						break;
				}
				//today's style
				if(day.format('Y-m-d')==new Date().format('Y-m-d'))
				{
					style['background-color']=params.today.back;
					style['color']=params.today.fore;
				}
				//activedate's style
				for (var i2=0;i2<this.activedates.length;i2++) if (day.format('Y-m-d')==this.activedates[i2].format('Y-m-d')) style=active;
				style['cursor']='pointer';
				$(this).css(style).text((display+1).toString());
			});
		}
		this.cover.show();
	},
	/* hide calendar */
	hide:function(){
		this.cover.hide();
	}
};
jQuery.fn.calendar=function(options){
	var options=$.extend({
		container:null,
		multi:false,
		selected:null,
		span:1,
		active:{back:'#FFB46E',fore:'#2B2B2B'},
		normal:{back:'#FFFFFF',fore:'#2B2B2B'},
		saturday:{back:'#FFFFFF',fore:'#69B4C8'},
		sunday:{back:'#FFFFFF',fore:'#FA8273'},
		today:{back:'#69B4C8',fore:'#2B2B2B'}
	},options);
	options.container=this;
	return new Calendar(options);
};
})(jQuery);
