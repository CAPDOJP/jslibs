/*
*--------------------------------------------------------------------
* jQuery-Plugin "chatworkroom"
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
		room_id:'',
		redirect:'',
		button:null,
		input:null,
		select:null,
		splash:null,
		config:{},
		myinfo:{},
		history:{
			limit:10,
			offset:0,
			container:null,
			next:null,
			prev:null,
			limiter:null,
			roomer:null,
			searcher:null,
			table:null,
			messages:[],
			records:[],
			limits:[10,25,50]
		},
		windows:{
			reply:null,
			room:null,
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
					authurl+='&scope=rooms.all:read_write%20contacts.all:read%20users.profile.me:read';
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
		/* convert tag */
		convert:function(value){
			var res=value
			.replace(/\[To:[^\]]+\]/g,'')
			.replace(/\[rp [^\]]+\]/g,'')
			.replace(/\[info\]/g,'')
			.replace(/\[\/info\]/g,'')
			.replace(/\[title\]/g,'')
			.replace(/\[\/title\]/g,'<br>')
			.replace(/\[qt\]/g,'<div class="quote">')
			.replace(/\[\/qt\]/g,'</div>')
			.replace(/\[qtmeta[^\]]+\]/g,'')
			.replace(/^[ 　]+/g,'')
			.replace(/\n/g,'<br>');
			return res;
		},
		/* download files */
		download:function(file_id){
			var accesstoken=sessionStorage.getItem('accesstoken');
			if (accesstoken)
			{
				kintone.proxy(
					'https://api.chatwork.com/v2/rooms/'+vars.room_id+'/files/'+file_id+'?create_download_url=1',
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
									functions.download(file_id);
								});
							}
							else
							{
								if (status==200) window.open(json.download_url);
								else
								{
									vars.splash.addClass('hide');
									swal('Error!',json.errors[0],'error');
								}
							}
						}
						else
						{
							vars.splash.addClass('hide');
							swal('Error!','ファイルがありません。','error');
						}
					},
					function(error){
						vars.splash.addClass('hide');
						swal('Error!','ChatWorkへの接続に失敗しました。','error');
					}
				);
			}
		},
		/* load files */
		files:function(callback){
			var accesstoken=sessionStorage.getItem('accesstoken');
			if (accesstoken)
			{
				kintone.proxy(
					'https://api.chatwork.com/v2/rooms/'+vars.room_id+'/files',
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
									functions.files(callback);
								});
							}
							else
							{
								if (status==200) callback(json);
								else callback([]);
							}
						}
						else callback([]);
					},
					function(error){
						vars.splash.addClass('hide');
						swal('Error!','ChatWorkへの接続に失敗しました。','error');
					}
				);
			}
		},
		/* array join */
		join:function(param){
			return Object.keys(param).map((key) => {
				return key+'='+param[key];
			}).join('&');
		},
		/* load my informations */
		me:function(callback){
			var accesstoken=sessionStorage.getItem('accesstoken');
			if (accesstoken)
			{
				kintone.proxy(
					'https://api.chatwork.com/v2/me',
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
									functions.me(callback);
								});
							}
							else
							{
								if (status==200) callback(json);
								else swal('Error!',json.errors[0],'error');
							}
						}
						else
						{
							vars.splash.addClass('hide');
							swal('Error!','ユーザー情報が見つかりませんでした。','error');
						}
					},
					function(error){
						vars.splash.addClass('hide');
						swal('Error!','ChatWorkへの接続に失敗しました。','error');
					}
				);
			}
		},
		/* load messages */
		messageget:function(callback){
			var accesstoken=sessionStorage.getItem('accesstoken');
			if (accesstoken)
			{
				kintone.proxy(
					'https://api.chatwork.com/v2/rooms/'+vars.room_id+'/messages?force=1',
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
									functions.messageget(callback);
								});
							}
							else
							{
								if (status==200) callback(json);
								else callback([]);
							}
						}
						else callback([]);
					},
					function(error){
						vars.splash.addClass('hide');
						swal('Error!','ChatWorkへの接続に失敗しました。','error');
					}
				);
			}
		},
		/* show messages */
		messagelist:function(){
			if (vars.history.messages.length>0)
			{
				/* clear rows */
				vars.history.table.rows.remove();
				/* create rows */
				for (var i=vars.history.offset;i<vars.history.offset+vars.history.limit;i++)
					if (i<vars.history.messages.length)
					{
						vars.history.table.addrow();
						(function(row,message){
							var cells=$('td',row);
							if (message.file_id)
							{
								$('.reply-chatworkroom',cells.eq(0)).hide();
								$('.download-chatworkroom',cells.eq(0)).on('click',function(){
									functions.download(message.file_id);
								});
							}
							else
							{
								$('.reply-chatworkroom',cells.eq(0)).on('click',function(){
									vars.windows.reply.show({
										buttons:{
											ok:function(){
												/* close window */
												vars.windows.reply.hide();
												if ($('#message .receiver',vars.windows.reply.contents).val())
												{
													var reply='';
													reply+='[rp aid='+message.account.account_id+' to='+vars.room_id+'-'+message.message_id+'] '+message.account.name+'さん\n';
													reply+=$('#message .receiver',vars.windows.reply.contents).val();
													functions.messagepush(reply,function(message_id){
														var message={
															account:vars.myinfo,
															message_id:message_id,
															body:functions.convert(reply),
															send_time:new Date(),
															file_id:''
														};
														vars.history.records.unshift(message);
														vars.history.messages.unshift(message);
														functions.messagelist();
													});
												}
											},
											cancel:function(){
												/* close window */
												vars.windows.reply.hide();
											}
										}
									});
								});
								$('.download-chatworkroom',cells.eq(0)).hide();
							}
							$('.avatar',cells.eq(0)).attr('src',message.account.avatar_image_url);
							$('.account_name',cells.eq(0)).html(message.account.name);
							$('span',cells.eq(1)).html(message.send_time.format('Y-m-d H:i:s'));
							$('span',cells.eq(2)).html(message.body);
						})(vars.history.table.rows.last(),vars.history.messages[i]);
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
				vars.history.table.container.css({display:'table'});
			}
			else vars.history.table.container.hide();
		},
		/* push message */
		messagepush:function(message,callback){
			var accesstoken=sessionStorage.getItem('accesstoken');
			if (accesstoken)
			{
				kintone.proxy(
					'https://api.chatwork.com/v2/rooms/'+vars.room_id+'/messages',
					'POST',
					{
						'Authorization':'Bearer '+accesstoken,
						'Content-Type':'application/x-www-form-urlencoded'
					},
					functions.join({
						'body':encodeURIComponent(message),
						'self_unread':0
					}),
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
									functions.messagepush(message,callback);
								});
							}
							else
							{
								if ('message_id' in json) callback(json.message_id);
								else
								{
									vars.splash.addClass('hide');
									swal('Error!',json.errors[0],'error');
								}
							}
						}
						else
						{
							vars.splash.addClass('hide');
							swal('Error!','メッセージ送信に失敗しました。','error');
						}
					},
					function(error){}
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
									functions.rooms(callback);
								});
							}
							else
							{
								if (status==200) callback(json);
								else
								{
									vars.splash.addClass('hide');
									swal('Error!',json.errors[0],'error');
								}
							}
						}
						else
						{
							vars.splash.addClass('hide');
							swal('Error!','チャットルームが見つかりませんでした。','error');
						}
					},
					function(error){
						vars.splash.addClass('hide');
						swal('Error!','ChatWorkへの接続に失敗しました。','error');
					}
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
		vars.button=$('<button type="button" class="custom-elements-chatworkroom">').css({
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
		vars.input=$('<div class="kintoneplugin-input-outer custom-elements-chatworkroom">').css({
			'margin-top':'0.5em',
			'padding':'0px'
		})
		.append(
			$('<input type="text">').addClass('kintoneplugin-input-text').css({
				'height':'40px',
				'padding-right':'40px',
				'position':'relative',
				'width':'100%'
			})
		)
		.append(
			$('<img>').css({
				'background-color':'transparent',
				'border':'none',
				'box-sizing':'border-box',
				'cursor':'pointer',
				'display':'block',
				'height':'40px',
				'margin':'0px',
				'position':'absolute',
				'right':'8px',
				'top':'0px',
				'width':'40px'
			})
			.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA7BJREFUeNpiYKAa6J8yMQFK/yfbhP9Qej7RigkpOk+U1QABRLnf92MTZ4LSDkgKHbDpNiDoHZACvIqIChCAAKIIMeLwNtxHhTn5jCTFNHoo4FLPRISZ58mJNQdCwctIauIlKRzwAYAAGqKIkUBcNwIDp4GsRAIqFoC4gBiNAaTmEOQUZkBpWfCeXJtB4AFSMRgAYoNSE9Zyg5R0TVbaRteEnK4JZkn0TAA0rIGcwPxP+4KNWAAQQKO5mVCeg2WdA8DYP0Azi6FZTACILwAtMkQSB4ndxyZHjfbNf2LaE1RNsqBMQ4phUMsdSLEDV04+gBSkRJW3pMY5E45iA2RIIxC/x9cQhEbFeiB2pHqqhlYz/TikHUGOhLZXzpNS6TNSIT2A4nY/MQUuVS0mpibD5gCqt4NwOCARaPkCuhSJ0CyZMFo5wABAAI2iUTCwLRBoLVWAVBI10NRioIUK0JYG0UUhxRaj1TiBQEs2oLWu66FcQaDcB1ItZiHUu8bmK2hQw1op78kp85lw+HY9kUGpiFRnU24xEICaMwSDD+iwBzC3UstiEJhIpBlkta+ZqJAlBahtcT2RZhhQ0+IFxDRvkdrSiVSxGJhoYAa9J1Ca7YeqX0DNoBZE6iXMR7N0P8xRsCyHb0iO3Hb1exwJ6AHQUkUsaohq2JHSTYXF5wegwRfQehMGpLYqqdGgx9Wexms5NfJxIA7x+fiatxRbDK21Ekm1nBo+hmUnnJbTzGIiLKedxXgsF6RbQw7UZCJqZmcUDGsAEKBdq71BEIihhAlYwQ10AnUEJlAnME5g3MAN1AlgA9xAmYAVGEGaVFObA+8LKOZe9I/RpI96vfb1hVdAQMD/qRCazeceB8wuwPAJXdKJDJnTIIwzQ6Fo82scWkvy2TIi/gEC6MzXNiLGYIRRAnowotr7bZzyLuzfAJuztTjCir3DyUVkY84RyPKs72zHBsEljGzqqihiVq9EQin6zrDJ/ECls5wKi46k6bwxN91M9kmYovQcx32oomVLeOlxqEtYBZdxhvG8voNZWblP1MjYUXlKqtJwJVUswNQhsxW53j4SnbjGQyHfwRnc6XRPWJQydo+fm98epHdaCQa++lGIkqhdPP8iit3bhXy/xgeZj05YQX7bvDdR92YAAr9xAh1tKoUXW8HoXlBuVdGAE3ER5teOXYN34mLcviie24isRsTF2ZstiUNxW+jcErE0wpAt3NOZbCbhOBwnmWHLjGubQCfj2G8hPrhiEhAQEDAoXv32txproetaAAAAAElFTkSuQmCC')
		);
		vars.select=$('<div class="kintoneplugin-select-outer custom-elements-chatworkroom">')
		.append(
			$('<div class="kintoneplugin-select">').css({
				'height':'40px',
				'line-height':'40px',
			})
			.append(
				$('<select>').css({
					'height':'40px',
					'line-height':'40px',
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
			if (event.record[vars.config['room_id']].value)
			{
				/* initialize valiable */
				vars.room_id='';
				vars.splash=$('<div id="splash">').append(
					$('<p>')
					.append($('<span>').text('now loading'))
					.append($('<span class="dot progress1">').text('.'))
					.append($('<span class="dot progress2">').text('.'))
					.append($('<span class="dot progress3">').text('.'))
					.append($('<span class="dot progress4">').text('.'))
					.append($('<span class="dot progress5">').text('.'))
				);
				/* authorize */
				functions.authorize(function(){
					/* load my informations */
					functions.me(function(record){
						vars.myinfo=record;
						/* load rooms */
						functions.rooms(function(records){
							var room_ids=event.record[vars.config['room_id']].value.split(',');
							var loadmessages=function(){
								vars.splash.removeClass('hide');
								vars.history.offset=0;
								vars.history.records=[];
								functions.files(function(records){
									for (var i=0;i<records.length;i++)
									{
										var record=records[i];
										vars.history.records.push({
											account:record.account,
											message_id:record.message_id,
											body:record.filename,
											send_time:new Date(record.upload_time*1000),
											file_id:record.file_id
										});
									}
									functions.messageget(function(records){
										var filter=$.grep(records,function(item,index){
											var exists=true;
											if (item.body.match(/(\[deleted\]|\[download:|\[task |\[dtext:chatroom_contact_added|\[dtext:chatroom_groupchat_created)/g)) exists=false;
											return exists;
										});
										for (var i=0;i<filter.length;i++)
										{
											var record=filter[i];
											vars.history.records.push({
												account:record.account,
												message_id:record.message_id,
												body:functions.convert(record.body),
												send_time:new Date(record.send_time*1000),
												file_id:''
											});
										}
										vars.history.records.sort(function(a,b){
											if(a.send_time>b.send_time) return -1;
											if(a.send_time<b.send_time) return 1;
											return 0;
										});
										vars.history.messages=$.extend(true,[],vars.history.records);
										functions.messagelist();
										vars.splash.addClass('hide');
									});
								});
							};
							/* clear elements */
							if ($('.custom-elements-chatworkroom').size()) $('.custom-elements-chatworkroom').remove();
							/* create table */
							vars.history.container=$(kintone.app.record.getSpaceElement(vars.config['spacer'])).empty();
							vars.history.table=$('<table class="table-chatworkroom">').addClass('subtable-gaia')
								.append($('<thead>').addClass('subtable-header-gaia')
									.append($('<tr>')
										.append($('<th>').addClass('subtable-label-gaia').append($('<span>').text('')))
										.append($('<th>').addClass('subtable-label-gaia').append($('<span>').text('日時')))
										.append($('<th>').addClass('subtable-label-gaia').append($('<span>').text('メッセージ')))
									)
								)
								.append($('<tbody>')
									.append($('<tr>')
										.append(
											$('<td>')
											.css({'text-align':'center'})
											.append($('<img>').addClass('avatar'))
											.append($('<span>').addClass('account_name'))
											.append(
												$('<img>').addClass('action').addClass('reply-chatworkroom')
												.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAsVJREFUeNpiYKAq6J8y8T26GBOapACQVsCqACQJpe8DFf3HZcV/bGzKAEAAUc///3H5HcOljMiBgixRmJPPyARlCAKpDzBBILWBMgcCBNDAIUY86UUAyYOENWMLMvTgw2szFgMuALEBEv8DNOjxJ3VssQoUu0+VAAMIoFGEJ2NhA0zkasSqGa2cSSA6bROwsRCYsiYQdDauYAAaPh+nZiw5aAIaP4GokMaRrkHiDnidjSsPQ8UdhngqBAigUTToS4n3lLYJWMho7whQw/Es9LYQb81MgYWNwNzeQEmToB9IFVDoqQtARxjSy8fYgCDQAR9IspiQA9ALV6A6kBpQfRBAqBBmpCRV42uZQdWD2k7nSYl7quZj9B7FKKArAAigUTQKRsGANnsMqDEUwkSqpdBCn4FuFlPTUqItpralRFlMC0uJafrgs7QRiA8AK/gDVLWYDJ8+AGJHoEMeUNLKpCR4CQ8P4bGYGkOWWFuXhBKXIRUsfk9yqga69AI1LMc2tkwwOxFhOThVE7BbANrWJi074Uto2NrU0GGm+WjCG4BqA0kuQEgJdqDaBVAHIafqALKLTFLjHJSaCfUymEgwjOQEh89yJhINIie1F462YkbByAAAAdo1wyOEQRgKo8cAjqCTOIMb2AkcxRU6ghuoE+goHUFyjXeeSgWBEPS9K3/JfQ205BE8EARBmjWTCsQH5CNXVatawFYQ9F5KLGpm2AqCqpD9F9DswNpBswG3Apr8lS4AenLjzHbFVQ1whYz2ZuzyGUSBlSxd6k/sUuDnpi2RSUaX1RefRfgLS3pKG5ftQ1FgheBRfQ7JZ+lvwD0G89KMja401iauJY/2dS9aPMSAf/KPPS9j68bON3/onNmrpRDwWOA3MQh+/xTjpUFV5CtNhwa+VCPvfCixafmag2I8+u1BW6rYb0kInDLawQCAIAiCGtUNf5s2kfrLlk4AAAAASUVORK5CYII=')
											)
											.append(
												$('<img>').addClass('action').addClass('download-chatworkroom')
												.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAABCdJREFUeNpiYKA66J8y8T8yzYRFMhFZjBFJ0gBInQfiBUCcUJiTz4jXCqwSOCXxAYAAIh8xotkvAKTeg9gg1zOhSdwH4g8wMeSAAekQgLIFsQXle6gJRAYELgAQQNTzKqHohwUBMRoEoPH2HpdBjHhsAoVnIRDPB2JHIF4PCkpkm1mwmQpSAGU/gBqyHxT2QPEPyOpZCLgeqyaqAIAAGqKIkZQEAioKgIG3AFuWwKdREYg3QOOcuCSJnlOgYg14bcaSWJABbmfDTEbXiGTgA1wFyH9oeu5HzkXILkFWj1zAKEAVTIA67QM+jehpOwHJNlDpnIhPIy5nb4A6/T6hzI8eYCAbA4jROLAAIIBGczMlrQIFpGR2ARjJG2hmMXI1jAegFD0UWYzFQlDuE0RTsx6azEEgED0EmEi1EJrp3iNZCHJ8IawoQAKFSGwDQpmRUAGMzcL/0ML4PpLa98h8oNoGkiyGtXeA9H609gSyheByGFrQvYeKwxtSRJVdOKoYcPzhaF+BLEyE+hC5UUawIYCrHQMKmnpY3YZcOaCpI9lCQs2YC8jmg1IltSwkJqgTiKjByW5bEdtYDUDKEgtwBf0owAcAArBjBjcMgzAUlVig7SawQbJRRmGDdISOkA2STtSCZCSXGIpteqiElVwSpCdD8v3tcY34CwcSBSeVRi/SaiYwSupCvDqZg57WZ6eK/IcbKJRF0xHqAeKydWu3jAmoC9CDM4wwv4C2hOkBzScmGiPAgb6ItVOXjOGXaYVaGMCkmDVbvTCgO3q0hbUbG4xtLRKFExSsbQ6N/dPM3mqA5md1ZUCdxN5O6Jxu0AOtlCpJoLWM8RZb6Pbi7CgJ/0MDrWX8dQSqgYq1WguVSqYaWgPfs5GeRZVGDW3tFkshhla3Gj6qkn3xGmhTPYbmPErmJdxPapAyYgQVbwHaNaMbBGEgDEPCu7gBG+gKjOAEwgTGCQybuIGOwAiO4AbGDaTmagrpletRKcb744MxpvSDo73/rvIRiUT/WYUIUFRQ2fTJksbbEqOGW9FMI0PmkL1vmUOcoY+5bOAAoD0HCdb1vjhgAqia/A7z0oMeyVCkLkG6INCSUjSyOCetxtZPC+IRfUChRvRAYHU4rqGwkY+N6bgpK8qcsiU8UbOx1X13LkRYQVR5qijAI+VjFNSQ+q1GQlndRFsUtFQDmQUELRKjP80A1bp6gGp7fqTOM+QTxgBKveoSerKfyRNAbzC2V/82m/qOGhU37MKH7v/7xDj05EogvgXK3pYsfaX3dmCcMc09hpsNlAWMlKyHoTgWtr09cy5Qb2AHiHc+GwOU8w5vkESg/gVQDvATA/BICaOBckLadRQPzWPB515ig3IXrQIS9zzAtWcFneSWIJ+tmNdswQJGOUw/9dhFAf60IkA2mM8ViUQiEaIXNl9+XnjctTwAAAAASUVORK5CYII=')
											)
										)
										.append($('<td>').append($('<span>').css({'white-space':'nowrap'})))
										.append($('<td>').append($('<span>')))
									)
								).adjustabletable({});
							vars.history.next=vars.button.clone(true).css({
								'height':'40px',
								'line-height':'40px',
								'margin':'0.25em'
							})
							.text('次へ').on('click',function(){
								vars.history.offset+=vars.history.limit;
								functions.messagelist();
							});
							vars.history.prev=vars.button.clone(true).css({
								'height':'40px',
								'line-height':'40px',
								'margin':'0.25em'
							})
							.text('前へ').on('click',function(){
								vars.history.offset-=vars.history.limit;
								functions.messagelist();
							});
							vars.history.roomer=(function(){
								var roomer=vars.select.clone(true).css({
									'margin':'0.5em 0.5em 0px 0px'
								});
								for (var i=0;i<records.length;i++)
								{
									var record=records[i];
									if (room_ids.indexOf(record.room_id.toString())>-1)
									{
										$('select',roomer).append(
											$('<option>').attr('value',record.room_id).html('&nbsp;'+record.name+'&nbsp;').css({
												'color':'#3498db',
												'line-height':'20px',
												'padding':'0px 5px',
												'-webkit-appearance':'none',
												'-moz-appearance':'none'
											})
										);
									}
								}
								$('select',roomer)
								.val(room_ids[0])
								.on('change',function(){
									vars.room_id=$(this).val();
									loadmessages();
								});
								return roomer;
							})();
							vars.history.limiter=(function(){
								var limiter=vars.select.clone(true).css({
									'margin':'0.5em 0.5em 0px 0px'
								});
								for (var i=0;i<vars.history.limits.length;i++)
									$('select',limiter).append(
										$('<option>').attr('value',vars.history.limits[i]).html('&nbsp;'+vars.history.limits[i]+'件&nbsp;').css({
											'color':'#3498db',
											'line-height':'20px',
											'padding':'0px 5px',
											'-webkit-appearance':'none',
											'-moz-appearance':'none'
										})
									);
								$('select',limiter)
								.val(vars.history.limit)
								.on('change',function(){
									vars.history.limit=parseInt($(this).val());
									vars.history.offset=0;
									functions.messagelist();
								});
								return limiter;
							})();
							vars.history.searcher=(function(){
								var searcher=vars.input.clone(true);
								$('input',searcher).attr('placeholder','キーワードでメッセージを絞り込む');
								$('img',searcher).on('click',function(){
									vars.history.offset=0;
									if ($('input',searcher).val())
									{
										vars.history.messages=$.grep(vars.history.records,function(item,index){
											var exists=false;
											var keywords=$('input',searcher).val().replace(/[ 　]+/g,' ').split(' ');
											for (var i=0;i<keywords.length;i++) if (item.body.match(new RegExp(keywords[i],'g'))) exists=true;
											return exists;
										});
									}
									else vars.history.messages=$.extend(true,[],vars.history.records);
									functions.messagelist();
								});
								return searcher;
							})();
							vars.history.container.append(vars.history.roomer);
							vars.history.container.append(vars.history.limiter);
							vars.history.container.append(vars.history.searcher);
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
							/* create window */
							vars.windows.reply=$('body').fieldsform({fields:[{
								code:'message',
								label:'メッセージ',
								type:'MULTI_LINE_TEXT'
							}]});
							/* append elements */
							$('body').append(vars.splash);
							vars.room_id=room_ids[0];
							loadmessages();
						});
					});
				});
			}
			return event;
		});
		kintone.events.on(events.edit,function(event){
			if (vars.config['room_id']) event.record[vars.config['room_id']].disabled=true;
			if (vars.config['room_name']) event.record[vars.config['room_name']].disabled=true;
			/* authorize */
			functions.authorize(function(){
				/* load rooms */
				functions.rooms(function(records){
					/* clear elements */
					if ($('.custom-elements-chatworkroom').size()) $('.custom-elements-chatworkroom').remove();
					/* create window */
					vars.windows.room=$('body').multiselect({ismulticells:true});
					/* append elements */
					$('.gaia-argoui-app-edit-buttons')
					.append(
						vars.button.clone(true).css({
							'height':'48px',
							'line-height':'48px',
							'margin':'0px 0px 0px 16px'
						})
						.text('チャットルームID取得')
						.on('click',function(e){
							vars.windows.room.show({
								datasource:(function(records){
									var res=[];
									for (var i=0;i<records.length;i++)
									{
										var record=records[i];
										res.push({
											room_id:{display:false,value:record.room_id},
											icon_path:{display:true,value:'<img src="'+record.icon_path+'" style="display:block;height:32px;">'},
											name:{display:true,value:record.name}
										});
									}
									return res;
								})(records),
								buttons:{
									ok:function(selection){
										var record=kintone.app.record.get();
										var room_ids=[];
										var room_names=[];
										for (var i=0;i<selection.length;i++)
										{
											room_ids.push(selection[i]['room_id'].value);
											room_names.push(selection[i]['name'].value);
										}
										if (vars.config['room_id']) record.record[vars.config['room_id']].value=room_ids.join(',');
										if (vars.config['room_name']) record.record[vars.config['room_name']].value=room_names.join(',');
										kintone.app.record.set(record);
										vars.windows.room.hide();
									},
									cancel:function(){
										/* close window */
										vars.windows.room.hide();
									}
								},
								selected:(function(){
									var record=kintone.app.record.get();
									var res=[];
									var room_ids=[];
									if (record.record[vars.config['room_id']].value)
									{
										room_ids=record.record[vars.config['room_id']].value.split(',');
										for (var i=0;i<room_ids.length;i++) res.push({room_id:room_ids[i]});
									}
									return res;
								})()
							});
						})
					);
				});
			});
			return event;
		});
	}
})(jQuery,kintone.$PLUGIN_ID);
