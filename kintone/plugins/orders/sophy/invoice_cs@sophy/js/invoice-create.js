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
		taxround:'',
		progress:null,
		table:null,
		apps:{},
		config:{},
		offset:{},
		const:[],
		displayrecords:[],
		lectures:[],
		fields:[]
	};
	var events={
		lists:[
			'app.record.index.show'
		],
		show:[
			'app.record.create.show',
			'app.record.edit.show'
		],
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
			var updatevalues=[];
			vars.progress.find('.message').text('請求書作成中');
			vars.progress.find('.progressbar').find('.progresscell').width(0);
			vars.progress.show();
			for (var i=0;i<vars.apps[vars.config['parent']].length;i++)
			{
				var parent=vars.apps[vars.config['parent']][i];
				var filter=$.grep(vars.apps[vars.config['student']],function(item,index){
					return (item['parentcode'].value==parent['$id'].value);
				});
				/* check exclude */
				if ($.grep(vars.displayrecords,function(item,index){
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
					collectdate:{value:''},
					collecttrading:{value:parent['collecttrading'].value},
					billtable:{value:[]}
				};
				/* append bill records */
				for (var i2=0;i2<filter.length;i2++)
				{
					var student=filter[i2];
					var admissiondate=new Date(student['admissiondate'].value.dateformat());
					var loafrom=new Date(student['loafrom'].value.dateformat());
					var loato=new Date(student['loato'].value.dateformat());
					var billfrom=null;
					var billto=null;
					var irregulardate=null;
					var courses=[];
					var precourses=[];
					billfrom=vars.fromdate.calc('first-of-month').calc('1 month');
					billto=billfrom.calc('1 month').calc('-1 day');
					/* check status */
					if (student['status'].value=='退塾') continue;
					/* check admissiondate */
					if (vars.todate<admissiondate) continue;
					updatevalue={
						app:vars.config['student'],
						id:student['$id'].value,
						record:{}
					};
					/* ordinary lecture */
					if (student['status'].value!='外部')
					{
						lectureindex=0;
						lecturename=vars.lectures[lectureindex].name;
						lecturekey='';
						if (vars.fromdate<admissiondate.calc('1 day') && vars.todate>admissiondate.calc('-1 day'))
						{
							entryvalue.billtable.value.push({
								value:{
									studentname:{value:student['name'].value},
									breakdown:{value:'入塾金'},
									billprice:{value:(filter.length>1)?vars.const['discountfee'].value:vars.const['entrancefee'].value},
									taxsegment:{value:'課税'},
									billsegment:{value:'入室金'}
								}
							});
							irregulardate=admissiondate;
							addtextbookfee=true;
						}
						else addtextbookfee=(vars.const['textbookbillmonths'].value.indexOf((vars.fromdate.getMonth()+1).toString())>-1);
						if (vars.fromdate<loato.calc('1 day') && vars.todate>loato.calc('-1 day')) irregulardate=loato;
						for (var i3=0;i3<student['coursetable'].value.length;i3++)
						{
							var exists=false;
							var coursestartdate=null;
							var courseenddate=null;
							var row=student['coursetable'].value[i3].value;
							if (!row['courseenddate'].value) row['courseenddate'].value='9999-12-30';;
							if (row['courseenddate'].value.length==0) row['courseenddate'].value='9999-12-30';;
							coursestartdate=new Date(row['coursestartdate'].value.dateformat());
							courseenddate=new Date(row['courseenddate'].value.dateformat());
							if (billfrom>coursestartdate.calc('-1 day') && billto<courseenddate.calc('1 day')) exists=true;
							if (billfrom<coursestartdate.calc('1 day') && billto>coursestartdate.calc('-1 day')) exists=true;
							if (billfrom<courseenddate.calc('1 day') && billto>courseenddate.calc('-1 day')) exists=true;
							if (exists) courses.push(row);
							exists=false;
							if (vars.fromdate>coursestartdate.calc('-1 day') && vars.todate<courseenddate.calc('1 day')) exists=true;
							if (vars.fromdate<coursestartdate.calc('1 day') && vars.todate>coursestartdate.calc('-1 day')) exists=true;
							if (vars.fromdate<courseenddate.calc('1 day') && vars.todate>courseenddate.calc('-1 day')) exists=true;
							if (exists) precourses.push(row);
						}
						/* check leave of absence */
						if (!(billto>loafrom.calc('-1 day') && billto<loato.calc('1 day')))
						{
							if (courses.length!=1)
							{
								for (var i3=0;i3<courses.length;i3++)
								{
									var coursestartdate=null;
									var courseenddate=null;
									coursestartdate=new Date(courses[i3]['coursestartdate'].value.dateformat());
									courseenddate=new Date(courses[i3]['courseenddate'].value.dateformat());
									if (coursestartdate<billfrom) coursestartdate=billfrom;
									if (courseenddate>billto) courseenddate=billto;
									course=$.grep(vars.apps[vars.lectures[lectureindex].code],function(item,index){return (item['code'].value==courses[i3]['coursecode'].value);})[0];
									coursegrade=$.coursegrade(course,student['gradecode'].value);
									if (coursegrade!=null)
										entryvalue.billtable.value.push({
											value:{
												studentname:{value:student['name'].value},
												breakdown:{value:lecturename+'('+course['name'].value+')日割り受講料'},
												billprice:{value:functions.createirregularfee(courses[i3],coursestartdate,courseenddate,coursegrade)},
												taxsegment:{value:'課税'},
												billsegment:{value:'授業料'}
											}
										});
								}
							}
							else
							{
								course=$.grep(vars.apps[vars.lectures[lectureindex].code],function(item,index){return (item['code'].value==courses[0]['coursecode'].value);})[0];
								coursegrade=$.coursegrade(course,student['gradecode'].value);
								if (coursegrade!=null)
									entryvalue.billtable.value.push({
										value:{
											studentname:{value:student['name'].value},
											breakdown:{value:lecturename+'('+course['name'].value+')受講料'},
											billprice:{value:coursegrade['fee'].value},
											taxsegment:{value:'課税'},
											billsegment:{value:'授業料'}
										}
									});
							}
						}
						else addtextbookfee=false;
						if (precourses.length!=1)
						{
							var prefee=0;
							if (irregulardate==null) irregulardate=vars.fromdate;
							for (var i3=0;i3<precourses.length;i3++)
							{
								var coursestartdate=null;
								var courseenddate=null;
								coursestartdate=new Date(precourses[i3]['coursestartdate'].value.dateformat());
								courseenddate=new Date(precourses[i3]['courseenddate'].value.dateformat());
								if (coursestartdate<irregulardate) coursestartdate=irregulardate;
								if (courseenddate>vars.todate) courseenddate=vars.todate;
								course=$.grep(vars.apps[vars.lectures[lectureindex].code],function(item,index){return (item['code'].value==precourses[i3]['coursecode'].value);})[0];
								coursegrade=$.coursegrade(course,student['gradecode'].value);
								if (coursegrade!=null) prefee+=parseInt(functions.createirregularfee(precourses[i3],coursestartdate,courseenddate,coursegrade));
							}
							for (var i3=0;i3<vars.apps[kintone.app.getId()].length;i3++)
							{
								if (vars.apps[kintone.app.getId()][i3]['billdate'].value==vars.fromdate.calc('-1 day').format('Y-m-d') &&
									vars.apps[kintone.app.getId()][i3]['customer'].value==parent['$id'].value)
								{
									var rows=vars.apps[kintone.app.getId()][i3]['billtable'].value;
									for (var i4=0;i4<rows.length;i4++)
									{
										var row=rows[i4].value;
										if (row['studentname'].value==student['name'].value && row['breakdown'].value.match(/^通常講座.*受講料$/g))
											prefee-=parseInt(row['billprice'].value);
									}
								}
							}
							if (prefee!=0)
								entryvalue.billtable.value.push({
									value:{
										studentname:{value:student['name'].value},
										breakdown:{value:(vars.fromdate.calc('-1 month').getMonth()+1).toString()+'月分受講料過不足金'},
										billprice:{value:prefee.toString()},
										taxsegment:{value:'課税'},
										billsegment:{value:'授業料'}
									}
								});
						}
						else
						{
							if (irregulardate!=null)
								entryvalue.billtable.value.push({
									value:{
										studentname:{value:student['name'].value},
										breakdown:{value:lecturename+'('+course['name'].value+')日割り受講料'},
										billprice:{value:functions.createirregularfee(courses[0],irregulardate,vars.todate,coursegrade)},
										taxsegment:{value:'課税'},
										billsegment:{value:'授業料'}
									}
								});
						}
						if (addtextbookfee)
							entryvalue.billtable.value.push({
								value:{
									studentname:{value:student['name'].value},
									breakdown:{value:lecturename+'教材費'},
									billprice:{value:vars.const['textbookfee'].value},
									taxsegment:{value:'課税'},
									billsegment:{value:'教材費収入'}
								}
							});
					}
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
								if (coursegrade==null) continue;
								entryvalue.billtable.value.push({
									value:{
										studentname:{value:student['name'].value},
										breakdown:{value:lecturename+'('+course['name'].value+')受講料'},
										billprice:{value:coursegrade['fee'].value},
										taxsegment:{value:'課税'},
										billsegment:{value:'授業料'}
									}
								});
								if (row[lecturekey+'over'].value!='0')
									entryvalue.billtable.value.push({
										value:{
											studentname:{value:student['name'].value},
											breakdown:{value:lecturename+'('+course['name'].value+')追加受講料'},
											billprice:{value:(parseFloat(coursegrade['overfee'].value)*parseFloat(row[lecturekey+'over'].value)).toString()},
											taxsegment:{value:'課税'},
											billsegment:{value:'授業料'}
										}
									});
								if (course['textbookfee'].value!='0')
									entryvalue.billtable.value.push({
										value:{
											studentname:{value:student['name'].value},
											breakdown:{value:lecturename+'教材費'},
											billprice:{value:course['textbookfee'].value},
											taxsegment:{value:'課税'},
											billsegment:{value:'教材費収入'}
										}
									});
								row[lecturekey+'bill'].value='1';
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
							if (coursegrade==null) continue;
							entryvalue.billtable.value.push({
								value:{
									studentname:{value:student['name'].value},
									breakdown:{value:lecturename+'('+course['name'].value+')受講料'},
									billprice:{value:coursegrade['fee'].value},
									taxsegment:{value:'課税'},
									billsegment:{value:'授業料'}
								}
							});
							if (course['textbookfee'].value!='0')
								entryvalue.billtable.value.push({
									value:{
										studentname:{value:student['name'].value},
										breakdown:{value:lecturename+'教材費'},
										billprice:{value:course['textbookfee'].value},
										taxsegment:{value:'課税'},
										billsegment:{value:'教材費収入'}
									}
								});
							student[lecturekey+'bill'].value='1';
							updatevalue.record[lecturekey+'bill']={value:'1'};
						}
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
														studentname:{value:student['name'].value},
														breakdown:{value:lecturename+'('+courserow['name'].value+')受講料'},
														billprice:{value:courserow['fee'].value},
														taxsegment:{value:'課税'},
														billsegment:{value:'授業料'}
													}
												});
										});
										row[lecturekey+'bill'].value='1';
									}
								}
								updatevalue.record[lecturekey+'table']={value:functions.converttablerecords(student[lecturekey+'table'].value)};
								break;
							case '1':
								entryvalue.billtable.value.push({
									value:{
										studentname:{value:student['name'].value},
										breakdown:{value:lecturename+'受講料一括払い'},
										billprice:{value:course['bulkfee'].value},
										taxsegment:{value:'課税'},
										billsegment:{value:'授業料'}
									}
								});
								student[lecturekey+'bulkbill'].value='2';
								updatevalue.record[lecturekey+'bulkbill']={value:'2'};
								break;
						}
					/* night lecture */
					lectureindex=8;
					lecturename=vars.lectures[lectureindex].name;
					lecturekey='night';
					course=vars.apps[vars.lectures[lectureindex].code][vars.apps[vars.lectures[lectureindex].code].length-1];
					if (course['gradecode'].value==student['gradecode'].value)
						if (student[lecturekey+'id'].value.length!=0)
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
												studentname:{value:student['name'].value},
												breakdown:{value:lecturename+'受講料分割払い'},
												billprice:{value:course['fee'].value},
												taxsegment:{value:'課税'},
												billsegment:{value:'授業料'}
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
											studentname:{value:student['name'].value},
											breakdown:{value:lecturename+'受講料一括払い'},
											billprice:{value:course['bulkfee'].value},
											taxsegment:{value:'課税'},
											billsegment:{value:'授業料'}
										}
									});
									student[lecturekey+'bulkbill'].value='2';
									updatevalue.record[lecturekey+'bulkbill']={value:'2'};
									break;
							}
					/* individually lecture */
					lectureindex=9;
					lecturename=vars.lectures[lectureindex].name;
					lecturekey='individual';
					course=vars.apps[vars.lectures[lectureindex].code][vars.apps[vars.lectures[lectureindex].code].length-1];
					if (course['gradecode'].value==student['gradecode'].value)
						if (student[lecturekey+'id'].value.length!=0 && student[lecturekey+'bill'].value=='0')
						{
							entryvalue.billtable.value.push({
								value:{
									studentname:{value:student['name'].value},
									breakdown:{value:lecturename+'受講料'},
									billprice:{value:course['fee'].value},
									taxsegment:{value:'課税'},
									billsegment:{value:'授業料'}
								}
							});
							student[lecturekey+'bill'].value='1';
							updatevalue.record[lecturekey+'bill']={value:'1'};
						}
					updatevalues.push(updatevalue);
				}
				/* calculate tax */
				if (entryvalue.billtable.value.length!=0)
				{
					var able=0;
					var free=0;
					for (var i2=0;i2<entryvalue.billtable.value.length;i2++)
					{
						var row=entryvalue.billtable.value[i2].value;
						if (row.billprice.value)
						{
							if (row.taxsegment.value=='課税') able+=parseFloat(row.billprice.value.replace(/,/g,''));
							else free+=parseFloat(row.billprice.value.replace(/,/g,''));
						}
					}
					var calc=$.calculatetax({
						able:able,
						free:free,
						isoutsidetax:(vars.const['taxshift'].value=='0'),
						taxround:vars.taxround,
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
		createirregularfee:function(studentcourse,from,to,coursegrade){
			var day=from;
			var fee=0;
			var times=0;
			var week=['日','月','火','水','木','金','土'];
			fee=parseFloat(coursegrade['fee'].value)/(parseFloat(coursegrade['times'].value)*4);
			for (var i=from.getDate();i<to.getDate()+1;i++)
			{
				for (var i2=0;i2<studentcourse['courseweek'].value.length;i2++)
					if (week.indexOf(studentcourse['courseweek'].value[i2])==day.getDay()) times++;
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
		/* download journalizing file */
		downloadjournalizing:function(){
			var entryvalues={
				advances:'',
				sales:''
			};
			var months={
				this:vars.fromdate.calc('1 month').calc('-1 day'),
				next:vars.fromdate.calc('2 month').calc('-1 day')
			};
			var summaries={
				cash:{lecture:0,textbook:0,admission:0},
				precash:{lecture:0,textbook:0,admission:0},
				nss:{lecture:0,textbook:0,admission:0},
				post:{lecture:0,textbook:0,admission:0}
			};
			var writeline=function(thismonth,nextmonth,price,debit,assistance,credit,department){
				var datas=''
				var calc=$.calculatetax({
					able:price,
					free:0,
					isoutsidetax:(vars.const['taxshift'].value=='0'),
					taxround:vars.taxround,
					taxrate:vars.taxrate
				});
				datas+='"2000",,"","'+thismonth.format('Y-m-d').replace(/-/g,'\/')+'",';
				datas+='"'+debit+'","'+assistance+'","","対象外",'+calc.able.toString()+',0,';
				datas+='"'+credit+'","","'+department+'","課税売上内五'+(vars.taxrate*100).toString()+'%",'+calc.able.toString()+','+calc.tax.toString()+',';
				datas+='"'+(nextmonth.getMonth()+1).toString()+'月分授業料",';
				datas+='"","",0,"","","0","0","no"\n';
				return datas;
			};
			for (var i=0;i<vars.displayrecords.length;i++)
			{
				var record=vars.displayrecords[i];
				var summary={};
				if (!record['collectdate'].value) continue;
				if (record['collectdate'].value.length==0) continue;
				switch (record['collecttrading'].value)
				{
					case '現金':
						if (new Date(record['billdate'].value.dateformat()).format('Y-m')==new Date(record['collectdate'].value.dateformat()).format('Y-m')) summary=summaries.precash;
						else summary=summaries.cash;
						break;
					case 'NSS':
						summary=summaries.nss;
						break;
					case 'ゆうちょ':
						summary=summaries.post;
						break;
				}
				for (var i2=0;i2<record['billtable'].value.length;i2++)
				{
					var row=record['billtable'].value[i2].value;
					switch (row['billsegment'].value)
					{
						case '授業料':
							summary.lecture+=parseInt(row['billprice'].value);
							break;
						case '教材費収入':
							summary.textbook+=parseInt(row['billprice'].value);
							break;
						case '入室金':
							summary.admission+=parseInt(row['billprice'].value);
							break;
					}
				}
			}
			if (summaries.cash.lecture+summaries.cash.textbook+summaries.cash.admission!=0)
			{
				if (summaries.cash.lecture!=0) entryvalues.sales+=writeline(months.next,months.next,summaries.cash.lecture,'現金','','授業料','学習塾長岡');
				if (summaries.cash.textbook!=0) entryvalues.sales+=writeline(months.next,months.next,summaries.cash.textbook,'現金','','教材費収入','学習塾長岡');
				if (summaries.cash.admission!=0) entryvalues.sales+=writeline(months.next,months.next,summaries.cash.admission,'現金','','入室金','学習塾長岡');
			}
			if (summaries.precash.lecture+summaries.precash.textbook+summaries.precash.admission!=0)
			{
				if (summaries.precash.lecture!=0) entryvalues.sales+=writeline(months.next,months.next,summaries.precash.lecture,'前受金','','授業料','学習塾長岡');
				if (summaries.precash.textbook!=0) entryvalues.sales+=writeline(months.next,months.next,summaries.precash.textbook,'前受金','','教材費収入','学習塾長岡');
				if (summaries.precash.admission!=0) entryvalues.sales+=writeline(months.next,months.next,summaries.precash.admission,'前受金','','入室金','学習塾長岡');
				entryvalues.advances+=writeline(months.this,months.next,summaries.precash.lecture+summaries.precash.textbook+summaries.precash.admission,'現金','','前受金','');
			}
			if (summaries.nss.lecture+summaries.nss.textbook+summaries.nss.admission!=0)
			{
				if (summaries.nss.lecture!=0) entryvalues.sales+=writeline(months.next,months.next,summaries.nss.lecture,'普通預金','北越銀行','授業料','学習塾長岡');
				if (summaries.nss.textbook!=0) entryvalues.sales+=writeline(months.next,months.next,summaries.nss.textbook,'普通預金','北越銀行','教材費収入','学習塾長岡');
				if (summaries.nss.admission!=0) entryvalues.sales+=writeline(months.next,months.next,summaries.nss.admission,'普通預金','北越銀行','入室金','学習塾長岡');
			}
			if (summaries.post.lecture+summaries.post.textbook+summaries.post.admission!=0)
			{
				if (summaries.post.lecture!=0) entryvalues.sales+=writeline(months.next,months.next,summaries.post.lecture,'前受金','','授業料','学習塾長岡');
				if (summaries.post.textbook!=0) entryvalues.sales+=writeline(months.next,months.next,summaries.post.textbook,'前受金','','教材費収入','学習塾長岡');
				if (summaries.post.admission!=0) entryvalues.sales+=writeline(months.next,months.next,summaries.post.admission,'前受金','','入室金','学習塾長岡');
				entryvalues.advances+=writeline(months.this,months.next,summaries.post.lecture+summaries.post.textbook+summaries.post.admission,'郵便貯金','','前受金','');
			}
			$.downloadtext(entryvalues.advances,'SJIS','advances'+months.this.format('Y-m')+'.txt');
			$.downloadtext(entryvalues.sales,'SJIS','sales'+months.next.format('Y-m')+'.txt');
		},
		/* download nss file */
		downloadnss:function(){
			var entryvalue='';
			for (var i=0;i<vars.displayrecords.length;i++)
			{
				var record=vars.displayrecords[i];
				var summary={lecture:0,textbook:0,admission:0};
				if (record['collecttrading'].value!='NSS') continue;
				for (var i2=0;i2<record['billtable'].value.length;i2++)
				{
					var row=record['billtable'].value[i2].value;
					switch (row['billsegment'].value)
					{
						case '授業料':
							summary.lecture+=parseInt(row['billprice'].value);
							break;
						case '教材費収入':
							summary.textbook+=parseInt(row['billprice'].value);
							break;
						case '入室金':
							summary.admission+=parseInt(row['billprice'].value);
							break;
					}
				}
				if (summary.lecture+summary.textbook+summary.admission!=0)
				{
					var calc=null;
					var parent=$.grep(vars.apps[vars.config['parent']],function(item,index){
						return (item['$id'].value==record['customer'].value);
					})[0];
					entryvalue+=parent['nsscode'].value+',';
					calc=$.calculatetax({
						able:summary.lecture,
						free:0,
						isoutsidetax:(vars.const['taxshift'].value=='0'),
						taxround:vars.taxround,
						taxrate:vars.taxrate
					});
					entryvalue+=calc.able.toString()+',';
					calc=$.calculatetax({
						able:summary.textbook,
						free:0,
						isoutsidetax:(vars.const['taxshift'].value=='0'),
						taxround:vars.taxround,
						taxrate:vars.taxrate
					});
					entryvalue+=calc.able.toString()+',';
					calc=$.calculatetax({
						able:summary.admission,
						free:0,
						isoutsidetax:(vars.const['taxshift'].value=='0'),
						taxround:vars.taxround,
						taxrate:vars.taxrate
					});
					entryvalue+=calc.able.toString()+',';
					entryvalue+='0,0\n';
				}
			}
			$.downloadtext(entryvalue,'SJIS','nss.txt');
		},
		/* reload view */
		load:function(){
			/* after apprecords acquisition,rebuild view */
			vars.apps[kintone.app.getId()]=null;
			vars.offset[kintone.app.getId()]=0;
			functions.loaddatas(kintone.app.getId(),function(){
				vars.displayrecords=$.grep(vars.apps[kintone.app.getId()],function(item,index){
					return item['billdate'].value==vars.todate.format('Y-m-d');
				});
				/* initialize table */
				vars.table.clearrows();
				/* insert row */
				for (var i=0;i<vars.displayrecords.length;i++)
					vars.table.insertrow(null,function(row){
						$.each(row.find('td'),function(){
							var code=$(this).attr('class');
							if (!code) return true;
							if (!(code in vars.displayrecords[i])) return true;
							switch (code)
							{
								case 'bill':
								case 'subbill':
								case 'tax':
									$(this).css({'text-align':'right'}).text(parseInt($.fieldvalue(vars.displayrecords[i][code])).format()+'円');
									break;
								case 'collectdate':
									$('input',$(this)).val($.fieldvalue(vars.displayrecords[i][code]));
									break;
								case 'collecttrading':
									$('select',$(this)).val($.fieldvalue(vars.displayrecords[i][code]));
									break;
								default:
									$(this).text($.fieldvalue(vars.displayrecords[i][code]));
									break;
							}
						});
						$.each(vars.displayrecords[i],function(key,values){
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
			query+='billdate>"'+vars.fromdate.calc('-1 month').calc('-1 day').format('Y-m-d')+'" and billdate<"'+vars.todate.calc('1 day').format('Y-m-d')+'"';
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
		},
		/* upload nss records */
		uploadnss:function(){
			var error=false;
			var counter=0;
			var target=$('.nssfile');
			var entryvalues=[];
			if (target[0].files.length==0) return;
			vars.progress.find('.message').text('入金情報更新中');
			vars.progress.find('.progressbar').find('.progresscell').width(0);
			vars.progress.show();
			$.uploadtext(target[0].files[0],'UNICODE',function(records){
				records=records.split('\n');
				for (var i=0;i<records.length;i++)
				{
					if (records[i].length==0) continue;
					var record=records[i].split(',');
					var parent=$.grep(vars.apps[vars.config['parent']],function(item,index){
						return (item['nsscode'].value==record[6].replace(/"/g,'') && vars.fromdate.format('Y-m')==new Date(record[0].replace(/"/g,'')).format('Y-m'));
					});
					if (parent.length!=0)
					{
						var record=$.grep(vars.displayrecords,function(item,index){
							return (item['customer'].value==parent[0]['$id'].value);
						});
						if (record.length!=0)
							entryvalues.push({
								app:kintone.app.getId(),
								id:record[0]['$id'].value,
								record:{
									collectdate:{value:new Date().format('Y-m-d')},
									collecttrading:{value:'NSS'}
								}
							});
					}
				}
				if (entryvalues.length!=0)
				{
					for (var i=0;i<entryvalues.length;i++)
					{
						if (error) return;
						kintone.api(kintone.api.url('/k/v1/record',true),'PUT',entryvalues[i],function(resp){
							counter++;
							if (counter<entryvalues.length)
							{
								vars.progress.find('.progressbar').find('.progresscell').width(vars.progress.find('.progressbar').innerWidth()*(counter/entryvalues.length));
							}
							else
							{
								vars.progress.hide();
								swal({
									title:'更新完了',
									text:'入金情報を更新しました。',
									type:'success'
								},function(){
									/* reload view */
									functions.load();
								});
							}
						},function(error){
							vars.progress.hide();
							swal('Error!',error.message,'error');
							error=true;
						});
					}
				}
				else
				{
					vars.progress.hide();
					swal('Error!','読み込まれた入金データに該当する請求書が見つかりませんでした。','error');
				}
			},
			function(){vars.progress.hide();});
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
		if ($('.custom-elements').size()) $('.custom-elements').remove();
		kintone.app.getHeaderMenuSpaceElement().appendChild(feed.addClass('custom-elements')[0]);
		kintone.app.getHeaderMenuSpaceElement().appendChild($('<button class="kintoneplugin-button-dialog-ok createinvoicebutton">').addClass('custom-elements')[0]);
		kintone.app.getHeaderMenuSpaceElement().appendChild($('<button class="kintoneplugin-button-dialog-ok downloadjournalizingbutton">').addClass('custom-elements')[0]);
		kintone.app.getHeaderMenuSpaceElement().appendChild($('<button class="kintoneplugin-button-dialog-ok downloadnssbutton">').addClass('custom-elements')[0]);
		kintone.app.getHeaderMenuSpaceElement().appendChild($('<button class="kintoneplugin-button-dialog-ok uploadnssbutton">').addClass('custom-elements')[0]);
		kintone.app.getHeaderMenuSpaceElement().appendChild(
			$('<input type="file" class="nssfile">').addClass('custom-elements').on('change',function(){functions.uploadnss();}).hide()[0]
		);
		$('body').append(vars.progress);
		$('body').append(splash);
		$('.createinvoicebutton')
		.text('請求書作成')
		.on('click',function(e){
			swal({
				title:'確認',
				text:'請求書を作成します。\n宜しいですか?',
				type:'warning',
				showCancelButton:true,
				confirmButtonText:'OK',
				cancelButtonText:"キャンセル"
			},
			function(){
				functions.createinvoice();
			});
		});
		$('.downloadjournalizingbutton')
		.text('仕訳作成')
		.on('click',function(e){functions.downloadjournalizing();});
		$('.downloadnssbutton')
		.text('NSSデータ書出')
		.on('click',function(e){functions.downloadnss();});
		$('.uploadnssbutton')
		.text('NSSデータ読込')
		.on('click',function(e){$('.nssfile').trigger('click');});
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
			/* calculate round of tax */
			switch (vars.const['taxround'].value)
			{
				case '1':
					vars.taxround='floor';
					break;
				case '2':
					vars.taxround='ceil';
					break;
				case '3':
					vars.taxround='round';
					break;
			}
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
					'pending',
					'customername',
					'nss',
					'subbill',
					'tax',
					'bill',
					'collectdate',
					'collecttrading'
				];
				for (var i=0;i<columns.length;i++)
				{
					var button=null;
					var cell=null;
					var unit=null;
					var fieldinfo=resp.properties[columns[i]];
					head.append($('<th>').text(fieldinfo.label));
					switch (columns[i])
					{
						case 'collectdate':
							cell=$('<input type="text" id="'+fieldinfo.code+'" class="center" placeholder="ex) '+(new Date().format('Y-m-d'))+'">').css({'width':'100%'})
							.on('change',function(){
								var id=$('#\\$id',$(this).closest('tr')).val();
								var value=$(this).val();
								var body={
									app:kintone.app.getId(),
									id:id,
									record:{collectdate:{value:value}}
								};
								kintone.api(kintone.api.url('/k/v1/record',true),'PUT',body,function(resp){
									var filter=$.grep(vars.displayrecords,function(item,index){
										return (item['$id'].value==id);
									});
									if (filter.length!=0) filter[0]['collectdate'].value=value;
								},function(error){
									swal('Error!',error.message,'error');
								});
							});
							template.append($('<td class="'+fieldinfo.code+'">').css({'padding':'0px','width':'125px'}).append(cell));
							break;
						case 'collecttrading':
							cell=$('<select id="'+fieldinfo.code+'">').css({'width':'100%'})
							.on('change',function(){
								var id=$('#\\$id',$(this).closest('tr')).val();
								var value=$(this).val();
								var body={
									app:kintone.app.getId(),
									id:id,
									record:{collecttrading:{value:value}}
								};
								kintone.api(kintone.api.url('/k/v1/record',true),'PUT',body,function(resp){
									var filter=$.grep(vars.displayrecords,function(item,index){
										return (item['$id'].value==id);
									});
									if (filter.length!=0) filter[0]['collecttrading'].value=value;
								},function(error){
									swal('Error!',error.message,'error');
								});
							});
							cell.append($('<option>').attr('value','').text(''));
							var datasource=[fieldinfo.options.length];
							$.each(fieldinfo.options,function(key,values){
								datasource[values.index]=values;
							});
							$.each(datasource,function(index){
								cell.append($('<option>').attr('value',datasource[index].label).text(datasource[index].label));
							});
							template.append($('<td class="'+fieldinfo.code+'">').css({'padding':'0px'}).append(cell));
							break;
						default:
							template.append($('<td class="'+fieldinfo.code+'">'));
							break;
					}
				}
				head.append($('<th>'));
				template.append(
					$('<td>')
					.append(
						$('<button class="customview-button edit-button">').on('click',function(){
							var cell=$(this).closest('td');
							var index=cell.find('#\\$id').val();
							if (index.length!=0) window.location.href=kintone.api.url('/k/', true).replace(/\.json/g,'')+kintone.app.getId()+'/show#record='+index;
						})
					)
					.append($('<input type="hidden" value="">'))
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
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		var splash=$('<div id="splash">');
		splash.append(
			$('<p>')
			.append($('<span>').text('now loading'))
			.append($('<span class="dot progress1">').text('.'))
			.append($('<span class="dot progress2">').text('.'))
			.append($('<span class="dot progress3">').text('.'))
			.append($('<span class="dot progress4">').text('.'))
			.append($('<span class="dot progress5">').text('.'))
		);
		$('body').append(splash);
		/* setup lectures value */
		vars.lectures=JSON.parse(vars.config['lecture']);
		/* check app fields */
		var counter=0;
		var param=[];
		for (var i=0;i<vars.lectures.length;i++)
			param.push({
				app:'',
				appname:vars.lectures[i].name,
				limit:limit,
				offset:0,
				records:[],
				isstudent:false
			});
		param.push({
			app:'',
			appname:'学年',
			limit:limit,
			offset:0,
			records:[],
			isstudent:false
		});
		param.push({
			app:'',
			appname:'保護者',
			limit:limit,
			offset:0,
			records:[],
			isstudent:false
		});
		param.push({
			app:'',
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
			/* calculate round of tax */
			switch (vars.const['taxround'].value)
			{
				case '1':
					vars.taxround='floor';
					break;
				case '2':
					vars.taxround='ceil';
					break;
				case '3':
					vars.taxround='round';
					break;
			}
			var calcevents=[];
			calcevents.push('app.record.create.change.billprice');
			calcevents.push('app.record.edit.change.billprice');
			calcevents.push('mobile.app.record.create.change.billprice');
			calcevents.push('mobile.app.record.edit.change.billprice');
			calcevents.push('app.record.create.change.taxsegment');
			calcevents.push('app.record.edit.change.taxsegment');
			calcevents.push('mobile.app.record.create.change.taxsegment');
			calcevents.push('mobile.app.record.edit.change.taxsegment');
			calcevents.push('app.record.create.change.billtable');
			calcevents.push('app.record.edit.change.billtable');
			calcevents.push('mobile.app.record.create.change.billtable');
			calcevents.push('mobile.app.record.edit.change.billtable');
			kintone.events.on(calcevents,function(event){
				if (!event.record['billdate'].value) return event;
				/* calculate reate of tax */
				vars.taxrate=functions.calculatetaxrate();
				/* calculate subtotal and tax */
				var able=0;
				var free=0;
				var unitprice=0;
				for (var i2=0;i2<event.record['billtable'].value.length;i2++)
				{
					var row=event.record['billtable'].value[i2];
					unitprice=0;
					unitprice=(row.value['billprice'].value)?parseFloat(row.value['billprice'].value.replace(/,/g,'')):0;
					if (row.value['taxsegment'].value=='課税') able+=unitprice;
					else free+=unitprice;
				}
				var calc=$.calculatetax({
					able:able,
					free:free,
					isoutsidetax:(vars.const['taxshift'].value=='0'),
					taxround:vars.taxround,
					taxrate:vars.taxrate
				});
				event.record['subbill'].value=(calc.able-calc.tax+calc.free).toString();
				event.record['tax'].value=calc.tax.toString();
				return event;
			});
		});
		event.record['billdate']['disabled']=true;
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
