/*
*--------------------------------------------------------------------
* jQuery-Plugin "invoice-create"
* Version: 1.0
* Copyright (c) 2016 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
jQuery.noConflict();
(function($,PLUGIN_ID){
	"use strict";
	/*---------------------------------------------------------------
	 valiable
	---------------------------------------------------------------*/
	var vars={
		fromdate:new Date(),
		todate:new Date(),
		taxrate:0,
		progress:null,
		table:null,
		studentselect:null,
		apps:{},
		config:{},
		offset:{},
		const:[],
		lectures:[],
		fields:[]
	};
	var events={
		lists:[
			'app.record.index.show'
		]
	};
	var limit=500;
	var functions={
		/* calculate reate of tax */
		calculatetaxrate:function(){
			var rate=0;
			for (var i=0;i<vars.apps[vars.config['tax']].length;i++)
				if (new Date(vars.apps[vars.config['tax']][i]['date'].value.dateformat())<vars.todate) rate=parseFloat(vars.apps[vars.config['tax']][i]['rate'].value);
			return rate;
		},
		/* convert table records for update */
		converttablerecords:function(rows){
			var res=[];
			var row={};
			for (var i=0;i<rows.length;i++)
			{
				row={value:{}};
				$.each(rows[i].value,function(key,values){
					if (key.match(/bill$/g)) row.value[key]={value:'1'};
					else row.value[key]={value:values.value};
				});
				res.push(row);
			}
			return res;
		},
		/* create invoice */
		createinvoice:function(){
			var addtextbookfee=false;
			var course=null;
			var coursegrade=null;
			var lectureindex=0;
			var lecturekey='';
			var lecturename='';
			var entryvalue={};
			var updatevalue={};
			var entryvalues=[];
			var irregularfees=[];
			var updatevalues=[];
			vars.progress.find('.message').text('スケジュール作成中');
			vars.progress.find('.progressbar').find('.progresscell').width(0);
			vars.progress.show();
			for (var i=0;i<vars.apps[vars.config['parent']].length;i++)
			{
				var parent=vars.apps[vars.config['parent']][i];
				var filter=$.grep(vars.apps[vars.config['student']],function(item,index){
					return (item['parentcode'].value==parent['$id'].value);
				});
				/* check exclude */
				if ($.grep(vars.apps[kintone.app.getId()],function(item,index){
					return (item['customer'].value==parent['$id'].value);
				}).length!=0) continue;
				if (filter.length==0) continue;
				entryvalue={
					billdate:{value:vars.todate.format('Y-m-d')},
					customer:{value:parent['$id'].value},
					customername:{value:parent['name'].value},
					subbill:{value:0},
					tax:{value:0},
					bill:{value:0},
					collect:{value:0},
					billtable:{value:[]},
					collecttable:{value:[]}
				};
				/* append bill records */
				for (var i2=0;i2<filter.length;i2++)
				{
					var student=filter[i];
					var admissiondate=new Date(student['admissiondate'].value.dateformat());
					var loafrom=new Date(student['loafrom'].value.dateformat());
					var loato=new Date(student['loato'].value.dateformat());
					/* check status */
					if (student['status'].value!='通塾中') continue;
					/* check admissiondate */
					if (vars.todate<admissiondate) continue;
					/* check leave of absence */
					if (vars.todate>loafrom.calc('-1 day') && vars.todate<loato.calc('1 day')) continue;
					updatevalue={
						app:vars.config['student'],
						id:student['$id'].value,
						record:{}
					};
					/* ordinary lecture */
					lectureindex=0;
					lecturename=vars.lectures[lectureindex].name;
					lecturekey='';
					course=$.grep(vars.apps[vars.lectures[lectureindex].code],function(item,index){return (item['code'].value==student['coursecode'].value);})[0];
					coursegrade=$.coursegrade(course,student['gradecode'].value);
					irregularfees=[];
					if (vars.fromdate<admissiondate.calc('1 day') && vars.todate>admissiondate.calc('-1 day'))
					{
						entryvalue.billtable.value.push({
							value:{
								breakdown:{value:'入塾金'},
								billprice:{value:(filter.length>1)?vars.const['discountfee'].value:vars.const['entrancefee'].value},
								taxsegment:{value:'課税'}
							}
						});
						irregularfees.push(admissiondate);
						addtextbookfee=true;
					}
					else addtextbookfee=(vars.const['textbookbillmonths'].value.indexOf((vars.fromdate.getMonth()+1).toString())>-1);
					if (vars.fromdate<loato.calc('1 day') && vars.todate>loato.calc('-1 day')) irregularfees.push(loato);
					entryvalue.billtable.value.push({
						value:{
							breakdown:{value:lecturename+'('+course['name'].value+')受講料　'+student['gradename'].value},
							billprice:{value:coursegrade['fee'].value},
							taxsegment:{value:'課税'}
						}
					});
					for (var i3=0;i3<irregularfees.length;i3++)
						entryvalue.billtable.value.push({
							value:{
								breakdown:{value:lecturename+'('+course['name'].value+')日割り受講料　'+student['gradename'].value},
								billprice:{value:functions.createirregularfee(student,irregularfees[i3],coursegrade)},
								taxsegment:{value:'課税'}
							}
						});
					if (addtextbookfee)
						entryvalue.billtable.value.push({
							value:{
								breakdown:{value:lecturename+'教材費'},
								billprice:{value:vars.const['textbookfee'].value},
								taxsegment:{value:'課税'}
							}
						});
					/* short term lecture */
					for (var i3=1;i3<4;i3++)
					{
						lectureindex=i3;
						lecturename=vars.lectures[lectureindex].name;
						lecturekey='shortterm'+lectureindex.toString();
						for (var i4=0;i4<student[lecturekey+'table'].value.length;i4++)
						{
							var row=student[lecturekey+'table'].value[i4].value;
							if (row[lecturekey+'code'].value.length!=0 && row[lecturekey+'bill'].value=='0')
							{
								course=$.grep(vars.apps[vars.lectures[lectureindex].code],function(item,index){return (item['code'].value==row[lecturekey+'code'].value);})[0];
								coursegrade=$.coursegrade(course,student['gradecode'].value);
								entryvalue.billtable.value.push({
									value:{
										breakdown:{value:lecturename+'('+course['name'].value+')受講料　'+student['gradename'].value},
										billprice:{value:coursegrade['fee'].value},
										taxsegment:{value:'課税'}
									}
								});
								if (row[lecturekey+'over'].value!='0')
									entryvalue.billtable.value.push({
										value:{
											breakdown:{value:lecturename+'('+course['name'].value+')追加受講料　'+student['gradename'].value},
											billprice:{value:(parseFloat(coursegrade['overfee'].value)*parseFloat(row[lecturekey+'over'].value)).toString()},
											taxsegment:{value:'課税'}
										}
									});
								if (course['textbookfee'].value!='0')
									entryvalue.billtable.value.push({
										value:{
											breakdown:{value:lecturename+'教材費'},
											billprice:{value:course['textbookfee'].value},
											taxsegment:{value:'課税'}
										}
									});
							}
						}
						updatevalue.record[lecturekey+'table']={value:functions.converttablerecords(student[lecturekey+'table'].value)};
					}
					/* season lecture */
					for (var i3=1;i3<4;i3++)
					{
						lectureindex=i3;
						lecturename=vars.lectures[lectureindex+3].name;
						lecturekey='season'+lectureindex.toString();
						if (student[lecturekey+'code'].value.length!=0 && student[lecturekey+'bill'].value=='0')
						{
							course=$.grep(vars.apps[vars.lectures[lectureindex+3].code],function(item,index){return (item['code'].value==student[lecturekey+'code'].value);})[0];
							coursegrade=$.coursegrade(course,student['gradecode'].value);
							entryvalue.billtable.value.push({
								value:{
									breakdown:{value:lecturename+'('+course['name'].value+')受講料　'+student['gradename'].value},
									billprice:{value:coursegrade['fee'].value},
									taxsegment:{value:'課税'}
								}
							});
							if (course['textbookfee'].value!='0')
								entryvalue.billtable.value.push({
									value:{
										breakdown:{value:lecturename+'教材費'},
										billprice:{value:course['textbookfee'].value},
										taxsegment:{value:'課税'}
									}
								});
						}
						updatevalue.record[lecturekey+'bill']={value:'1'};
					}
					/* morning lecture */
					lectureindex=7;
					lecturename=vars.lectures[lectureindex].name;
					lecturekey='morning';
					course=vars.apps[vars.lectures[lectureindex].code][vars.apps[vars.lectures[lectureindex].code].length-1];
					if (course['gradecode'].value==student['gradecode'].value)
						switch (student[lecturekey+'bulkbill'].value)
						{
							case '0':
								for (var i3=0;i3<student[lecturekey+'table'].value.length;i3++)
								{
									var row=student[lecturekey+'table'].value[i3].value;
									if (row[lecturekey+'code'].value.length!=0 && row[lecturekey+'bill'].value=='0')
									{
										$.each(course['coursetable'].value,function(index){
											var courserow=course['coursetable'].value[index].value;
											if (course['coursetable'].value[index]['id']==row[lecturekey+'code'].value)
												entryvalue.billtable.value.push({
													value:{
														breakdown:{value:lecturename+'('+courserow['name'].value+')受講料'},
														billprice:{value:courserow['fee'].value},
														taxsegment:{value:'課税'}
													}
												});
										});
									}
								}
								updatevalue.record[lecturekey+'table']={value:functions.converttablerecords(student[lecturekey+'table'].value)};
								break;
							case '1':
								entryvalue.billtable.value.push({
									value:{
										breakdown:{value:lecturename+'受講料一括払い'},
										billprice:{value:course['bulkfee'].value},
										taxsegment:{value:'課税'}
									}
								});
								updatevalue.record[lecturekey+'bulkbill']={value:'2'};
								break;
						}
					/* night lecture */
					lectureindex=8;
					lecturename=vars.lectures[lectureindex].name;
					lecturekey='night';
					course=vars.apps[vars.lectures[lectureindex].code][vars.apps[vars.lectures[lectureindex].code].length-1];
					if (course['gradecode'].value==student['gradecode'].value)
						switch (student[lecturekey+'bulkbill'].value)
						{
							case '0':
								var billtimes=0;
								var row={};
								for (var i3=0;i3<student[lecturekey+'table'].value.length;i3++)
								{
									row=student[lecturekey+'table'].value[i3].value;
									if (row[lecturekey+'billmonth'].value.length!=0) billtimes++;
								}
								if (billtimes<parseInt(course['splittimes'].value))
								{
									entryvalue.billtable.value.push({
										value:{
											breakdown:{value:lecturename+'受講料分割払い'},
											billprice:{value:course['fee'].value},
											taxsegment:{value:'課税'}
										}
									});
									row={};
									row[lecturekey+'billmonth']={value:vars.fromdate.format('Y-m')};
									row[lecturekey+'bill']={value:'1'};
									student[lecturekey+'table'].value.push({value:row})
								}
								updatevalue.record[lecturekey+'table']={value:functions.converttablerecords(student[lecturekey+'table'].value)};
								break;
							case '1':
								entryvalue.billtable.value.push({
									value:{
										breakdown:{value:lecturename+'受講料一括払い'},
										billprice:{value:course['bulkfee'].value},
										taxsegment:{value:'課税'}
									}
								});
								updatevalue.record[lecturekey+'bulkbill']={value:'2'};
								break;
						}
					/* individually lecture */
					lectureindex=9;
					lecturename=vars.lectures[lectureindex].name;
					lecturekey='individual';
					course=vars.apps[vars.lectures[lectureindex].code][vars.apps[vars.lectures[lectureindex].code].length-1];
					if (course['gradecode'].value==student['gradecode'].value && student[lecturekey+'bill'].value=='0')
					{
						entryvalue.billtable.value.push({
							value:{
								breakdown:{value:lecturename+'受講料'},
								billprice:{value:course['fee'].value},
								taxsegment:{value:'課税'}
							}
						});
						updatevalue.record[lecturekey+'bill']={value:'1'};
					}
					updatevalues.push(updatevalue);
				}
				/* calculate tax */
				if (entryvalue.billtable.value.length!=0)
				{
					var able=0;
					var free=0;
					var price=0;
					var totax=false;
					for (var i2=0;i2<entryvalue.billtable.value.length;i2++)
					{
						var row=entryvalue.billtable.value[i2].value;
						if (row.taxsegment.value=='課税') able+=parseFloat('0'+row.billprice.value.replace(/,/g,''));
						else free+=parseFloat('0'+row.billprice.value.replace(/,/g,''));
					}
					var taxround='';
					switch (vars.const['taxround'].value)
					{
						case '1':
							taxround='floor';
							break;
						case '2':
							taxround='ceil';
							break;
						case '3':
							taxround='round';
							break;
					}
					var calc=$.calculatetax({
						able:able,
						free:free,
						isoutsidetax:(vars.const['taxshift'].value=='0'),
						taxround:taxround,
						taxrate:vars.taxrate
					});
					entryvalue.subbill.value=calc.able-calc.tax+calc.free;
					entryvalue.tax.value=calc.tax;
					entryvalues.push(entryvalue);
				}
			}
			/* entry invoice */
			$.entryinvoices(entryvalues,vars.progress,function(){
				/* update students */
				functions.updatestudents(updatevalues,function(){
					/* reload view */
					functions.load();
				});
			});
		},
		/* create irregular fee */
		createirregularfee:function(student,from,coursegrade){
			var day=from;
			var fee=0;
			var times=0;
			var week=['日','月','火','水','木','金','土'];
			fee=parseFloat(coursegrade['fee'].value)/(parseFloat(coursegrade['times'].value)*4);
			for (var i=from.getDate();i<vars.todate.getDate()+1;i++)
			{
				for (var i2=0;i2<student['coursetable'].value.length;i2++)
				{
					var row=student['coursetable'].value[i2].value;
					if (week.indexOf(row['courseweek'].value)==day.getDay()) times++;
				}
				day=day.calc('1 day');
			}
			switch (vars.const['taxround'].value)
			{
				case '1':
					fee=Math.floor(fee*times);
					break;
				case '2':
					fee=Math.ceil(fee*times);
					break;
				case '3':
					fee=Math.round(fee*times);
					break;
			}
			return fee.toString();
		},
		/* reload view */
		load:function(){
			/* after apprecords acquisition,rebuild view */
			vars.apps[kintone.app.getId()]=null;
			vars.offset[kintone.app.getId()]=0;
			functions.loaddatas(kintone.app.getId(),function(){
				var records=vars.apps[kintone.app.getId()];
				/* initialize table */
				vars.table.clearrows();
				/* insert row */
				for (var i=0;i<records.length;i++)
					vars.table.insertrow(null,function(row){
						$.each(row.find('td'),function(){
							var code=$(this).attr('class');
							if (!code) return true;
							if (!(code in records[i])) return true;
							switch (code)
							{
								case 'subbill':
								case 'tax':
								case 'bill':
								case 'collect':
								case 'remaining':
									$(this).css({'text-align':'right'}).text(parseInt('0'+$.fieldvalue(records[i][code])).format()+'円');
									break;
								default:
									$(this).text($.fieldvalue(records[i][code]));
									break;
							}
						});
						$.each(records[i],function(key,values){
							if (values!=null)
								if (values.value!=null)
									row.find('td').last().append($('<input type="hidden">').attr('id',key).val(values.value));
						});
					});
			});
		},
		/* reload datas */
		loaddatas:function(appkey,callback){
			var query=kintone.app.getQueryCondition();
			var body={
				app:appkey,
				query:'',
				fields:vars.fields
			};
			query+=((query.length!=0)?' and ':'');
			query+='billdate>"'+vars.fromdate.calc('-1 day').format('Y-m-d')+'" and billdate<"'+vars.todate.calc('1 day').format('Y-m-d')+'"';
			query+=' order by billdate asc,customername asc limit '+limit.toString()+' offset '+vars.offset[appkey].toString();
			body.query+=query;
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				if (vars.apps[appkey]==null) vars.apps[appkey]=resp.records;
				else Array.prototype.push.apply(vars.apps[appkey],resp.records);
				vars.offset[appkey]+=limit;
				if (resp.records.length==limit) functions.loaddatas(appkey,callback);
				else callback();
			},function(error){
				swal('Error!',error.message,'error');
			});
		},
		/* update students */
		updatestudents:function(values,callback){
			var error=false;
			var counter=0;
			vars.progress.find('.message').text('生徒情報更新中');
			vars.progress.find('.progressbar').find('.progresscell').width(0);
			vars.progress.show();
			for (var i=0;i<values.length;i++)
			{
				if (error) return;
				kintone.api(kintone.api.url('/k/v1/record',true),'PUT',values[i],function(resp){
					counter++;
					if (counter<values.length)
					{
						vars.progress.find('.progressbar').find('.progresscell').width(vars.progress.find('.progressbar').innerWidth()*(counter/values.length));
					}
					else
					{
						vars.progress.hide();
						swal({
							title:'作成完了',
							text:'請求書作成しました。',
							type:'success'
						},function(){
							if (callback!=null) callback();
						});
					}
				},function(error){
					vars.progress.hide();
					swal('Error!',error.message,'error');
					error=true;
				});
			}
		}
	};
	/*---------------------------------------------------------------
	 mouse events
	---------------------------------------------------------------*/
	$(window).on('mousemove',function(e){
		/* move balloon */
		$('div.invoice-balloon').css({
		  'left':e.clientX,
		  'top':e.clientY
		});
	});
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.lists,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		/* check viewid */
		if (event.viewId!=vars.config.createinvoice) return;
		/* initialize valiable */
		var container=$('div#invoice-container');
		var feed=$('<div class="invoice-headermenucontents">');
		var month=$('<span id="month" class="customview-span">');
		var prev=$('<button id="prev" class="customview-button prev-button">');
		var next=$('<button id="next" class="customview-button next-button">');
		var splash=$('<div id="splash">');
		vars.progress=$('<div id="progress">').append($('<div class="message">')).append($('<div class="progressbar">').append($('<div class="progresscell">')));
		splash.append(
			$('<p>')
			.append($('<span>').text('now loading'))
			.append($('<span class="dot progress1">').text('.'))
			.append($('<span class="dot progress2">').text('.'))
			.append($('<span class="dot progress3">').text('.'))
			.append($('<span class="dot progress4">').text('.'))
			.append($('<span class="dot progress5">').text('.'))
		);
		/* append elements */
		feed.append(prev);
		feed.append(month);
		feed.append(next);
		kintone.app.getHeaderMenuSpaceElement().innerHTML='';
		kintone.app.getHeaderMenuSpaceElement().appendChild(feed[0]);
		kintone.app.getHeaderMenuSpaceElement().appendChild($('<button class="kintoneplugin-button-dialog-ok searchstudentbutton">')[0]);
		kintone.app.getHeaderMenuSpaceElement().appendChild(
			$('<div class="invoice-headermenucontents">').css({'display':'none'})
			.append($('<span class="customview-span searchstudentname">').css({'padding':'0px 5px 0px 15px'}))
			.append($('<button class="customview-button close-button clearstudentbutton">').css({'margin-right':'15px'}))
			.append($('<input type="hidden" class="searchstudent">'))
			[0]
		);
		kintone.app.getHeaderMenuSpaceElement().appendChild($('<button class="kintoneplugin-button-dialog-ok createinvoicebutton">')[0]);
		$('body').append(vars.progress);
		$('body').append(splash);
		$('.searchstudentbutton')
		.text('生徒選択')
		.on('click',function(e){
			vars.studentselect.show({
				buttons:{
					cancel:function(){
						/* close the reference box */
						vars.studentselect.hide();
					}
				},
				callback:function(row){
					/* close the reference box */
					vars.studentselect.hide();
					$('.searchstudent').val(row.find('#\\$id').val());
					$('.searchstudentname').text(row.find('#name').val());
					$('.searchstudentname').closest('div').show();
					/* reload view */
					functions.load();
				}
			});
		});
		$('.clearstudentbutton')
		.on('click',function(e){
			$('.searchstudent').val('');
			$('.searchstudentname').text('');
			$('.searchstudentname').closest('div').hide();
			/* reload view */
			functions.load();
		});
		$('.createinvoicebutton')
		.text('請求書作成')
		.on('click',function(e){functions.createinvoice();});
		/* fixed header */
		var headeractions=$('div.contents-actionmenu-gaia');
		var headerspace=$(kintone.app.getHeaderSpaceElement());
		headeractions.parent().css({'position':'relative'});
		headerspace.parent().css({'position':'relative'});
		$(window).on('load resize scroll',function(e){
			headeractions.css({
				'left':$(window).scrollLeft().toString()+'px',
				'position':'absolute',
				'top':'0px',
				'width':$(window).width().toString()+'px'
			});
			headerspace.css({
				'left':$(window).scrollLeft().toString()+'px',
				'position':'absolute',
				'top':headeractions.outerHeight(false)+'px',
				'width':$(window).width().toString()+'px'
			});
			container.css({'margin-top':(headeractions.outerHeight(false)+headerspace.outerHeight(false))+'px','overflow-x':'visible'});
		});
		/* setup date value */
		vars.fromdate=vars.fromdate.calc('first-of-month');
		vars.todate=vars.fromdate.calc('1 month').calc('-1 day');
		month.text(vars.fromdate.format('Y-m'));
		/* day feed button */
		$.each([prev,next],function(){
			$(this).on('click',function(){
				var months=($(this).attr('id')=='next')?1:-1;
				vars.fromdate=vars.fromdate.calc(months+' month');
				vars.todate=vars.fromdate.calc('1 month').calc('-1 day');
				month.text(vars.fromdate.format('Y-m'));
				/* calculate reate of tax */
				vars.taxrate=functions.calculatetaxrate();
				/* reload view */
				functions.load();
			});
		});
		/* setup lectures value */
		vars.lectures=JSON.parse(vars.config['lecture']);
		/* check app fields */
		var counter=0;
		var param=[];
		for (var i=0;i<vars.lectures.length;i++)
			param.push({
				app:vars.lectures[i].code,
				appname:vars.lectures[i].name,
				limit:limit,
				offset:0,
				records:[],
				isstudent:false
			});
		param.push({
			app:vars.config['grade'],
			appname:'学年',
			limit:limit,
			offset:0,
			records:[],
			isstudent:false
		});
		param.push({
			app:vars.config['parent'],
			appname:'保護者',
			limit:limit,
			offset:0,
			records:[],
			isstudent:false
		});
		param.push({
			app:vars.config['student'],
			appname:'生徒情報',
			limit:limit,
			offset:0,
			records:[],
			isstudent:true
		});
		param.push({
			app:vars.config['const'],
			appname:'基本情報',
			limit:limit,
			offset:0,
			records:[],
			isstudent:false
		});
		param.push({
			app:vars.config['tax'],
			appname:'消費税',
			limit:limit,
			offset:0,
			records:[],
			isstudent:false
		});
		$.loadapps(counter,param,splash,function(){
			splash.addClass('hide');
			for (var i=0;i<param.length;i++) vars.apps[param[i].app]=param[i].records;
			if (vars.apps[vars.config['const']].length==0) {swal('Error!','基本情報が登録されていません。','error');return;}
			else vars.const=vars.apps[vars.config['const']][0];
			/* calculate reate of tax */
			vars.taxrate=functions.calculatetaxrate();
			/* create studentselect box */
			vars.studentselect=$('body').referer({
				datasource:$.grep(vars.apps[vars.config['student']],function(item,index){
					return (item['status'].value=='通塾中');
				}),
				displaytext:['gradename','name'],
				buttons:[
					{
						id:'cancel',
						text:'キャンセル'
					}
				],
				searches:[
					{
						id:'gradecode',
						class:'referer-select',
						label:'学年',
						type:'select',
						param:{app:vars.config['grade']},
						value:'code',
						text:'name',
						callback:function(row){
							vars.studentselect.search();
						}
					}
				]
			});
			vars.studentselect.searchblock.find('select').closest('label').css({'width':'100%'});
			vars.studentselect.searchblock.find('button').hide();
			container.empty();
			/* get fields of app */
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
				vars.fields=['$id'];
				$.each(resp.properties,function(key,values){
					vars.fields.push(values.code);
				});
				if (!$.checkinvoicefield(resp.properties)) return;
				/* create table */
				var head=$('<tr>');
				var template=$('<tr>');
				var columns=[
					'billdate',
					'customername',
					'subbill',
					'tax',
					'bill',
					'collect',
					'remaining'
				];
				for (var i=0;i<columns.length;i++)
				{
					head.append($('<th>').text(resp.properties[columns[i]].label));
					template.append($('<td class="'+resp.properties[columns[i]].code+'">'));
				}
				head.append($('<th>'));
				template.append(
					$('<td>')
					.append(
						$('<span>')
						.append(
							$('<button class="customview-button edit-button">').on('click',function(){
								var cell=$(this).closest('td');
								var index=cell.find('#\\$id').val();
								if (index.length!=0) window.location.href='https://'+$(location).attr('host')+'/k/'+kintone.app.getId()+'/show#record='+index;
							})
						)
						.append($('<input type="hidden" value="">'))
					)
				);
				vars.table=$('<table id="invoice" class="customview-table invoice-create">').mergetable({
					container:container,
					head:head,
					template:template,
					merge:false,
					mergeclass:'invoice-merge'
				});
				/* reload view */
				functions.load();
			},
			function(error){
				splash.addClass('hide');
				swal('Error!',error.message,'error');
			});
		});
		return;
	});
})(jQuery,kintone.$PLUGIN_ID);
