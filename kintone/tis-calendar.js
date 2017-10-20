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
* options	@ active		:active date color {back,fore}
*			@ normal		:normal date color {back,fore}
*			@ saturday		:saturday color {back,fore}
*			@ sunday		:subday color {back,fore}
*			@ today			:today color {back,fore}
*			@ multi			:multi dates select
*			@ selected		:cell click event
*			@ span			:display month count
* -------------------------------------------------------------------
*/
var Calendar=function(options){
	var options=$.extend({
		container:null,
		active:{back:'#FFB46E',fore:'#2B2B2B'},
		normal:{back:'#FFFFFF',fore:'#2B2B2B'},
		saturday:{back:'#FFFFFF',fore:'#69B4C8'},
		sunday:{back:'#FFFFFF',fore:'#FA8273'},
		today:{back:'#69B4C8',fore:'#2B2B2B'},
		multi:false,
		selected:null,
		span:1
	},options);
	/* property */
	this.activedate=new Date('1000/01/01');
	this.activedates=[];
	this.displaymonth=new Date().calc('first-of-month');
	this.params=options;
	/* valiable */
	var my=this;
	var div=$('<div>').css({
		'box-sizing':'border-box',
		'position':'relative'
	});
	var button=$('<button>').css({
		'background-color':'transparent',
		'background-position':'left top',
		'background-repeat':'no-repeat',
		'background-size':'30px 30px',
		'border':'none',
		'box-sizing':'border-box',
		'cursor':'pointer',
		'font-size':'13px',
		'height':'30px',
		'margin':'0px',
	    'outline':'none',
	    'padding':'0px',
		'width':'30px'
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
		'height':(250*Math.ceil(options.span/3)+65).toString()+'px',
		'left':'0',
		'margin':'auto',
		'max-height':'100%',
		'max-width':'100%',
		'padding':'30px 5px 5px 5px',
		'position':'absolute',
		'right':'0',
		'text-align':'center',
		'top':'0',
		'width':(220*((options.span>3)?3:options.span)+10).toString()+'px'
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
	);
	this.contents=[];
	this.feedblock=div.clone(true).css({
		'height':'30px',
		'width':'100%'
	})
	.append(button.clone(true).css({
		'background-image':'url("https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/prev.png")',
		'position':'absolute',
		'left':'0px',
		'top':'0px'
	})
	.on('click',function(){
		/* calc months */
		my.displaymonth=my.displaymonth.calc('-'+options.span.toString()+' month').calc('first-of-month');
		/* display calendar */
		my.show();
	}))
	.append(button.clone(true).css({
		'background-image':'url("https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/next.png")',
		'position':'absolute',
		'right':'0px',
		'top':'0px'
	})
	.on('click',function(){
		/* calc months */
		my.displaymonth=my.displaymonth.calc(options.span.toString()+' month').calc('first-of-month');
		/* display calendar */
		my.show();
	}));
	for (var i=0;i<options.span;i++)
	{
		var calendar=table.clone(true).css({
			'box-sizing':'border-box',
			'margin':'0px auto'
		});
		this.contents.push(
			div.clone(true).css({
				'display':'inline-block',
				'height':'240px',
				'margin':'5px',
				'width':'210px'
			})
			.append(calendar)
		);
		/* create cells */
		for (var i2=0;i2<7*8;i2++)
		{
			if (i2%7==0) calendar.append($('<tr>'));
			calendar.find('tr').last()
			.append($('<td>').css({
				'border':'1px solid #C9C9C9',
				'color':options.normal.fore,
				'font-size':'13px',
				'height':'30px',
				'margin':'0px',
				'padding':'3px',
				'text-align':'center',
				'width':'30px'
			})
			.on('click',function(){
				if ($.isNumeric($(this).text()))
				{
					var value=my.displaymonth.calc((parseInt($(this).text())-1).toString()+' day');
					if (options.selected!=null) options.selected($(this).closest('td'),value.format('Y-m-d'));
					my.cover.hide();
				}
			}));
		}
		/* create header */
		var week=['日','月','火','水','木','金','土'];
		calendar.find('tr').eq(0).find('td').css({'border':'none','cursor':'pointer'});
		calendar.find('tr').eq(0).find('td').each(function(index){if (index>0) $(this).remove();});
		calendar.find('tr').eq(0).find('td').eq(0).attr('colspan',7).css('cursor','default');
		calendar.find('tr').eq(1).find('td').each(function(index){$(this).text(week[index]);});
		calendar.find('tr:gt(0)').find('td').eq(0).css({'background-color':options.sunday.back,'color':options.sunday.fore});
		calendar.find('tr:gt(0)').find('td').eq(6).css({'background-color':options.saturday.back,'color':options.saturday.fore});
	}
	/* append elements */
	this.container.append(this.feedblock);
	$.each(this.contents,function(index){my.container.append(my.contents[index]);});
	this.cover.append(this.container);
	options.container.append(this.cover);
};
Calendar.prototype={
	/* display calendar */
	show:function(options){
		var options=$.extend({
			activedate:null
		},options);
		var activedate=null;
		var calendar=null;
		var displaymonth=null;
		var params=this.params;
		if (options.activedate!=null)
		{
			/* setup active day and display month */
			var targetvalue=options.activedate.format('Y-m-d');
			if (targetvalue.match(/^[0-9]{4}(-|\/){1}[0-1]?[0-9]{1}(-|\/){1}[0-3]?[0-9]{1}$/g)!=null)
			{
				this.activedate=new Date(targetvalue.replace(/-/g,'\/'));
				this.displaymonth=new Date(targetvalue.replace(/-/g,'\/')).calc('first-of-month');
			}
		}
		for (var i=0;i<params.span;i++)
		{
			activedate=this.activedate;
			calendar=this.contents[i].find('table');
			displaymonth=this.displaymonth.calc(i.toString()+' month');
			/* initialize header title */
			calendar.find('tr').first().find('td').eq(0).text(displaymonth.format('Y-m'));
			/* setup cells */
			calendar.find('tr:gt(1)').find('td').each(function(index){
				var display=index-displaymonth.getDay();
				var day=displaymonth.calc(display.toString()+' day');
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
				if (day.format('Y-m')!=displaymonth.format('Y-m')) {$(this).css(style).html('&nbsp;');return;}
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
				if(day.format('Y-m-d')==activedate.format('Y-m-d')) style=active;
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
		active:{back:'#FFB46E',fore:'#2B2B2B'},
		normal:{back:'#FFFFFF',fore:'#2B2B2B'},
		saturday:{back:'#FFFFFF',fore:'#69B4C8'},
		sunday:{back:'#FFFFFF',fore:'#FA8273'},
		today:{back:'#69B4C8',fore:'#2B2B2B'},
		selected:null
	},options);
	options.container=this;
	return new Calendar(options);
};
})(jQuery);
