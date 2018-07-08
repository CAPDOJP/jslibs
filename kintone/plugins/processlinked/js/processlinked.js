/*
*--------------------------------------------------------------------
* jQuery-Plugin "processlinked"
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
		inputform:null,
		config:{}
	};
	var events={
		process:[
			'app.record.detail.process.proceed'
		]
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.process,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		return new kintone.Promise(function(resolve,reject){
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
				var error=false;
				var messase='';
				var fields=[];
				var actions=JSON.parse(vars.config['action']);
				var actionfields=[];
				if (event.action.value in actions)
				{
					actionfields=actions[event.action.value].split(',');
					for (var i=0;i<actionfields.length;i++) if (actionfields[i] in resp.properties) fields.push(resp.properties[actionfields[i]]);
					if (fields.length!=0)
					{
						vars.inputform=$('body').fieldsform({fields:fields});
						vars.inputform.show({
							buttons:{
								ok:function(){
									/* close inputform */
									vars.inputform.hide();
									for (var i=0;i<fields.length;i++)
									{
										var fieldinfo=fields[i];
										var contents=$('#'+fieldinfo.code,vars.inputform.contents);
										var receivevalue=contents.find('.receiver').val();
										var receivevalues=[];
										switch (fieldinfo.type)
										{
											case 'CHECK_BOX':
											case 'MULTI_SELECT':
												$.each(contents.find('.receiver:checked'),function(){receivevalues.push($(this).val());});
												if (receivevalues.length==0)
												{
													event.error=contents.find('.title').text()+'を選択して下さい。';
													resolve(event);
												}
												else event.record[fieldinfo.code].value=receivevalues;
												break;
											case 'FILE':
												if (receivevalue.length==0)
												{
													event.error=contents.find('.title').text()+'を入力して下さい。';
													resolve(event);
												}
												else
												{
													var files=JSON.parse(receivevalue);
													$.each(files,function(index){
														receivevalues.push({
															fileKey:files[index].fileKey
														});
													});
													event.record[fieldinfo.code].value=receivevalues;
												}
												break;
											case 'GROUP_SELECT':
											case 'ORGANIZATION_SELECT':
											case 'USER_SELECT':
												if (receivevalue.length==0)
												{
													event.error=contents.find('.title').text()+'を入力して下さい。';
													resolve(event);
												}
												else
												{
													var values=receivevalue.split(',');
													for (var i2=0;i2<values.length;i2++) receivevalues.push({code:values[i2]});
													event.record[fieldinfo.code].value=receivevalues;
												}
												break;
											case 'RADIO_BUTTON':
												receivevalue=contents.find('[name='+fieldinfo.code+']:checked').val();
												if (receivevalue.length==0)
												{
													event.error=contents.find('.title').text()+'を選択して下さい。';
													resolve(event);
												}
												else event.record[fieldinfo.code].value=receivevalue;
												break;
											default:
												if (receivevalue.length==0)
												{
													event.error=contents.find('.title').text()+'を入力して下さい。';
													resolve(event);
												}
												else
												{
													event.record[fieldinfo.code].value=receivevalue;
													if (fieldinfo.lookup) event.record[fieldinfo.code].lookup=true;
												}
												break;
										}
									}
									resolve(event);
								},
								cancel:function(){
									/* close inputform */
									vars.inputform.hide();
									event.error='各項目を入力して下さい。';
									resolve(event);
								}
							},
							values:event.record
						});
					}
					else resolve(event);
				}
				else resolve(event);
			},function(error){});
		});
	});
})(jQuery,kintone.$PLUGIN_ID);
