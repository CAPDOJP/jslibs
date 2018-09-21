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
		account_id:'',
		account_name:'',
		room_id:'',
		redirect:'',
		button:null,
		input:null,
		select:null,
		replyform:null,
		userform:null,
		config:{},
		myinfo:{},
		history:{
			limit:25,
			offset:0,
			container:null,
			next:null,
			prev:null,
			search:null,
			table:null,
			filters:[],
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
			var res=value;
			res=res.replace(/\[To:[^\]]+\]/g,'');
			res=res.replace(/\[rp [^\]]+\]/g,'');
			res=res.replace(/\[qt\]\[qtmeta[^\]]+\]/g,'<div class="quote">');
			res=res.replace(/\[\/qt\]/g,'</div>');
			return res.replace(/^[ 　]+/g,'').replace(/\n/g,'<br>');
		},
		/* array join */
		join:function(param){
			return Object.keys(param).map((key) => {
				return key+'='+param[key];
			}).join('&');
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
								else swal('Error!',json.errors[0],'error');
							}
						}
						else swal('Error!','ファイルがありません。','error');
					},
					function(error){swal('Error!','ChatWorkへの接続に失敗しました。','error');}
				);
			}
		},
		/* load files */
		files:function(callback){
			var accesstoken=sessionStorage.getItem('accesstoken');
			if (accesstoken)
			{
				kintone.proxy(
					'https://api.chatwork.com/v2/rooms/'+vars.room_id+'/files?account_id='+vars.account_id,
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
				if (i<vars.history.filters.length)
				{
					vars.history.table.addrow();
					(function(message,row){
						if (message.file_id)
						{
							row.find('td').eq(0).find('.reply-chatworkuser').hide();
							row.find('td').eq(0).find('.download-chatworkuser').on('click',function(){
								functions.download(message.file_id);
							});
						}
						else
						{
							row.find('td').eq(0).find('.reply-chatworkuser').on('click',function(){
								vars.replyform.show({
									buttons:{
										ok:function(){
											/* close form */
											vars.replyform.hide();
											if ($('#message .receiver',vars.replyform.contents).val())
											{
												var reply='';
												reply+='[rp aid='+vars.account_id+' to='+vars.room_id+'-'+message.message_id+'] '+vars.account_name+'さん\n';
												reply+=$('#message .receiver',vars.replyform.contents).val();
												functions.send(reply,function(message_id){
													message.reply+='<p><span class="small">'+new Date().format('Y-m-d H:i:s')+'</span>'+functions.convert(reply)+'</p>';
													functions.histories();
												});
											}
										},
										cancel:function(){
											/* close form */
											vars.replyform.hide();
										}
									}
								});
							});
							row.find('td').eq(0).find('.download-chatworkuser').hide();
						}
						row.find('td').eq(1).find('span').html(message.send_time.format('Y-m-d H:i:s'));
						row.find('td').eq(2).find('span').html(message.body+((message.reply)?'<div class="reply">'+message.reply+'</div>':''));
					})(vars.history.filters[i],vars.history.table.rows.last());
				}
			if (vars.history.filters.length>vars.history.limit)
			{
				if (vars.history.offset>0) vars.history.prev.show();
				else vars.history.prev.hide();
				if (vars.history.offset+vars.history.limit<vars.history.filters.length) vars.history.next.show();
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
		/* load me */
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
						else swal('Error!','ユーザー情報が見つかりませんでした。','error');
					},
					function(error){swal('Error!','ChatWorkへの接続に失敗しました。','error');}
				);
			}
		},
		/* load messages */
		messages:function(callback){
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
									functions.messages(callback);
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
								if (status==200)
								{
									var counter=json.length;
									var res=[];
									for (var i=0;i<json.length;i++)
										(function(record,res){
											kintone.proxy(
												'https://api.chatwork.com/v2/rooms/'+record.room_id.toString()+'/members',
												'GET',
												{
													'Authorization':'Bearer '+accesstoken
												},
												{},
												function(body,status,headers){
													if (body)
													{
														var json=JSON.parse(body);
														if (status==200)
														{
															var filter=$.grep(json,function(item,index){return item.account_id.toString()==vars.account_id});
															if (filter.length!=0)
															{
																if (!vars.room_id) vars.room_id=record.room_id.toString();
																res.push(record);
															}
														}
													}
													counter--;
													if (counter==0) callback(res);
												},
												function(error){}
											);
										})(json[i],res);
								}
								else swal('Error!','チャットルーム一覧の取得に失敗しました。','error');
							}
						}
						else swal('Error!','チャットルームが見つかりませんでした。','error');
					},
					function(error){swal('Error!','ChatWorkへの接続に失敗しました。','error');}
				);
			}
		},
		/* send message */
		send:function(message,callback){
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
									functions.send(message,callback);
								});
							}
							else
							{
								if ('message_id' in json) callback(json.message_id);
								else swal('Error!',json.errors[0],'error');
							}
						}
						else swal('Error!','メッセージ送信に失敗しました。','error');
					},
					function(error){}
				);
			}
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
									functions.users(callback);
								});
							}
							else
							{
								if (status==200) callback(json);
								else swal('Error!',json.errors[0],'error');
							}
						}
						else swal('Error!','コンタクト可能なユーザーが見つかりませんでした。','error');
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
		vars.input=$('<div class="kintoneplugin-input-outer custom-elements-chatworkuser">')
		.append(
			$('<input type="text">').addClass('kintoneplugin-input-text').css({
				'height':'40px',
				'padding-right':'40px',
				'position':'relative',
				'z-index':'1',
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
				'width':'40px',
				'z-index':'2'
			})
			.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA7BJREFUeNpiYKAa6J8yMQFK/yfbhP9Qej7RigkpOk+U1QABRLnf92MTZ4LSDkgKHbDpNiDoHZACvIqIChCAAKIIMeLwNtxHhTn5jCTFNHoo4FLPRISZ58mJNQdCwctIauIlKRzwAYAAGqKIkUBcNwIDp4GsRAIqFoC4gBiNAaTmEOQUZkBpWfCeXJtB4AFSMRgAYoNSE9Zyg5R0TVbaRteEnK4JZkn0TAA0rIGcwPxP+4KNWAAQQKO5mVCeg2WdA8DYP0Azi6FZTACILwAtMkQSB4ndxyZHjfbNf2LaE1RNsqBMQ4phUMsdSLEDV04+gBSkRJW3pMY5E45iA2RIIxC/x9cQhEbFeiB2pHqqhlYz/TikHUGOhLZXzpNS6TNSIT2A4nY/MQUuVS0mpibD5gCqt4NwOCARaPkCuhSJ0CyZMFo5wABAAI2iUTCwLRBoLVWAVBI10NRioIUK0JYG0UUhxRaj1TiBQEs2oLWu66FcQaDcB1ItZiHUu8bmK2hQw1op78kp85lw+HY9kUGpiFRnU24xEICaMwSDD+iwBzC3UstiEJhIpBlkta+ZqJAlBahtcT2RZhhQ0+IFxDRvkdrSiVSxGJhoYAa9J1Ca7YeqX0DNoBZE6iXMR7N0P8xRsCyHb0iO3Hb1exwJ6AHQUkUsaohq2JHSTYXF5wegwRfQehMGpLYqqdGgx9Wexms5NfJxIA7x+fiatxRbDK21Ekm1nBo+hmUnnJbTzGIiLKedxXgsF6RbQw7UZCJqZmcUDGsAEKBdq71BEIihhAlYwQ10AnUEJlAnME5g3MAN1AlgA9xAmYAVGEGaVFObA+8LKOZe9I/RpI96vfb1hVdAQMD/qRCazeceB8wuwPAJXdKJDJnTIIwzQ6Fo82scWkvy2TIi/gEC6MzXNiLGYIRRAnowotr7bZzyLuzfAJuztTjCir3DyUVkY84RyPKs72zHBsEljGzqqihiVq9EQin6zrDJ/ECls5wKi46k6bwxN91M9kmYovQcx32oomVLeOlxqEtYBZdxhvG8voNZWblP1MjYUXlKqtJwJVUswNQhsxW53j4SnbjGQyHfwRnc6XRPWJQydo+fm98epHdaCQa++lGIkqhdPP8iit3bhXy/xgeZj05YQX7bvDdR92YAAr9xAh1tKoUXW8HoXlBuVdGAE3ER5teOXYN34mLcviie24isRsTF2ZstiUNxW+jcErE0wpAt3NOZbCbhOBwnmWHLjGubQCfj2G8hPrhiEhAQEDAoXv32txproetaAAAAAElFTkSuQmCC')
		);
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
					var anchor=vars.button.clone(true).css({'height':'40px','line-height':'40px','margin':'0.25em'});
					var search=vars.input.clone(true).css({'margin-top':'0.5em','max-width':'30em','width':'100%'});
					/* initialize valiable */
					vars.account_id=event.record[vars.config['account_id']].value;
					vars.room_id='';
					/* authorize */
					functions.authorize(function(){
						/* load users */
						functions.me(function(record){
							vars.myinfo=record;
							/* load users */
							functions.users(function(records){
								var filter=$.grep(records,function(item,index){return item.account_id.toString()==vars.account_id});
								if (filter.length!=0) vars.account_name=filter[0].name;
								/* clear elements */
								if ($('.custom-elements-chatworkuser').size()) $('.custom-elements-chatworkuser').remove();
								/* create table */
								vars.history.container=$(kintone.app.record.getSpaceElement(vars.config['spacer'])).empty();
								vars.history.table=$('<table class="table-chatworkuser">').addClass('subtable-gaia')
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
												.append(
													$('<img>').addClass('reply-chatworkuser')
													.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA1BJREFUeNpiYKAUMMIY/VMm/keXLMzJZ2RC5qDJK4IIJjQTHiApvI+iAAoUsFlFGQAIIAr9T8jvjmhygsje2o8UOBeA+D2Iz4KsnHr+BQigAQ4nUj0ESwlMeCQ3IAkdwJLGaGAzXQBAAI1EhFyYJACp+UToSQRG1QL0qLpApIVwdciaA6CR/4FA4gjAphmWwhagJ0UovxE9BWJLYQUgRVANhiAaqqkeXSELLifCbAHSOD1PUdpG1vyASD0PhnjyBAigUTQw1QVawm4AUvZUsOMgMGc1EGUx1NJ6KnqwEd1yRnyqgQ4AlYUJFFi4AWhhINFBjeTjD0CNglAxB1h7hQAIBOrZANUDasMpYPMxCwFDBNCKSkWgAQ+ghoIaSQKw1hRQ/ANQDMR/j6/AI7fguw9yCNQxE6HFciLUsv+wFhuphSapoB5q2XxyNDONuHw8CugGAAJoFI2CUUDbIhNava2nkh2g+vkDsZ2J91T03HtsHhyw2omJULeQCuABqdWiABWCHN5UIsrHQEvPgxIEtGlTSGZzlhFkKdAsrA1EXInLANqsAXXjJwDpCUgtRrzBClSvSEyrlFDimg9t3AlADVTEo9YQydL3hJrCLMRmCaBhoIEr0CAhI1pPYwJQvBBq4XrkIQdqWAwCDtDgD4S2oRqQ0gSxjX2K8vF6aFAyEBuslPoYXw9j6LSrRy2mG8CVuASpWR+PNntGwcgAAAHataIbBGEoCAkDMAJuIBvoBowAEwgTECdQJzBOoCOwgY7iCHLhSl4ICaJQq76Lxh/1vXu9lr5r9aVQKBQKh+CP+TIaZvSuDvK41Y1cPOl+mi3p0tGBWzI/dxuIr5A0Rzqn+RA6kD8MysOYsx1/BNGo65DR8NhZljpyKMxpqcgl7HNon21N+5DWf9raSl7j2FX1Z2wCknw6A0nEyWTBGc+oDdh6wn2agrAEAuU8Gq5YcZi8Gd9mkdu8IX1T1LtUGYuavFq5YILqQ9ZXkm/lJv0+Sh8ny9HAfCzMbavOtBn6rVXCEkjqLC4FQGZ7Sn8hRunIQkl1WFkYg5kXGCRdsgAXkoMK1t0FZ8b5b5WwBOZdIqR/8porByubzzGbhLvSLz8R+O92WkpY99I/1h4qFAqFQuEQHjGwTRBLz3OuAAAAAElFTkSuQmCC')
												)
												.append(
													$('<img>').addClass('download-chatworkuser')
													.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAABCdJREFUeNpiYKA66J8y8T8yzYRFMhFZjBFJ0gBInQfiBUCcUJiTz4jXCqwSOCXxAYAAIh8xotkvAKTeg9gg1zOhSdwH4g8wMeSAAekQgLIFsQXle6gJRAYELgAQQNTzKqHohwUBMRoEoPH2HpdBjHhsAoVnIRDPB2JHIF4PCkpkm1mwmQpSAGU/gBqyHxT2QPEPyOpZCLgeqyaqAIAAGqKIkZQEAioKgIG3AFuWwKdREYg3QOOcuCSJnlOgYg14bcaSWJABbmfDTEbXiGTgA1wFyH9oeu5HzkXILkFWj1zAKEAVTIA67QM+jehpOwHJNlDpnIhPIy5nb4A6/T6hzI8eYCAbA4jROLAAIIBGczMlrQIFpGR2ARjJG2hmMXI1jAegFD0UWYzFQlDuE0RTsx6azEEgED0EmEi1EJrp3iNZCHJ8IawoQAKFSGwDQpmRUAGMzcL/0ML4PpLa98h8oNoGkiyGtXeA9H609gSyheByGFrQvYeKwxtSRJVdOKoYcPzhaF+BLEyE+hC5UUawIYCrHQMKmnpY3YZcOaCpI9lCQs2YC8jmg1IltSwkJqgTiKjByW5bEdtYDUDKEgtwBf0owAcAArBjBjcMgzAUlVig7SawQbJRRmGDdISOkA2STtSCZCSXGIpteqiElVwSpCdD8v3tcY34CwcSBSeVRi/SaiYwSupCvDqZg57WZ6eK/IcbKJRF0xHqAeKydWu3jAmoC9CDM4wwv4C2hOkBzScmGiPAgb6ItVOXjOGXaYVaGMCkmDVbvTCgO3q0hbUbG4xtLRKFExSsbQ6N/dPM3mqA5md1ZUCdxN5O6Jxu0AOtlCpJoLWM8RZb6Pbi7CgJ/0MDrWX8dQSqgYq1WguVSqYaWgPfs5GeRZVGDW3tFkshhla3Gj6qkn3xGmhTPYbmPErmJdxPapAyYgQVbwHaNaMbBGEgDEPCu7gBG+gKjOAEwgTGCQybuIGOwAiO4AbGDaTmagrpletRKcb744MxpvSDo73/rvIRiUT/WYUIUFRQ2fTJksbbEqOGW9FMI0PmkL1vmUOcoY+5bOAAoD0HCdb1vjhgAqia/A7z0oMeyVCkLkG6INCSUjSyOCetxtZPC+IRfUChRvRAYHU4rqGwkY+N6bgpK8qcsiU8UbOx1X13LkRYQVR5qijAI+VjFNSQ+q1GQlndRFsUtFQDmQUELRKjP80A1bp6gGp7fqTOM+QTxgBKveoSerKfyRNAbzC2V/82m/qOGhU37MKH7v/7xDj05EogvgXK3pYsfaX3dmCcMc09hpsNlAWMlKyHoTgWtr09cy5Qb2AHiHc+GwOU8w5vkESg/gVQDvATA/BICaOBckLadRQPzWPB515ig3IXrQIS9zzAtWcFneSWIJ+tmNdswQJGOUw/9dhFAf60IkA2mM8ViUQiEaIXNl9+XnjctTwAAAAASUVORK5CYII=')
												)
											)
											.append($('<td>').append($('<span>').css({'white-space':'nowrap'})))
											.append($('<td>').append($('<span>')))
										)
									).adjustabletable({});
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
								vars.history.search=search.clone(true);
								vars.history.search.find('input').attr('placeholder','キーワードでメッセージを絞り込む');
								vars.history.search.find('img').on('click',function(){
									vars.history.offset=0;
									if (vars.history.search.find('input').val())
									{
										vars.history.filters=$.grep(vars.history.messages,function(item,index){
											return item.body.match(new RegExp(vars.history.search.find('input').val(),'g'));
										});
									}
									else vars.history.filters=vars.history.messages;
									functions.histories();
								});
								vars.history.container.append(vars.history.search);
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
								/* create form */
								vars.replyform=$('body').fieldsform({fields:[{
									code:'message',
									label:'メッセージ',
									type:'MULTI_LINE_TEXT'
								}]});
								/* append elements */
								var rooms=$('.gaia-argoui-app-toolbar-statusmenu')
								.append(
									vars.select.clone(true)
									.css({
										'height':'40px',
										'line-height':'40px',
										'margin':'3px 6px 0px 0px'
									})
								).find('select');
								/* load rooms */
								functions.rooms(function(records){
									var loadmessages=function(){
										vars.history.offset=0;
										vars.history.messages=[];
										functions.files(function(records){
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
											functions.messages(function(records){
												var filter=$.grep(records,function(item,index){
													var exists=true;
													if (item.account.account_id.toString()!=vars.account_id) exists=false;
													if (item.body.match(/(\[dtext:file_uploaded\]|\[deleted\])/g)) exists=false;
													if (!item.body.match(new RegExp('aid='+vars.myinfo.account_id,'g')) && !item.body.match(new RegExp('To:'+vars.myinfo.account_id,'g'))) exists=false;
													return exists;
												});
												for (var i=0;i<filter.length;i++)
												{
													var record=filter[i];
													var message={
														message_id:record.message_id,
														body:functions.convert(record.body),
														reply:'',
														send_time:new Date(record.send_time*1000),
														file_id:''
													}
													var reply=$.grep(records,function(item,index){
														var exists=true;
														if (item.account.account_id.toString()!=vars.myinfo.account_id) exists=false;
														if (item.body.match(/(\[dtext:file_uploaded\]|\[deleted\])/g)) exists=false;
														if (!item.body.match(new RegExp('aid='+vars.account_id+' to='+vars.room_id+'-'+record.message_id,'g'))) exists=false;
														return exists;
													});
													for (var i2=0;i2<reply.length;i2++)
														message.reply+='<p><span class="small">'+new Date(reply[i2].send_time).format('Y-m-d H:i:s')+'</span>'+functions.convert(reply[i2].body)+'</p>';
													vars.history.messages.push(message);
												}
												vars.history.messages.sort(function(a,b){
													if(a.send_time>b.send_time) return -1;
													if(a.send_time<b.send_time) return 1;
													return 0;
												});
												vars.history.filters=vars.history.messages;
												functions.histories();
											});
										});
									};
									for (var i=0;i<records.length;i++)
										rooms.append(
											$('<option>').attr('value',records[i].room_id).html('&nbsp;'+records[i].name+'&nbsp;')
											.css({
												'color':'#3498db',
												'line-height':'20px',
												'padding':'0px 5px',
												'-webkit-appearance':'none',
												'-moz-appearance':'none'
											})
										);
									rooms
									.val(vars.room_id)
									.on('change',function(){
										vars.room_id=$(this).val();
										vars.history.search.find('input').val('');
										loadmessages();
									});
									loadmessages();
								});
							});
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
						/* clear elements */
						if ($('.custom-elements-chatworkuser').size()) $('.custom-elements-chatworkuser').remove();
						/* create form */
						vars.userform=$('body').referer({
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
						/* append elements */
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
								vars.userform.show({
									buttons:{
										cancel:function(){
											/* close the reference box */
											vars.userform.hide();
										}
									},
									callback:function(row){
										var record=kintone.app.record.get();
										/* close the reference box */
										vars.userform.hide();
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
					});
				});
			}
			return event;
		});
	}
})(jQuery,kintone.$PLUGIN_ID);
