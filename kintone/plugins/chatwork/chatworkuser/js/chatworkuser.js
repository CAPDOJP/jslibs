/*
*--------------------------------------------------------------------
* jQuery-Plugin "chatworkuser"
* Version: 1.0
* Copyright (c) 2018 TIS
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
		button:null,
		select:null,
		userselect:null,
		config:{},
		fieldinfos:{},
		history:{
			limit:25,
			offset:0,
			container:null,
			next:null,
			prev:null,
			table:null,
			messages:[]
		}
	};
	var events={
		lists:[
			'app.record.index.show'
		],
		detail:[
			'app.record.detail.show'
		],
		edit:[
			'app.record.create.show',
			'app.record.edit.show'
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
					authurl+='&scope=rooms.all:read_write%20contacts.all:read';
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
		/* download files */
		download:function(room,file_id){
			var accesstoken=sessionStorage.getItem('accesstoken');
			if (accesstoken)
			{
				kintone.proxy(
					'https://api.chatwork.com/v2/rooms/'+room+'/files/'+file_id+'?create_download_url=1',
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
								functions.download(room,file_id);
							});
						}
						else
						{
							if (status==200) window.open(json.download_url);
							else swal('Error!','ファイルの取得に失敗しました。','error');
						}
					},
					function(error){swal('Error!','ChatWorkへの接続に失敗しました。','error');}
				);
			}
		},
		/* load files */
		files:function(room,account_id,callback){
			var accesstoken=sessionStorage.getItem('accesstoken');
			if (accesstoken)
			{
				kintone.proxy(
					'https://api.chatwork.com/v2/rooms/'+room+'/files?account_id='+account_id,
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
								functions.files(room,account_id,callback);
							});
						}
						else
						{
							if (status==200) callback(json);
							else swal('Error!','ファイル一覧の取得に失敗しました。','error');
						}
					},
					function(error){swal('Error!','ChatWorkへの接続に失敗しました。','error');}
				);
			}
		},
		/* check members */
		ismember:function(room,account_id,callback){
			var accesstoken=sessionStorage.getItem('accesstoken');
			if (accesstoken)
			{
				kintone.proxy(
					'https://api.chatwork.com/v2/rooms/'+room+'/members',
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
								functions.ismember(room,account_id,callback);
							});
						}
						else
						{
							if (status==200)
							{
								var filter=$.grep(json,function(item,index){return item.account_id.toString()==account_id});
								if (filter.length!=0) callback();
							}
						}
					},
					function(error){}
				);
			}
		},
		/* load messages */
		messages:function(records,room,callback){
			var accesstoken=sessionStorage.getItem('accesstoken');
			if (accesstoken)
			{
				kintone.proxy(
					'https://api.chatwork.com/v2/rooms/'+room+'/messages?force='+((records.length==0)?'1':'0'),
					'GET',
					{
						'Authorization':'Bearer '+accesstoken
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
									functions.messages(records,room,callback);
								});
							}
							else
							{
								if (status==200)
								{
									Array.prototype.push.apply(records,json);
									if (json.length==0) callback(records);
									else functions.messages(records,room,callback);
								}
								else swal('Error!','メッセージ一覧の取得に失敗しました。','error');
							}
						}
						else callback(records);
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
		/* show messages */
		histories:function(){
			/* clear rows */
			vars.history.table.rows.remove();
			/* create rows */
			for (var i=vars.history.offset;i<vars.history.offset+vars.history.limit;i++)
				if (i<vars.history.messages.length)
				{
					vars.history.table.addrow();
					(function(message,row){
						if (message.file_id)
						{
							row.find('td').eq(0).find('.reply-chatworkuser').hide();
							row.find('td').eq(0).find('.download-chatworkuser').on('click',function(){
								functions.download($('select',vars.select).val(),message.file_id);
							});
						}
						else
						{
							row.find('td').eq(0).find('.download-chatworkuser').on('click',function(){




							});
							row.find('td').eq(0).find('.download-chatworkuser').hide();
						}
						row.find('td').eq(1).find('span').html(message.send_time.format('Y-m-d H:i:s'));
						row.find('td').eq(2).find('span').html(message.body);
					})(vars.history.messages[i],vars.history.table.rows.last());
				}
			if (vars.history.messages.length>vars.history.limit)
			{
				if (vars.history.offset>0) vars.history.prev.show();
				else vars.history.prev.hide();
				if (vars.history.offset+vars.history.limit<vars.history.messages.length) vars.history.next.show();
				else vars.history.next.hide();
			}
			else
			{
				vars.history.prev.hide();
				vars.history.next.hide();
			}
			/* show histories */
			vars.history.container.show();
		},
		/* load users */
		users:function(callback){
			var accesstoken=sessionStorage.getItem('accesstoken');
			if (accesstoken)
			{
				kintone.proxy(
					'https://api.chatwork.com/v2/contacts',
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
								functions.users(room,callback);
							});
						}
						else
						{
							if (status==200) callback(json);
							else swal('Error!','ユーザー一覧の取得に失敗しました。','error');
						}
					},
					function(error){swal('Error!','ChatWorkへの接続に失敗しました。','error');}
				);
			}
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
		if (!('client_id' in vars.config)) enable=false;
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
		vars.button=$('<button type="button" class="custom-elements-chatworkuser">')
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
		vars.select=$('<div class="kintoneplugin-select-outer custom-elements-chatworkuser">')
		.append(
			$('<div class="kintoneplugin-select">')
			.append(
				$('<select>')
				.css({
					'min-width':'auto',
					'width':'auto'
				})
			)
		);
		vars.redirect=kintone.api.url('/k/', true).replace(/\.json/g,kintone.app.getId()+'/');
		kintone.events.on(events.lists,function(event){
			/* authorize */
			functions.authorize(function(){});
			return event;
		});
		kintone.events.on(events.detail,function(event){
			if (vars.config['history']=='1')
				if (event.record[vars.config['account_id']].value)
				{
					var account_id=event.record[vars.config['account_id']].value;
					var anchor=$('<a href="javascript:void(0)">').css({'display':'inline-block','margin':'0.5em','vertical-align':'top'});
					var img=$('<img>').css({'cursor':'pointer','display':'inline-block','height':'2em','width':'2em'});
					var span=$('<span>').css({'display':'inline-block','line-height':'1.5em','padding':'0.5em'});
					var table=$('<table>').addClass('subtable-gaia').css({'margin':'0.5em 0px'});
					var td=$('<td>').css({'padding':'0px','vertical-align':'top'});
					var th=$('<th>').addClass('subtable-label-gaia').css({'padding':'0px 0.5em','text-align':'center'});
					table.append($('<thead>').addClass('subtable-header-gaia')
						.append($('<tr>')
							.append(th.clone(true).append(span.clone(true).text('')))
							.append(th.clone(true).append(span.clone(true).text('日時')))
							.append(th.clone(true).append(span.clone(true).text('メッセージ')))
						)
					);
					table.append($('<tbody>')
						.append($('<tr>')
							.append(
								td.clone(true)
								.append(img.clone(true).addClass('reply-chatworkuser').attr('src','https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/mail.svg'))
								.append(img.clone(true).addClass('download-chatworkuser').attr('src','https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/clip.svg'))
							)
							.append(td.clone(true).append(span.clone(true).css({'white-space':'nowrap'})))
							.append(td.clone(true).append(span.clone(true)))
						)
					);
					vars.history.container=$(kintone.app.record.getSpaceElement(vars.config['spacer'])).empty();
					vars.history.table=table.adjustabletable({});
					vars.history.next=anchor.clone(true)
					.text('次へ').on('click',function(){
						vars.history.offset+=vars.history.limit;
						functions.histories();
					});
					vars.history.prev=anchor.clone(true)
					.text('前へ').on('click',function(){
						vars.history.offset-=vars.history.limit;
						functions.histories();
					});
					vars.history.container.append(vars.history.table.container);
					vars.history.container.append(vars.history.prev);
					vars.history.container.append(vars.history.next);
					vars.history.container.closest('.layout-gaia').css({'max-width':'100%','padding':'0px','width':'auto'});
					vars.history.container.closest('.control-etc-gaia').css({
						'height':'auto',
						'min-height':'0px',
						'min-width':'0px',
						'padding':'0px 8px',
						'width':'100%'
					});
					/* authorize */
					functions.authorize(function(){
						/* load rooms */
						functions.rooms(function(records){
							(function(select,records){
								var initialize='';
								var loadmessages=function(room){
									vars.history.offset=0;
									vars.history.messages=[];
									functions.files(room,account_id,function(records){
										for (var i=0;i<records.length;i++)
										{
											var record=records[i];
											vars.history.messages.push({
												message_id:record.message_id,
												body:record.filename,
												send_time:new Date(record.upload_time*1000),
												file_id:record.file_id
											});
										}
										functions.messages([],room,function(records){
											var filter=$.grep(records,function(item,index){
												return (item.account.account_id.toString()==account_id && !item.body.match(/dtext:file_uploaded/g));
											});
											for (var i=0;i<filter.length;i++)
											{
												var record=filter[i];
												vars.history.messages.push({
													message_id:record.message_id,
													body:record.body.replace(/\n/g,'<br>'),
													send_time:new Date(record.send_time*1000),
													file_id:''
												});
											}
											vars.history.messages.sort(function(a,b){
												if(a.send_time>b.send_time) return -1;
												if(a.send_time<b.send_time) return 1;
												return 0;
											});
											functions.histories();
										});
									});
								};
								select.empty().on('change',function(){loadmessages($(this).val());});
								for (var i=0;i<records.length;i++)
									(function(record){
										functions.ismember(record.room_id,account_id,function(){
											if (!initialize)
											{
												loadmessages(record.room_id);
												initialize=record.room_id;
											}
											select.append(
												$('<option>').attr('value',record.room_id).text(record.name)
												.css({
													'color':'#3498db',
													'line-height':'20px',
													'padding':'0px 5px',
													'-webkit-appearance':'none',
													'-moz-appearance':'none'
												})
											).val(initialize);
										});
									})(records[i]);
							})($('select',vars.select),records);
							$('.gaia-argoui-app-toolbar-statusmenu')
							.append(
								vars.select
								.css({
									'height':'40px',
									'line-height':'40px',
									'margin':'3px 6px 0px 0px'
								})
							);
						});
					});
				}
			return event;
		});
		kintone.events.on(events.edit,function(event){
			if (vars.config['regist']=='1')
			{
				if (vars.config['account_id']) event.record[vars.config['account_id']].disabled=true;
				if (vars.config['name']) event.record[vars.config['name']].disabled=true;
				if (vars.config['chatwork_id']) event.record[vars.config['chatwork_id']].disabled=true;
				if (vars.config['organization_name']) event.record[vars.config['organization_name']].disabled=true;
				if (vars.config['department']) event.record[vars.config['department']].disabled=true;
				/* authorize */
				functions.authorize(function(){
					/* load users */
					functions.users(function(records){
						/* create userselect */
						vars.userselect=$('body').referer({
							datasource:(function(records){
								var res=[];
								for (var i=0;i<records.length;i++)
								{
									var record=records[i];
									res.push({
										account_id:{value:record.account_id},
										name:{value:record.name},
										chatwork_id:{value:record.chatwork_id},
										organization_name:{value:record.organization_name},
										department:{value:record.department},
										avatar_image_url:{value:'<img src="'+record.avatar_image_url+'" style="display:block;height:32px;">'},
									});
								}
								return res;
							})(records),
							displaytext:['avatar_image_url','chatwork_id','name']
						});
						/* get fieldinfo */
						kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
							vars.fieldinfos=resp.properties;
							if ($('.custom-elements-chatworkuser').size()) $('.custom-elements-chatworkuser').remove();
							$('.gaia-argoui-app-edit-buttons')
							.append(
								vars.button.clone(true)
								.css({
									'height':'48px',
									'line-height':'48px',
									'margin':'0px 0px 0px 16px'
								})
								.text('チャットワークユーザー情報取得')
								.on('click',function(e){
									vars.userselect.show({
										buttons:{
											cancel:function(){
												/* close the reference box */
												vars.userselect.hide();
											}
										},
										callback:function(row){
											var record=kintone.app.record.get();
											/* close the reference box */
											vars.userselect.hide();
											if (vars.config['account_id']) record.record[vars.config['account_id']].value=$('#account_id',row).val();
											if (vars.config['name']) record.record[vars.config['name']].value=$('#name',row).val();
											if (vars.config['chatwork_id']) record.record[vars.config['chatwork_id']].value=$('#chatwork_id',row).val();
											if (vars.config['organization_name']) record.record[vars.config['organization_name']].value=$('#organization_name',row).val();
											if (vars.config['department']) record.record[vars.config['department']].value=$('#department',row).val();
											kintone.app.record.set(record);
										}
									});
								})
							);
						},function(error){});
					});
				});
			}
			return event;
		});
	}
})(jQuery,kintone.$PLUGIN_ID);
