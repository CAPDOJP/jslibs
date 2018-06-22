/*
*--------------------------------------------------------------------
* jQuery-Plugin "student-setting"
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
		apps:{},
		config:{},
		offset:{}
	};
	var events={
		show:[
			'app.record.detail.show'
		],
		save:[
			'app.record.edit.submit',
			'app.record.index.edit.submit'
		]
	};
	var limit=500;
	var functions={
		checkapps:function(counter,param,callback){
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:param[counter].app},function(resp){
				var error='';
				var fieldinfos=$.fieldparallelize(resp.properties);
				switch (param[counter].appname)
				{
					case '洋書テキスト選択':
						if (!('student' in fieldinfos)) error='生徒';
						if (!('startmonth' in fieldinfos)) error='受講開始月';
						if (!('endmonth' in fieldinfos)) error='受講終了日';
						if (!('month' in fieldinfos)) error='受講期間';
					case '受講保留':
						if (!('student' in fieldinfos)) error='生徒';
						if (!('startmonth' in fieldinfos)) error='受講開始月';
						if (!('endmonth' in fieldinfos)) error='受講終了日';
						break;
					case '生徒在籍情報':
						if (!('date' in fieldinfos)) error='登録日';
						if (!('student' in fieldinfos)) error='生徒';
						if (!('event' in fieldinfos)) error='イベント';
						break;
					case 'イベント管理':
						if (!('title' in fieldinfos)) error='タイトル';
						if (!('date' in fieldinfos)) error='開催日';
						break;
					case 'イベント参加者':
						if (!('event' in fieldinfos)) error='イベント';
						if (!('student' in fieldinfos)) error='生徒';
						break;
				}
				if (error.length!=0)
				{
					swal('Error!',name+'アプリ内に'+error+'フィールドが見つかりません。','error');
					return false;
				}
				counter++;
				if (counter<param.length) functions.checkapps(counter,param,callback);
				else callback();
			},
			function(error){
				swal('Error!',error.message,'error');
			});
		},
		/* reload lecture datas */
		loadevents:function(callback){
			var query='';
			var body={
				app:vars.config['event'],
				query:''
			};
			query+='date>"'+new Date().calc('-1 day').format('Y-m-d')+'"';
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
		/* reload lecture datas */
		loadlectures:function(student,date,callback){
			var query='';
			var body={
				app:vars.config['lecture'],
				query:''
			};
			query+='student='+student+' and endmonth>"'+date.calc('1 month').calc('-2 day').format('Y-m-d')+'"';
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
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.save,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		return new kintone.Promise(function(resolve,reject){
			/* check app fields */
			var counter=0;
			var param=[];
			param.push({
				app:vars.config['lecture'],
				appname:'洋書テキスト選択',
				limit:limit,
				offset:0,
				records:[]
			});
			param.push({
				app:vars.config['pending'],
				appname:'受講保留',
				limit:limit,
				offset:0,
				records:[]
			});
			functions.checkapps(counter,param,function(){
				if (event.record[vars.config['loafrom']].value)
				{
					var counter=0;
					var diff=0;
					var from=new Date(event.record[vars.config['loafrom']].value.dateformat()).calc('first-of-month');
					var to=new Date();
					var body={};
					var deletes=[];
					var posts=[];
					var puts=[];
					var postrecords=function(success,fail){
						counter=0;
						for (var i=0;i<posts.length;i++)
							(function(body,success,fail){
								kintone.api(kintone.api.url('/k/v1/record',true),'POST',body,function(resp){
									counter++;
									if (counter==posts.length) success();
								},function(error){
									event.error=error.message;
									fail();
								});
							})(posts[i],success,fail);
					}
					var putrecords=function(success,fail){
						counter=0;
						for (var i=0;i<puts.length;i++)
							(function(body,success,fail){
								kintone.api(kintone.api.url('/k/v1/record',true),'PUT',body,function(resp){
									counter++;
									if (counter==puts.length) success();
								},function(error){
									event.error=error.message;
									fail();
								});
							})(puts[i],success,fail);
					}
					var deleterecords=function(success,fail){
						counter=0;
						for (var i=0;i<deletes.length;i++)
							(function(body,success,fail){
								kintone.api(kintone.api.url('/k/v1/records',true),'DELETE',body,function(resp){
									counter++;
									if (counter==deletes.length) success();
								},function(error){
									event.error=error.message;
									fail();
								});
							})(deletes[i],success,fail);
					}
					vars.apps[vars.config['lecture']]=null;
					vars.offset[vars.config['lecture']]=0;
					functions.loadlectures(event.record['$id'].value,from,function(){
						for (var i=0;i<vars.apps[vars.config['lecture']].length;i++)
						{
							var record=vars.apps[vars.config['lecture']][i];
							if (new Date(event.record[vars.config['loafrom']].value.dateformat()).calc('first-of-month')>new Date(record['startmonth'].value.dateformat()).calc('first-of-month'))
							{
								body={
									app:vars.config['lecture'],
									id:record['$id'].value,
									record:{}
								};
								diff=0;
								to=new Date(record['endmonth'].value.dateformat()).calc('first-of-month');
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
								body.record['endmonth']={value:to.calc('-'+diff.toString()+' month').calc('-1 day').format('Y-m-d')};
								puts.push($.extend(true,{},body));
								body={
									app:vars.config['pending'],
									record:{}
								};
								$.each(record,function(key,values){
									switch (values.type)
									{
										case 'CALC':
										case 'CATEGORY':
										case 'CREATED_TIME':
										case 'CREATOR':
										case 'MODIFIER':
										case 'RECORD_NUMBER':
										case 'STATUS':
										case 'STATUS_ASSIGNEE':
										case 'UPDATED_TIME':
											break;
										default:
											body.record[key]=values;
											break;
									}
								});
								body.record['startmonth']={value:''};
								body.record['endmonth']={value:''};
								body.record['month']={value:parseInt(record['month'].value)-diff};
								posts.push($.extend(true,{},body));
							}
							else
							{
								body={
									app:vars.config['lecture'],
									ids:[record['$id'].value]
								};
								deletes.push($.extend(true,{},body));
								body={
									app:vars.config['pending'],
									record:{}
								};
								$.each(record,function(key,values){
									switch (values.type)
									{
										case 'CALC':
										case 'CATEGORY':
										case 'CREATED_TIME':
										case 'CREATOR':
										case 'MODIFIER':
										case 'RECORD_NUMBER':
										case 'STATUS':
										case 'STATUS_ASSIGNEE':
										case 'UPDATED_TIME':
											break;
										default:
											body.record[key]=values;
											break;
									}
								});
								body.record['startmonth']={value:''};
								body.record['endmonth']={value:''};
								posts.push($.extend(true,{},body));
							}
						}
						postrecords(function(){
							if (puts.length!=0)
							{
								putrecords(function(){
									if (deletes.length!=0) deleterecords(function(){resolve(event)},function(){resolve(event)});
									else resolve(event)
								},function(){resolve(event)});
							}
							else deleterecords(function(){resolve(event)},function(){resolve(event)});
						},function(){resolve(event)});
					});
				}
				else resolve(event);
			});
		});
	});
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		/* check app fields */
		var counter=0;
		var param=[];
		param.push({
			app:vars.config['history'],
			appname:'生徒在籍情報',
			limit:limit,
			offset:0,
			records:[]
		});
		param.push({
			app:vars.config['event'],
			appname:'イベント管理',
			limit:limit,
			offset:0,
			records:[]
		});
		param.push({
			app:vars.config['participant'],
			appname:'イベント参加者',
			limit:limit,
			offset:0,
			records:[]
		});
		functions.checkapps(counter,param,function(){
			var templatelist=$('<div class="student-select-outer custom-elements-student">').append($('<div class="student-select-inner">').append($('<select>')));
			vars.apps[vars.config['event']]=null;
			vars.offset[vars.config['event']]=0;
			functions.loadevents(function(){
				/* get fields of app */
				kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:vars.config['history']},function(resp){
					var eventlist=templatelist.clone(true);
					var historylist=templatelist.clone(true);
					$('select',eventlist).append($('<option>').attr('value','').text('イベント選択'));
					$('select',historylist).append($('<option>').attr('value','').text('在籍状況イベント選択'));
					for (var i=0;i<vars.apps[vars.config['event']].length;i++)
					{
						var record=vars.apps[vars.config['event']][i];
						$('select',eventlist).append($('<option>').attr('value',record['$id'].value).text(record['title'].value));
					}
					$.each(resp.properties['event'].options,function(key,values){
						$('select',historylist).append($('<option>').attr('value',values.label).text(values.label));
					});
					if ($('.custom-elements-student').size()) $('.custom-elements-student').remove();
					if ($('.gaia-app-statusbar').size()) $('.gaia-app-statusbar').css({'display':'inline-block'});
					$('.gaia-argoui-app-toolbar-statusmenu')
					.append(historylist)
					.append(
						$('<button type="button" class="student-button custom-elements-student">').text('在籍状況へ転記')
						.on('click',function(e){
							var record=kintone.app.record.get().record;
							if ($('select',historylist).val().length!=0)
							{
								var body={
									app:vars.config['history'],
									record:{}
								};
								body.record['date']={value:new Date().format('Y-m-d')};
								body.record['student']={value:record['$id'].value};
								body.record['event']={value:$('select',historylist).val()};
								kintone.api(kintone.api.url('/k/v1/record',true),'POST',body,function(resp){
									window.open(kintone.api.url('/k/', true).replace(/\.json/g,'')+vars.config['history']+'/show#record='+resp.id+'&mode=show');
								},function(error){
									swal('Error!',error.message,'error');
								});
							}
							else swal('Error!','在籍状況イベントを選択して下さい。','error');
						})
					)
					.append(eventlist)
					.append(
						$('<button type="button" class="student-button custom-elements-student">').text('イベントに参加')
						.on('click',function(e){
							var record=kintone.app.record.get().record;
							if ($('select',eventlist).val().length!=0)
							{
								var body={
									app:vars.config['participant'],
									record:{}
								};
								body.record['event']={value:$('select',eventlist).val()};
								body.record['student']={value:record['$id'].value};
								kintone.api(kintone.api.url('/k/v1/record',true),'POST',body,function(resp){
									window.open(kintone.api.url('/k/', true).replace(/\.json/g,'')+vars.config['participant']+'/show#record='+resp.id+'&mode=show');
								},function(error){
									swal('Error!',error.message,'error');
								});
							}
							else swal('Error!','イベントを選択して下さい。','error');
						})
					);
				},
				function(error){
					swal('Error!',error.message,'error');
				});
			});
		});
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
