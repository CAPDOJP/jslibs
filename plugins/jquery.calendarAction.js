/*
*--------------------------------------------------------------------
* jQuery-Plugin "calendarAction"
* Version: 1.0
* Copyright (c) 2014 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
(function($){
/*
*--------------------------------------------------------------------
* parameters
* options @ active		:対象セルスタイルシート
*         @ normal		:通常セルスタイルシート
*         @ saturday	:右列セルスタイルシート
*         @ sunday		:左列セルスタイルシート
*         @ today		:当日セルスタイルシート
*         @ line		:境界線幅
*         @ feedcolor	:移動ボタン色
*         @ box			:セル内ボックススタイルシート
*         @ opening		:表示スタイルシート
*         @ changed		:表示月変更時コールバック
*         @ selected	:日付選択時コールバック
* -------------------------------------------------------------------
*/
jQuery.fn.calendarAction = function(options){
	var options=$.extend({
		active:{'background-color':'#87cefa','color':'#2b2b2b'},
		normal:{'background-color':'#ffffff','color':'#2b2b2b'},
		saturday:{'background-color':'#ffffff','color':'#1e90ff'},
		sunday:{'background-color':'#ffffff','color':'#dc143c'},
		today:{'background-color':'#ffb6c1','color':'#2b2b2b'},
		line:2,
		feedcolor:'#2b2b2b',
		box:[],
		maxwidth:'700px',
		opening:'',
		changed:null,
		selected:null
	},options);
	return $(this).each(function(){
		/*
		*------------------------------------------------------------
		* コンテナ設定
		*------------------------------------------------------------
		*/
		var target=$(this);
		//引数を変数に代入
		$.data(target[0],'active',new Date('1000/01/01'));
		$.data(target[0],'display',new Date().DateCalc('first-of-month'));
		$.data(target[0],'options',options);
		/*
		*------------------------------------------------------------
		* カレンダー設定
		*------------------------------------------------------------
		*/
		var header=$('<thead>');
		var cells=$('<tbody>');
		var calendar=$('<table>').css({
			'box-sizing':'border-box',
			'margin':'0px auto',
			'max-width':options.maxwidth,
			'position':'relative',
			'text-align':'center',
			'width':'100%',
		})
		.append(header)
		.append(cells);
		//ヘッダー(年月)
		header.append($('<tr>'))
		header.find('tr').last().append($('<td>'));
		header.find('tr').last().append($('<td colspan="5">'));
		header.find('tr').last().append($('<td>'));
		header.find('tr').last().find('td').css({
			'border':'none',
			'cursor':'pointer',
			'height':'50px'
		});
		//ヘッダー(曜日)
		var week=['日','月','火','水','木','金','土'];
		header.append($('<tr>'))
		for (var i=0;i<week.length;i++)
		{
			var cell=$('<td>').text(week[i]);
			switch (i)
			{
				case 0:
					if (options.sunday!=null) cell.css(options.sunday);
					break;
				case 6:
					if (options.saturday!=null) cell.css(options.saturday);
					break;
				default:
					if (options.normal!=null) cell.css(options.normal);
					break;
			}
			header.find('tr').last().append(cell);
		}
		//セル(日付)
		for (var i=0;i<7*6;i++)
		{
			if (i%7==0) cells.append($('<tr>'));
			var cell=$('<td>');
			var cellinner=$('<div>').on('click',function(){
				if ($.isNumeric($(this).text()))
				{
					var value=$.data(target[0],'display').DateCalc((parseInt($(this).text())-1).toString()+' day');
					if ($($.data(target[0],'target'))!=null) $($.data(target[0],'target')).val(value.DateFormat('Y-m-d'));
					//カレンダー非表示
					if (options.opening.length!=0) target.removeClass(options.opening);
					//コールバック
					if (options.selected!=null) options.selected($(this).closest('td'),value.DateFormat('Y-m-d'));
				}
			});
			switch (i)
			{
				case 0:
					if (options.sunday!=null) {cell.css(options.sunday);cellinner.css(options.sunday);}
					break;
				case 6:
					if (options.saturday!=null) {cell.css(options.saturday);cellinner.css(options.saturday);}
					break;
				default:
					if (options.normal!=null) {cell.css(options.normal);cellinner.css(options.normal);}
					break;
			}
			cells.find('tr').last().append(cell.append(cellinner));
			//追加セルボックス
			$.each(options.box,function(index){
				cell.append($('<div>')
				.on('click',function(){
					if ($.isNumeric(cellinner.text()))
					{
						var value=$.data(target[0],'display').DateCalc((parseInt(cell.text())-1).toString()+' day');
						if ($($.data(target[0],'target'))!=null) $($.data(target[0],'target')).val(value.DateFormat('Y-m-d'));
						//カレンダー非表示
						if (options.opening.length!=0) target.removeClass(options.opening);
						//コールバック
						if (options.selected!=null) options.selected($(this).closest('td'),value.DateFormat('Y-m-d'));
					}
				})
				.css(options.box[index]));
			});
		}
		calendar.find('th,td').css({'width':'calc(100% / 7)'});
		target.append(calendar);
		/*
		*------------------------------------------------------------
		* 移動ボタン設定
		*------------------------------------------------------------
		*/
		header.find('tr').first().find('td').first().append($('<div>'))
		.on('click',function(){
			//月減算
			$.data(target[0],'display',$.data(target[0],'display').DateCalc('-1 month').DateCalc('first-of-month'));
			//カレンダー再表示
			target.calendarShow();
		});
		header.find('tr').first().find('td').last().append($('<div>'))
		.on('click',function(){
			//月加算
			$.data(target[0],'display',$.data(target[0],'display').DateCalc('1 month').DateCalc('first-of-month'));
			//カレンダー再表示
			target.calendarShow();
		});
		header.find('tr').first().find('td').find('div').css({
			'border-top':'11.5px solid transparent',
			'border-bottom':'11.5px solid transparent',
			'display':'block',
			'height':'0px',
			'left':'50%',
			'position':'absolute',
			'top':'13.5px',
			'width':'0px'
		});
		header.find('tr').first().find('td').first().find('div').css({
			'border-left':'20px solid transparent',
			'border-right':'20px solid '+options.feedcolor,
			'margin-left':'-30px'
		});
		header.find('tr').first().find('td').last().find('div').css({
			'border-left':'20px solid '+options.feedcolor,
			'border-right':'20px solid transparent',
			'margin-left':'-10px'
		});
	});
}
/*
*--------------------------------------------------------------------
* カレンダー表示
*--------------------------------------------------------------------
* parameters
* options @ target:値設定テキストボックス
* -------------------------------------------------------------------
*/
jQuery.fn.calendarShow = function(options){
	var options=$.extend({
		target:null
	},options);
	var target=$(this);
	if (options.target!=null)
	{
		//テキストボックスを変数に代入
		$.data(target[0],'target',options.target);
		//日付取得
		if ($(options.target).toVal().match(/^[0-9]{4}(-|\/){1}[0-1]?[0-9]{1}(-|\/){1}[0-3]?[0-9]{1}$/g)!=null)
		{
			$.data(target[0],'active',new Date($(options.target).toVal().replace(/-/g,'\/')));
			$.data(target[0],'display',new Date($(options.target).toVal().replace(/-/g,'\/')));
		}
	}
	/*
	*----------------------------------------------------------------
	* 日付設定
	*----------------------------------------------------------------
	*/
	//タイトル初期化
	$(this).find('thead').find('tr').first().find('td').eq(1).text($.data(target[0],'display').DateFormat('Y-m'));
	//日付初期化
	$.data(target[0],'display',$.data(target[0],'display').DateCalc('first-of-month'));
	//セル設定
	target.find('tbody').find('td').each(function(index){
		$(this).animate({opacity:'0'},50,function(){
			var display=index-$.data(target[0],'display').getDay();
			var day=$.data(target[0],'display').DateCalc(display.toString()+' day');
			var active=$.data(target[0],'options').active;
			var normal=$.data(target[0],'options').normal;
			var saturday=$.data(target[0],'options').saturday;
			var sunday=$.data(target[0],'options').sunday;
			var today=$.data(target[0],'options').today;
			var cell=$(this).find('div').first();
			if (normal!=null) cell.css(normal);
			//月初日以前は処理しない
			if (display<0) {cell.html('&nbsp;');return;}
			//翌月初日以降は処理しない
			if (day.DateFormat('Y-m')!=$.data(target[0],'display').DateFormat('Y-m')) {cell.html('&nbsp;');return;}
			switch ((index+1)%7)
			{
				case 0:
					//土曜日
					if (saturday!=null) cell.css(saturday);
					break;
				case 1:
					//日曜日
					if (sunday!=null) cell.css(sunday);
					break;
			}
			//当日
			if(day.DateFormat('Y-m-d')==new Date().DateFormat('Y-m-d'))
				if (today!=null) cell.css(today);
			//指定日
			if(day.DateFormat('Y-m-d')==$.data(target[0],'active').DateFormat('Y-m-d'))
				if (active!=null) cell.css(active);
			//日付設定
			cell.css({'cursor':'pointer'}).text((display+1).toString());
		}).delay(index*10).animate({opacity:'1'},150);
	});
	//コールバック
	if ($.data(target[0],'options').changed!=null) $.data(target[0],'options').changed();
	/*
	*----------------------------------------------------------------
	* カレンダー表示
	*----------------------------------------------------------------
	*/
	if ($.data(target[0],'options').opening.length!=0) $(this).addClass($.data(target[0],'options').opening);
}
/*
*--------------------------------------------------------------------
* 日付加算
*--------------------------------------------------------------------
* parameters
* pattern:加算パターン
* -------------------------------------------------------------------
*/
Date.prototype.DateCalc = function(pattern){
	var year=this.getFullYear();
	var month=this.getMonth()+1;
	var day=this.getDate();
	//年加算
	if (pattern.match(/^-?[0-9]+ year$/g)!=null) year+=parseInt(pattern.match(/^-?[0-9]+/g));
	//月加算
	if (pattern.match(/^-?[0-9]+ month$/g)!=null)
	{
		month+=parseInt(pattern.match(/^-?[0-9]+/g));
		//年末チェック
		while (month<1) {year--;month+=12;}
		while (month>12) {year++;month-=12;}
		//月末チェック
		var check=new Date(year.toString()+'/'+month.toString()+'/'+day.toString());
		if (check.getMonth()+1!=month)
		{
			check=new Date(year.toString()+'/'+(month+1).toString()+'/1');
			check.setDate(0);
			day=check.getDate();
		}
	}
	//日加算
	if (pattern.match(/^-?[0-9]+ day$/g)!=null) day+=parseInt(pattern.match(/^-?[0-9]+/g));
	//年初日
	if (pattern.match(/^first-of-year$/g)!=null) {month=1;day=1};
	//月初日
	if (pattern.match(/^first-of-month$/g)!=null) day=1;
	if (month<1){year--;month=12;}
	if (month>12){year++;month=1;}
	return new Date(year.toString(),(month-1).toString(),day.toString());
}
/*
*--------------------------------------------------------------------
* 日付フォーマット
*--------------------------------------------------------------------
* parameters
* pattern:フォーマットパターン
* -------------------------------------------------------------------
*/
Date.prototype.DateFormat = function(pattern){
	var year=this.getFullYear().toString();
	var month=('0'+(this.getMonth()+1).toString()).slice(-2);
	var day=('0'+this.getDate()).slice(-2);
	//年
	if (pattern.match(/^Y$/g)!=null) return year;
	//月
	if (pattern.match(/^Y-m$/g)!=null) return year+'-'+month;
	if (pattern.match(/^Y\/m$/g)!=null) return year+'/'+month;
	//日
	if (pattern.match(/^Y-m-d$/g)!=null) return year+'-'+month+'-'+day;
	if (pattern.match(/^Y\/m\/d$/g)!=null) return year+'/'+month+'/'+day;
	return '';
}
/*
*--------------------------------------------------------------------
* 時間加算
*--------------------------------------------------------------------
* parameters
* pattern:加算パターン
* -------------------------------------------------------------------
*/
Date.prototype.TimeCalc = function(pattern){
	var year=this.getFullYear();
	var month=this.getMonth()+1;
	var day=this.getDate();
	//時間加算
	if (pattern.match(/^-?[0-9]+ hour/g)!=null) return new Date(this.setHours(this.getHours()+parseInt(pattern.match(/^-?[0-9]+/g))));
	//分加算
	if (pattern.match(/^-?[0-9]+ minute/g)!=null) return new Date(this.setMinutes(this.getMinutes()+parseInt(pattern.match(/^-?[0-9]+/g))));
	//秒加算
	if (pattern.match(/^-?[0-9]+ second/g)!=null) return new Date(this.setSeconds(this.getSeconds()+parseInt(pattern.match(/^-?[0-9]+/g))));
}
/*
*--------------------------------------------------------------------
* 時間フォーマット
*--------------------------------------------------------------------
* parameters
* pattern:フォーマットパターン
* -------------------------------------------------------------------
*/
Date.prototype.TimeFormat = function(pattern){
	var hour=('0'+this.getHours()).slice(-2);
	var minute=('0'+this.getMinutes()).slice(-2);
	var second=('0'+this.getSeconds()).slice(-2);
	//時間
	if (pattern.match(/^H$/g)!=null) return hour;
	//分
	if (pattern.match(/^H:i$/g)!=null) return hour+':'+minute;
	//秒
	if (pattern.match(/^H:i:s$/g)!=null) return hour+':'+minute+':'+second;
	return '';
}
})(jQuery);
/*
*--------------------------------------------------------------------
* 期間指定ウインドウ
*--------------------------------------------------------------------
* parameters
* options @ container	:期間指定要素コンテナ
*         @ isadd		:行追加判定
*         @ isdatepick	:日付カレンダー使用判定
*         @ issingle	:分単一指定判定
*         @ minutespan	:指定分間隔
*         @ buttons		:各種ボタン
*         @ calendar	:日付選択カレンダー
* -------------------------------------------------------------------
*/
var TermSelect=function(options){
	var options=$.extend({
		container:null,
		isadd:false,
		isdatepick:false,
		issingle:false,
		minutespan:30,
		buttons:{
			ok:null,
			add:null,
			del:null
		},
		calendar:{
			button:null,
			container:null,
			cover:null
		}
	},options);
	var my=this;
	var select=$('<select>').css({
		'display':'inline-block',
		'line-height':'2em',
		'margin':'0px',
		'padding':'0px 0.5em',
		'vertical-align':'top'
	});
	var span=$('<span>').css({
		'display':'inline-block',
		'line-height':'2em',
		'margin':'0px',
		'padding':'0px 0.25em',
		'vertical-align':'top'
	});
	/* プロパティ */
	this.container=options.container.css({'text-align':'left'});
	this.isadd=options.isadd;
	this.isdatepick=options.isdatepick;
	this.issingle=options.issingle;
	this.buttons=options.buttons;
	this.calendar=options.calendar;
	if (this.buttons.ok==null) {alert('追加ボタンを指定して下さい。');return;}
	/* テンプレート生成 */
	this.hour=select.clone(true);
	this.minute=select.clone(true);
	for (var i=0;i<60;i+=options.minutespan) this.minute.append($('<option>').attr('value',('0'+i.toString()).slice(-2)).text(('0'+i.toString()).slice(-2)))
	this.template=$('<div>').css({
		'border-bottom':'1px dotted #C9C9C9',
		'padding':'0.25em 0px',
		'width':'100%'
	})
	.addClass('term');
	this.template.append(
		$('<div>').css({
			'display':'inline-block',
			'min-height':'2em'
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
	/* 各種ボタン追加 */
	if (options.isadd)
	{
		if (this.buttons.add==null) {alert('追加ボタンを指定して下さい。');return;}
		if (this.buttons.del==null) {alert('削除ボタンを指定して下さい。');return;}
		this.template.append(
			this.buttons.add.css({
				'height':'2em',
				'vertical-align':'top',
				'width':'2em'
			})
			.addClass('add')
			.on('click',function(){
				var row=my.template.clone(true);
				$('.del',row).show();
				my.container.append(row);
				/* 日付要素幅調整 */
				my.adjustdate();
			})
		);
		this.template.append(
			this.buttons.del.css({
				'height':'2em',
				'vertical-align':'top',
				'width':'2em'
			})
			.addClass('del')
			.on('click',function(){
				$(this).closest('.term').remove();
			}).hide()
		);
	}
	/* 日付ピッカー */
	if (options.isdatepick)
	{
		var activerow=null;
		options.calendar.container.calendarAction({
			normal:{
				'background-color':'#ffffff',
				'color':'#2b2b2b',
				'line-height':'3em'
			},
			selected:function(target,value){
				$('.date',activerow).text(value);
				options.calendar.cover.hide();
			}
		});
		this.template.find('.date').css({'padding-left':'0.5em'}).closest('div').css({'padding-left':'2em'})
		.append(
			options.calendar.button
			.css({
				'height':'2em',
				'left':'0px',
				'margin':'0px',
				'position':'absolute',
				'top':'0px',
				'width':'2em'
			})
			.on('click',function(){
				activerow=$(this).closest('div');
				options.calendar.container.calendarShow({target:($('.date',activerow).text().length!=0)?$('.date',activerow):null});
				options.calendar.cover.show();
			})
		);
	}
	$(window).on('resize',function(){
		/* 日付要素幅調整 */
		my.adjustdate();
	});
}
TermSelect.prototype={
	adjustdate:function(){
		if (!$('div.term',this.container).size()) return;
		var width=0;
		$.each($('div.term',this.container).eq(0).find('select,span'),function(index){
			if (!$(this).hasClass('date')) width+=$(this).outerWidth(true);
		});
		if (this.isadd) width+=$('div.term',this.container).eq(0).find('.add').outerWidth(true)*2;
		$('.date').closest('div').css({'width':'calc(100% - '+width.toString()+'px)'});
	},
	show:function(options){
		var options=$.extend({
			fromhour:0,
			tohour:23,
			dates:[],
			callback:null
		},options);
		var my=this;
		if (options.callback!=null)
			this.buttons.ok.off('click').on('click',function(){
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
					times+=new Date(($('.date',row).text()+' '+endtime+':00').replace(/-/g,'\/')).getTime();
					times-=new Date(($('.date',row).text()+' '+starttime+':00').replace(/-/g,'\/')).getTime();
					datetimes.push({
						date:$('.date',row).text(),
						starttime:starttime,
						endtime:endtime,
						hours:times/(1000*60*60)
					});
				});
				options.callback(datetimes);
			});
		this.container.empty();
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
			this.container.append(row);
		}
		if (this.isadd && options.dates.length==0) this.container.append(this.template.clone(true));
		this.container.closest('div.floating').show();
		/* 日付要素幅調整 */
		this.adjustdate();
	}
}
