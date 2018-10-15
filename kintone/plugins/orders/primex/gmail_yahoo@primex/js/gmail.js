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
		previewform:null,
		progress:null,
		config:{},
		fieldinfos:{},
		tablefields:{}
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
				if ('details' in reason) swal('Error!',reason.details,'error');
				else swal('Error!',reason.result.error.message,'error');
			});
		},
		/* gmail send */
		mailsend:function(record,type){
		},
		/* mail transfer */
		mailtransfer:function(record,type){
			var record=kintone.app.record.get();
			var tablecode=vars.fieldinfos[vars.config['transfer_id']].tablecode;
			var zapiermail='';
			var parts={};
			var transfer_id=[];
			var transfer_io=[];
			var transfer_item=[];
			var transfer_client=[];
			var transfer_price=[];
			var transfer_number=[];
			var transfer_fromdate=[];
			var transfer_todate=[];
			var transfer_profile=[];
			var transfer_promotion=[];
			var body={
				app:kintone.app.getId(),
				id:record.record['$id'].value,
				record:{}
			};
			zapiermail=record.record[vars.config['zapiermail']].value;
			if (!zapiermail)
			{
				swal('Error!','枠確保メールがありません。','error');
				return;
			}
			zapiermail=zapiermail.replace(/[ 　]*[:：]{1}[ 　]*/g,'：').replace(/プロファイル詳細.*：/g,'プロファイル詳細：');
			transfer_id=zapiermail.match(/\nID番号[^\n]+\n/g);
			transfer_io=zapiermail.match(/\nIO番号[^\n]+\n/g);
			transfer_item=zapiermail.match(/\n商品[^\n]+\n/g);
			transfer_client=zapiermail.match(/\nクライアント[^\n]+\n/g);
			transfer_price=zapiermail.match(/\n価格[^\n]+\n/g);
			transfer_number=zapiermail.match(/\n掲載数[^\n]+\n/g);
			transfer_fromdate=zapiermail.match(/\n掲載開始日[^\n]+\n/g);
			transfer_todate=zapiermail.match(/\n掲載終了日[^\n]+\n/g);
			transfer_profile=(zapiermail.replace(/\r?\n/g,'<br>').replace(/(プロモーション|≪枠押え|-----)/g,'EOF')+'EOF').match(/プロファイル詳細：(?:(?!EOF).)*EOF/g);
			transfer_promotion=zapiermail.match(/\nプロモーション[^\n]+\n/g);
			for (var i=0;i<transfer_id.length;i++)
			{
				var key='';
				var part={
					transfer_id:'',
					transfer_io:'',
					transfer_item:'',
					transfer_client:'',
					transfer_price:'',
					transfer_number:'',
					transfer_fromdate:'',
					transfer_todate:'',
					transfer_profile:'',
					transfer_promotion:''
				};
				if (i>transfer_io.length-1)
				{
					swal('Error!','枠確保メール内のID番号とIO番号の記載数が一致しません。','error');
					return;
				}
				key=transfer_id[i]+':'+transfer_io[i];
				if (!(key in parts))
				{
					if (i<transfer_id.length) part.transfer_id=transfer_id[i].replace(/^\nID番号：[ 　]*/g,'').replace(/\n$/g,'');
					if (i<transfer_io.length) part.transfer_io=transfer_io[i].replace(/^\nIO番号：[ 　]*/g,'').replace(/\n$/g,'');
					if (i<transfer_item.length) part.transfer_item=transfer_item[i].replace(/^\n商品：[ 　]*/g,'').replace(/\n$/g,'');
					if (i<transfer_client.length) part.transfer_client=transfer_client[i].replace(/^\nクライアント：[ 　]*/g,'').replace(/\n$/g,'');
					if (i<transfer_price.length) part.transfer_price=transfer_price[i].replace(/^\n価格：[ 　]*/g,'').replace(/\n$/g,'');
					if (i<transfer_number.length) part.transfer_number=transfer_number[i].replace(/^\n掲載数：[ 　]*/g,'').replace(/\n$/g,'');
					if (i<transfer_fromdate.length) part.transfer_fromdate=transfer_fromdate[i].replace(/^\n掲載開始日：[ 　]*/g,'').replace(/\n$/g,'').replace(/\//g,'-');
					if (i<transfer_todate.length) part.transfer_todate=transfer_todate[i].replace(/^\n掲載終了日：[ 　]*/g,'').replace(/\n$/g,'').replace(/\//g,'-');
					if (i<transfer_profile.length) part.transfer_profile=transfer_profile[i].replace(/^プロファイル詳細：[ 　]*/g,'').replace(/^<br>/g,'').replace(/<br>/g,'\n').replace(/[ 　\n]*EOF$/g,'');
					if (i<transfer_promotion.length) part.transfer_promotion=transfer_promotion[i].replace(/^\nプロモーション：[ 　]*/g,'').replace(/\n$/g,'');
					parts[key]=part;
				}
			}
			$.each(record.record,function(key,values){
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
			for (var key in parts)
			{
				var isempty=false;
				var row={};
				if (body.record[tablecode].value.length==1)
					if ($.isemptyrow(body.record[tablecode].value[0].value,vars.tablefields)) isempty=true;
				row=$.createrow(vars.tablefields);
				row.value[vars.config['transfer_id']].value=parts[key].transfer_id;
				row.value[vars.config['transfer_io']].value=parts[key].transfer_io;
				row.value[vars.config['transfer_item']].value=parts[key].transfer_item;
				row.value[vars.config['transfer_client']].value=parts[key].transfer_client;
				row.value[vars.config['transfer_price']].value=parts[key].transfer_price;
				row.value[vars.config['transfer_number']].value=parts[key].transfer_number;
				row.value[vars.config['transfer_fromdate']].value=parts[key].transfer_fromdate;
				row.value[vars.config['transfer_todate']].value=parts[key].transfer_todate;
				row.value[vars.config['transfer_profile']].value=parts[key].transfer_profile;
				row.value[vars.config['transfer_promotion']].value=parts[key].transfer_promotion;
				if (isempty) body.record[tablecode].value=[row];
				else body.record[tablecode].value.push(row);
			}
			kintone.api(kintone.api.url('/k/v1/record',true),'PUT',body,function(resp){
				location.reload(true);
			},function(error){
				swal('Error!',error.message,'error');
			});
		},
		setupelements:function(callback){
			/* get groups of login user */
			kintone.api(kintone.api.url('/v1/user/groups',true),'GET',{code:kintone.getLoginUser().code},function(resp){
				if ($.grep(resp.groups,function(item,index){return item.code==vars.config['permitgroup']}).length!=0)
				{
					/* get fields of app */
					kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
						vars.fieldinfos=$.fieldparallelize(resp.properties);
						vars.tablefields=resp.properties[vars.fieldinfos[vars.config['transfer_id']].tablecode].fields;
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
						vars.previewform=$('body').previewform({
							fields:[
								{
									code:'mailto',
									disabled:true,
									label:'To',
									type:'SINGLE_LINE_TEXT'
								},
								{
									code:'mailcc',
									disabled:true,
									label:'Cc',
									type:'SINGLE_LINE_TEXT'
								},
								{
									code:'mailbcc',
									disabled:true,
									label:'Bcc',
									type:'SINGLE_LINE_TEXT'
								},
								{
									code:'subject',
									disabled:false,
									label:'件名',
									type:'SINGLE_LINE_TEXT'
								},
								{
									code:'body',
									disabled:false,
									label:'本文',
									type:'MULTI_LINE_TEXT'
								}
							]
						});
						$('.gaia-argoui-app-toolbar-statusmenu')
						.append(
							vars.button.clone(true).text('枠確保メールからの取込')
							.on('click',function(e){
								if (!vars.auth) return;
								functions.mailtransfer();
							})
						)
						.append(
							vars.button.clone(true).text('申込メール送付')
							.on('click',function(e){
								if (!vars.auth) return;
								functions.mailsend(kintone.app.record.get().record,1);
							})
						)
						.append(
							vars.button.clone(true).text('新規メール送付')
							.on('click',function(e){
								if (!vars.auth) return;
								functions.mailsend(kintone.app.record.get().record,2);
							})
						)
						.append(
							vars.button.clone(true).text('申込新規メール送付')
							.on('click',function(e){
								if (!vars.auth) return;
								functions.mailsend(kintone.app.record.get().record,3);
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
					},function(error){
						swal('Error!',error.message,'error');
					});
				}
			},function(error){});
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		if (!('zapiermail' in vars.config)) return event;
		/* initialize valiable */
		gapi.load('client:auth2',functions.apiloaded);
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
