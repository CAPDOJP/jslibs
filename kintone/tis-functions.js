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
	//year
	if (pattern.match(/^Y$/g)!=null) return year;
	//year-month
	if (pattern.match(/^Y-m$/g)!=null) return year+'-'+month;
	//year-month-day
	if (pattern.match(/^Y-m-d$/g)!=null) return year+'-'+month+'-'+day;
	return '';
}
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
	$.each([cybozu.data.page.FORM_DATA.schema.table.fieldList,cybozu.data.page.FORM_DATA.schema.table.fieldList],function(key,values){
		if (values.var==fieldcode)
		{
			$.each(target.find('[id*='+key+'],[name*='+key+']'),function(index){
				if ($(this).prop('tagName').toLowerCase()!='undefined')
					if ($.inArray($(this),fields)==-1) fields.push($(this));
			});
		}
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
/*
*--------------------------------------------------------------------
* related data acquisition
*--------------------------------------------------------------------
* parameters
* options	@ recordcode	:target record code
*			@ datasource	:json
*			@ fields		:value change elements
*							.fieldcode is field code
*							.relation is array
*							.relation.datasource is json
*							.relation.basekey is base key
*							.relation.refererkey is referernce key
*							.relation.recordcode is record code
* -------------------------------------------------------------------
*/
jQuery.fn.relations=function(options){
	var options=$.extend({
		recordcode:'',
		datasource:null,
		fields:[]
	},options);
	return $(this).each(function(){
		var target=$(this);
		$.data(target[0],'value','');
		/* check field value */
		setInterval(function(){
			var targetvalue=(target.val()!=null)?target.val():'';
			if ($.data(target[0],'value')==targetvalue) return;
			$.data(target[0],'value',targetvalue);
			/* set fields value */
			$.each(options.fields,function(index){
				var fieldvalues=$.extend({
					fieldcode:'',
					relation:{
						datasource:null,
						basekey:'',
						refererkey:'',
						recordcode:''
					},
				},options.fields[index]);
				if (targetvalue.length!=0)
				{
					var filterbase=$.grep(options.datasource,function(item,index){return item[options.recordcode].value==targetvalue;});
					if (filterbase.length!=0)
					{
						var filterreferer=$.grep(fieldvalues.relation.datasource,function(item,index){
							return item[fieldvalues.relation.refererkey].value==filterbase[0][fieldvalues.relation.basekey].value;
						});
						if (filterreferer.length!=0)
							$.each($('body').fields(fieldvalues.fieldcode),function(){
								$(this).val(filterreferer[0][fieldvalues.relation.recordcode].value);
							});
					}
				}
			});
		},500);
	});
}
/*
*--------------------------------------------------------------------
* setup stylesheets
*--------------------------------------------------------------------
* parameters
* addition	:additional style sheet
* -------------------------------------------------------------------
*/
jQuery.fn.style=function(addition){
	var style='';
	style+='<style type="text/css">';
	style+='body *{';
	style+='	position:relative;';
	style+='}';
	style+='button,input,label,p,select,span{';
	style+='	margin:0px 5px;';
	style+='}';
	style+='label,p,span{';
	style+='	line-height:35px;';
	style+='}';
	style+='table{';
	style+='	margin:5px 0px;';
	style+='	width:100%;';
	style+='}';
	style+='table thead tr{';
	style+='	background-color:#f5f5f5;';
	style+='}';
	style+='table tbody tr:nth-of-type(even){';
	style+='	background-color:#f7f9fa;';
	style+='}';
	style+='table th{';
	style+='	border:1px solid #a9a9a9;';
	style+='	font-weight:normal;';
	style+='	padding:5px;';
	style+='}';
	style+='table td{';
	style+='	border:1px solid #a9a9a9;';
	style+='	padding:5px;';
	style+='}';
	style+='table button{';
	style+='	margin:0px;';
	style+='	width:100%;';
	style+='}';
	style+=(addition!=null)?addition:'';
	style+='</style>';
	$(this).append(style);
}
})(jQuery);
