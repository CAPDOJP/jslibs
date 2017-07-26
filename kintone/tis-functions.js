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
* pattern	:calculation pattern
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
		var check=new Date(year+'/'+month+'/'+day);
		if (check.getMonth()+1!=month)
		{
			check=new Date(year+'/'+(month+1)+'/1');
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
	return new Date(year,(month-1),day);
}
/*
*--------------------------------------------------------------------
* date format
*--------------------------------------------------------------------
* parameters
* pattern	:format pattern
* -------------------------------------------------------------------
*/
Date.prototype.format=function(pattern){
	var year=this.getFullYear();
	var month=('0'+(this.getMonth()+1)).slice(-2);
	var day=('0'+this.getDate()).slice(-2);
	var hour=('0'+this.getHours()).slice(-2);
	var minute=('0'+this.getMinutes()).slice(-2);
	var second=('0'+this.getSeconds()).slice(-2);
	//year
	if (pattern.match(/^Y$/g)!=null) return year;
	//year-month
	if (pattern.match(/^Y-m$/g)!=null) return year+'-'+month;
	//year-month-day
	if (pattern.match(/^Y-m-d$/g)!=null) return year+'-'+month+'-'+day;
	//year-month-day H
	if (pattern.match(/^Y-m-d H$/g)!=null) return year+'-'+month+'-'+day+' '+hour;
	//year-month-day H:i
	if (pattern.match(/^Y-m-d H:i$/g)!=null) return year+'-'+month+'-'+day+' '+hour+':'+minute;
	//year-month-day H:i:s
	if (pattern.match(/^Y-m-d H:i:s$/g)!=null) return year+'-'+month+'-'+day+' '+hour+':'+minute+':'+second;
	//H
	if (pattern.match(/^H$/g)!=null) return hour;
	//H:i
	if (pattern.match(/^H:i$/g)!=null) return hour+':'+minute;
	//H:i:s
	if (pattern.match(/^H:i:s$/g)!=null) return hour+':'+minute+':'+second;
	return '';
}
/*
*--------------------------------------------------------------------
* number format
*--------------------------------------------------------------------
* parameters
* pattern	:format pattern
* -------------------------------------------------------------------
*/
Number.prototype.format = function(){
	return String(this).replace(/(\d)(?=(\d\d\d)+(?!\d))/g,'$1,');
}
/*
*--------------------------------------------------------------------
* padding
*--------------------------------------------------------------------
* parameters
* pattern	:pattern string
* length	:padding length
* -------------------------------------------------------------------
*/
String.prototype.lpad=function(pattern,length){
	var padding='';
	for (var i=0;i<length;i++) padding+=pattern;
	return (pattern+this).slice(length*-1);
}
String.prototype.rpad=function(pattern,length){
	var padding='';
	for (var i=0;i<length;i++) padding+=pattern;
	return (this+pattern).slice(0,length);
}
/*
*--------------------------------------------------------------------
* get query strings
* -------------------------------------------------------------------
*/
jQuery.extend({
	fieldparallelize:function(properties){
		var tablecode='';
		var fields={};
		$.each(properties,function(key,values){
			tablecode='';
			switch (values.type)
			{
				case 'SUBTABLE':
					tablecode=values.code;
					$.each(values.fields,function(index,values){
						values['tablecode']=tablecode;
						fields[values.code]=values;
					});
					break;
				default:
					values['tablecode']=tablecode;
					fields[values.code]=values;
					break;
			}
		});
		return fields;
	},
	isvalidtype:function(criteria,target){
		var types=[];
		switch (criteria.type)
		{
			case 'CALC':
				switch (criteria.format)
				{
					case 'DATE':
						types=['DATE'];
						break;
					case 'DATETIME':
						types=['DATETIME'];
						break;
					case 'DAY_HOUR_MINUTE':
					case 'HOUR_MINUTE':
						types=['SINGLE_LINE_TEXT'];
						break;
					case 'NUMBER':
					case 'NUMBER_DIGIT':
						types=['NUMBER'];
						break;
					case 'TIME':
						types=['TIME'];
						break;
				}
				break;
			case 'CHECK_BOX':
			case 'MULTI_SELECT':
				types=['CHECK_BOX','MULTI_SELECT'];
				break;
			case 'DATETIME':
				types=['DATETIME'];
				break;
			case 'DATE':
				types=['DATE'];
				break;
			case 'DROP_DOWN':
			case 'RADIO_BUTTON':
				types=['DROP_DOWN','RADIO_BUTTON','SINGLE_LINE_TEXT'];
				break;
			case 'FILE':
				types=['FILE'];
				break;
			case 'GROUP_SELECT':
				types=['GROUP_SELECT'];
				break;
			case 'LINK':
				types=['LINK','SINGLE_LINE_TEXT'];
				break;
			case 'MULTI_LINE_TEXT':
				types=['MULTI_LINE_TEXT'];
				break;
			case 'NUMBER':
			case 'RECORD_NUMBER':
				types=['NUMBER'];
				break;
			case 'ORGANIZATION_SELECT':
				types=['ORGANIZATION_SELECT'];
				break;
			case 'RICH_TEXT':
				types=['RICH_TEXT'];
				break;
			case 'SINGLE_LINE_TEXT':
				types=['SINGLE_LINE_TEXT'];
				break;
			case 'TIME':
				types=['TIME'];
				break;
			case 'USER_SELECT':
				types=['USER_SELECT'];
				break;
		}
		return ($.inArray(target.type,types)>-1);
	},
	queries:function(){
		var queries=[];
		var hash=null;
		var hashes=window.location.search.substring(1).split('&');
		for(var i=0;i<hashes.length;i++)
		{
			hash=hashes[i].split('=');
			queries[decodeURI(hash[0])]=decodeURI(hash[1]);
		}
		return queries;
	}
});
/*
*--------------------------------------------------------------------
* get elements
*--------------------------------------------------------------------
* parameters
* fieldcode	:field code
* -caution-
* lookup field in mobile is disable
* -------------------------------------------------------------------
*/
jQuery.fn.fields=function(fieldcode){
	var fields=[];
	var target=$(this);
	$.each(cybozu.data.page.FORM_DATA.schema.table.fieldList,function(key,values){
		if (values.var==fieldcode)
		{
			$.each(target.find('[id*='+key+'],[name*='+key+']'),function(index){
				if ($(this).prop('tagName').toLowerCase()!='undefined')
					if ($.inArray($(this),fields)==-1) fields.push($(this));
			});
		}
	});
	if ('subTable' in cybozu.data.page.FORM_DATA.schema)
		$.each(cybozu.data.page.FORM_DATA.schema.subTable,function(key,values){
			$.each(values.fieldList,function(key,values){
				if (values.var==fieldcode)
				{
					$.each(target.find('[id*='+key+'],[name*='+key+']'),function(index){
						if ($(this).prop('tagName').toLowerCase()!='undefined')
							if ($.inArray($(this),fields)==-1) fields.push($(this));
					});
				}
			});
		});
	return fields;
}
/*
*--------------------------------------------------------------------
* setup lists
*--------------------------------------------------------------------
* parameters
* options	@ param		:api parameter
*			@ value		:selected value
*			@ text		:display text
*			@ addition	:adding Elements
*			@ callback	:callback function
* -------------------------------------------------------------------
*/
jQuery.fn.listitems=function(options){
	var options=$.extend({
		param:{},
		value:'',
		text:'',
		addition:null,
		callback:null
	},options);
	return $(this).each(function(){
		var target=$(this);
		target.empty();
		if (options.addition!=null)	target.append(options.addition);
		kintone.api(kintone.api.url('/k/v1/records',true),'GET',options.param,function(resp){
			$.data(target[0],'datasource',resp.records);
			$.each(resp.records,function(index){
				target.append(
					$('<option>')
					.attr('value',resp.records[index][options.value].value)
					.text(resp.records[index][options.text].value)
				);
			});
			if (options.callback!=null) options.callback();
		},function(error){});
	});
}
})(jQuery);
