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
		limit:500,
		offset:0,
		button:null,
		mailselect:null,
		progress:null,
		config:{},
		fieldinfos:{}
	};
	var events={
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
					if (vars.auth) functions.setupelements();
				});
				vars.auth=gapi.auth2.getAuthInstance().isSignedIn.get();
				if (!vars.auth) gapi.auth2.getAuthInstance().signIn();
				else functions.setupelements();
			},function(reason){
				swal('Error!',reason.result.error.message,'error');
			});
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
		/* gmail send */
		mailsend:function(record,mailto,mailcc,mailbcc,mailname,type){
			var body='';
			var subject='';
			var table=null;
			var attachment=[];
			var maildata=[];
			var boundaries={
				alternative:functions.boundary(),
				mixed:functions.boundary()
			};
			var send=function(maildata){
				if (vars.config['draft']=='0')
				{
					gapi.client.gmail.users.messages.send({
						'userId':'me',
						'resource':{'raw':window.btoa(unescape(encodeURIComponent(maildata.join('\n').trim()))).replace(/\+/g, '-').replace(/\//g, '_')}
					}).execute(function(resp){
						if ('id' in resp)
						{
							swal({
								title:'送信完了',
								text:'メールを送信しました。',
								type:'success'
							},function(){location.reload(true);});
						}
						else swal('送信エラー',resp.error.message,'error');
					});
				}
				else
				{
					gapi.client.gmail.users.drafts.create({
						'userId':'me',
						'resource':{'message':{'raw':window.btoa(unescape(encodeURIComponent(maildata.join('\n').trim()))).replace(/\+/g, '-').replace(/\//g, '_')}}
					}).execute(function(resp){
						if ('id' in resp)
						{
							swal({
								title:'送信完了',
								text:'メールを下書き保存しました。',
								type:'success'
							},function(){location.reload(true);});
						}
						else swal('送信エラー',resp.error.message,'error');
					});
				}
			};
			if (vars.auth)
			{
				table=record[vars.fieldinfos[vars.config['media']].tablecode];
				if (table.value.length>0)
				{
					var keep=table.value[0].value[vars.config['media']].value;
					for (var i=0;i<table.value.length;i++)
						if (keep!=table.value[i].value[vars.config['media']].value)
						{
							swal('送信エラー','テーブル内に異なる媒体があります。','error');
							return;
						}
				}
				else swal('送信エラー','テーブル内にデータがありません。','error');
				switch (type)
				{
					case 1:
						subject='【申込書送付依頼】';
						body='';
						body+=mailname.join(',')+'\n\n';
						body+='いつもお世話になっております、プライムクロスの入稿センターでございます。\n';
						body+='下記、案件につきまして、お申込書の送付をお願い致します。\n';
						body+='－－－－－－－－－－－－－－－－－－－－－－－－－－－－\n';
						body+='・広告主：'+record[vars.config['customer']].value+'\n';
						body+='・案件名：'+record[vars.config['subject']].value+'\n';
						body+='・代理店名：株式会社プライムクロス\n';
						body+='・営業担当者：'+record[vars.config['charger']].value[0].name+'\n';
						body+='－－－－－－－－－－－－－－－－－－－－－－－－－－－－\n';
						for (var i=0;i<table.value.length;i++)
						{
							body+='・メニュー：'+table.value[i].value[vars.config['menu']].value+'\n';
							body+='・期間：'+table.value[i].value[vars.config['datefrom']].value+'\n';
							body+='・申込金額：'+String(table.value[i].value[vars.config['price']].value).replace(/(\d)(?=(\d\d\d)+(?!\d))/g,'$1,')+'円\n';
							body+='－－－－－－－－－－－－－－－－－－－－－－－－－－－－\n';
						}
						break;
					case 2:
						subject='【申込】';
						body='';
						body+='*************************************************************************\n';
						body+='株式会社プライムクロスより、正式発注のご連絡を致します。\n';
						body+='*************************************************************************\n';
						body+=mailname.join(',')+'\n\n';
						body+='いつもお世話になっております、プライムクロスの入稿センターでございます。\n';
						body+='添付致しました内容にて、正式発注をさせていただきます。\n';
						body+='内容をご確認の上、受領の旨を本メール全員返信にて\n';
						body+='お戻し頂けますようお願い致します。\n';
						body+='■プライムクロス注文番号：\n';
						body+='－－－－－－－－－－－－－－－－－－－－－－－－－－－－\n';
						for (var i=0;i<table.value.length;i++) body+=table.value[i].value[vars.config['orderno']].value+'\n';
						body+='－－－－－－－－－－－－－－－－－－－－－－－－－－－－\n';
						if (vars.config['attachment']) Array.prototype.push.apply(attachment,record[vars.config['attachment']].value);
						break;
					case 3:
						subject='【訂正】【申込】';
						body='';
						body+=record[vars.config['revisionbody']].value+'\n';
						body+='*************************************************************************\n';
						body+='株式会社プライムクロスより、正式発注のご連絡を致します。\n';
						body+='*************************************************************************\n';
						body+=mailname.join(',')+'\n\n';
						body+='いつもお世話になっております、プライムクロスの入稿センターでございます。\n';
						body+='添付致しました内容にて、正式発注をさせていただきます。\n';
						body+='内容をご確認の上、受領の旨を本メール全員返信にて\n';
						body+='お戻し頂けますようお願い致します。\n';
						body+='■プライムクロス注文番号：\n';
						body+='－－－－－－－－－－－－－－－－－－－－－－－－－－－－\n';
						for (var i=0;i<table.value.length;i++) body+=table.value[i].value[vars.config['orderno']].value+'\n';
						body+='－－－－－－－－－－－－－－－－－－－－－－－－－－－－\n';
						if (vars.config['attachment']) Array.prototype.push.apply(attachment,record[vars.config['attachment']].value);
						break;
				}
				if (mailto.length>0)
				{
					subject+=record[vars.config['customer']].value+'/';
					subject+=record[vars.config['subject']].value+'/';
					subject+=table.value[0].value[vars.config['media']].value+'/';
					subject+=table.value[0].value[vars.config['menu']].value;
					subject+=(table.value.length>1)?'（他）/':'/';
					subject+=table.value[0].value[vars.config['datefrom']].value+'～';
					subject+=table.value[0].value[vars.config['dateto']].value;
					subject+=(table.value.length>1)?'（他）':'';
					maildata.push('To: '+mailto.join(','));
					if (mailcc.length!=0) maildata.push('CC: '+mailcc.join(','));
					if (mailbcc.length!=0) maildata.push('BCC: '+mailbcc.join(','));
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
				else swal('送信エラー','宛先を選択して下さい。','error');
			}
		},
		/* load app datas */
		loaddatas:function(records,callback){
			var sort='';
			var body={
				app:vars.config['mailtoapp'],
				query:''
			};
			sort=' order by $id asc limit '+vars.limit.toString()+' offset '+vars.offset.toString();
			body.query+=sort;
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				Array.prototype.push.apply(records,resp.records);
				vars.offset+=vars.limit;
				if (resp.records.length==vars.limit) functions.loaddatas(records,callback);
				else callback(records);
			},function(error){
				swal('Error!',error.message,'error');
			});
		},
		setupelements:function(callback){
			/* get fields of app */
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
				vars.fieldinfos=$.fieldparallelize(resp.properties);
				if ($('.custom-elements-gmail').size()) $('.custom-elements-gmail').remove();
				vars.button=$('<button type="button" class="custom-elements-gmail">')
				.css({
					'background-color':'#f7f9fa',
					'border':'1px solid #e3e7e8',
					'box-shadow':'1px 1px 1px #fff inset',
					'box-sizing':'border-box',
					'color':'#3498db',
					'cursor':'pointer',
					'display':'inline-block',
					'font-size':'14px',
					'height':'40px',
					'line-height':'40px',
					'margin':'3px 6px 0px 0px',
					'outline':'none',
					'padding':'0px 16px',
					'position':'relative',
					'text-align':'center',
					'vertical-align':'top',
					'white-space':'nowrap'
				});
				/* get fields of app */
				kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:vars.config['mailtoapp']},function(resp){
					vars.offset=0;
					functions.loaddatas([],function(records){
						var fields={};
						fields[vars.config['mailtomedia']]=resp.properties[vars.config['mailtomedia']];
						fields[vars.config['mailtosegment']]=resp.properties[vars.config['mailtosegment']];
						fields[vars.config['mailtoarea']]=resp.properties[vars.config['mailtoarea']];
						vars.mailselect=$('body').mailselect({
							datasource:records,
							config:vars.config,
							fields:fields
						});
						$('.gaia-argoui-app-toolbar-statusmenu')
						.append(
							vars.button.clone(true).text('申込書送付依頼')
							.on('click',function(e){
								if (!vars.auth) return;
								swal({
									title:'確認',
									text:'申込書送付依頼メールを送信します。宜しいですか？',
									type:'info',
									showCancelButton:true,
									cancelButtonText:'Cancel'
								},
								function(){
									vars.mailselect.show({
										buttons:{
											ok:function(selectionto,selectioncc,selectionbcc){
												var mailto=[];
												var mailcc=[];
												var mailbcc=[];
												var mailname=[];
												for (var i=0;i<selectionto.length;i++)
												{
													mailto.push(selectionto[i].mail);
													mailname.push(selectionto[i].name);
												}
												for (var i=0;i<selectioncc.length;i++) mailcc.push(selectioncc[i].mail);
												for (var i=0;i<selectionbcc.length;i++) mailbcc.push(selectionbcc[i].mail);
												functions.mailsend(kintone.app.record.get().record,mailto,mailcc,mailbcc,mailname,1);
												vars.mailselect.hide();
											},
											cancel:function(){vars.mailselect.hide();}
										}
									});
								});
							})
						)
						.append(
							vars.button.clone(true).text('申込書送付')
							.on('click',function(e){
								if (!vars.auth) return;
								swal({
									title:'確認',
									text:'申込書送付メールを送信します。宜しいですか？',
									type:'info',
									showCancelButton:true,
									cancelButtonText:'Cancel'
								},
								function(){
									vars.mailselect.show({
										buttons:{
											ok:function(selectionto,selectioncc,selectionbcc){
												var mailto=[];
												var mailcc=[];
												var mailbcc=[];
												var mailname=[];
												for (var i=0;i<selectionto.length;i++)
												{
													mailto.push(selectionto[i].mail);
													mailname.push(selectionto[i].name);
												}
												for (var i=0;i<selectioncc.length;i++) mailcc.push(selectioncc[i].mail);
												for (var i=0;i<selectionbcc.length;i++) mailbcc.push(selectionbcc[i].mail);
												functions.mailsend(kintone.app.record.get().record,mailto,mailcc,mailbcc,mailname,2);
												vars.mailselect.hide();
											},
											cancel:function(){vars.mailselect.hide();}
										}
									});
								});
							})
						)
						.append(
							vars.button.clone(true).text('訂正申込')
							.on('click',function(e){
								if (!vars.auth) return;
								swal({
									title:'確認',
									text:'訂正申込メールを送信します。宜しいですか？',
									type:'info',
									showCancelButton:true,
									cancelButtonText:'Cancel'
								},
								function(){
									vars.mailselect.show({
										buttons:{
											ok:function(selectionto,selectioncc,selectionbcc){
												var mailto=[];
												var mailcc=[];
												var mailbcc=[];
												var mailname=[];
												for (var i=0;i<selectionto.length;i++)
												{
													mailto.push(selectionto[i].mail);
													mailname.push(selectionto[i].name);
												}
												for (var i=0;i<selectioncc.length;i++) mailcc.push(selectioncc[i].mail);
												for (var i=0;i<selectionbcc.length;i++) mailbcc.push(selectionbcc[i].mail);
												functions.mailsend(kintone.app.record.get().record,mailto,mailcc,mailbcc,mailname,3);
												vars.mailselect.hide();
											},
											cancel:function(){vars.mailselect.hide();}
										}
									});
								});
							})
						)
						.append(
							$('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/link.svg" class="auth-gmail custom-elements-gmail" alt="認証" title="認証" />')
							.css({
								'cursor':'pointer',
								'display':'inline-block',
								'height':'40px',
								'margin':'3px 12px 0px 0px',
								'vertical-align':'top',
								'width':'40px'
							})
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
						$('.auth-gmail').attr('src','https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/unlink.svg');
					});
				},function(error){
					swal('Error!',error.message,'error');
				});
			},function(error){
				swal('Error!',error.message,'error');
			});
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		if (!('mailtoapp' in vars.config)) return event;
		/* initialize valiable */
		gapi.load('client:auth2',functions.apiloaded);
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
