/*
*--------------------------------------------------------------------
* jQuery-Plugin "tis-functions"
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
* date calc
*--------------------------------------------------------------------
* parameters
* pattern:calculation pattern
* -------------------------------------------------------------------
*/
Date.prototype.calc=function(pattern){
	var year=this.getFullYear();
	var month=this.getMonth()+1;
	var day=this.getDate();
	//add years
	if (pattern.match(/^-?[0-9]+ year$/g)!=null) year+=parseInt(pattern.match(/^-?[0-9]+/g));
	//add months
	if (pattern.match(/^-?[0-9]+ month$/g)!=null)
	{
		month+=parseInt(pattern.match(/^-?[0-9]+/g));
		//check of next year
		if (month<1) {year--;month=12;}
		if (month>12) {year++;month=1;}
		//check of next month
		var check=new Date(year.toString()+'/'+month.toString()+'/'+day.toString());
		if (check.getMonth()+1!=month)
		{
			check=new Date(year.toString()+'/'+(month+1).toString()+'/1');
			check.setDate(0);
			day=check.getDate();
		}
	}
	//add day
	if (pattern.match(/^-?[0-9]+ day$/g)!=null) day+=parseInt(pattern.match(/^-?[0-9]+/g));
	//first day of year
	if (pattern.match(/^first-of-year$/g)!=null) {month=1;day=1};
	//first day of month
	if (pattern.match(/^first-of-month$/g)!=null) day=1;
	if (month<1){year--;month=12;}
	if (month>12){year++;month=1;}
	return new Date(year.toString(),(month-1).toString(),day.toString());
};
/*
*--------------------------------------------------------------------
* date format
*--------------------------------------------------------------------
* parameters
* pattern:format pattern
* -------------------------------------------------------------------
*/
Date.prototype.format=function(pattern){
	var year=this.getFullYear().toString();
	var month=('0'+(this.getMonth()+1).toString()).slice(-2);
	var day=('0'+this.getDate()).slice(-2);
	//year
	if (pattern.match(/^Y$/g)!=null) return year;
	//year-month
	if (pattern.match(/^Y-m$/g)!=null) return year+'-'+month;
	//year-month-day
	if (pattern.match(/^Y-m-d$/g)!=null) return year+'-'+month+'-'+day;
	return '';
};
/*
*--------------------------------------------------------------------
* get elements
*--------------------------------------------------------------------
* parameters
* name:elements keyword
* -------------------------------------------------------------------
*/
jQuery.fn.fields=function(name){
	var fields=[];
	var target=$(this);
	$.each(cybozu.data.page.FORM_DATA.schema.table.fieldList,function(key,values){
		if (values.var==name)
		{
			$.each(target.find('[id*='+key+'],[name*='+key+']'),function(index){
				if ($(this).prop('tagName')!='undefined')
					if ($.inArray(this,fields)==-1) fields.push(this);
			});
		}
	});
	return fields;
};
/*
*--------------------------------------------------------------------
* set stylesheets
*--------------------------------------------------------------------
* parameters
* options	@ height	:height
*			@ width		:width
* -------------------------------------------------------------------
*/
jQuery.fn.fieldscss=function(options){
	var options=$.extend({
		height:'100%',
		width:'100%'
	},options);
	return $(this).each(function(){
		var target=$(this);
		switch (target.prop('tagName').toLowerCase())
		{
			case 'button':
				target.css({
					'background-color':'transparent',
					'border':'1px solid #a9a9a9',
					'border-radius':'5px',
					'box-sizing':'border-box',
					'height':options.height,
					'lint-height':options.height,
					'width':options.width
				});
				break;
			case 'div':
				target.css({
					'box-sizing':'border-box',
					'padding':'5px',
					'position':'relative',
					'text-align':'center',
					'width':options.width
				});
				break;
			case 'input':
				if (target.prop('type').toLowerCase()=='password' ||
					target.prop('type').toLowerCase()=='text')
				target.css({
					'background-color':'transparent',
					'border':'1px solid #a9a9a9',
					'border-radius':'5px',
					'box-sizing':'border-box',
					'display':'block',
					'height':options.height,
					'lint-height':options.height,
					'margin':'15px 0px',
					'padding':'0px',
					'width':options.width
				});
				break;
			case 'select':
				target.css({
					'background-color':'transparent',
					'border':'1px solid #a9a9a9',
					'border-radius':'5px',
					'box-sizing':'border-box',
					'display':'block',
					'height':options.height,
					'lint-height':options.height,
					'margin':'15px 0px',
					'padding':'0px',
					'width':options.width
				});
				break;
			case 'span':
				target.css({
					'box-sizing':'border-box',
					'lint-height':options.height,
					'padding':'0px 15px'
				});
				break;
			case 'table':
				target.css({
					'margin':'15px 0px',
					'width':options.width
				});
				break;
			case 'textarea':
				target.css({
					'background-color':'transparent',
					'border':'1px solid #a9a9a9',
					'border-radius':'5px',
					'box-sizing':'border-box',
					'display':'block',
					'height':options.height,
					'margin':'15px 0px',
					'padding':'0px',
					'width':options.width
				});
				break;
			case 'td':
				target.css({
					'padding':'5px',
					'width':options.width
				});
				break;
			case 'th':
				target.css({
					'font-weight':'normal'
				});
				break;
		}
	});
};
})(jQuery);
