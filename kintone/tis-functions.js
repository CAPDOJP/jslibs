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
		while (month<1) {year--;month+=12;}
		while (month>12) {year++;month-=12;}
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
	//month-day
	if (pattern.match(/^m-d$/g)!=null) return month+'-'+day;
	//day
	if (pattern.match(/^d$/g)!=null) return day;
	//H
	if (pattern.match(/^H$/g)!=null) return hour;
	//H:i
	if (pattern.match(/^H:i$/g)!=null) return hour+':'+minute;
	//H:i:s
	if (pattern.match(/^H:i:s$/g)!=null) return hour+':'+minute+':'+second;
	//i
	if (pattern.match(/^i$/g)!=null) return minute;
	//i:s
	if (pattern.match(/^i:s$/g)!=null) return minute+':'+second;
	//s
	if (pattern.match(/^s$/g)!=null) return second;
	return '';
}
String.prototype.dateformat=function(){
	if(this.match(/^Z$/))
	{
		var date=new Date(this.replace(/-/g,'\/').replace(/T/g,' ').replace(/\.000Z$/g,'').replace(/Z$/g,''));
		date.setHours(date.getHours() + 9);
		var year=date.getFullYear();
		var month=('0'+(date.getMonth()+1)).slice(-2);
		var day=('0'+date.getDate()).slice(-2);
		var hour=('0'+date.getHours()).slice(-2);
		var minute=('0'+date.getMinutes()).slice(-2);
		var second=('0'+date.getSeconds()).slice(-2);
		return year+'/'+month+'/'+day+' '+hour+':'+minute+':'+second;
	}
	else return this.replace(/-/g,'\/').replace(/T/g,' ').replace(/(\+0900|\+09:00)$/g,'');
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
* functions
* -------------------------------------------------------------------
*/
var loadgroupsvalues={
	offset:0,
	records:null,
	size:100
}
var loadorganizationsvalues={
	offset:0,
	records:null,
	size:100
}
var loadusersvalues={
	offset:0,
	records:null,
	size:100
}
jQuery.extend({
	calculatetax:function(options){
		var options=$.extend({
			able:0,
			free:0,
			isoutsidetax:true,
			taxround:'round',
			taxrate:0
		},options);
		var tax=0;
		if (options.isoutsidetax)
		{
			//outside
			switch (options.taxround)
			{
				case 'floor':
					options.able=Math.floor(options.able*(1+options.taxrate));
					tax=Math.floor((options.able*options.taxrate*100)/(100+(options.taxrate*100)));
					break;
				case 'ceil':
					options.able=Math.ceil(options.able*(1+options.taxrate));
					tax=Math.ceil((options.able*options.taxrate*100)/(100+(options.taxrate*100)));
					break;
				case 'round':
					options.able=Math.round(options.able*(1+options.taxrate));
					tax=Math.round((options.able*options.taxrate*100)/(100+(options.taxrate*100)));
					break;
			}
		}
		else
		{
			//inside
			switch (options.taxround)
			{
				case 'floor':
					options.able=Math.floor(options.able);
					tax=Math.floor((options.able*options.taxrate*100)/(100+(options.taxrate*100)));
					break;
				case 'ceil':
					options.able=Math.ceil(options.able);
					tax=Math.ceil((options.able*options.taxrate*100)/(100+(options.taxrate*100)));
					break;
				case 'round':
					options.able=Math.round(options.able);
					tax=Math.round((options.able*options.taxrate*100)/(100+(options.taxrate*100)));
					break;
			}
		}
		switch (options.taxround)
		{
			case 'floor':
				options.free=Math.floor(options.free);
				break;
			case 'ceil':
				options.free=Math.ceil(options.free);
				break;
			case 'round':
				options.free=Math.round(options.free);
				break;
		}
		return {able:options.able,tax:tax,free:options.free}
	},
	calculatetaxrate:function(date){
		var taxdatas=[
			{startdate:'1900-01-01',rate:0},
			{startdate:'1989-04-01',rate:0.03},
			{startdate:'1997-04-01',rate:0.05},
			{startdate:'2014-04-01',rate:0.08},
			{startdate:'2019-10-01',rate:0.1}
		];
		var rate=0;
		for (var i=0;i<taxdatas.length;i++) if (new Date(taxdatas[i].startdate.dateformat())<date) rate=parseFloat(taxdatas[i].rate);
		return rate;
	},
	downloadtext:function(values,character,filename){
		if (!Encoding) {alert('encoding.jsを読み込んで下さい。');return;}
		var a=document.createElement('a');
		var url=window.URL || window.webkitURL;
		var strtoarray=function(str){
			var arr=[];
			for (var i=0;i<str.length;i++)
				arr.push(str.charCodeAt(i));
			return arr;
		};
		var array=strtoarray(values.replace(/\n$/g,''));
		var blob=new Blob([new Uint8Array(Encoding.convert(array,character,Encoding.detect(array)))],{'type':'text/plain'});
		a.href=url.createObjectURL(blob);
		a.download=filename;
		a.target='_blank';
		a.click();
	},
	uploadtext:function(file,character,success,error){
		if (!Encoding) {alert('encoding.jsを読み込んで下さい。');return;}
		var reader=null;
		reader=new FileReader();
		reader.readAsArrayBuffer(file);
		reader.onabort=function(event){error();};
		reader.onerror=function(event){error();};
		reader.onload=function(event){
			var array=new Uint8Array(event.target.result);
			var records=Encoding.codeToString(Encoding.convert(array,character,Encoding.detect(array)));
			success(records);
		}
	},
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
	fieldvalue:function(field){
		var value=null;
		switch (field.type.toUpperCase())
		{
			case 'CATEGORY':
			case 'CHECK_BOX':
			case 'MULTI_SELECT':
				if (field.value.length!=0) value=field.value.join('<br>');
				else value='';
				break;
			case 'CREATOR':
			case 'MODIFIER':
				value=field.value.name;
				break;
			case 'LINK':
				if (field.value.length!=0) value='<a href="'+field.value+'" target="_blank">'+field.value+'</a>';
				else value='';
				break;
			case 'MULTI_LINE_TEXT':
				if (field.value.length!=0) value=field.value.replace('\n','<br>');
				else value='';
				break;
			case 'GROUP_SELECT':
			case 'ORGANIZATION_SELECT':
			case 'STATUS_ASSIGNEE':
			case 'USER_SELECT':
				if (field.value.length!=0)
				{
					value='';
					$.each(field.value,function(index){
						value+=field.value[index].name+'<br>';
					});
				}
				else value='';
				break;
			default:
				if (field.value)
				{
					if (field.value.length!=0) value=field.value;
					else value='';
				}
				else value='';
				break;
		}
		return value;
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
	loadgroups:function(callback,initialize){
		if ((initialize===undefined)?true:initialize)
		{
			loadgroupsvalues={
				offset:0,
				records:null,
				size:100
			};
		}
		var query='size='+loadgroupsvalues.size.toString()+'&offset='+loadgroupsvalues.offset.toString();
		kintone.api(kintone.api.url('/v1/groups',true),'GET',{query:query},function(resp){
			if (loadgroupsvalues.records==null) loadgroupsvalues.records=resp.groups;
			else Array.prototype.push.apply(loadgroupsvalues.records,resp.groups);
			loadgroupsvalues.offset+=loadgroupsvalues.size;
			if (resp.groups.length==loadgroupsvalues.size) $.loadgroups(callback,false);
			else callback(loadgroupsvalues.records);
		},function(error){callback([]);});
	},
	loadorganizations:function(callback,initialize){
		if ((initialize===undefined)?true:initialize)
		{
			loadorganizationsvalues={
				offset:0,
				records:null,
				size:100
			};
		}
		var query='size='+loadorganizationsvalues.size.toString()+'&offset='+loadorganizationsvalues.offset.toString();
		kintone.api(kintone.api.url('/v1/organizations',true),'GET',{query:query},function(resp){
			if (loadorganizationsvalues.records==null) loadorganizationsvalues.records=resp.organizations;
			else Array.prototype.push.apply(loadorganizationsvalues.records,resp.organizations);
			loadorganizationsvalues.offset+=loadorganizationsvalues.size;
			if (resp.organizations.length==loadorganizationsvalues.size) $.loadorganizations(callback,false);
			else callback(loadorganizationsvalues.records);
		},function(error){callback([]);});
	},
	loadusers:function(callback,initialize){
		if ((initialize===undefined)?true:initialize)
		{
			loadusersvalues={
				offset:0,
				records:null,
				size:100
			};
		}
		var query='size='+loadusersvalues.size.toString()+'&offset='+loadusersvalues.offset.toString();
		kintone.api(kintone.api.url('/v1/users',true),'GET',{query:query},function(resp){
			if (loadusersvalues.records==null) loadusersvalues.records=resp.users;
			else Array.prototype.push.apply(loadusersvalues.records,resp.users);
			loadusersvalues.offset+=loadusersvalues.size;
			if (resp.users.length==loadusersvalues.size) $.loadusers(callback,false);
			else callback(loadusersvalues.records);
		},function(error){callback([]);});
	},
	queries:function(){
		var queries={};
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
* color selector
* -------------------------------------------------------------------
*/
jQuery.fn.colorSelector = function(colors,input){
	return $(this).each(function(){
		var target=$(this);
		var colorbuttons=null;
		var colorinput=null;
		var colorlist=null;
		var position={x:0,y:0};
		colorbuttons=$('<div>').css({
			'box-sizing':'border-box',
			'height':'calc(100% - 3em)',
			'overflow-x':'hidden',
			'overflow-y':'scroll',
			'margin-bottom':'3em',
			'width':'100%',
			'z-index':'1',
		});
		colorinput=$('<div>').css({
			'background-color':'#F3F3F3',
			'border-bottom-left-radius':'0.25em',
			'border-bottom-right-radius':'0.25em',
			'bottom':'0px',
			'box-sizing':'border-box',
			'left':'0px',
			'margin':'0px',
			'padding':'0.5em',
			'position':'absolute',
			'width':'100%',
			'z-index':'2'
		})
		.append($('<input type="text" placeholder="16進数カラーコードを入力">').css({
			'border':'1px solid #DCDCDC',
			'border-radius':'0.25em',
			'box-sizing':'border-box',
			'line-height':'2em',
			'height':'2em',
			'margin':'0px',
			'outline':'0px',
			'padding':'0px 0.25em',
			'width':'calc(100% - 5.25em)',
		}))
		.append($('<button>').css({
			'background-color':'transparent',
			'border':'1px solid #DCDCDC',
			'border-radius':'0.25em',
			'box-sizing':'border-box',
			'cursor':'pointer',
			'line-height':'2em',
			'margin':'0px 0px 0px 0.25em',
			'outline':'none',
			'padding':'0px 0.25em',
			'text-align':'center',
			'width':'5em'
		}).on('click',function(){
			if (colorinput.find('input').val().length==0) alert('カラーコードを入力して下さい。');
			else
			{
				target.css({'background-color':'#'+colorinput.find('input').val().replace('#','')});
				input.val(colorinput.find('input').val().replace('#',''));
				colorlist.hide();
			}
		}).text('OK'));
		colorlist=$('<div class="colorlist">').css({
			'background-color':'#F3F3F3',
			'border':'1px solid #DCDCDC',
			'border-radius':'0.25em',
			'box-shadow':'0px 0px 2px rgba(0,0,0,0.5)',
			'height':'400px',
			'left':'50%',
			'margin':'0px',
			'max-height':'calc(100% - 2em)',
			'max-width':'calc(100% - 2em)',
			'overflow':'hidden',
			'padding':'2px',
			'position':'fixed',
			'text-align':'left',
			'top':'50%',
			'z-index':'9999999',
			'width':'400px',
			'-webkit-transform':'translate(-50%,-50%)',
			'-ms-transform':'translate(-50%,-50%)',
			'transform':'translate(-50%,-50%)'
		}).on('touchstart mousedown',function(e){e.stopPropagation();}).hide();
		target.css({'background-color':'#'+input.val()})
		.off('touchstart.selector mousedown.selector')
		.on('touchstart.selector mousedown.selector',function(e){
			$('div.colorlist').hide();
			colorlist.show();
			return false;
		});
		for (var i=0;i<colors.length;i++)
		{
			colorbuttons.append(
				$('<div>').css({
					'background-color':colors[i],
					'cursor':'pointer',
					'display':'inline-block',
					'padding-top':'calc(25% - 4px)',
					'margin':'2px',
					'width':'calc(25% - 4px)'
				})
				.on('touchstart mousedown',function(e){e.stopPropagation();})
				.on('click',function(){
					var index=colorbuttons.find('div').index($(this));
					target.css({'background-color':colors[index]});
					input.val(colors[index].replace('#',''));
					colorlist.hide();
				})
			);
		}
		colorlist.append(colorbuttons);
		colorlist.append(colorinput);
		$('body').on('touchstart mousedown',function(){colorlist.hide();}).append(colorlist);
	});
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
