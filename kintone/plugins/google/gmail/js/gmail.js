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
		progress:null,
		records:[],
		config:{}
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
				apiKey:vars.config['apikey'],
				scope:'https://www.googleapis.com/auth/gmail.compose',
			}).then(function(){
				vars.auth=true;;
			},function(reason){
				swal('Error!',reason.result.error.message,'error');
			});
		},
		/* gmail send */
		mailsend:function(record,success,fail){
			if (vars.auth)
			{
				var subject=record[vars.config['subject'].value];
				var body=record[vars.config['body'].value];
				var mimeData=[
					'To: '+record[vars.config['mailto'].value],
					"Subject: =?utf-8?B?"+window.btoa(unescape(encodeURIComponent(subject)))+"?=",
					"MIME-Version: 1.0",
					"Content-Type: text/plain; charset=UTF-8",
					"Content-Transfer-Encoding: 7bit",
					"",
					body
				].join("\n").trim();
				gapi.client.gmail.users.messages.send({
					'userId':'me',
					'resource':{'raw':window.btoa(unescape(encodeURIComponent(mimeData))).replace(/\+/g, '-').replace(/\//g, '_')}
				}).execute(function(result){
					console.log(result);
				});
			}
			else
			{
				if (fail) fail();
			}
		},
		/* load app datas */
		loaddatas:function(callback){
			var sort='';
			var body={
				app:kintone.app.getId(),
				query:kintone.app.getQueryCondition()
			};
			sort=' order by $id asc limit '+vars.limit.toString()+' offset '+vars.offset.toString();
			body.query+=sort;
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				Array.prototype.push.apply(vars.records,resp.records);
				vars.offset+=vars.limit;
				if (resp.records.length==vars.limit) functions.loaddatas(callback);
				else callback();
			},function(error){
				vars.progress.hide();
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
		/* clear elements */
		if ($('.custom-elements-gmail').size()) $('.custom-elements-gmail').remove();
		else gapi.load('client',functions.apiloaded);
		/* append elements */
		kintone.app.getHeaderMenuSpaceElement().appendChild(
			$('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/mail.svg" class="settingbutton" alt="メール送信" title="メール送信" />').css({
				'cursor':'pointer',
				'display':'inline-block',
				'height':'48px',
				'margin':'0px 12px',
				'vertical-align':'top',
				'width':'48px'
			})
			.on('click',function(e){
				swal({
					title:'確認',
					text:'表示中の一覧の条件に該当するすべてのレコードを送信します。宜しいですか？',
					type:'info',
					showCancelButton:true,
					cancelButtonText:'Cancel'
				},
				function(){
					vars.offset=0;
					vars.records=[];
					vars.progress.find('.message').text('一覧データ取得中');
					vars.progress.find('.progressbar').find('.progresscell').width(0);
					vars.progress.show();
					functions.loaddatas(function(){
						var error=false;
						var counter=0;
						var progress=function(){
							counter++;
							if (counter<vars.records.length)
							{
								vars.progress.find('.progressbar').find('.progresscell').width(vars.progress.find('.progressbar').innerWidth()*(counter/vars.records.length));
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
						if (vars.records.length==0)
						{
							vars.progress.hide();
							setTimeout(function(){
								swal('Error!','レコードがありません。','error');
							},500);
							return;
						}
						else vars.progress.find('.message').text('メール送信中');
						for (var i=0;i<vars.records.length;i++)
						{
							if (error) break;
							functions.mailsend(vars.records[i],function(){progress();},function(){error=true;});
						}
					});
				});
			})[0]
		);
		vars.progress=$('<div id="progress">').append($('<div class="message">')).append($('<div class="progressbar">').append($('<div class="progresscell">')));
		$('body').append(vars.progress);
		return event;
	});
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		/* clear elements */
		if ($('.custom-elements-gmail').size()) $('.custom-elements-gmail').remove();
		else gapi.load('client',functions.apiloaded);
		/* append elements */
		kintone.app.getHeaderMenuSpaceElement().appendChild(
			$('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/mail.svg" class="settingbutton" alt="メール送信" title="メール送信" />').css({
				'cursor':'pointer',
				'display':'inline-block',
				'height':'48px',
				'margin':'0px 12px',
				'vertical-align':'top',
				'width':'48px'
			})
			.on('click',function(e){
				swal({
					title:'確認',
					text:'メールを送信します。宜しいですか？',
					type:'info',
					showCancelButton:true,
					cancelButtonText:'Cancel'
				},
				function(){
					functions.mailsend(kintone.app.record.get(),function(){
						swal('送信完了','メールを送信しました。','success');
					});
				});
			})[0]
		);
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
