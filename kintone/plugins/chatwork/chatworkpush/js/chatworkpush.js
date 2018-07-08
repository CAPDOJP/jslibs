/*
*--------------------------------------------------------------------
* jQuery-Plugin "chatworkpush"
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
		config:{},
		fieldinfos:{},
		rooms:[]
	};
	var events={
		insert:[
			'app.record.create.submit.success'
		],
		update:[
			'app.record.edit.submit.success',
			'app.record.index.edit.submit.success'
		],
		delete:[
			'app.record.detail.delete.submit',
			'app.record.index.delete.submit'
		],
		process:[
			'app.record.detail.process.proceed'
		],
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
					authurl+='&scope=rooms.messages:write';
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
		/* create push message */
		createmessage:function(headers,footers,record,fields){
			var res='';
			if (headers.length>0) res+=headers.join('\n');
			if (fields.length>0)
			{
				for (var i=0;i<fields.length;i++)
				{
					if (fields[i] in vars.fieldinfos)
					{
						res+='[info]';
						res+='[title]'+vars.fieldinfos[fields[i]].label+'[/title]';
						res+=(function(fieldinfo,value){
							var res='';
							var unit=(fieldinfo.unit!=null)?fieldinfo.unit:'';
							var unitPosition=(fieldinfo.unitPosition!=null)?fieldinfo.unitPosition.toUpperCase():'BEFORE';
							if (value)
								switch (fieldinfo.type.toUpperCase())
								{
									case 'CALC':
										switch(fieldinfo.format.toUpperCase())
										{
											case 'DATETIME':
												res=new Date(value.dateformat()).format('Y-m-d H:i');
												break;
											case 'NUMBER_DIGIT':
												res=parseFloat(value).format();
												break;
											default:
												res=value;
												break;
										}
										if (unitPosition=='BEFORE') res=unit+res;
										else res=res+unit;
										break;
									case 'CATEGORY':
									case 'CHECK_BOX':
									case 'MULTI_SELECT':
										if (value.length!=0) res=value.join(',');
										break;
									case 'CREATOR':
									case 'MODIFIER':
										res=value.name;
										break;
									case 'CREATED_TIME':
									case 'DATETIME':
									case 'UPDATED_TIME':
										res=new Date(value.dateformat()).format('Y-m-d H:i');
										break;
									case 'NUMBER':
										if (fieldinfo.digit) res=parseFloat(value).format();
										else res=value;
										if (unitPosition=='BEFORE') res=unit+res;
										else res=res+unit;
										break;
									case 'GROUP_SELECT':
									case 'ORGANIZATION_SELECT':
									case 'STATUS_ASSIGNEE':
									case 'USER_SELECT':
										res=[];
										for (var i2;i2<value.length;i2++) res.push(value[i2].name);
										res=res.join(',');
										break;
									default:
										res=value;
										break;
								}
							return res;
						})(vars.fieldinfos[fields[i]],record[fields[i]].value);
						res+='[/info]';
					}
				}
			}
			else res+='\n';
			if (footers.length>0) res+=footers.join('\n');
			return res;
		},
		/* array join */
		join:function(param){
			return Object.keys(param).map((key) => {
				return key+'='+param[key];
			}).join('&');
    	},
		/* push */
		push:function(room_id,message,success,fail){
			var accesstoken=sessionStorage.getItem('accesstoken');
			if (accesstoken)
			{
				kintone.proxy(
					'https://api.chatwork.com/v2/rooms/'+room_id+'/messages?'+functions.join({
						'body':encodeURIComponent(message)
					}),
					'POST',
					{
						'Authorization':'Bearer '+accesstoken
					},
					{},
					function(body,status,headers){
						var json=JSON.parse(body);
						var refresh=false;
						if ('WWW-Authenticate' in headers)
							if (headers['WWW-Authenticate'].match(/The access token expired/g)) refresh=true;
						if (refresh)
						{
							functions.token(null,sessionStorage.getItem('refreshtoken'),function(){
								functions.push(room_id,message,success,fail);
							});
						}
						else
						{
							if (json.message_id) success(json.message_id);
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
		if (!('rooms' in vars.config)) enable=false;
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
		vars.redirect=kintone.api.url('/k/', true).replace(/\.json/g,kintone.app.getId()+'/');
		vars.rooms=JSON.parse(vars.config['rooms']);
		/* authorize */
		functions.authorize(function(){
			/* get fieldinfo */
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
				vars.fieldinfos=resp.properties;
				kintone.api(kintone.api.url('/k/v1/app/settings',true),'GET',{app:kintone.app.getId()},function(resp){
					var appname=resp.name;
					kintone.events.on(events.insert,function(event){
						return new kintone.Promise(function(resolve,reject){
							var rooms=$.grep(vars.rooms,function(item,index){
								return item.insert=='1';
							});
							var counter=rooms.length;
							for (var i=0;i<rooms.length;i++)
							{
								functions.push(
									rooms[i].room,
									functions.createmessage(
										['【アプリ名】'+appname+' 【アクション】レコード追加'],
										[kintone.api.url('/k/',true).replace(/\.json/g,'')+kintone.app.getId()+'/show#record='+event.record['$id'].value+'&mode=show'],
										event.record,
										rooms[i].fields
									),
									function(id){
									counter--;
									if (counter==0) resolve(event);
									},
									function(){resolve(event);}
								);
							}
						});
					});
					kintone.events.on(events.update,function(event){
						return new kintone.Promise(function(resolve,reject){
							var rooms=$.grep(vars.rooms,function(item,index){
								return item.update=='1';
							});
							var counter=rooms.length;
							for (var i=0;i<rooms.length;i++)
							{
								functions.push(
									rooms[i].room,
									functions.createmessage(
										['【アプリ名】'+appname+' 【アクション】レコード更新'],
										[kintone.api.url('/k/',true).replace(/\.json/g,'')+kintone.app.getId()+'/show#record='+event.record['$id'].value+'&mode=show'],
										event.record,
										rooms[i].fields
									),
									function(id){
									counter--;
									if (counter==0) resolve(event);
									},
									function(){resolve(event);}
								);
							}
						});
					});
					kintone.events.on(events.delete,function(event){
						return new kintone.Promise(function(resolve,reject){
							var rooms=$.grep(vars.rooms,function(item,index){
								return item.delete=='1';
							});
							var counter=rooms.length;
							for (var i=0;i<rooms.length;i++)
							{
								functions.push(
									rooms[i].room,
									functions.createmessage(
										['【アプリ名】'+appname+' 【アクション】レコード削除'],
										[],
										event.record,
										rooms[i].fields
									),
									function(id){
									counter--;
									if (counter==0) resolve(event);
									},
									function(){resolve(event);}
								);
							}
						});
					});
					kintone.events.on(events.process,function(event){
						return new kintone.Promise(function(resolve,reject){
							var rooms=$.grep(vars.rooms,function(item,index){
								return item.process=='1';
							});
							var counter=rooms.length;
							for (var i=0;i<rooms.length;i++)
							{
								functions.push(
									rooms[i].room,
									functions.createmessage(
										[
											'【アプリ名】'+appname+' 【アクション】ステータス変更',
											'【変更前ステータス】'+event.status.value+' 【変更後ステータス】'+event.nextStatus.value
										],
										[kintone.api.url('/k/',true).replace(/\.json/g,'')+kintone.app.getId()+'/show#record='+event.record['$id'].value+'&mode=show'],
										event.record,
										rooms[i].fields
									),
									function(id){
									counter--;
									if (counter==0) resolve(event);
									},
									function(){resolve(event);}
								);
							}
						});
					});
				},function(error){
					swal({
						title:'Error!',
						text:error.message,
						type:'error'
					},function(){resolve(event);});
				});
			},function(error){});
		});
	}
})(jQuery,kintone.$PLUGIN_ID);
