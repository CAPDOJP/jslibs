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
*			@ selected		:cell click event
* -------------------------------------------------------------------
*/
var Calendar=function(options){
	var options=$.extend({
		container:null,
		active:{back:'#FFB46E',fore:'#2B2B2B'},
		normal:{back:'#F3F3F3',fore:'#2B2B2B'},
		saturday:{back:'#F3F3F3',fore:'#69B4C8'},
		sunday:{back:'#F3F3F3',fore:'#FA8273'},
		today:{back:'#B4DC69',fore:'#2B2B2B'},
		selected:null
	},options);
	/* property */
	this.activedate=new Date('1000/01/01');
	this.displaymonth=new Date().calc('first-of-month');
	this.params=options;
	/* valiable */
	var my=this;
	var div=$('<div>').css({
		'box-sizing':'border-box'
	});
	var button=$('<button>');
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
		'background-color':'#ffffff',
		'bottom':'0',
		'border-radius':'5px',
		'box-shadow':'0px 0px 3px rgba(0,0,0,0.35)',
		'height':'600px',
		'left':'0',
		'margin':'auto',
		'max-height':'100%',
		'max-width':'100%',
		'padding':'5px',
		'position':'absolute',
		'right':'0',
		'text-align':'center',
		'top':'0',
		'width':'600px'
	});
	this.contents=table.clone(true).css({
		'box-sizing':'border-box',
		'margin':'0px auto'
	});
	this.buttonblock=div.clone(true).css({
		'text-align':'right',
		'width':'100%'
	});
	/* create cells */
	for (var i=0;i<7*8;i++)
	{
		if (i%7==0) this.contents.append($('<tr>'));
		this.contents.find('tr').last()
		.append($('<td>').css({
			'border':'1px solid #C9C9C9',
			'color':options.normal.fore,
			'font-size':'13px',
			'margin':'0px',
			'padding':'3px',
			'text-align':'center'
		})
		.on('click',function(){
			if ($.isNumeric($(this).text()))
			{
				var value=my.displaymonth.calc((parseInt($(this).text())-1).toString()+' day');
				if (options.selected!=null) options.selected($(this).closest('td'),value.format('Y-m-d'));
			}
		}));
	}
	/* create header */
	var week=['日','月','火','水','木','金','土'];
	this.contents.find('tr').eq(0).find('td').css({'border':'none','cursor':'pointer'});
	this.contents.find('tr').eq(0).find('td').each(function(index){if (index>2) $(this).remove();});
	this.contents.find('tr').eq(0).find('td').eq(1).attr('colspan',5).css('cursor','default');
	this.contents.find('tr').eq(1).find('td').each(function(index){$(this).text(week[index]);});
	this.contents.find('tr:gt(0)').find('td').eq(0).css({'background-color':options.sunday.back,'color':options.sunday.fore});
	this.contents.find('tr:gt(0)').find('td').eq(6).css({'background-color':options.saturday.back,'color':options.saturday.fore});
	/* create buttons */
	this.contents.find('tr').first().find('td').first().append($('<div>'))
	.on('click',function(){
		/* calc months */
		my.displaymonth=my.displaymonth.calc('-1 month').calc('first-of-month');
		/* display calendar */
		my.calendarShow();
	});
	this.contents.find('tr').first().find('td').last().append($('<div>'))
	.on('click',function(){
		/* calc months */
		my.displaymonth=my.displaymonth.calc('1 month').calc('first-of-month');
		/* display calendar */
		my.calendarShow();
	});
	/* append elements */
	this.buttonblock.append(button.clone(true)
	
	
	
		.on('click',function(){my.cover.hide();})
	);
	this.container.append(this.buttonblock);
	this.container.append(this.contents);
	this.cover.append(this.container);
	options.container.append(this.cover);
};
Calendar.prototype={
	/* display calendar */
	show:function(options){
		var options=$.extend({
			activedate:null
		},options);
		if (options.activedate!=null)
		{
			/* setup active day and display month */
			var targetvalue=options.activedate.format('Y-m-d');
			if (targetvalue.match(/^[0-9]{4}(-|\/){1}[0-1]?[0-9]{1}(-|\/){1}[0-3]?[0-9]{1}$/g)!=null)
			{
				this.activedate=new Date(targetvalue.replace(/-/g,'\/'));
				this.displaymonth=new Date(targetvalue.replace(/-/g,'\/'));
			}
		}
		/* initialize header title */
		this.contents.find('tr').first().find('td').eq(1).text(this.displaymonth.format('Y-m'));
		/* setup cells */
		var activedate=this.activedate;
		var displaymonth=this.displaymonth;
		var params=this.params;
		this.contents.find('tr:gt(1)').find('td').each(function(index){
			$(this).animate({opacity:'0'},50,function(){
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
			}).delay(index*10).animate({opacity:'1'},150);
		});
		this.cover.show();
	}
};
jQuery.fn.calendar=function(options){
	var options=$.extend({
		container:null,
		active:{back:'#FFB46E',fore:'#2B2B2B'},
		normal:{back:'#F3F3F3',fore:'#2B2B2B'},
		saturday:{back:'#F3F3F3',fore:'#69B4C8'},
		sunday:{back:'#F3F3F3',fore:'#FA8273'},
		today:{back:'#B4DC69',fore:'#2B2B2B'},
		selected:null
	},options);
	options.container=this;
	return new Calendar(options);
};
})(jQuery);
