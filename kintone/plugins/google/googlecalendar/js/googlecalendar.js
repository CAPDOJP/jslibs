/*
*--------------------------------------------------------------------
* jQuery-Plugin "googlecalendar"
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
		fromdate:new Date().calc('first-of-month'),
		todate:new Date().calc('first-of-month').calc('1 month').calc('-1 day'),
		fromcalendar:null,
		tocalendar:null,
		auth:false,
		list:false,
		limit:500,
		offset:0,
		progress:null,
		config:{},
		fieldinfos:{}
	};
	var events={
		lists:[
			'app.record.index.show'
		],
		show:[
			'app.record.create.show',
			'app.record.edit.show'
		],
		save:[
			'app.record.create.submit',
			'app.record.edit.submit',
			'app.record.index.edit.submit'
		]
	};
	var functions={
		/* google api loaded */
		apiloaded:function(){
			gapi.client.init({
				client_id:vars.config['client_id'],
				discoveryDocs:['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
				scope:'https://www.googleapis.com/auth/calendar',
			}).then(function(){
				gapi.auth2.getAuthInstance().isSignedIn.listen(function(isSignedIn){
					vars.auth=isSignedIn;
					if (vars.auth)
					{
						functions.setupelements(function(){
							$('.auth-googlecalendar').attr('src','https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/unlink.svg');
						});
					}
				});
				vars.auth=gapi.auth2.getAuthInstance().isSignedIn.get();
				if (!vars.auth) gapi.auth2.getAuthInstance().signIn();
				else
				{
					functions.setupelements(function(){
						$('.auth-googlecalendar').attr('src','https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/unlink.svg');
					});
				}
			},function(reason){
				swal('Error!',reason.result.error.message,'error');
			});
		},
		/* googlecalendar get */
		calendarget:function(record,token,callback){
			var params={};
			if (token)
			{
				params['calendarId']=vars.config['calendarid'];
				params['pageToken']=token;
			}
			else
			{
				params['calendarId']=vars.config['calendarid'];
				params['timeMin']=vars.fromdate.format('Y-m-d')+'T00:00:00+0900';
				params['timeMax']=vars.todate.format('Y-m-d')+'T23:59:00+0900';
				params['showDeleted']=false;
				params['singleEvents']=true;
				params['orderBy']='startTime';
			}
			gapi.client.calendar.events.list({param}).then(function(resp){
				Array.prototype.push.apply(records,resp.result.items);
				if (resp.nextPageToken) functions.calendarget(records,resp.nextPageToken,callback);
				else callback(records);
			});
		},
		/* googlecalendar register */
		calendarregist:function(record,success,fail){
			var callback=function(resp){
				if ('id' in resp)
				{
					record[vars.config['eventid']].value=resp.id;
					success();
				}
				else
				{
					swal({
						title:'エラー',
						text:resp.error.message,
						type:'error'
					},function(){if (fail) fail();});
				}
			};
			if (vars.auth)
			{
				var event={
					summary:'',
					location:'',
					description:'',
					start:{
						timeZone:'Asia/Tokyo'
					},
					end:{
						timeZone:'Asia/Tokyo'
					}
				};
				if (record[vars.config['summary']].value) event.summary=record[vars.config['summary']].value;
				switch (vars.fieldinfos[vars.config['start']].type)
				{
					case 'DATE':
						event.start['date']=record[vars.config['start']].value;
						break;
					case 'DATETIME':
						event.start['datetime']=record[vars.config['start']].value;
						break;
				}
				switch (vars.fieldinfos[vars.config['end']].type)
				{
					case 'DATE':
						event.end['date']=record[vars.config['end']].value;
						break;
					case 'DATETIME':
						event.end['datetime']=record[vars.config['end']].value;
						break;
				}
				if (vars.config['location'])
					if (record[vars.config['location']].value) event.location=record[vars.config['location']].value;
				if (vars.config['description'])
					if (record[vars.config['description']].value) event.description=record[vars.config['description']].value;
				if (record[vars.config['eventid']].value)
				{
					gapi.client.calendar.events.update({
						'calendarId':vars.config['calendarid']
						'eventId':record[vars.config['eventid']].value,
						'resource':event
					}).execute(function(resp){callback(resp);});
				}
				else
				{
					gapi.client.calendar.events.insert({
						'calendarId':vars.config['calendarid']
						'resource':event
					}).execute(function(resp){callback(resp);});
				}
			}
			else
			{
				if (fail) fail();
			}
		},
		/* load app datas */
		loaddatas:function(appkey,filter,records,callback){
			var sort='';
			var body={
				app:appkey,
				query:filter
			};
			sort=' order by $id asc limit '+vars.limit.toString()+' offset '+vars.offset.toString();
			body.query+=sort;
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				Array.prototype.push.apply(records,resp.records);
				vars.offset+=vars.limit;
				if (resp.records.length==vars.limit) functions.loaddatas(appkey,filter,records,callback);
				else callback(records);
			},function(error){
				vars.progress.hide();
				swal('Error!',error.message,'error');
			});
		},
		setupelements:function(callback){
			if ($('.custom-elements-googlecalendar').size()) $('.custom-elements-googlecalendar').remove();
			/* get fields of app */
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
				vars.fieldinfos=resp.properties;
				if (vars.list)
				{
					var feed=$('<div class="dayfeed-googlecalendar custom-elements-googlecalendar">');
					var fromdate=$('<span class="span-googlecalendar">');
					var frombutton=$('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/calendar.png" class="button-googlecalendar" alt="カレンダー" title="カレンダー" />');
					var todate=$('<span class="span-googlecalendar">');
					var tobutton=$('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/calendar.png" class="button-googlecalendar" alt="カレンダー" title="カレンダー" />');
					/* setup date value */
					fromdate.text(vars.fromdate.format('Y-m-d'));
					todate.text(vars.todate.format('Y-m-d'));
					/* date pickup button */
					vars.fromcalendar=$('body').calendar({
						selected:function(target,value){
							vars.fromdate=new Date(value.dateformat());
							fromdate.text(vars.fromdate.format('Y-m'));
						}
					});
					frombutton.on('click',function(){vars.fromcalendar.show({activedate:vars.fromdate});});
					vars.tocalendar=$('body').calendar({
						selected:function(target,value){
							vars.todate=new Date(value.dateformat());
							todate.text(vars.todate.format('Y-m'));
						}
					});
					tobutton.on('click',function(){vars.tocalendar.show({activedate:vars.todate});});
					kintone.app.getHeaderMenuSpaceElement().appendChild(
						$('<div class="kintoneplugin-select-outer custom-elements-googlecalendar">')
						.append(
							$('<div class="kintoneplugin-select">')
							.append($('<select id="template-googlecalendar">'))
						)[0]
					);
					/* append elements */
					feed.append(fromdate);
					feed.append(frombutton);
					feed.append($('<span class="span-googlecalendar">').text(' ~ '));
					feed.append(todate);
					feed.append(tobutton);
					kintone.app.getHeaderMenuSpaceElement().appendChild(feed[0]);
					kintone.app.getHeaderMenuSpaceElement().appendChild(
						$('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/download.svg" class="button-googlecalendar custom-elements-googlecalendar" alt="予定取得" title="予定取得" />')
						.on('click',function(e){
							if (!vars.auth) return;
							swal({
								title:'確認',
								text:'Googleカレンダーから条件に該当する予定を取得します。宜しいですか？',
								type:'info',
								showCancelButton:true,
								cancelButtonText:'Cancel'
							},
							function(){
								var records={
									google:[],
									kintone:[]
								}
								vars.offset=0;
								vars.progress.find('.message').text('一覧データ取得中');
								vars.progress.find('.progressbar').find('.progresscell').width(0);
								vars.progress.show();
								functions.loaddatas(kintone.app.getId(),'',records.kintone,function(records){
									functions.calendarget(records.google,'',function(records){
										var error=false;
										var counter=0;
										var progress=function(){
											counter++;
											if (counter<records.length)
											{
												vars.progress.find('.progressbar').find('.progresscell').width(vars.progress.find('.progressbar').innerWidth()*(counter/records.length));
											}
											else
											{
												vars.progress.hide();
												swal({
													title:'登録完了',
													text:'予定を登録しました。',
													type:'success'
												},function(){location.reload(true);});
											}
										};
										var setuprecord=function(record){
											record[vars.config['summary']]={value:event.summary};
											switch (vars.fieldinfos[vars.config['start']].type)
											{
												case 'DATE':
													record[vars.config['start']]={value:event.start.date};
													break;
												case 'DATETIME':
													record[vars.config['start']]={value:event.start.datetime};
													break;
											}
											switch (vars.fieldinfos[vars.config['end']].type)
											{
												case 'DATE':
													record[vars.config['end']]={value:event.end.date};
													break;
												case 'DATETIME':
													record[vars.config['end']]={value:event.end.datetime};
													break;
											}
											if (vars.config['location'])
												record[vars.config['location']]={value:event.location};
											if (vars.config['description'])
												record[vars.config['description']]={value:event.description};
											if ('$id' in record) delete record['$id'];
											if ('$revision' in record) delete record['$revision'];
											return record;
										};
										if (records.google.length==0)
										{
											vars.progress.hide();
											setTimeout(function(){
												swal('Error!','予定がありません。','error');
											},500);
											return;
										}
										else vars.progress.find('.message').text('予定登録中');
										for (var i=0;i<records.google.length;i++)
										{
											if (error) break;
											(function(event){
												var filter=$.grep(records.kintone,function(item,index){
													return item[vars.config['eventid']].value=event.id;
												});
												if (filter.length!=0)
												{
													var body={
														app:kintone.app.getId(),
														id:filter[0]['$id'].value,
														record:setuprecord(filter[0])
													};
													kintone.api(kintone.api.url('/k/v1/record',true),'PUT',body,function(resp){
														progress();
													},function(error){
														swal('Error!',error.message,'error');
														error=true;
													});
												}
												else
												{
													var body={
														app:kintone.app.getId(),
														record:setuprecord({})
													};
													kintone.api(kintone.api.url('/k/v1/record',true),'POST',body,function(resp){
														progress();
													},function(error){
														swal('Error!',error.message,'error');
														error=true;
													});
												}
											})(records.google[i]);
										}
									});
								});
							});
						})[0]
					);
					kintone.app.getHeaderMenuSpaceElement().appendChild(
						$('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/upload.svg" class="button-googlecalendar custom-elements-googlecalendar" alt="予定登録" title="予定登録" />')
						.on('click',function(e){
							if (!vars.auth) return;
							swal({
								title:'確認',
								text:'表示中の一覧の条件に該当するすべての予定をGoogleカレンダーへ登録します。宜しいですか？',
								type:'info',
								showCancelButton:true,
								cancelButtonText:'Cancel'
							},
							function(){
								vars.offset=0;
								vars.progress.find('.message').text('一覧データ取得中');
								vars.progress.find('.progressbar').find('.progresscell').width(0);
								vars.progress.show();
								functions.loaddatas(kintone.app.getId(),kintone.app.getQueryCondition(),[],function(records){
									var error=false;
									var counter=0;
									var progress=function(){
										counter++;
										if (counter<records.length)
										{
											vars.progress.find('.progressbar').find('.progresscell').width(vars.progress.find('.progressbar').innerWidth()*(counter/records.length));
										}
										else
										{
											vars.progress.hide();
											swal({
												title:'登録完了',
												text:'予定を登録しました。',
												type:'success'
											},function(){location.reload(true);});
										}
									};
									if (records.length==0)
									{
										vars.progress.hide();
										setTimeout(function(){
											swal('Error!','レコードがありません。','error');
										},500);
										return;
									}
									else vars.progress.find('.message').text('予定登録中');
									for (var i=0;i<records.length;i++)
									{
										if (error) break;
										(function(record){
											functions.calendarregist(record,function(){
												var body={
													app:kintone.app.getId(),
													id:record['$id'].value,
													record:record
												};
												kintone.api(kintone.api.url('/k/v1/record',true),'PUT',body,function(resp){
													progress();
												},function(error){
													swal('Error!',error.message,'error');
													error=true;
												});
											},function(){error=true;});
										})(records[i]);
									}
								});
							});
						})[0]
					);
					kintone.app.getHeaderMenuSpaceElement().appendChild(
						$('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/link.svg" class="auth-googlecalendar custom-elements-googlecalendar" alt="認証" title="認証" />')
						.on('click',function(e){
							if ($(this).attr('src').match(/unlink.svg$/g))
							{
								gapi.auth2.getAuthInstance().signOut();
								$(this).attr('src','https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/link.svg');
								vars.auth=false;
							}
							else gapi.auth2.getAuthInstance().signIn();
						})[0]
					);
					for(var i=0;i<12;i++) $('#template-googlecalendar').append($('<option>').html('月').val(vars.templates[i]['$id'].value));
				}
				else
				{
					$('.gaia-argoui-app-toolbar-statusmenu')
					.append(
						$('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/link.svg" class="auth-googlecalendar custom-elements-googlecalendar" alt="認証" title="認証" />')
						.on('click',function(e){
							if ($(this).attr('src').match(/unlink.svg$/g))
							{
								gapi.auth2.getAuthInstance().signOut();
								$(this).attr('src','https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/link.svg');
								vars.auth=false;
							}
							else gapi.auth2.getAuthInstance().signIn();
						})
					);
				}
				if (callback) callback();
			},function(error){
				swal('Error!',error.message,'error');
			});
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.lists,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		if (!('eventid' in vars.config)) return event;
		/* initialize valiable */
		vars.list=true;
		gapi.load('client:auth2',functions.apiloaded);
		vars.progress=$('<div id="progress">').append($('<div class="message">')).append($('<div class="progressbar">').append($('<div class="progresscell">')));
		$('body').append(vars.progress);
		return event;
	});
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		if (!('eventid' in vars.config)) return event;
		/* initialize valiable */
		vars.list=false;
		gapi.load('client:auth2',functions.apiloaded);
		/* hide elements  */
		kintone.app.record.setFieldShown(vars.config['eventid'],false);
		return event;
	});
	kintone.events.on(events.save,function(event){
		if (vars.auth)
		{
			return new kintone.Promise(function(resolve,reject){
				functions.calendarregist(event.record,function(){
					resolve(event);
				},function(){
					resolve(event);
				});
			});
		}
		else return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
