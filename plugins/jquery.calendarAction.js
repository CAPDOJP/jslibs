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
* options @ active  　:対象色{back,fore}
*         @ normal  　:通常色{back,fore}
*         @ saturday :右列色{back,fore}
*         @ sunday   :左列色{back,fore}
*         @ today   　:当日色{back,fore}
*         @ line    　:境界線幅
*         @ box     　:セル内ボックススタイルシート
*         @ opening 　:表示スタイルシート
*         @ changed  :表示月変更時コールバック
*         @ selected :日付選択時コールバック
* -------------------------------------------------------------------
*/
jQuery.fn.calendarAction = function(options){
	var options=$.extend({
		active:{back:'#87cefa',fore:'#2b2b2b'},
		normal:{back:'#ffffff',fore:'#2b2b2b'},
		saturday:{back:'#ffffff',fore:'#1e90ff'},
		sunday:{back:'#ffffff',fore:'#dc143c'},
		today:{back:'#ffb6c1',fore:'#2b2b2b'},
		line:2,
		box:[],
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
		var calendar=$('<table>').css({
			'margin':'0px auto',
			'max-width':'700px',
			'position':'relative',
			'width':'100%',
			'box-sizing':'border-box',
			'-moz-box-sizing':'border-box',
			'-ms-box-sizing':'border-box',
			'-o-box-sizing':'border-box',
			'-webkit-box-sizing':'border-box'
		});
		for (var i=0;i<7*8;i++)
		{
			if (i%7==0) calendar.append($('<tr>'));
			calendar.find('tr').last()
			.append($('<td>').css({
				'border':'none',
				'color':options.normal.fore,
				'font-size':'18px',
				'line-height':'54px',
				'margin':'0px',
				'min-height':'54px',
				'padding':'0px',
				'position':'relative',
				'text-align':'center'
			})
			.append($('<div>').css({
				'border':'none',
				'color':options.normal.fore,
				'font-size':'18px',
				'height':'54px',
				'line-height':'54px',
				'margin':'3px',
				'padding':'0px',
				'position':'relative',
				'text-align':'center',
				'border-radius':'3px',
				'-moz-border-radius':'3px',
				'-ms-border-radius':'3px',
				'-o-border-radius':'3px',
				'-webkit-border-radius':'3px'
			})
			.on('click',function(){
				if ($.isNumeric($(this).text()))
				{
					var value=$.data(target[0],'display').DateCalc((parseInt($(this).text())-1).toString()+' day');
					if ($($.data(target[0],'target'))!=null) $($.data(target[0],'target')).val(value.DateFormat('Y-m-d'));
					//カレンダー非表示
					if (options.opening.length!=0) target.removeClass(options.opening);
					//コールバック
					if (options.selected!=null) options.selected($(this).closest('td'),value.DateFormat('Y-m-d'));
				}
			})));
		}
		//ヘッダー(年月)
		calendar.find('tr').eq(0).find('td').css({'border':'none','cursor':'pointer'});
		calendar.find('tr').eq(0).find('td').each(function(index){if (index>2) $(this).remove();});
		calendar.find('tr').eq(0).find('td').eq(1).attr('colspan',5).css('cursor','default');
		//ヘッダー(曜日)
		var week=['日','月','火','水','木','金','土'];
		calendar.find('tr').eq(1).css('border-bottom',options.line.toString()+'px solid '+options.normal.fore);
		calendar.find('tr').eq(1).find('td').each(function(index){$(this).text(week[index]);});
		//列(日曜日)
		calendar.find('tr:gt(0)').find('td').eq(0).css({'background-color':options.sunday.back,'color':options.sunday.fore});
		//列(土曜日)
		calendar.find('tr:gt(0)').find('td').eq(6).css({'background-color':options.saturday.back,'color':options.saturday.fore});
		//セルボックス
		calendar.find('tr:gt(1)').find('td').each(function(){
			var cell=$(this).find('div').first();
			for (var i=0;i<options.box.length;i++)
			{
				$(this).append($('<div>')
				.on('click',function(){
					if ($.isNumeric(cell.text()))
					{
						var value=$.data(target[0],'display').DateCalc((parseInt(cell.text())-1).toString()+' day');
						if ($($.data(target[0],'target'))!=null) $($.data(target[0],'target')).val(value.DateFormat('Y-m-d'));
						//カレンダー非表示
						if (options.opening.length!=0) target.removeClass(options.opening);
						//コールバック
						if (options.selected!=null) options.selected($(this).closest('td'),value.DateFormat('Y-m-d'));
					}
				})
				.css(options.box[i]));
			}
		});
		target.append(calendar);
		/*
		*------------------------------------------------------------
		* 移動ボタン設定
		*------------------------------------------------------------
		*/
		calendar.find('tr').first().find('td').first().append($('<div>'))
		.on('click',function(){
			//月減算
			$.data(target[0],'display',$.data(target[0],'display').DateCalc('-1 month').DateCalc('first-of-month'));
			//カレンダー再表示
			target.calendarShow();
		});
		calendar.find('tr').first().find('td').last().append($('<div>'))
		.on('click',function(){
			//月加算
			$.data(target[0],'display',$.data(target[0],'display').DateCalc('1 month').DateCalc('first-of-month'));
			//カレンダー再表示
			target.calendarShow();
		});
		calendar.find('tr').first().find('td').find('div').css({
			'border-top':'11.5px solid transparent',
			'border-bottom':'11.5px solid transparent',
			'display':'block',
			'height':'0px',
			'position':'absolute',
			'top':'0px',
			'width':'0px'
		});
		calendar.find('tr').first().find('td').first().find('div').css({
			'border-right':'11.5px solid '+options.normal.fore,
			'left':'7.5px;'
		});
		calendar.find('tr').first().find('td').last().find('div').css({
			'border-left':'11.5px solid '+options.normal.fore,
			'left':'17.5px'
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
	$(this).find('table').find('tr').first().find('td').eq(1).text($.data(target[0],'display').DateFormat('Y-m'));
	//日付初期化
	$.data(target[0],'display',$.data(target[0],'display').DateCalc('first-of-month'));
	//セル設定
	target.find('table').find('tr:gt(1)').find('td').each(function(index){
		$(this).animate({opacity:'0'},50,function(){
			var display=index-$.data(target[0],'display').getDay();
			var day=$.data(target[0],'display').DateCalc(display.toString()+' day');
			var style={
				'background-color':$.data(target[0],'options').normal.back,
				'color':$.data(target[0],'options').normal.fore,
				'cursor':'default'
			};
			var active={
				'background-color':$.data(target[0],'options').active.back,
				'color':$.data(target[0],'options').active.fore,
				'cursor':'pointer'
			};
			var cell=$(this).find('div').first();
			//月初日以前は処理しない
			if (display<0) {cell.css(style).html('&nbsp;');return;}
			//翌月初日以降は処理しない
			if (day.DateFormat('Y-m')!=$.data(target[0],'display').DateFormat('Y-m')) {cell.css(style).html('&nbsp;');return;}
			switch ((index+1)%7)
			{
				case 0:
					//土曜日
					style['background-color']=$.data(target[0],'options').saturday.back;
					style['color']=$.data(target[0],'options').saturday.fore;
					break;
				case 1:
					//日曜日
					style['background-color']=$.data(target[0],'options').sunday.back;
					style['color']=$.data(target[0],'options').sunday.fore;
					break;
			}
			//当日
			if(day.DateFormat('Y-m-d')==new Date().DateFormat('Y-m-d'))
			{
				style['background-color']=$.data(target[0],'options').today.back;
				style['color']=$.data(target[0],'options').today.fore;
			}
			//指定日
			if(day.DateFormat('Y-m-d')==$.data(target[0],'active').DateFormat('Y-m-d')) style=active;
			//日付設定
			style['cursor']='pointer';
			cell.css(style).text((display+1).toString());
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
		if (month<1) {year--;month=12;}
		if (month>12) {year++;month=1;}
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
	//日
	if (pattern.match(/^Y-m-d$/g)!=null) return year+'-'+month+'-'+day;
	return '';
}
})(jQuery);
