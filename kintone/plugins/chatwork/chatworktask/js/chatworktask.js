/*
*--------------------------------------------------------------------
* jQuery-Plugin "chatworktask"
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
		redirect:'',
		refreshtoken:'',
		limit:500,
		offset:0,
		button:null,
		form:null,
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
			'app.record.edit.show',
			'app.record.detail.show'
		]
	};
	var functions={
		/* authorize */
		authorize:function(callback){
			/* get access token */
			if (!sessionStorage.getItem('accesstoken'))
			{
				var regex=new RegExp("code=([^&#]*)");
				var results=regex.exec(window.location.href);
				if (results!=null) functions.token(results[1],null,callback);
				else
				{
					/* setup session storage */
					sessionStorage.setItem('redirect',window.location.href);
					/* redirect authorize url */
					var authurl='https://www.chatwork.com/packages/oauth2/login.php?response_type=code';
					authurl+='&client_id='+vars.config['client_id'];
					authurl+='&scope=rooms.all:read_write';
					authurl+='&redirect_uri='+encodeURIComponent(vars.redirect);
					window.location.href=authurl;
				}
			}
			else callback();
		},
		/* convert base64 */
		base64:function(value,callback){
			var blob=new Blob([value]);
			var reader=new FileReader();
			reader.onload=function(event){callback(event.target.result.replace(/^.+,/,''))};
			reader.readAsDataURL(blob);
		},
		/* array join */
		join:function(param){
			return Object.keys(param).map((key) => {
				return key+'='+param[key];
			}).join('&');
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
		/* load members */
		members:function(room_id,callback){
			var accesstoken=sessionStorage.getItem('accesstoken');
			if (accesstoken)
			{
				kintone.proxy(
					'https://api.chatwork.com/v2/rooms/'+room_id+'/members',
					'GET',
					{
						'Authorization':'Bearer '+accesstoken
					},
					{},
					function(body,status,headers){
						var json=JSON.parse(body);
						var refresh=false;
						$.each(headers,function(key,values){
							if (key.match(/WWW-Authenticate/g))
								if (values.match(/The access token expired/g)) refresh=true;
						});
						if (refresh)
						{
							functions.token(null,sessionStorage.getItem('refreshtoken'),function(){
								functions.members(room_id,callback);
							});
						}
						else
						{
							if (status==200) callback(json);
							else swal('Error!','タスク担当メンバ一覧の取得に失敗しました。','error');
						}
					},
					function(error){swal('Error!','ChatWorkへの接続に失敗しました。','error');}
				);
			}
		},
		/* load rooms */
		rooms:function(callback){
			var accesstoken=sessionStorage.getItem('accesstoken');
			if (accesstoken)
			{
				kintone.proxy(
					'https://api.chatwork.com/v2/rooms',
					'GET',
					{
						'Authorization':'Bearer '+accesstoken
					},
					{},
					function(body,status,headers){
						var json=JSON.parse(body);
						var refresh=false;
						$.each(headers,function(key,values){
							if (key.match(/WWW-Authenticate/g))
								if (values.match(/The access token expired/g)) refresh=true;
						});
						if (refresh)
						{
							functions.token(null,sessionStorage.getItem('refreshtoken'),function(){
								functions.rooms(callback);
							});
						}
						else
						{
							if (status==200) callback(json);
							else swal('Error!','チャットルーム一覧の取得に失敗しました。','error');
						}
					},
					function(error){swal('Error!','ChatWorkへの接続に失敗しました。','error');}
				);
			}
		},
		/* task get */
		taskget:function(task_id,room_id,callback){
			var accesstoken=sessionStorage.getItem('accesstoken');
			if (accesstoken)
			{
				kintone.proxy(
					'https://api.chatwork.com/v2/rooms/'+room_id+'/tasks/'+task_id,
					'GET',
					{
						'Authorization':'Bearer '+accesstoken,
					},
					{},
					function(body,status,headers){
						if (body)
						{
							var json=JSON.parse(body);
							var refresh=false;
							$.each(headers,function(key,values){
								if (key.match(/WWW-Authenticate/g))
									if (values.match(/The access token expired/g)) refresh=true;
							});
							if (refresh)
							{
								functions.token(null,sessionStorage.getItem('refreshtoken'),function(){
									functions.taskget(task_id,room_id,callback);
								});
							}
							else
							{
								if (status==200) callback(json);
								else
								{
									vars.progress.hide();
									swal('Error!','タスク一覧の取得に失敗しました。','error');
									callback({});
								}
							}
						}
						else callback({});
					},
					function(error){
						vars.progress.hide();
						swal('Error!','ChatWorkへの接続に失敗しました。','error');
					}
				);
			}
		},
		/* task register */
		taskregist:function(record,room_id,member,limit,success,fail){
			var accesstoken=sessionStorage.getItem('accesstoken');
			if (accesstoken)
			{
				kintone.proxy(
					'https://api.chatwork.com/v2/rooms/'+room_id+'/tasks',
					'POST',
					{
						'Authorization':'Bearer '+accesstoken,
						'Content-Type':'application/x-www-form-urlencoded'
					},
					functions.join({
						'body':encodeURIComponent(record[vars.config['task']].value),
						'limit':(new Date(limit.dateformat()).getTime()/1000).toFixed(),
						'to_ids':member
					}),
					function(body,status,headers){
						var json=JSON.parse(body);
						var refresh=false;
						$.each(headers,function(key,values){
							if (key.match(/WWW-Authenticate/g))
								if (values.match(/The access token expired/g)) refresh=true;
						});
						if (refresh)
						{
							functions.token(null,sessionStorage.getItem('refreshtoken'),function(){
								functions.taskregist(record,room_id,member,limit,success,fail);
							});
						}
						else
						{
							if ('task_ids' in json) success(json.task_ids);
							else
							{
								swal({
									title:'Error!',
									text:json.errors[0],
									type:'error'
								},function(){fail();});
							}
						}
					},
					function(error){
						fail();
					}
				);
			}
			else fail();
		},
		/* get access token */
		token:function(code,refreshtoken,callback){
			var body='';
			if (refreshtoken)
			{
				body=functions.join({
					'grant_type':'refresh_token',
					'refresh_token':refreshtoken
				});
			}
			else
			{
				body=functions.join({
					'grant_type':'authorization_code',
					'code':code,
					'redirect_uri':encodeURIComponent(vars.redirect),
				});
			}
			functions.base64(vars.config['client_id']+':'+vars.config['client_secret'],function(resp){
				kintone.proxy(
					'https://oauth.chatwork.com/token',
					'POST',
					{
						'Authorization':'Basic '+resp,
						'Content-Type':'application/x-www-form-urlencoded'
					},
					body,
					function(body,status,headers){
						var json=JSON.parse(body);
						if (!json.error)
						{
							/* setup session storage */
							sessionStorage.setItem('accesstoken',json.access_token);
							sessionStorage.setItem('refreshtoken',json.refresh_token);
							if (sessionStorage.getItem('redirect').replace(/\/$/g,'')+'/'==vars.redirect) callback();
							else window.location.href=sessionStorage.getItem('redirect');
						}
						else swal('Error!',json.error_description,'error');
					},
					function(error){
						swal('Error!',error,'error');
					}
				);
			});
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	var enable=true;
	vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
	if (!vars.config) enable=false;
	else
	{
		if (!('taskid' in vars.config)) enable=false;
		else
		{
			if (!sessionStorage)
			{
				swal('Error!','本プラグインはご利用中のブラウザには対応しておりません。','error');
				enable=false;
			}
		}
	}
	if (enable)
	{
		vars.button=$('<button type="button" class="custom-elements-chatworktask">')
		.css({
			'background-color':'#f7f9fa',
			'border':'1px solid #e3e7e8',
			'box-shadow':'1px 1px 1px #fff inset',
			'box-sizing':'border-box',
			'color':'#3498db',
			'cursor':'pointer',
			'display':'inline-block',
			'font-size':'14px',
			'outline':'none',
			'padding':'0px 16px',
			'position':'relative',
			'text-align':'center',
			'vertical-align':'top',
			'white-space':'nowrap'
		});
		vars.redirect=kintone.api.url('/k/', true).replace(/\.json/g,kintone.app.getId()+'/');
		kintone.events.on(events.lists,function(event){
			/* authorize */
			functions.authorize(function(){
				if ($('.custom-elements-chatworktask').size()) $('.custom-elements-chatworktask').remove();
				kintone.app.getHeaderMenuSpaceElement().appendChild(
					vars.button.clone(true)
					.css({
						'height':'48px',
						'line-height':'48px',
						'margin':'0px 6px 0px 0px'
					})
					.text('タスクを同期')
					.on('click',function(e){
						swal({
							title:'確認',
							text:'タスクを同期します。宜しいですか？',
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
								var updates=[];
								var progress=function(){
									counter++;
									if (counter<updates.length)
									{
										vars.progress.find('.progressbar').find('.progresscell').width(vars.progress.find('.progressbar').innerWidth()*(counter/updates.length));
									}
									else
									{
										vars.progress.hide();
										swal({
											title:'同期完了',
											text:'タスクを同期しました。',
											type:'success'
										},function(){location.reload(true);});
									}
								};
								var setuprecord=function(record,task){
									record[vars.config['taskid']]={value:task.task_id};
									record[vars.config['member']]={value:task.account.name};
									record[vars.config['limit']]={value:(task.limit_time)?new Date(task.limit_time*1000).format('Y-m-d'):null};
									record[vars.config['task']]={value:task.body};
									if (vars.config['status']) record[vars.config['status']]={value:(task.status=='open')?'未完了':'完了'};
									return record;
								};
								for (var i=0;i<records.length;i++)
								{
									var record=records[i];
									if (!record[vars.config['taskid']].value) continue;
									if (!record[vars.config['roomid']].value) continue;
									updates.push({
										task_id:record[vars.config['taskid']].value,
										room_id:record[vars.config['roomid']].value,
										record:record
									})
								}
								if (updates.length==0)
								{
									vars.progress.hide();
									setTimeout(function(){
										swal('Error!','タスクがありません。','error');
									},500);
									return;
								}
								else vars.progress.find('.message').text('タスク更新中');
								for (var i=0;i<updates.length;i++)
								{
									if (error) break;
									(function(task){
										functions.taskget(task.task_id,task.room_id,function(resp){
											if ('task_id' in resp)
											{
												var body={
													app:kintone.app.getId(),
													id:task.record['$id'].value,
													record:setuprecord((function(filter){
														var record={};
														$.each(filter,function(key,values){
															switch (values.type)
															{
																case 'CALC':
																case 'CATEGORY':
																case 'CREATED_TIME':
																case 'CREATOR':
																case 'FILE':
																case 'MODIFIER':
																case 'RECORD_NUMBER':
																case 'STATUS':
																case 'STATUS_ASSIGNEE':
																case 'UPDATED_TIME':
																	break;
																default:
																	record[key]=values;
																	break;
															}
														});
														return record;
													})(task.record),resp)
												};
												kintone.api(kintone.api.url('/k/v1/record',true),'PUT',body,function(resp){
													progress();
												},function(error){
													vars.progress.hide();
													swal('Error!',error.message,'error');
													error=true;
												});
											}
											else error=true;
										});
									})(updates[i]);
								}
							});
						})
					})[0]
				);
			});
			vars.progress=$('<div id="progress">').append($('<div class="message">')).append($('<div class="progressbar">').append($('<div class="progresscell">')));
			$('body').append(vars.progress);
			return event;
		});
		kintone.events.on(events.show,function(event){
			if (event.type.match(/(create|edit)/g)!=null)
			{
				event.record[vars.config['taskid']].disabled=true;
				event.record[vars.config['roomid']].disabled=true;
				event.record[vars.config['roomname']].disabled=true;
				event.record[vars.config['member']].disabled=true;
				event.record[vars.config['limit']].disabled=true;
				if (vars.config['status']) event.record[vars.config['status']].disabled=true;
			}
			else
			{
				if (event.record[vars.config['taskid']].value) return;
				/* authorize */
				functions.authorize(function(){
					/* get fieldinfo */
					kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
						vars.fieldinfos=resp.properties;
						if ($('.custom-elements-chatworktask').size()) $('.custom-elements-chatworktask').remove();
						$('.gaia-argoui-app-toolbar-statusmenu')
						.append(
							vars.button.clone(true)
							.css({
								'height':'40px',
								'line-height':'40px',
								'margin':'3px 6px 0px 0px'
							})
							.text('タスクを登録')
							.on('click',function(e){
								var fields=[];
								if (event.record[vars.config['task']].value)
								{
									fields.push({
										code:'rooms',
										label:'チャットルーム',
										type:'DROP_DOWN',
										options:['dummy']
									});
									fields.push({
										code:'members',
										label:'担当メンバー',
										type:'DROP_DOWN',
										options:['dummy']
									});
									fields.push({
										code:'limit',
										label:'期限',
										type:'DATE'
									});
									vars.form=$('body').fieldsform({fields:fields});
									functions.rooms(function(records){
										var rooms=$('#rooms .receiver',vars.form.contents);
										var members=$('#members .receiver',vars.form.contents);
										var limit=$('#limit .receiver',vars.form.contents);
										rooms.on('change',function(){
											members.empty().append($('<option>').attr('value','').text(''));
											if (rooms.val())
												functions.members(rooms.val(),function(records){
													for (var i=0;i<records.length;i++) members.append($('<option>').attr('value',records[i].account_id).text(records[i].name));
												});
										});
										rooms.empty().append($('<option>').attr('value','').text(''));
										for (var i=0;i<records.length;i++) rooms.append($('<option>').attr('value',records[i].room_id).text(records[i].name));
										vars.form.show({
											buttons:{
												ok:function(){
													/* close form */
													vars.form.hide();
													if (!rooms.val())
													{
														swal('Error!',fields.rooms.label+'を指定して下さい。','error');
														return;
													}
													if (!members.val())
													{
														swal('Error!',fields.members.label+'を指定して下さい。','error');
														return;
													}
													if (!limit.val())
													{
														swal('Error!',fields.limit.label+'を入力して下さい。','error');
														return;
													}
													functions.taskregist(event.record,rooms.val(),members.val(),limit.val(),function(ids){
														var body={
															app:kintone.app.getId(),
															id:event.record['$id'].value,
															record:{}
														};
														body.record[vars.config['taskid']]={value:ids[0]};
														body.record[vars.config['roomid']]={value:rooms.val()};
														body.record[vars.config['roomname']]={value:$('option:selected',rooms).text()};
														body.record[vars.config['member']]={value:$('option:selected',members).text()};
														body.record[vars.config['limit']]={value:limit.val()};
														if (vars.config['status']) body.record[vars.config['status']]={value:'未完了'};
														kintone.api(kintone.api.url('/k/v1/record',true),'PUT',body,function(resp){
															swal({
																title:'登録完了',
																text:'タスクをを登録しました。',
																type:'success'
															},function(){location.reload(true);});
														},function(error){
															swal('Error!',error.message,'error');
															error=true;
														});
													});
												},
												cancel:function(){
													/* close form */
													vars.form.hide();
												}
											}
										});
									});
								}
								else swal('Error!',vars.fieldinfos[vars.config['task']].label+'を入力して下さい。','error');
							})
						);
					},function(error){});
				});
			}
			return event;
		});
	}
})(jQuery,kintone.$PLUGIN_ID);
