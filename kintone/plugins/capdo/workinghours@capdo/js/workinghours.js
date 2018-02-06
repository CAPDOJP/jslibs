/*
*--------------------------------------------------------------------
* jQuery-Plugin "workinghours"
* Version: 3.0
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
		apps:{},
		config:{},
		offset:{},
		referers:{},
		timer:{
			action:false,
			start:new Date()
		}
	};
	var events={
		lists:[
			'app.record.index.show'
		]
	};
	var limit=500;
	var functions={
		createlookuplabel:function(record,fieldinfo){
			var res='';
			if (record.length!=0)
			{
				res+=record[0][fieldinfo.lookup.relatedKeyField].value+'/';
				for (var i=0;i<fieldinfo.lookup.fieldMappings.length;i++)
				{
					var field=fieldinfo.lookup.fieldMappings[i].relatedField;
					res+=record[0][field].value+'/';
				}
			}
			return res.replace(/\/$/g,'');
		},
		loadlookups:function(fieldinfo,callback){
			var body={
				app:fieldinfo.lookup.relatedApp.app,
				query:fieldinfo.lookup.filterCond+' order by '+fieldinfo.lookup.sort+' limit '+limit.toString()+' offset '+vars.offset[fieldinfo.code].toString()
			};
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				if (vars.apps[fieldinfo.code]==null) vars.apps[fieldinfo.code]=resp.records;
				else Array.prototype.push.apply(vars.apps[fieldinfo.code],resp.records);
				vars.offset[fieldinfo.code]+=limit;
				if (resp.records.length==limit) my.loadlookups(fieldinfo,callback);
				else
				{
					/* create reference box */
					vars.referers[fieldinfo.code]=$('body').referer({
						datasource:vars.apps[fieldinfo.code],
						displaytext:fieldinfo.lookup.lookupPickerFields,
						buttons:[
							{
								id:'cancel',
								text:'キャンセル'
							}
						],
						searches:[
							{
								id:'multi',
								class:'referer-input-multi',
								label:'',
								type:'multi'
							}
						]
					});
					callback();
				}
			},function(error){});
		},
		timer:function(){
			setInterval(function(){
				if (!vars.timer.action) $('#displaytime').text('');
				else
				{
					var diff=new Date().getTime()-vars.timer.start.getTime();
					var hours=0;
					var minutes=0;
					var seconds=0;
					var display='';
					hours=Math.floor(diff/(1000*60*60));
					diff-=hours*1000*60*60;
					minutes=Math.floor(diff/(1000*60));
					diff-=minutes*1000*60;
					seconds=Math.floor(diff/1000);
					if (hours!=0) display+=hours.toString()+'時間';
					if (hours+minutes!=0) display+=minutes.toString()+'分';
					if (hours+minutes+seconds!=0) display+=seconds.toString()+'秒';
					$('#displaytime').text(display+'経過');
				}
			},1000);
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.lists,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		/* check viewid */
		if (event.viewId!=vars.config.workinghours) return;
		kintone.proxy(
			vars.config['license']+'?domain='+$(location).attr('host').replace(/\.cybozu\.com/g,''),
			'GET',
			{},
			{},
			function(body,status,headers){
				if (status>=200 && status<300)
				{
					var json=JSON.parse(body);
					if (parseInt('0'+json.permit)==0) {swal('Error!','ライセンスが登録されていません。','error');return;}
					/* get fields of app */
					kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
						var fieldinfos=resp.properties;
						vars.apps[vars.config['client']]=null;
						vars.offset[vars.config['client']]=0;
						vars.referers[vars.config['client']]=null;
						functions.loadlookups(fieldinfos[vars.config['client']],function(){
							vars.apps[vars.config['segment']]=null;
							vars.offset[vars.config['segment']]=0;
							vars.referers[vars.config['segment']]=null;
							functions.loadlookups(fieldinfos[vars.config['segment']],function(){
								var container=$('div#workinghours-container');
								container.empty();
								container.append(
									$('<div id="worker" class="field">')
									.append($('<label class="title">').text('作業者'))
									.append(
										$('<div class="input">')
										.append($('<span class="label">').text(kintone.getLoginUser().name))
									)
								);
								container.append(
									$('<div id="client" class="field">')
									.append($('<label class="title">').text('顧客'))
									.append(
										$('<div class="input">')
										.append($('<span class="label">').css({'padding-left':'35px'}))
										.append($('<input type="hidden" class="receiver">').val(''))
										.append($('<input type="hidden" class="key">').val(fieldinfos[vars.config['client']].lookup.relatedKeyField))
										.append(
											$('<button class="customview-button">').css({
												'left':'0px',
												'margin':'0px',
												'padding':'0px',
												'position':'absolute',
												'top':'5px',
												'width':'30px'
											})
											.append($('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/search.png">').css({'width':'100%'}))
											.on('click',function(){
												var target=$(this);
												var field=target.closest('.field');
												vars.referers[vars.config['client']].show({
													buttons:{
														cancel:function(){
															/* close the reference box */
															vars.referers[vars.config['client']].hide();
														}
													},
													callback:function(row){
														$('.label',field).text(
															functions.createlookuplabel(
																$.grep(vars.apps[vars.config['client']],function(item,index){
																	return item[fieldinfos[vars.config['client']].lookup.relatedKeyField].value==row.find('#'+$('.key',field).val()).val();
																}),
																fieldinfos[vars.config['client']]
															)
														);
														$('.receiver',field).val(row.find('#'+$('.key',field).val()).val());
														/* close the reference box */
														vars.referers[vars.config['client']].hide();
													}
												});
											})
										)
									)
								);
								container.append(
									$('<div id="segment" class="field">')
									.append($('<label class="title">').text('作業区分'))
									.append(
										$('<div class="input">')
										.append($('<span class="label">').css({'padding-left':'35px'}))
										.append($('<input type="hidden" class="receiver">').val(''))
										.append($('<input type="hidden" class="key">').val(fieldinfos[vars.config['segment']].lookup.relatedKeyField))
										.append(
											$('<button class="customview-button">').css({
												'left':'0px',
												'margin':'0px',
												'padding':'0px',
												'position':'absolute',
												'top':'5px',
												'width':'30px'
											})
											.append($('<img src="https://rawgit.com/TIS2010/jslibs/master/kintone/plugins/images/search.png">').css({'width':'100%'}))
											.on('click',function(){
												var target=$(this);
												var field=target.closest('.field');
												vars.referers[vars.config['segment']].show({
													buttons:{
														cancel:function(){
															/* close the reference box */
															vars.referers[vars.config['segment']].hide();
														}
													},
													callback:function(row){
														$('.label',field).text(
															functions.createlookuplabel(
																$.grep(vars.apps[vars.config['segment']],function(item,index){
																	return item[fieldinfos[vars.config['segment']].lookup.relatedKeyField].value==row.find('#'+$('.key',field).val()).val();
																}),
																fieldinfos[vars.config['segment']]
															)
														);
														$('.receiver',field).val(row.find('#'+$('.key',field).val()).val());
														/* close the reference box */
														vars.referers[vars.config['segment']].hide();
													}
												});
											})
										)
									)
								);
								container.append(
									$('<div id="memo" class="field">')
									.append($('<label class="title">').text('メモ'))
									.append(
										$('<div class="input">')
										.append($('<textarea class="receiver">'))
									)
								);
								container.append($('<div id="displaytime" class="display">'));
								container.append(
									$('<button id="action" class="kintoneplugin-button-normal">')
									.append($('<input type="hidden" class="id">').val(''))
									.append($('<input type="hidden" class="status">').val('start'))
									.append($('<span class="label">').text('作業開始'))
									.on('click',function(){
										switch ($('.status',$('#action')).val())
										{
											case 'start':
												if ($('.receiver',$('#client')).val().toString().length==0)
												{
													swal('Error!','顧客を選択して下さい。','error');
													return;
												}
												if ($('.receiver',$('#segment')).val().toString().length==0)
												{
													swal('Error!','作業区分を選択して下さい。','error');
													return;
												}
												vars.timer.start=new Date();
												var body={
													app:kintone.app.getId(),
													record:{}
												};
												body.record[vars.config['date']]={value:vars.timer.start.format('Y-m-d')};
												body.record[vars.config['starttime']]={value:vars.timer.start.format('H:i')};
												body.record[vars.config['client']]={value:$('.receiver',$('#client')).val()};
												body.record[vars.config['segment']]={value:$('.receiver',$('#segment')).val()};
												body.record[vars.config['memo']]={value:$('.receiver',$('#memo')).val()};
												kintone.api(kintone.api.url('/k/v1/record',true),'POST',body,function(resp){
													$('.id',$('#action')).val(resp.id);
													$('.status',$('#action')).val('end');
													$('.label',$('#action')).text('作業終了');
													vars.timer.action=true;
												},function(error){
													swal('Error!',error.message,'error');
												});
												break;
											case 'end':
												var body={
													app:kintone.app.getId(),
													id:$('.id',$('#action')).val(),
													record:{}
												};
												swal({
													title:'確認',
													text:'作業終了します。\n宜しいですか?',
													type:'warning',
													showCancelButton:true,
													confirmButtonText:'OK',
													cancelButtonText:"Cancel"
												},
												function(){
													body.record[vars.config['endtime']]={value:new Date().format('H:i')};
													body.record[vars.config['memo']]={value:$('.receiver',$('#memo')).val()};
													kintone.api(kintone.api.url('/k/v1/record',true),'PUT',body,function(resp){
														$('.label',$('#client')).text('');
														$('.label',$('#segment')).text('');
														$('.receiver',$('#client')).val('');
														$('.receiver',$('#segment')).val('');
														$('.receiver',$('#memo')).val('');
														$('.id',$('#action')).val('');
														$('.status',$('#action')).val('start');
														$('.label',$('#action')).text('作業開始');
														vars.timer.action=false;
													},function(error){
														swal('Error!',error.message,'error');
													});
												});
												break;
										}
									})
								);
								var body={
									app:kintone.app.getId(),
									query:vars.config['worker']+' in (LOGINUSER()) order by $id desc limit 1'
								};
								kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
									if (resp.records.length!=0)
									{
										if (!resp.records[0][vars.config['endtime']].value)
										{
											$('.label',$('#client')).text(
												functions.createlookuplabel(
													$.grep(vars.apps[vars.config['client']],function(item,index){
														return item[fieldinfos[vars.config['client']].lookup.relatedKeyField].value==resp.records[0][vars.config['client']].value;
													}),
													fieldinfos[vars.config['client']]
												)
											);
											$('.label',$('#segment')).text(
												functions.createlookuplabel(
													$.grep(vars.apps[vars.config['segment']],function(item,index){
														return item[fieldinfos[vars.config['segment']].lookup.relatedKeyField].value==resp.records[0][vars.config['segment']].value;
													}),
													fieldinfos[vars.config['segment']]
												)
											);
											$('.receiver',$('#memo')).val(resp.records[0][vars.config['memo']].value);
											$('.id',$('#action')).val(resp.records[0]['$id'].value);
											$('.status',$('#action')).val('end');
											$('.label',$('#action')).text('作業終了');
											vars.timer.start=new Date((resp.records[0][vars.config['date']].value+'T'+resp.records[0][vars.config['starttime']].value+':00+0900').dateformat());
											vars.timer.action=true;
										}
										else vars.timer.action=false;
									}
									else vars.timer.action=false;
									functions.timer();
								},function(error){});
							});
						});
					},function(error){});
				}
				else swal('Error!','ライセンス認証に失敗しました。','error');
			},
			function(error){swal('Error!','ライセンス認証に失敗しました。','error');}
		);
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
