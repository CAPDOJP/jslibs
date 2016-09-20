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
		var header=$('<thead>');
		var cells=$('<tbody>');
		var calendar=$('<table>').css({
			'margin':'0px auto',
			'max-width':'700px',
			'position':'relative',
			'width':'100%',
			'box-sizing':'border-box'
		})
		.append(header)
		.append(cells);
		if (options.normal!=null)
		{
			calendar.css(options.normal);
			header.css(options.normal);
			cells.css(options.normal);
		}
		//ヘッダー(年月)
		header.append($('<tr>'))
		header.find('tr').last().append($('<td>'));
		header.find('tr').last().append($('<td colspan="5">'));
		header.find('tr').last().append($('<td>'));
		header.find('tr').last().find('td').css({
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
		for (var i=0;i<7*5;i++)
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
			'position':'absolute',
			'top':'0px',
			'width':'0px'
		});
		header.find('tr').first().find('td').first().find('div').css({
			'border-left':'20px solid transparent',
			'border-right':'20px solid '+options.normal.fore,
			'left':'7.5px;'
		});
		header.find('tr').first().find('td').last().find('div').css({
			'border-left':'20px solid '+options.normal.fore,
			'border-right':'20px solid transparent',
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
			//月初日以前は処理しない
			if (display<0) {cell.html('&nbsp;').hide();return;}
			//翌月初日以降は処理しない
			if (day.DateFormat('Y-m')!=$.data(target[0],'display').DateFormat('Y-m')) {cell.html('&nbsp;').hide();return;}
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
				default:
					if (normal!=null) cell.css(normal);
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
