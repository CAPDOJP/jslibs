/*
*--------------------------------------------------------------------
* jQuery-Plugin "gmail"
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
		auth:false,
		list:false,
		limit:500,
		offset:0,
		progress:null,
		templates:[],
		config:{},
		history:{
			page:1,
			target:'',
			token:'',
			container:null,
			next:null,
			prev:null,
			table:null,
			mails:[]
		}
	};
	var events={
		lists:[
			'app.record.index.show'
		],
		show:[
			'app.record.detail.show'
		]
	};
	var functions={
		/* google api loaded */
		apiloaded:function(){
			gapi.client.init({
				client_id:vars.config['client_id'],
				discoveryDocs:['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'],
				scope:'https://www.googleapis.com/auth/gmail.modify',
			}).then(function(){
				gapi.auth2.getAuthInstance().isSignedIn.listen(function(isSignedIn){
					vars.auth=isSignedIn;
					if (vars.auth)
					{
						functions.setupelements(function(){
							functions.mailget(true);
							$('.auth-gmail').attr('src','https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/unlink.svg');
						});
					}
				});
				vars.auth=gapi.auth2.getAuthInstance().isSignedIn.get();
				if (!vars.auth) gapi.auth2.getAuthInstance().signIn();
				else
				{
					functions.setupelements(function(){
						functions.mailget(true);
						$('.auth-gmail').attr('src','https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/unlink.svg');
					});
				}
			},function(reason){
				swal('Error!',reason.result.error.message,'error');
			});
		},
		/* assign values */
		assign:function(target,record){
			for (var key in record) target=target.replace(new RegExp('%'+key+'%','g'),record[key].value);
			return target;
		},
		/* create boundary */
		boundary:function(){
		    var chars="-_1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
		    var res='';
		    for (var i=0;i<30;i++) res+=chars.charAt(Math.floor(Math.random()*chars.length));
		    return res;
		},
		/* download file */
		download:function(fileKey){
			return new Promise(function(resolve,reject)
			{
				var url=kintone.api.url('/k/v1/file',true)+'?fileKey='+fileKey;
				var xhr=new XMLHttpRequest();
				xhr.open('GET',url);
				xhr.setRequestHeader('X-Requested-With','XMLHttpRequest');
				xhr.responseType='blob';
				xhr.onload=function(){
					if (xhr.status===200) resolve(xhr.response);
					else reject(Error('File download error:' + xhr.statusText));
				};
				xhr.onerror=function(){
					reject(Error('There was a network error.'));
				};
				xhr.send();
			});
		},
		/* gmail get */
		mailget:function(init){
			var params={};
			var get=function(params){
				gapi.client.gmail.users.messages.list(params).execute(function(resp){
					if (resp.resultSizeEstimate>0)
					{
						vars.history.mails.push(resp.messages);
						vars.history.token=(resp.nextPageToken)?resp.nextPageToken:'';
						functions.maillist(vars.history.mails[vars.history.page-1]);
					}
					else vars.history.container.hide();
				});
			};
			if (!vars.list)
			{
				if (init)
				{
					params['userId']='me';
					params['q']='{From:'+vars.history.target+' To:'+vars.history.target+'} {label:inbox label:sent}';
					get(params);
				}
				else
				{
					if (vars.history.mails.length<vars.history.page)
					{
						params['userId']='me';
						params['pageToken']=vars.history.token;
						get(params);
					}
					else functions.maillist(vars.history.mails[vars.history.page-1]);
				}
			}
		},
		maillist:function(mails){
			/* clear rows */
			vars.history.table.rows.remove();
			/* create rows */
			for (var i=0;i<mails.length;i++)
			{
				vars.history.table.addrow();
				(function(id,row){
					gapi.client.request({
						'path':'gmail/v1/users/me/messages/'+id,
						'method':'GET',
						'params':{'format':'full'}
					}).execute(function(resp){
						var date=$.grep(resp.payload.headers,function(item,index){
							return item.name.toLowerCase()=='date';
						});
						var subject=$.grep(resp.payload.headers,function(item,index){
							return item.name.toLowerCase()=='subject';
						});
						var label=(resp.labelIds.indexOf('INBOX')<0)?'sent':'inbox';
						row.find('td').eq(0).find('span').text((label=='inbox')?'受信':'送信');
						row.find('td').eq(1).find('span').text((date.length!=0)?new Date(date[0].value).format('Y-m-d H:i:s'):'');
						row.find('td').eq(2).find('span').text((subject.length!=0)?subject[0].value:'');
						row.find('td').eq(3).find('img').on('click',function(){
							window.open('https://mail.google.com/mail/u/0/#'+label+'/'+resp.id);
						});
					});
				})(mails[i].id,vars.history.table.rows.last());
			}
			if (vars.history.page==1) vars.history.prev.hide();
			else vars.history.prev.show();
			if (vars.history.page==vars.history.mails.length)
			{
				if (vars.history.token) vars.history.next.show();
				else vars.history.next.hide();
			}
			else vars.history.next.show();
			/* show histories */
			vars.history.container.show();
		},
		/* gmail send */
		mailsend:function(record,success,fail){
			var callback=function(resp){
				if ('id' in resp) success();
				else
				{
					swal({
						title:'送信エラー',
						text:resp.error.message,
						type:'error'
					},function(){if (fail) fail();});
				}
			};
			var send=function(maildata){
				if (vars.config['draft']=='0')
				{
					gapi.client.gmail.users.messages.send({
						'userId':'me',
						'resource':{'raw':window.btoa(unescape(encodeURIComponent(maildata.join('\n').trim()))).replace(/\+/g, '-').replace(/\//g, '_')}
					}).execute(function(resp){callback(resp);});
				}
				else
				{
					gapi.client.gmail.users.drafts.create({
						'userId':'me',
						'resource':{'message':{'raw':window.btoa(unescape(encodeURIComponent(maildata.join('\n').trim()))).replace(/\+/g, '-').replace(/\//g, '_')}}
					}).execute(function(resp){callback(resp);});
				}
			};
			if (vars.auth)
			{
				var templates=$.grep(vars.templates,function(item,index){
					return item['$id'].value==$('#template-gmail option:selected').val();
				});
				if (templates.length!=0)
				{
					if (record[vars.config['mailto']].value)
					{
						var attachment=[];
						var subject=functions.assign(templates[0][vars.config['templatesubject']].value,record);
						var body=functions.assign(templates[0][vars.config['templatebody']].value,record);
						var maildata=[];
						var boundaries={
							alternative:functions.boundary(),
							mixed:functions.boundary()
						};
						if (vars.config['templateattachment']) Array.prototype.push.apply(attachment,templates[0][vars.config['templateattachment']].value);
						if (vars.config['attachment']) Array.prototype.push.apply(attachment,record[vars.config['attachment']].value);
						maildata.push('To: '+record[vars.config['mailto']].value);
						if (vars.config['mailcc'])
							if (record[vars.config['mailcc']].value)
								maildata.push('CC: '+record[vars.config['mailcc']].value);
						if (vars.config['mailbcc'])
							if (record[vars.config['mailbcc']].value)
								maildata.push('BCC: '+record[vars.config['mailbcc']].value);
						maildata.push('Subject: =?utf-8?B?'+window.btoa(unescape(encodeURIComponent(subject)))+'?=');
						maildata.push('MIME-Version: 1.0');
						if (attachment.length!=0)
						{
							maildata.push('Content-Type: multipart/mixed; boundary="'+boundaries.mixed+'"');
							maildata.push('');
							maildata.push('--'+boundaries.mixed);
							maildata.push('Content-Type: multipart/alternative; boundary="'+boundaries.alternative+'"');
							maildata.push('');
							maildata.push('--'+boundaries.alternative);
						}
						maildata.push('Content-Type: text/html;charset=iso-8859-1');
						maildata.push('Content-Transfer-Encoding: 7bit');
						maildata.push('');
						maildata.push('<html><body>'+body.replace(/\r/g,'').replace(/\n/g,'<br>')+'</body></html>');
						if (attachment.length!=0)
						{
							maildata.push('');
							maildata.push('--'+boundaries.alternative+'--');
							var counter=0;
							for (var i=0;i<attachment.length;i++)
							{
								(function(file){
									functions.download(file.fileKey).then(function(blob){
										var reader=new FileReader();
										reader.onabort=function(event){error();};
										reader.onerror=function(event){error();};
										reader.onload=function(event){
											maildata.push('');
											maildata.push('--'+boundaries.mixed);
											maildata.push('Content-Type: '+file.contentType+'; name="'+file.name+'"');
											maildata.push('Content-Transfer-Encoding: base64');
											maildata.push('Content-Disposition: attachment; filename="'+file.name+'"');
											maildata.push('');
											maildata.push(event.target.result.replace(/^.+,/,''));
											counter++;
											if (counter==attachment.length)
											{
												maildata.push('');
												maildata.push('--'+boundaries.mixed+'--');
												send(maildata);
											}
										}
										reader.readAsDataURL(blob);
									});
								})(attachment[i]);
							}
						}
						else send(maildata);
					}
					else success();
				}
				else
				{
					swal({
						title:'エラー',
						text:'テンプレートを選択して下さい。',
						type:'error'
					},function(){if (fail) fail();});
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
			if ($('.custom-elements-gmail').size()) $('.custom-elements-gmail').remove();
			vars.offset=0;
			functions.loaddatas(vars.config['templateapp'],'',[],function(records){
				vars.templates=records;
				if (vars.list)
				{
					kintone.app.getHeaderMenuSpaceElement().appendChild(
						$('<div class="kintoneplugin-select-outer custom-elements-gmail">')
						.append(
							$('<div class="kintoneplugin-select">')
							.append($('<select id="template-gmail">'))
						)[0]
					);
					kintone.app.getHeaderMenuSpaceElement().appendChild(
						$('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/mail.svg" class="button-gmail custom-elements-gmail" alt="メール送信" title="メール送信" />')
						.on('click',function(e){
							if (!vars.auth) return;
							swal({
								title:'確認',
								text:'表示中の一覧の条件に該当するすべてのレコードを送信します。宜しいですか？',
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
												title:'送信完了',
												text:'メールを送信しました。',
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
									else vars.progress.find('.message').text('メール送信中');
									for (var i=0;i<records.length;i++)
									{
										if (error) break;
										functions.mailsend(records[i],function(){progress();},function(){error=true;});
									}
								});
							});
						})[0]
					);
					kintone.app.getHeaderMenuSpaceElement().appendChild(
						$('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/link.svg" class="auth-gmail button-gmail custom-elements-gmail" alt="認証" title="認証" />')
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
					for(var i=0;i<vars.templates.length;i++) $('#template-gmail').append($('<option>').html('&nbsp;'+vars.templates[i][vars.config['templatename']].value+'&nbsp;').val(vars.templates[i]['$id'].value));
				}
				else
				{
					$('.gaia-argoui-app-toolbar-statusmenu')
					.append(
						$('<div class="kintoneplugin-select-outer custom-elements-gmail">')
						.append(
							$('<div class="kintoneplugin-select">')
							.append($('<select id="template-gmail">'))
						)
					)
					.append(
						$('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/mail.svg" class="button-gmail custom-elements-gmail" alt="メール送信" title="メール送信" />')
						.on('click',function(e){
							if (!vars.auth) return;
							swal({
								title:'確認',
								text:'メールを送信します。宜しいですか？',
								type:'info',
								showCancelButton:true,
								cancelButtonText:'Cancel'
							},
							function(){
								functions.mailsend(kintone.app.record.get().record,function(){
									swal({
										title:'送信完了',
										text:'メールを送信しました。',
										type:'success'
									},function(){location.reload(true);});
								});
							});
						})
					)
					.append(
						$('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/link.svg" class="auth-gmail button-gmail custom-elements-gmail" alt="認証" title="認証" />')
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
					for(var i=0;i<vars.templates.length;i++) $('#template-gmail').append($('<option>').html('&nbsp;'+vars.templates[i][vars.config['templatename']].value+'&nbsp;').val(vars.templates[i]['$id'].value));
				}
				if (callback) callback();
			});
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.lists,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		if (!('mailto' in vars.config)) return event;
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
		if (!('mailto' in vars.config)) return event;
		/* initialize valiable */
		vars.list=false;
		gapi.load('client:auth2',functions.apiloaded);
		/* create history */
		vars.history={
			page:1,
			target:event.record[vars.config['mailto']].value,
			token:'',
			container:null,
			next:null,
			prev:null,
			table:null,
			mails:[]
		};
		if (vars.config['histories'])
		{
			var table=$('<table class="table-gmail">').addClass('subtable-gaia').addClass('history-gmail');
			table.append($('<thead>').addClass('subtable-header-gaia')
				.append($('<tr>')
					.append($('<th>').addClass('subtable-label-gaia').append($('<span>').text('')))
					.append($('<th>').addClass('subtable-label-gaia').append($('<span>').text('日時')))
					.append($('<th>').addClass('subtable-label-gaia').append($('<span>').text('件名')))
					.append($('<th>').addClass('subtable-label-gaia').append($('<span>').text('')))
				)
			);
			table.append($('<tbody>')
				.append($('<tr>')
					.append($('<td>').append($('<span>')))
					.append($('<td>').append($('<span>')))
					.append($('<td>').append($('<span>')))
					.append($('<td>').append($('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/mail.svg" />')))
				)
			);
			vars.history.container=$(kintone.app.record.getSpaceElement(vars.config['histories'])).empty();
			vars.history.table=table.adjustabletable({});
			vars.history.next=$('<a href="javascript:void(0)" class="feed-gmail">')
			.text('次へ').on('click',function(){
				vars.history.page++;
				functions.mailget(false);
			});
			vars.history.prev=$('<a href="javascript:void(0)" class="feed-gmail">')
			.text('前へ').on('click',function(){
				vars.history.page--;
				functions.mailget(false);
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
		}
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
