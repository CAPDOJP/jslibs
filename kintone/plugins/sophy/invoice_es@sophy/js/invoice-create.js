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
		date:new Date(),
		taxround:'',
		progress:null,
		splash:null,
		table:null,
		apps:{},
		config:{},
		const:{},
		offset:{}
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
		/* check app fields */
		checkfield:function(index,name,properties){
			var error='';
			var fieldinfos=$.fieldparallelize(properties);
			switch (name)
			{
				case '洋書テキスト選択':
					if (!('student' in fieldinfos)) error='生徒';
					if (!('coursefee' in fieldinfos)) error='授業料';
					if (!('startmonth' in fieldinfos)) error='受講開始月';
					if (!('endmonth' in fieldinfos)) error='受講終了日';
					if (!('textbookname' in fieldinfos)) error='テキスト名';
					if (!('textbookfee' in fieldinfos)) error='テキスト代';
					if (!('dummy' in fieldinfos)) error='ダミー';
					if (!('textbookfeebill' in fieldinfos)) error='テキスト代請求';
					if (!('collected' in fieldinfos)) error='入金確認';
					if (!('cancel' in fieldinfos)) error='受講キャンセル';
					if (!('canceldate' in fieldinfos)) error='キャンセル日';
					if (!('cancelfeepayee' in fieldinfos)) error='返金処理';
					break;
				case 'イベント参加者':
					if (!('student' in fieldinfos)) error='生徒';
					if (!('eventtitle' in fieldinfos)) error='イベントタイトル';
					if (!('eventdate' in fieldinfos)) error='イベント開催日';
					if (!('eventfee' in fieldinfos)) error='参加費';
					if (!('eventfeetype' in fieldinfos)) error='参加費区分';
					if (!('eventfeebill' in fieldinfos)) error='参加費請求';
					if (!('cancel' in fieldinfos)) error='参加キャンセル';
					if (!('canceldate' in fieldinfos)) error='キャンセル日';
					if (!('cancelfeepayee' in fieldinfos)) error='返金処理';
					break;
				case '備品販売':
					if (!('salesdate' in fieldinfos)) error='イベント開催日';
					if (!('student' in fieldinfos)) error='生徒';
					if (!('textbookname' in fieldinfos)) error='テキスト名';
					if (!('textbookfee' in fieldinfos)) error='テキスト金額';
					if (!('quantity' in fieldinfos)) error='数量';
					if (!('textbooktaxsegment' in fieldinfos)) error='テキスト課税区分';
					if (!('itemname' in fieldinfos)) error='備品名';
					if (!('itemfee' in fieldinfos)) error='備品金額';
					if (!('itemtaxsegment' in fieldinfos)) error='備品課税区分';
					if (!('itemfeebill' in fieldinfos)) error='備品請求';
					break;
				case '生徒情報':
					if (!('name' in fieldinfos)) error='氏名';
					if (!('admissiondate' in fieldinfos)) error='入学日';
					if (!('entrancefee' in fieldinfos)) error='入学金';
					if (!('collecttrading' in fieldinfos)) error='支払方法';
					if (!('nsscode' in fieldinfos)) error='NSS加入者番号';
					break;
				case '基本情報':
					if (!('taxshift' in fieldinfos)) error='税転嫁';
					if (!('taxround' in fieldinfos)) error='税端数';
					break;
			}
			if (error.length!=0)
			{
				vars.splash.addClass('hide');
				swal('Error!',name+'アプリ内に'+error+'フィールドが見つかりません。','error');
				return false;
			}
			else return true;
		},
		checkinvoicefield:function(properties){
			var error='';
			var fieldinfos=$.fieldparallelize(properties);
			if (!('billdate' in fieldinfos)) error='請求日';
			if (!('student' in fieldinfos)) error='生徒';
			if (!('studentname' in fieldinfos)) error='生徒名';
			if (!('subbill' in fieldinfos)) error='小計';
			if (!('tax' in fieldinfos)) error='消費税';
			if (!('bill' in fieldinfos)) error='請求金額';
			if (!('collectlimit' in fieldinfos)) error='支払期限';
			if (!('collectdate' in fieldinfos)) error='入金日';
			if (!('collecttrading' in fieldinfos)) error='入金方法';
			if (!('lectureids' in fieldinfos)) error='洋書テキスト選択ID';
			if (!('billtable' in properties)) error='請求テーブル';
			if (error.length!=0)
			{
				swal('Error!','請求アプリ内に'+error+'フィールドが見つかりません。','error');
				return false;
			}
			else return true;
		},
		/* create invoice */
		createinvoice:function(){
			var entryvalues=[];
			var updatevalues=[];
			vars.progress.find('.message').text('請求書作成中');
			vars.progress.find('.progressbar').find('.progresscell').width(0);
			vars.progress.show();
			vars.apps[vars.config['lecture']]=null;
			vars.offset[vars.config['lecture']]=0;
			functions.loadlectures(function(){
				vars.apps[vars.config['event']]=null;
				vars.offset[vars.config['event']]=0;
				functions.loadevents(function(){
					vars.apps[vars.config['item']]=null;
					vars.offset[vars.config['item']]=0;
					functions.loaditems(function(){
						for (var i=0;i<vars.apps[vars.config['student']].length;i++)
						{
							var student=vars.apps[vars.config['student']][i];
							var events=$.grep(vars.apps[vars.config['event']],function(item,index){
								return (item['student'].value==student['$id'].value);
							});
							var items=$.grep(vars.apps[vars.config['item']],function(item,index){
								return (item['student'].value==student['$id'].value);
							});
							var lectures=$.grep(vars.apps[vars.config['lecture']],function(item,index){
								return (item['student'].value==student['$id'].value);
							});
							/* check entried */
							if ($.grep(vars.apps[kintone.app.getId()],function(item,index){
								return (item['student'].value==student['$id'].value);
							}).length!=0) continue;
							/* create invoice values */
							var entryvalue={
								billdate:{value:vars.date.calc('1 month').calc('-1 day').format('Y-m-d')},
								student:{value:student['$id'].value},
								studentname:{value:student['name'].value},
								subbill:{value:0},
								tax:{value:0},
								bill:{value:0},
								collectlimit:{value:''},
								collectdate:{value:''},
								collecttrading:{value:student['collecttrading'].value},
								lectureids:{value:''},
								billtable:{value:[]}
							};
							/* append bill records */
							for (var i2=0;i2<lectures.length;i2++)
							{
								/* check cancel */
								if (lectures[i2]['cancel'].value)
								{
									if (lectures[i2]['collected'].value=='済' && lectures[i2]['cancelfeepayee'].value=='未')
									{
										var diff=1;
										var from=new Date(lectures[i2]['startmonth'].value.dateformat()).calc('first-of-month');
										var to=new Date(lectures[i2]['canceldate'].value.dateformat()).calc('first-of-month');
										while (from.format('Y-m')!=to.format('Y-m'))
										{
											if (from<to)
											{
												from=from.calc('1 month');
												diff++;
											}
											else
											{
												from=from.calc('-1 month');
												diff--;
											}
										}
										if (diff>0) diff=1;
										entryvalue.billtable.value.push({
											value:{
												breakdown:{value:'授業料返金'},
												billfee:{value:(parseInt(lectures[i2]['coursefee'].value)*diff*-1).toString()},
												taxsegment:{value:'課税'},
												billsegment:{value:'授業料'}
											}
										});
										if (lectures[i2]['cancel'].value.match(/買取/g)==null && lectures[i2]['textbookfeebill'].value=='済')
										{
											entryvalue.billtable.value.push({
												value:{
													breakdown:{value:'教材費返金 ('+lectures[i2]['textbookname'].value+')'},
													billfee:{value:(parseInt(lectures[i2]['textbookfee'].value)*-1).toString()},
													taxsegment:{value:'課税'},
													billsegment:{value:'教材費収入'}
												}
											});
										}
										updatevalues.push({
											app:vars.config['lecture'],
											id:lectures[i2]['$id'].value,
											record:{cancelfeepayee:{value:'済'}}
										});
									}
								}
								else
								{
									entryvalue.billtable.value.push({
										value:{
											breakdown:{value:(vars.date.getMonth()+2).toString()+'月分授業料'},
											billfee:{value:lectures[i2]['coursefee'].value},
											taxsegment:{value:'課税'},
											billsegment:{value:'授業料'}
										}
									});
									entryvalue.lectureids.value+=lectures[i2]['$id'].value.toString()+',';
									if (!lectures[i2]['dummy'].value && lectures[i2]['textbookfeebill'].value=='未')
									{
										entryvalue.billtable.value.push({
											value:{
												breakdown:{value:'教材費 ('+lectures[i2]['textbookname'].value+')'},
												billfee:{value:lectures[i2]['textbookfee'].value},
												taxsegment:{value:'課税'},
												billsegment:{value:'教材費収入'}
											}
										});
										updatevalues.push({
											app:vars.config['lecture'],
											id:lectures[i2]['$id'].value,
											record:{textbookfeebill:{value:'済'}}
										});
									}
								}
							}
							for (var i2=0;i2<events.length;i2++)
							{
								/* check paid */
								if (events[i2]['eventfeebill'].value)
									if (events[i2]['eventfeebill'].value.match(/別払/g)!=null) continue;
								/* check cancel */
								if (events[i2]['cancel'].value.length!=0)
								{
									if (events[i2]['eventfeebill'].value=='済' && events[i2]['cancelfeepayee'].value=='未')
									{
										entryvalue.billtable.value.push({
											value:{
												breakdown:{value:events[i2]['eventtitle'].value+'参加費返金'},
												billfee:{value:(parseInt(events[i2]['eventfee'].value)*-1).toString()},
												taxsegment:{value:'課税'},
												billsegment:{value:'セミナー売上'}
											}
										});
										updatevalues.push({
											app:vars.config['event'],
											id:events[i2]['$id'].value,
											record:{cancelfeepayee:{value:'済'}}
										});
									}
								}
								else
								{
									if (events[i2]['eventfeebill'].value=='未')
									{
										entryvalue.billtable.value.push({
											value:{
												breakdown:{value:events[i2]['eventtitle'].value+'参加費'},
												billfee:{value:events[i2]['eventfee'].value},
												taxsegment:{value:'課税'},
												billsegment:{value:'セミナー売上'}
											}
										});
										updatevalues.push({
											app:vars.config['event'],
											id:events[i2]['$id'].value,
											record:{eventfeebill:{value:'済'}}
										});
									}
								}
							}
							for (var i2=0;i2<items.length;i2++)
							{
								var row={};
								/* check paid */
								if (items[i2]['itemfeebill'].value!='未') continue;
								for (var i3=0;i3<items[i2]['textbooktable'].value.length;i3++)
								{
									row=items[i2]['textbooktable'].value[i3].value;
									if (row['textbookname'].value)
									{
										entryvalue.billtable.value.push({
											value:{
												breakdown:{value:row['textbookname'].value},
												billfee:{value:(parseInt(row['textbookfee'].value)*parseInt(row['quantity'].value)).toString()},
												taxsegment:{value:row['textbooktaxsegment'].value},
												billsegment:{value:'雑費'}
											}
										});
									}
								}
								for (var i3=0;i3<items[i2]['itemtable'].value.length;i3++)
								{
									row=items[i2]['itemtable'].value[i3].value;
									if (row['itemname'].value)
									{
										entryvalue.billtable.value.push({
											value:{
												breakdown:{value:row['itemname'].value},
												billfee:{value:row['itemfee'].value},
												taxsegment:{value:row['itemtaxsegment'].value},
												billsegment:{value:'雑費'}
											}
										});
									}
								}
								updatevalues.push({
									app:vars.config['item'],
									id:items[i2]['$id'].value,
									record:{itemfeebill:{value:'済'}}
								});
							}
							/* check admissiondate */
							if (student['admissiondate'].value)
							{
								var admissiondate=new Date(student['admissiondate'].value.dateformat());
								if (vars.date.calc('1 month').calc('-1 day')<admissiondate && vars.date.calc('2 month')>admissiondate)
								{
									entryvalue.billtable.value.push({
										value:{
											breakdown:{value:'入学金'},
											billfee:{value:student['entrancefee'].value},
											taxsegment:{value:'課税'},
											billsegment:{value:'入室金'}
										}
									});
								}
							}
							/* calculate tax */
							if (entryvalue.billtable.value.length!=0)
							{
								var able=0;
								var free=0;
								for (var i2=0;i2<entryvalue.billtable.value.length;i2++)
								{
									var row=entryvalue.billtable.value[i2].value;
									if (row.taxsegment.value=='課税') able+=(row.billfee.value)?parseFloat(row.billfee.value.replace(/,/g,'')):0;
									else free+=(row.billfee.value)?parseFloat(row.billfee.value.replace(/,/g,'')):0;
								}
								var calc=$.calculatetax({
									able:able,
									free:free,
									isoutsidetax:(vars.const['taxshift'].value=='外税'),
									taxround:vars.taxround,
									taxrate:$.calculatetaxrate(new Date(entryvalue.billdate.value.dateformat()))
								});
								entryvalue.subbill.value=calc.able-calc.tax+calc.free;
								entryvalue.tax.value=calc.tax;
								entryvalue.lectureids.value=entryvalue.lectureids.value.replace(/,$/g,'');
								entryvalues.push(entryvalue);
							}
						}
						/* entry invoice */
						functions.entryinvoices(entryvalues,function(){
							if (updatevalues.length==0)
							{
								vars.progress.hide();
								swal({
									title:'作成完了',
									text:'請求書作成しました。',
									type:'success'
								},function(){
									/* reload view */
									functions.load();
								});
							}
							else
							{
								var error=false;
								var counter=0;
								vars.progress.find('.message').text('洋書テキスト選択更新中');
								vars.progress.find('.progressbar').find('.progresscell').width(0);
								vars.progress.show();
								for (var i=0;i<updatevalues.length;i++)
								{
									if (error) return;
									kintone.api(kintone.api.url('/k/v1/record',true),'PUT',updatevalues[i],function(resp){
										counter++;
										if (counter<updatevalues.length)
										{
											vars.progress.find('.progressbar').find('.progresscell').width(vars.progress.find('.progressbar').innerWidth()*(counter/updatevalues.length));
										}
										else
										{
											vars.progress.hide();
											swal({
												title:'作成完了',
												text:'請求書作成しました。',
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
						});
					});
				});
			});
		},
		/* entry invoice */
		entryinvoices:function(values,callback){
			var error=false;
			var counter=0;
			for (var i=0;i<values.length;i++)
			{
				if (error) return;
				(function(values,total,callback){
					var body={
						app:kintone.app.getId(),
						record:values
					};
					kintone.api(kintone.api.url('/k/v1/record',true),'POST',body,function(resp){
						counter++;
						if (counter<total)
						{
							vars.progress.find('.progressbar').find('.progresscell').width(vars.progress.find('.progressbar').innerWidth()*(counter/total));
						}
						else
						{
							vars.progress.hide();
							if (callback!=null) callback();
						}
					},function(error){
						vars.progress.hide();
						swal('Error!',error.message,'error');
						error=true;
					});
				})(values[i],values.length,callback);
			}
			if (values.length==0)
			{
				vars.progress.hide();
				swal('Error!','請求書作成に該当するデータが見つかりませんでした。','error');
			}
		},
		/* reload view */
		load:function(){
			/* after apprecords acquisition,rebuild view */
			vars.apps[kintone.app.getId()]=null;
			vars.offset[kintone.app.getId()]=0;
			functions.loaddatas(function(){
				/* initialize table */
				vars.table.clearrows();
				/* insert row */
				for (var i=0;i<vars.apps[kintone.app.getId()].length;i++)
					vars.table.insertrow(null,function(row){
						$.each(row.find('td'),function(){
							var code=$(this).attr('class');
							var value='';
							if (!code) return true;
							if (!(code in vars.apps[kintone.app.getId()][i])) return true;
							value=$.fieldvalue(vars.apps[kintone.app.getId()][i][code]);
							switch (code)
							{
								case 'bill':
								case 'subbill':
								case 'tax':
									$(this).css({'text-align':'right'}).text(((value)?parseInt(value).format()+'円':''));
									break;
								case 'collectlimit':
								case 'collectdate':
									$('input',$(this)).val(value);
									break;
								case 'collecttrading':
									$('select',$(this)).val(value);
									break;
								default:
									$(this).text(value);
									break;
							}
						});
						$.each(vars.apps[kintone.app.getId()][i],function(key,values){
							if (values!=null)
								if (values.value!=null)
									row.find('td').last().append($('<input type="hidden">').attr('id',key).val(values.value));
						});
					});
			});
		},
		/* reload app datas */
		loadapps:function(counter,param,callback){
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:param[counter].app},function(resp){
				if (!functions.checkfield(counter,param[counter].appname,resp.properties)) return;
				if (param[counter].ischeckonly)
				{
					counter++;
					if (counter<param.length) functions.loadapps(counter,param,callback);
					else callback();
				}
				else
				{
					var body={
						app:param[counter].app,
						query:''
					};
					body.query+='order by $id asc limit '+param[counter].limit.toString()+' offset '+param[counter].offset.toString();
					kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
						Array.prototype.push.apply(param[counter].records,resp.records);
						param[counter].offset+=param[counter].limit;
						if (resp.records.length==param[counter].limit) functions.loadapps(counter,param,callback);
						else
						{
							counter++;
							if (counter<param.length) functions.loadapps(counter,param,callback);
							else callback();
						}
					},function(error){
						vars.splash.addClass('hide');
						swal('Error!',error.message,'error');
					});
				}
			},
			function(error){
				vars.splash.addClass('hide');
				swal('Error!',error.message,'error');
			});
		},
		/* reload datas */
		loaddatas:function(callback){
			var query=kintone.app.getQueryCondition();
			var body={
				app:kintone.app.getId(),
				query:''
			};
			query+=((query.length!=0)?' and ':'');
			query+='billdate>"'+vars.date.calc('-1 day').format('Y-m-d')+'" and billdate<"'+vars.date.calc('1 month').format('Y-m-d')+'"';
			query+=' order by billdate asc,student asc limit '+limit.toString()+' offset '+vars.offset[kintone.app.getId()].toString();
			body.query+=query;
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				if (vars.apps[kintone.app.getId()]==null) vars.apps[kintone.app.getId()]=resp.records;
				else Array.prototype.push.apply(vars.apps[kintone.app.getId()],resp.records);
				vars.offset[kintone.app.getId()]+=limit;
				if (resp.records.length==limit) functions.loaddatas(callback);
				else callback();
			},function(error){
				swal('Error!',error.message,'error');
			});
		},
		/* reload event datas */
		loadevents:function(callback){
			var query='';
			var body={
				app:vars.config['event'],
				query:''
			};
			query+='eventdate<"'+vars.date.calc('2 month').calc('-2 day').format('Y-m-d')+'" and eventfeetype in ("有料")';
			query+=' order by $id asc limit '+limit.toString()+' offset '+vars.offset[vars.config['event']].toString();
			body.query+=query;
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				if (vars.apps[vars.config['event']]==null) vars.apps[vars.config['event']]=resp.records;
				else Array.prototype.push.apply(vars.apps[vars.config['event']],resp.records);
				vars.offset[vars.config['event']]+=limit;
				if (resp.records.length==limit) functions.loadevents(callback);
				else callback();
			},function(error){
				swal('Error!',error.message,'error');
			});
		},
		/* reload item datas */
		loaditems:function(callback){
			var query='';
			var body={
				app:vars.config['item'],
				query:''
			};
			query+='salesdate<"'+vars.date.calc('2 month').calc('-2 day').format('Y-m-d')+'"';
			query+=' order by $id asc limit '+limit.toString()+' offset '+vars.offset[vars.config['item']].toString();
			body.query+=query;
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				if (vars.apps[vars.config['item']]==null) vars.apps[vars.config['item']]=resp.records;
				else Array.prototype.push.apply(vars.apps[vars.config['item']],resp.records);
				vars.offset[vars.config['item']]+=limit;
				if (resp.records.length==limit) functions.loaditems(callback);
				else callback();
			},function(error){
				swal('Error!',error.message,'error');
			});
		},
		/* reload lecture datas */
		loadlectures:function(callback){
			var query='';
			var body={
				app:vars.config['lecture'],
				query:''
			};
			query+='startmonth<"'+vars.date.calc('1 month').calc('1 day').format('Y-m-d')+'" and endmonth>"'+vars.date.calc('2 month').calc('-2 day').format('Y-m-d')+'"';
			query+=' order by $id asc limit '+limit.toString()+' offset '+vars.offset[vars.config['lecture']].toString();
			body.query+=query;
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				if (vars.apps[vars.config['lecture']]==null) vars.apps[vars.config['lecture']]=resp.records;
				else Array.prototype.push.apply(vars.apps[vars.config['lecture']],resp.records);
				vars.offset[vars.config['lecture']]+=limit;
				if (resp.records.length==limit) functions.loadlectures(callback);
				else callback();
			},function(error){
				swal('Error!',error.message,'error');
			});
		},
		/* update lecture datas */
		updatelectures:function(ids,collected,callback){
			var error=false;
			var counter=0;
			var updateids=[]
			var updatevalues=[];
			if (ids.length!=0)
			{
				vars.progress.find('.message').text('洋書テキスト選択更新中');
				vars.progress.find('.progressbar').find('.progresscell').width(0);
				vars.progress.show();
				updateids=ids.split(',');
				for (var i=0;i<updateids.length;i++)
				{
					updatevalues.push({
						app:vars.config['lecture'],
						id:updateids[i],
						record:{collected:{value:((collected)?'済':'未')}}
					});
				}
				for (var i=0;i<updatevalues.length;i++)
				{
					if (error) return;
					kintone.api(kintone.api.url('/k/v1/record',true),'PUT',updatevalues[i],function(resp){
						counter++;
						if (counter<updatevalues.length)
						{
							vars.progress.find('.progressbar').find('.progresscell').width(vars.progress.find('.progressbar').innerWidth()*(counter/updatevalues.length));
						}
						else
						{
							vars.progress.hide();
							if (callback!=null) callback();
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
				if (callback!=null) callback();
			}
		}
	};
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
		vars.progress=$('<div id="progress">').append($('<div class="message">')).append($('<div class="progressbar">').append($('<div class="progresscell">')));
		vars.splash=$('<div id="splash">').append(
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
		kintone.app.getHeaderMenuSpaceElement().appendChild(
			$('<button class="kintoneplugin-button-dialog-ok">').addClass('custom-elements').text('請求書作成')
			.on('click',function(e){functions.createinvoice();})[0]
		);
		kintone.app.getHeaderMenuSpaceElement().appendChild(
			$('<button class="kintoneplugin-button-dialog-ok">').addClass('custom-elements').text('仕訳書出')
			.on('click',function(e){
				var outputs={
					advances:'',
					sales:''
				};
				var months={
					this:vars.date.calc('1 month').calc('-1 day'),
					next:vars.date.calc('2 month').calc('-1 day')
				};
				var summaries={
					cash:{event:0,item:0,lecture:0,textbook:0,admission:0},
					precash:{event:0,item:0,lecture:0,textbook:0,admission:0},
					nss:{event:0,item:0,lecture:0,textbook:0,admission:0},
					post:{event:0,item:0,lecture:0,textbook:0,admission:0}
				};
				var writeline=function(thismonth,nextmonth,fee,debit,assistance,credit,department){
					var datas=''
					var taxrate=$.calculatetaxrate(new Date(thismonth.dateformat()));
					var calc=$.calculatetax({
						able:fee,
						free:0,
						isoutsidetax:(vars.const['taxshift'].value=='外税'),
						taxround:vars.taxround,
						taxrate:taxrate
					});
					datas+='"2000",,"","'+thismonth.format('Y-m-d').replace(/-/g,'\/')+'",';
					datas+='"'+debit+'","'+assistance+'","","対象外",'+calc.able.toString()+',0,';
					datas+='"'+credit+'","","'+department+'","課税売上内五'+(taxrate*100).toString()+'%",'+calc.able.toString()+','+calc.tax.toString()+',';
					datas+='"'+(nextmonth.getMonth()+1).toString()+'月分",';
					datas+='"","",0,"","","0","0","no"\n';
					return datas;
				};
				for (var i=0;i<vars.apps[kintone.app.getId()].length;i++)
				{
					var record=vars.apps[kintone.app.getId()][i];
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
							case 'セミナー売上':
								summary.event+=parseInt(row['billfee'].value);
								break;
							case '雑費':
								summary.item+=parseInt(row['billfee'].value);
								break;
							case '授業料':
								summary.lecture+=parseInt(row['billfee'].value);
								break;
							case '教材費収入':
								summary.textbook+=parseInt(row['billfee'].value);
								break;
							case '入室金':
								summary.admission+=parseInt(row['billfee'].value);
								break;
						}
					}
				}
				if (summaries.cash.event+summaries.cash.item+summaries.cash.lecture+summaries.cash.textbook+summaries.cash.admission!=0)
				{
					if (summaries.cash.event!=0) outputs.sales+=writeline(months.next,months.next,summaries.cash.event,'現金','','セミナー売上','英会話');
					if (summaries.cash.item!=0) outputs.sales+=writeline(months.next,months.next,summaries.cash.item,'現金','','雑費','英会話');
					if (summaries.cash.lecture!=0) outputs.sales+=writeline(months.next,months.next,summaries.cash.lecture,'現金','','授業料','英会話');
					if (summaries.cash.textbook!=0) outputs.sales+=writeline(months.next,months.next,summaries.cash.textbook,'現金','','教材費収入','英会話');
					if (summaries.cash.admission!=0) outputs.sales+=writeline(months.next,months.next,summaries.cash.admission,'現金','','入室金','英会話');
				}
				if (summaries.precash.event+summaries.precash.item+summaries.precash.lecture+summaries.precash.textbook+summaries.precash.admission!=0)
				{
					if (summaries.precash.event!=0) outputs.sales+=writeline(months.next,months.next,summaries.precash.event,'前受金','','セミナー売上','英会話');
					if (summaries.precash.item!=0) outputs.sales+=writeline(months.next,months.next,summaries.precash.item,'前受金','','雑費','英会話');
					if (summaries.precash.lecture!=0) outputs.sales+=writeline(months.next,months.next,summaries.precash.lecture,'前受金','','授業料','英会話');
					if (summaries.precash.textbook!=0) outputs.sales+=writeline(months.next,months.next,summaries.precash.textbook,'前受金','','教材費収入','英会話');
					if (summaries.precash.admission!=0) outputs.sales+=writeline(months.next,months.next,summaries.precash.admission,'前受金','','入室金','英会話');
					outputs.advances+=writeline(months.this,months.next,summaries.precash.event+summaries.precash.item+summaries.precash.lecture+summaries.precash.textbook+summaries.precash.admission,'現金','','前受金','');
				}
				if (summaries.nss.event+summaries.nss.item+summaries.nss.lecture+summaries.nss.textbook+summaries.nss.admission!=0)
				{
					if (summaries.nss.event!=0) outputs.sales+=writeline(months.next,months.next,summaries.nss.event,'普通預金','北越銀行','セミナー売上','英会話');
					if (summaries.nss.item!=0) outputs.sales+=writeline(months.next,months.next,summaries.nss.item,'普通預金','北越銀行','雑費','英会話');
					if (summaries.nss.lecture!=0) outputs.sales+=writeline(months.next,months.next,summaries.nss.lecture,'普通預金','北越銀行','授業料','英会話');
					if (summaries.nss.textbook!=0) outputs.sales+=writeline(months.next,months.next,summaries.nss.textbook,'普通預金','北越銀行','教材費収入','英会話');
					if (summaries.nss.admission!=0) outputs.sales+=writeline(months.next,months.next,summaries.nss.admission,'普通預金','北越銀行','入室金','英会話');
				}
				if (summaries.post.event+summaries.post.item+summaries.post.lecture+summaries.post.textbook+summaries.post.admission!=0)
				{
					if (summaries.post.event!=0) outputs.sales+=writeline(months.next,months.next,summaries.post.event,'前受金','','セミナー売上','英会話');
					if (summaries.post.item!=0) outputs.sales+=writeline(months.next,months.next,summaries.post.item,'前受金','','雑費','英会話');
					if (summaries.post.lecture!=0) outputs.sales+=writeline(months.next,months.next,summaries.post.lecture,'前受金','','授業料','英会話');
					if (summaries.post.textbook!=0) outputs.sales+=writeline(months.next,months.next,summaries.post.textbook,'前受金','','教材費収入','英会話');
					if (summaries.post.admission!=0) outputs.sales+=writeline(months.next,months.next,summaries.post.admission,'前受金','','入室金','英会話');
					outputs.advances+=writeline(months.this,months.next,summaries.post.event+summaries.post.item+summaries.post.lecture+summaries.post.textbook+summaries.post.admission,'郵便貯金','','前受金','');
				}
				$.downloadtext(outputs.advances,'SJIS','advances'+months.this.format('Y-m')+'.txt');
				$.downloadtext(outputs.sales,'SJIS','sales'+months.next.format('Y-m')+'.txt');
			})[0]
		);
		kintone.app.getHeaderMenuSpaceElement().appendChild(
			$('<button class="kintoneplugin-button-dialog-ok">').addClass('custom-elements').text('NSS書出')
			.on('click',function(e){
				var output='';
				for (var i=0;i<vars.apps[kintone.app.getId()].length;i++)
				{
					var record=vars.apps[kintone.app.getId()][i];
					var summary={lecture:0,textbook:0,admission:0};
					if (record['collecttrading'].value!='NSS') continue;
					for (var i2=0;i2<record['billtable'].value.length;i2++)
					{
						var row=record['billtable'].value[i2].value;
						switch (row['billsegment'].value)
						{
							case '授業料':
							case 'セミナー売上':
							case '雑費':
								summary.lecture+=parseInt(row['billfee'].value);
								break;
							case '教材費収入':
								summary.textbook+=parseInt(row['billfee'].value);
								break;
							case '入室金':
								summary.admission+=parseInt(row['billfee'].value);
								break;
						}
					}
					if (summary.lecture+summary.textbook+summary.admission!=0)
					{
						var calc=null;
						var student=$.grep(vars.apps[vars.config['student']],function(item,index){
							return (item['$id'].value==record['student'].value);
						})[0];
						output+=student['nsscode'].value+',';
						calc=$.calculatetax({
							able:summary.lecture,
							free:0,
							isoutsidetax:(vars.const['taxshift'].value=='外税'),
							taxround:vars.taxround,
							taxrate:$.calculatetaxrate(new Date(record['billdate'].value.dateformat()))
						});
						output+=calc.able.toString()+',';
						calc=$.calculatetax({
							able:summary.textbook,
							free:0,
							isoutsidetax:(vars.const['taxshift'].value=='外税'),
							taxround:vars.taxround,
							taxrate:$.calculatetaxrate(new Date(record['billdate'].value.dateformat()))
						});
						output+=calc.able.toString()+',';
						calc=$.calculatetax({
							able:summary.admission,
							free:0,
							isoutsidetax:(vars.const['taxshift'].value=='外税'),
							taxround:vars.taxround,
							taxrate:$.calculatetaxrate(new Date(record['billdate'].value.dateformat()))
						});
						output+=calc.able.toString()+',';
						output+='0,0\n';
					}
				}
				$.downloadtext(output,'SJIS','nss.txt');
			})[0]
		);
		kintone.app.getHeaderMenuSpaceElement().appendChild(
			$('<button class="kintoneplugin-button-dialog-ok">').addClass('custom-elements').text('CVS振替')
			.on('click',function(e){
				var output='';
				for (var i=0;i<vars.apps[kintone.app.getId()].length;i++)
				{
					var record=vars.apps[kintone.app.getId()][i];
					if (record['collecttrading'].value!='コンビニ') continue;
					if (!record['collectlimit'].value)
					{
						swal('Error!','支払期限を入力して下さい。','error');
						return;
					}
					var student=$.grep(vars.apps[vars.config['student']],function(item,index){
						return (item['$id'].value==record['student'].value);
					})[0];
					output+=student['$id'].value+',';
					output+='"'+student['name'].value+'",';
					output+='"'+student['phonetic'].value+'",';
					output+=record['bill'].value+',';
					output+='"'+record['collectlimit'].value.replace(/\//g,'')+'",';
					output+=record['tax'].value+'\n';
				}
				$.downloadtext(output,'SJIS','cvs.csv');
			})[0]
		);
		kintone.app.getHeaderMenuSpaceElement().appendChild(
			$('<button class="kintoneplugin-button-dialog-ok">').addClass('custom-elements').text('NSS読込')
			.append(
				$('<input type="file" class="nssfile">')
				.on('change',function(){
					var error=false;
					var counter=0;
					var target=$(this);
					var entryvalues=[];
					var updatevalues=[];
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
							var student=$.grep(vars.apps[vars.config['student']],function(item,index){
								return (item['nsscode'].value==record[6].replace(/"/g,'') && vars.date.format('Y-m')==new Date(record[0].replace(/"/g,'')).format('Y-m'));
							});
							if (student.length!=0)
							{
								var record=$.grep(vars.apps[kintone.app.getId()],function(item,index){
									return (item['student'].value==student[0]['$id'].value);
								});
								if (record.length!=0)
								{
									entryvalues.push({
										app:kintone.app.getId(),
										id:record[0]['$id'].value,
										record:{
											collectdate:{value:new Date().format('Y-m-d')},
											collecttrading:{value:'NSS'}
										}
									});
									if (record[0]['lectureids'].value)
										if (record[0]['lectureids'].value.length!=0)
											updatevalues.push(record[0]['lectureids'].value);
								}
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
										/* update lecture datas */
										functions.updatelectures(updatevalues.join(','),true,function(){
											vars.progress.hide();
											swal({
												title:'更新完了',
												text:'入金情報を更新しました。',
												type:'success'
											},function(){
												/* reload view */
												functions.load();
											});
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
				}).hide()
			)
			.on('click',function(e){$('.nssfile').trigger('click');})[0]
		);
		$('body').append(vars.progress);
		$('body').append(vars.splash);
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
		vars.date=vars.date.calc('first-of-month');
		month.text(vars.date.format('Y-m'));
		/* day feed button */
		$.each([prev,next],function(){
			$(this).on('click',function(){
				var months=($(this).attr('id')=='next')?1:-1;
				vars.date=vars.date.calc(months+' month');
				month.text(vars.date.format('Y-m'));
				/* reload view */
				functions.load();
			});
		});
		/* check app fields */
		var counter=0;
		var param=[];
		param.push({
			app:vars.config['lecture'],
			appname:'洋書テキスト選択',
			limit:limit,
			offset:0,
			records:[],
			ischeckonly:true
		});
		param.push({
			app:vars.config['event'],
			appname:'イベント参加者',
			limit:limit,
			offset:0,
			records:[],
			ischeckonly:true
		});
		param.push({
			app:vars.config['student'],
			appname:'生徒情報',
			limit:limit,
			offset:0,
			records:[],
			ischeckonly:false
		});
		param.push({
			app:vars.config['const'],
			appname:'基本情報',
			limit:limit,
			offset:0,
			records:[],
			ischeckonly:false
		});
		functions.loadapps(counter,param,function(){
			vars.splash.addClass('hide');
			for (var i=0;i<param.length;i++) vars.apps[param[i].app]=param[i].records;
			if (vars.apps[vars.config['const']].length==0) {swal('Error!','基本情報が登録されていません。','error');return;}
			else vars.const=vars.apps[vars.config['const']][0];
			/* calculate round of tax */
			switch (vars.const['taxround'].value)
			{
				case '切り捨て':
					vars.taxround='floor';
					break;
				case '切り上げ':
					vars.taxround='ceil';
					break;
				case '四捨五入':
					vars.taxround='round';
					break;
			}
			container.empty();
			/* get fields of app */
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
				/* check app fields */
				if (!functions.checkinvoicefield(resp.properties)) return;
				/* create table */
				var head=$('<tr>');
				var template=$('<tr>');
				var columns=[
					'billdate',
					'studentname',
					'subbill',
					'tax',
					'bill',
					'collectlimit',
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
						case 'collectlimit':
							cell=$('<input type="text" id="'+fieldinfo.code+'" class="center" placeholder="ex) '+(new Date().format('Y-m-d'))+'">').css({'width':'100%'})
							.on('change',function(){
								var id=$('#\\$id',$(this).closest('tr')).val();
								var ids=$('#lectureids',$(this).closest('tr')).val();
								var value=$(this).val();
								var body={
									app:kintone.app.getId(),
									id:id,
									record:{collectlimit:{value:value}}
								};
								kintone.api(kintone.api.url('/k/v1/record',true),'PUT',body,function(resp){
									var filter=$.grep(vars.apps[kintone.app.getId()],function(item,index){
										return (item['$id'].value==id);
									});
									if (filter.length!=0) filter[0]['collectlimit'].value=value;
								},function(error){
									swal('Error!',error.message,'error');
								});
							});
							template.append($('<td class="'+fieldinfo.code+'">').css({'padding':'0px','width':'125px'}).append(cell));
							break;
						case 'collectdate':
							cell=$('<input type="text" id="'+fieldinfo.code+'" class="center" placeholder="ex) '+(new Date().format('Y-m-d'))+'">').css({'width':'100%'})
							.on('change',function(){
								var id=$('#\\$id',$(this).closest('tr')).val();
								var ids=$('#lectureids',$(this).closest('tr')).val();
								var value=$(this).val();
								var body={
									app:kintone.app.getId(),
									id:id,
									record:{collectdate:{value:value}}
								};
								kintone.api(kintone.api.url('/k/v1/record',true),'PUT',body,function(resp){
									var filter=$.grep(vars.apps[kintone.app.getId()],function(item,index){
										return (item['$id'].value==id);
									});
									if (filter.length!=0) filter[0]['collectdate'].value=value;
									/* update lecture datas */
									functions.updatelectures(ids,(value.length!=0));
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
									var filter=$.grep(vars.apps[kintone.app.getId()],function(item,index){
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
							if (index.length!=0) window.location.href='https://'+$(location).attr('host')+'/k/'+kintone.app.getId()+'/show#record='+index;
						})
					)
					.append($('<input type="hidden" value="">'))
				);
				vars.table=$('<table id="invoice" class="customview-table invoice-create">').mergetable({
					container:container,
					head:head,
					template:template,
					merge:false
				});
				/* reload view */
				functions.load();
			},
			function(error){
				swal('Error!',error.message,'error');
			});
		});
		return;
	});
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		var body={
			app:vars.config['const'],
			query:'order by $id asc'
		};
		kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
			if (resp.records.length==0) swal('Error!','基本情報が登録されていません。','error');
			else
			{
				vars.const=resp.records[0];
				/* calculate round of tax */
				switch (vars.const['taxround'].value)
				{
					case '切り捨て':
						vars.taxround='floor';
						break;
					case '切り上げ':
						vars.taxround='ceil';
						break;
					case '四捨五入':
						vars.taxround='round';
						break;
				}
				var calcevents=[];
				calcevents.push('app.record.create.change.billfee');
				calcevents.push('app.record.edit.change.billfee');
				calcevents.push('mobile.app.record.create.change.billfee');
				calcevents.push('mobile.app.record.edit.change.billfee');
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
					/* calculate subtotal and tax */
					var able=0;
					var free=0;
					var unitfee=0;
					for (var i2=0;i2<event.record['billtable'].value.length;i2++)
					{
						var row=event.record['billtable'].value[i2];
						unitfee=0;
						unitfee=(row.value['billfee'].value)?parseFloat(row.value['billfee'].value.replace(/,/g,'')):0;
						if (row.value['taxsegment'].value=='課税') able+=unitfee;
						else free+=unitfee;
					}
					var calc=$.calculatetax({
						able:able,
						free:free,
						isoutsidetax:(vars.const['taxshift'].value=='外税'),
						taxround:vars.taxround,
						taxrate:$.calculatetaxrate(new Date(event.record['billdate'].value.dateformat()))
					});
					event.record['subbill'].value=(calc.able-calc.tax+calc.free).toString();
					event.record['tax'].value=calc.tax.toString();
					return event;
				});
			}
		},function(error){
			swal('Error!',error.message,'error');
		});
		/* hide elements  */
		kintone.app.record.setFieldShown('lectureids',false);
		/* disabled elements  */
		event.record['billdate']['disabled']=true;
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
