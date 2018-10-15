/*
*--------------------------------------------------------------------
* jQuery-Plugin "weeklylecture"
* Version: 1.0
* Copyright (c) 2017 TIS
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
		limit:500,
		loaded:false,
		offset:0,
		config:{},
		records:[]
	};
	var events={
		lists:[
			'app.record.index.show'
		]
	};
	var functions={
		/* reload datas */
		loaddatas:function(callback){
			var body={
				app:kintone.app.getId(),
				query:kintone.app.getQuery().replace(/ limit [0-9]+/g,'').replace(/ offset [0-9]+/g,'')
			};
			body.query+=' limit '+vars.limit.toString()+' offset '+vars.offset.toString();
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				Array.prototype.push.apply(vars.records,resp.records);
				vars.offset+=vars.limit;
				if (resp.records.length==vars.limit) functions.loaddatas(callback);
				else callback();
			},function(error){});
		},
		assign:function(target,record){
			for (var key in record) target=target.replace(new RegExp('%'+key+'%','g'),record[key].value);
			return target;
		},
		assignhtml:function(target,record){
			if(target.nodeType==3) target.nodeValue=functions.assign(target.nodeValue,record);
			else for(var i=0;i<target.childNodes.length;i++) functions.assignhtml(target.childNodes[i],record);
		},
		htmltotext:function(target){
			var display='';
			var res='';
			if(target.nodeType==3) res=target.nodeValue.replace(/\s+/g,' ');
			else
			{
				for(var i=0;i<target.childNodes.length;i++) res+=functions.htmltotext(target.childNodes[i]);
				display=target.currentStyle?target.currentStyle['display']:document.defaultView.getComputedStyle(target,null).getPropertyValue('display');
				if(display.match(/^block/)||display.match(/list/)||display.match(/row/)||target.tagName=='BR'||target.tagName=='HR') res+='\n';
			}
			return res;
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.lists,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		/* check loaded */
		if(vars.loaded) return event;
		else vars.loaded=true;
		/* check view type */
		if ('view' in vars.config)
		{
			if ($.inArray(event.viewId.toString(),JSON.parse(vars.config.view))<0) return event;
			kintone.app.getHeaderMenuSpaceElement().appendChild(
				$('<button type="button" class="wl-button">')
				.on('click',function(e){
					vars.offset=0;
					vars.records=[];
					functions.loaddatas(function(){
						var error=false;
						var counter=vars.records.length;
						var targets=[];
						for (var i=0;i<vars.records.length;i++)
						{
							if (error) break;
							(function(record,targets,success,fail){
								var body={
									app:vars.config.templateapp,
									id:''
								};
								for (var i2=1;i2<7;i2++)
									for (var i3=1;i3<5;i3++)
										if (record['wl'+i2.toString()+'_'+i3.toString()+'date'].value)
											if (record['wl'+i2.toString()+'_'+i3.toString()+'date'].value.dateformat()==new Date().format('Y-m-d').dateformat())
												body.id=record['wl'+i2.toString()+'_'+i3.toString()+'template'].value;
								kintone.api(kintone.api.url('/k/v1/record',true),'GET',body,function(resp){
									var mailsubject=functions.assign(resp.record[vars.config.templatesubject].value,record);
									var mailbody=functions.assign(resp.record[vars.config.templatebody].value,record);
									if (resp.record[vars.config.templatebody].type=='RICH_TEXT')
									{
										var div=$('<div>').html(mailbody);
										targets.push({
											Address:record['mail'].value,
											subject:mailsubject,
											body:functions.htmltotext(div.get(0)),
											htmlbody:div.html()
										});
									}
									else
									{
										targets.push({
											Address:record['mail'].value,
											subject:mailsubject,
											body:mailbody,
											htmlbody:mailbody
										});
									}
									counter--;
									if (counter==0) success(targets);
								},function(error){
									fail(error.message);
								});
							})(vars.records[i],targets,function(targets){
								swal({
									title:'確認',
									text:'メールワイズの画面を開きます。',
									type:'info',
									showCancelButton:true,
									cancelButtonText:'Cancel'
								},
								function(){
									if ($('#wl-form').size()) $('#wl-form').remove();
									kintone.app.getHeaderMenuSpaceElement().appendChild(
										$('<form id="wl-form">')
										.attr('action','/m/mw.cgi')
										.attr('method','POST')
										.attr('target','_blank')[0]
									);
									$('#wl-form')
									.append($('<input type="hidden" name="Page">').val('PostConfirm'))
									.append($('<input type="hidden" name="MailTo">').val('1'))
									.append($('<input type="hidden" name="Subject">').val('%subject%'))
									.append($('<input type="hidden" name="Data">').val('%body%'))
									.append($('<input type="hidden" name="HtmlData">').val('%htmlbody%'))
									.append($('<input type="hidden" name="Targets">').val(JSON.stringify(targets)))
									.submit();
								});
							},function(error){
								swal('Error!','メールテンプレート取得に失敗しました。\n'+error,'error');
								error=true;
							});
						}
					});
				})[0]
			);
		}
		else return event;
	});
})(jQuery,kintone.$PLUGIN_ID);